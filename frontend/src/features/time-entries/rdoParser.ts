import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url'

export type ParsedRDO = {
  numeroObra?: string
  dataApontamento?: string
  horas?: string
  minutos?: string
  detalhes?: string
}

type TextContentItem = {
  str?: string
}

function toIsoDate(date: string) {
  const [day, month, year] = date.split('/')
  if (!day || !month || !year) return undefined
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

function parseDecimalHours(value: string) {
  const normalized = Number(value.replace(',', '.'))
  if (!Number.isFinite(normalized) || normalized < 0) return {}
  const totalMinutes = Math.round(normalized * 60)
  return {
    horas: String(Math.floor(totalMinutes / 60)),
    minutos: String(totalMinutes % 60),
  }
}

function extractTotalHours(text: string) {
  const totalHoursMatch = text.match(
    /\bTotal\s+(?:de\s+)?Horas\b[\s\S]{0,80}?([0-9]{1,2}(?:[.,][0-9]{1,2})?)\b/i,
  )
  return totalHoursMatch?.[1]
}

export function parseRDOText(text: string): ParsedRDO {
  const normalizedText = text
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\r/g, '\n')

  const obraMatch = normalizedText.match(/(?:N[º°]?\s*do\s*QQP|Obra)[\s\S]{0,120}?Obra\s+([A-Z0-9-]+)/i)
    ?? normalizedText.match(/\bObra\s+([A-Z0-9-]+)\b/i)
  const dateMatch = normalizedText.match(/(?:Data\s*OS|Data)[\s\S]{0,80}?(\d{2}\/\d{2}\/\d{4})/i)
    ?? normalizedText.match(/\b(\d{2}\/\d{2}\/\d{4})\b/)
  const totalHours = extractTotalHours(normalizedText)
  const detailsMatch = normalizedText.match(/DESCRI[ÇC][ÃA]O\s+DA\s+ATIVIDADE\s+E\s+DO\s+LOCAL\s*([\s\S]{20,1200}?)(?=\n\s*(?:Total\s+de\s+Horas|Assinatura|Respons[aá]vel|Observa[çc][õo]es|Fotos|Anexos)\b|$)/i)

  const details = detailsMatch?.[1]
    ?.replace(/\n+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()

  return {
    numeroObra: obraMatch?.[1]?.trim(),
    dataApontamento: dateMatch?.[1] ? toIsoDate(dateMatch[1]) : undefined,
    ...parseDecimalHours(totalHours ?? ''),
    detalhes: details || undefined,
  }
}

export async function parseRDO(file: File): Promise<ParsedRDO> {
  const pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl
  const buffer = await file.arrayBuffer()
  const document = await pdfjsLib.getDocument({ data: buffer }).promise
  const pagesText: string[] = []

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber)
    const content = await page.getTextContent()
    const pageText = content.items
      .map((item) => (item as TextContentItem).str ?? '')
      .filter(Boolean)
      .join(' ')
    pagesText.push(pageText)
    page.cleanup()
  }

  await document.cleanup()
  return parseRDOText(pagesText.join('\n'))
}
