import { readFileSync } from 'node:fs'
import { jsPDF } from 'jspdf'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  buildRdoData,
  decodeSignatureDataUrl,
  generateRdo,
  generateRdoWord,
  type RdoData,
} from './rdo'

const imageRunSpy = vi.hoisted(() => vi.fn())
const textRunSpy = vi.hoisted(() => vi.fn())
const decodeImage = vi.fn()

vi.mock('docx', async (importOriginal) => {
  const actual = await importOriginal<typeof import('docx')>()

  return {
    ...actual,
    TextRun: class extends actual.TextRun {
      constructor(options: import('docx').IRunOptions | string) {
        textRunSpy(options)
        super(options)
      }
    },
    ImageRun: class extends actual.ImageRun {
      constructor(options: import('docx').IImageOptions) {
        imageRunSpy(options)
        super(options)
      }
    },
  }
})

vi.mock('file-saver', () => ({ saveAs: vi.fn() }))

const signatureBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='
const logo = new Uint8Array(readFileSync(new URL('../../assets/brand/sma-logo.jpg', import.meta.url)))

function buildTestRdo(signature?: string) {
  return buildRdoData({
    startDate: '2026-07-20',
    projectCode: 'SMA-001',
    hours: '9',
    minutes: '0',
    details: 'Levantamento de campo',
    signatureBase64: signature,
  }, { name: 'Rafael' })
}

function spyOnPdfAddImage() {
  const api = jsPDF.API as unknown as { addImage: (...args: unknown[]) => unknown }
  return vi.spyOn(api, 'addImage')
}

beforeEach(() => {
  imageRunSpy.mockClear()
  textRunSpy.mockClear()
  vi.restoreAllMocks()
  decodeImage.mockReset().mockResolvedValue(undefined)
  vi.stubGlobal('Image', class {
    src = ''
    naturalWidth = 1
    naturalHeight = 1
    decode() { return decodeImage(this.src) }
  })
})

afterEach(() => vi.unstubAllGlobals())

describe('dados do RDO', () => {
  it('preserva a assinatura digital válida nos dados do RDO', () => {
    const data = buildTestRdo(signatureBase64)

    expect(data.signatureBase64).toBe(signatureBase64)
  })

  it('mantém a assinatura digital opcional para dados legados', () => {
    const data = buildRdoData({
      startDate: '2026-07-20',
      projectCode: 'SMA-001',
      hours: '9',
      minutes: '0',
      details: 'Levantamento de campo',
    }, { name: 'Rafael' })

    expect(data.signatureBase64).toBeUndefined()
  })

  it('mantém horários, pausa de almoço e assinatura do profissional', () => {
    const data = buildRdoData({
      startDate: '2026-07-20',
      projectCode: 'SMA-001',
      hours: '9',
      minutes: '0',
      startTime: '07:30',
      endTime: '17:30',
      funcaoContrato: 'Categoria EAP',
      details: 'Levantamento de campo',
    }, { name: 'Rafael', jobTitle: 'Engenheiro de campo' })

    expect(data).toMatchObject({
      startTime: '07:30',
      endTime: '17:30',
      lunchBreak: '1 hora de almoço',
      professional: 'Rafael',
      category: 'Categoria EAP',
      signatureName: 'Rafael',
    })
  })

  it('calcula a duração pelos horários descontando uma hora de almoço quando horas totais estão vazias', () => {
    const data = buildRdoData({
      startDate: '2026-07-20',
      projectCode: 'SMA-001',
      hours: '',
      minutes: '',
      startTime: '07:30',
      endTime: '17:30',
      details: 'Levantamento de campo',
    }, { name: 'Rafael' })

    expect(data.duration).toBe('09:00')
  })
})

describe('assinatura nos geradores de RDO', () => {
  it('decodifica uma assinatura PNG válida em bytes para o Word', () => {
    const signature = decodeSignatureDataUrl(signatureBase64)

    expect(signature).toMatchObject({ format: 'PNG' })
    expect([...signature!.bytes.slice(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10])
  })

  it('adiciona uma assinatura PNG com dimensões limitadas ao PDF', () => {
    const addImageSpy = spyOnPdfAddImage()

    expect(() => generateRdo(buildTestRdo(signatureBase64), logo)).not.toThrow()

    const signatureCall = addImageSpy.mock.calls.find((call) => call[1] === 'PNG')
    expect(signatureCall).toBeDefined()
    expect(signatureCall![4]).toBeGreaterThan(0)
    expect(signatureCall![4]).toBeLessThanOrEqual(42)
    expect(signatureCall![5]).toBeGreaterThan(0)
    expect(signatureCall![5]).toBeLessThanOrEqual(16)
  })

  it('mantém o fallback do PDF para assinatura ausente ou inválida', () => {
    const addImageSpy = spyOnPdfAddImage()
    const malformedData = { ...buildTestRdo(), signatureBase64: 'data:image/png;base64,%%%' } as RdoData

    expect(() => generateRdo(buildTestRdo(), logo)).not.toThrow()
    expect(() => generateRdo(malformedData, logo)).not.toThrow()
    expect(addImageSpy.mock.calls.some((call) => call[1] === 'PNG')).toBe(false)
  })

  it('adiciona a assinatura PNG ao Word acima do nome do profissional', async () => {
    await expect(generateRdoWord(buildTestRdo(signatureBase64), logo)).resolves.toBeUndefined()

    expect(imageRunSpy).toHaveBeenCalledWith(expect.objectContaining({
      type: 'png',
      data: expect.any(Uint8Array),
      transformation: { width: 160, height: 60 },
    }))
  })

  it('mantém o fallback do Word para assinatura ausente ou inválida', async () => {
    const malformedData = { ...buildTestRdo(), signatureBase64: 'data:image/jpeg;base64,%%%' } as RdoData

    await expect(generateRdoWord(buildTestRdo(), logo)).resolves.toBeUndefined()
    await expect(generateRdoWord(malformedData, logo)).resolves.toBeUndefined()
    expect(imageRunSpy.mock.calls.some(([options]) => options.type === 'png')).toBe(false)
  })

  it('rejects a marker-only JPEG before embedding it in Word and retains the line/name', async () => {
    const malformedJpeg = 'data:image/jpeg;base64,/9j/2Q=='
    expect(decodeSignatureDataUrl(malformedJpeg)).not.toBeNull()
    decodeImage.mockRejectedValue(new Error('The source image cannot be decoded.'))

    await expect(generateRdoWord(buildTestRdo(malformedJpeg), logo)).resolves.toBeUndefined()

    expect(imageRunSpy).toHaveBeenCalledTimes(1)
    expect(imageRunSpy).toHaveBeenCalledWith(expect.objectContaining({ data: logo }))
    expect(textRunSpy).toHaveBeenCalledWith(expect.objectContaining({ text: '___________________________' }))
    expect(textRunSpy).toHaveBeenLastCalledWith(expect.objectContaining({ text: 'Rafael' }))
    expect(decodeImage).toHaveBeenCalledWith(malformedJpeg)
  })

  it('embeds a decodable JPEG signature in Word', async () => {
    const jpeg = `data:image/jpeg;base64,${btoa(Array.from(logo, (byte) => String.fromCharCode(byte)).join(''))}`
    await generateRdoWord(buildTestRdo(jpeg), logo)
    expect(decodeImage).toHaveBeenCalledWith(jpeg)
    expect(imageRunSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'jpg', transformation: { width: 160, height: 60 } }))
  })
})
