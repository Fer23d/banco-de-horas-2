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
  transform?: unknown
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

function extractActivityDetails(text: string) {
  const sectionMatch = text.match(
    /(?:HORA\s+DE\s+IN[IÍ]CIO[\s\S]{0,160}?HORA\s+DE\s+T[ÉE]RMINO[\s\S]{0,220}?)?DESCRI[ÇC][ÃA]O\s+DA\s+ATIVIDADE\s+E\s+DO\s+LOCAL\s*([\s\S]{20,2400}?)(?=\s*(?:Total\s+(?:de\s+)?Horas|Assinatura|Respons[aá]vel|Observa[çc][õo]es|Fotos|Anexos)\b|$)/i,
  )
  const section = sectionMatch?.[1]
    ?.replace(/\bHORA\s+DE\s+IN[IÍ]CIO\b/gi, ' ')
    .replace(/\bHORA\s+DE\s+T[ÉE]RMINO\b/gi, ' ')
    .replace(/\bDESCRI[ÇC][ÃA]O\s+DA\s+ATIVIDADE\s+E\s+DO\s+LOCAL\b/gi, ' ')
  if (!section) return undefined

  const rowPattern = /(?:^|\n)\s*(\d{1,2}:\d{2})\s+(\d{1,2}:\d{2})\s+([\s\S]*?)(?=\n\s*\d{1,2}:\d{2}\s+\d{1,2}:\d{2}\s+|\n?\s*Total\s+(?:de\s+)?Horas\b|$)/gi
  const inlineRowPattern = /(\d{1,2}:\d{2})\s+(\d{1,2}:\d{2})\s+([\s\S]*?)(?=\s+\d{1,2}:\d{2}\s+\d{1,2}:\d{2}\s+|\s+Total\s+(?:de\s+)?Horas\b|$)/gi
  const matches = Array.from(section.matchAll(rowPattern))
  const rows = (matches.length > 0 ? matches : Array.from(section.matchAll(inlineRowPattern))).flatMap((match) => {
    const startTime = match[1].padStart(5, '0')
    const endTime = match[2].padStart(5, '0')
    const description = match[3]
      .replace(/\b(?:HORA\s+DE\s+IN[IÍ]CIO|HORA\s+DE\s+T[ÉE]RMINO|DESCRI[ÇC][ÃA]O\s+DA\s+ATIVIDADE\s+E\s+DO\s+LOCAL)\b/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    return description ? [`[${startTime} - ${endTime}] ${description}`] : []
  })

  if (rows.length > 0) return rows.join('\n\n')
  return section.replace(/\s+/g, ' ').trim() || undefined
}

function getTextItemPosition(item: TextContentItem) {
  const transform = Array.isArray(item.transform) ? item.transform : []
  const x = typeof transform[4] === 'number' ? transform[4] : 0
  const y = typeof transform[5] === 'number' ? transform[5] : 0
  return { x, y }
}

function textItemsToRows(items: TextContentItem[]) {
  const rows = new Map<number, Array<{ x: number; text: string }>>()
  items.forEach((item) => {
    const text = item.str?.trim()
    if (!text) return
    const { x, y } = getTextItemPosition(item)
    const rowKey = Math.round(y)
    rows.set(rowKey, [...(rows.get(rowKey) ?? []), { x, text }])
  })

  return Array.from(rows.entries())
    .sort(([leftY], [rightY]) => rightY - leftY)
    .map(([, row]) => row
      .sort((left, right) => left.x - right.x)
      .map((item) => item.text)
      .join(' '))
    .join('\n')
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
  const details = extractActivityDetails(normalizedText)

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
    const pageText = textItemsToRows(content.items as TextContentItem[])
    pagesText.push(pageText)
    page.cleanup()
  }

  await document.cleanup()
  return parseRDOText(pagesText.join('\n'))
}
