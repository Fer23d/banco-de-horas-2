import { jsPDF } from 'jspdf'
import { AlignmentType, Document, ImageRun, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from 'docx'
import { saveAs } from 'file-saver'
import { areValidDurationParts, formatMinutes } from '../time-entries/domain'
import { formatDatePtBr, isIsoDate } from '../../shared/utils/date'

type RdoFormData = {
  entryDate?: string
  startDate?: string
  projectCode: string
  clientName?: string
  activityName?: string
  hours: string
  minutes: string
  startTime?: string
  endTime?: string
  funcaoContrato?: string
  details: string
}
type RdoContext = { name: string; jobTitle?: string; clientName?: string; activityName?: string }
export type RdoData = ReturnType<typeof buildRdoData>

export function buildRdoData(values: RdoFormData, context: RdoContext) {
  const entryDate = values.entryDate ?? values.startDate ?? ''
  if (!isIsoDate(entryDate)) throw new Error('Informe uma data válida para criar o RDO.')
  const hours = Number(values.hours || 0), minutes = Number(values.minutes || 0)
  if (!areValidDurationParts(hours, minutes)) throw new Error('Informe uma duração válida para criar o RDO.')
  if (!values.projectCode.trim()) throw new Error('Informe o número do projeto para criar o RDO.')
  return {
    contractor: 'SM&A Sistemas Elétricos e Automação',
    contractorNumber: '',
    date: entryDate, professional: context.name, category: values.funcaoContrato?.trim() || context.jobTitle || '',
    duration: formatMinutes(hours * 60 + minutes), object: '',
    startTime: values.startTime || '--:--', endTime: values.endTime || '--:--',
    lunchBreak: '1 hora de almoço', signatureName: context.name,
    valeNumber: '',
    discipline: 'C – Campo',
    documentType: '', client: values.clientName ?? context.clientName ?? '',
    projectCode: values.projectCode.trim(), activity: context.activityName ?? '', details: values.details.trim(),
  }
}

export function rdoFileName(data: RdoData) {
  const safe = (value: string) => [...value].map((char) => char.charCodeAt(0) < 32 || '<>:"/\\|?*'.includes(char) ? '_' : char).join('').replace(/[. ]+$/g, '').slice(0, 70)
  return ['RDO', data.date, safe(data.projectCode), safe(data.valeNumber)].filter(Boolean).join('_') + '.pdf'
}

export function rdoWordFileName(data: RdoData) {
  return rdoFileName(data).replace(/\.pdf$/i, '.docx')
}

export function generateRdo(data: RdoData, logo: Uint8Array) {
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: false })
  pdf.setProperties({ title: 'Relatório Diário de Obra', author: 'SM&A Sistemas Elétricos e Automação' })
  const margin = 12
  const width = pdf.internal.pageSize.getWidth() - margin * 2
  const bottom = pdf.internal.pageSize.getHeight() - 14
  const lineHeight = 4

  const drawHeader = () => {
    pdf.setDrawColor(75)
    pdf.setLineWidth(0.25)
    pdf.rect(margin, 12, width, 24)
    pdf.line(margin + 62, 12, margin + 62, 36)
    pdf.line(margin + width - 55, 12, margin + width - 55, 36)

    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(8)
    pdf.setTextColor(35)
    pdf.text('SM&A SISTEMAS ELÉTRICOS', margin + 31, 24, { align: 'center' })

    const image = pdf.getImageProperties(logo)
    const logoWidth = 39
    const logoHeight = logoWidth * image.height / image.width
    pdf.addImage(logo, 'JPEG', margin + width - 47, 18, logoWidth, logoHeight)

    pdf.setFontSize(13)
    pdf.text('RELATÓRIO DIÁRIO DE OBRA', margin + width / 2, 22.5, { align: 'center' })
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8)
    pdf.text('Apontamento individual do colaborador', margin + width / 2, 28, { align: 'center' })
  }

  const drawSection = (label: string, y: number) => {
    pdf.setFillColor(231, 237, 240)
    pdf.setDrawColor(75)
    pdf.rect(margin, y, width, 7, 'FD')
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(8)
    pdf.setTextColor(25)
    pdf.text(label, margin + 2.5, y + 4.7)
    return y + 7
  }

  const drawRow = (y: number, cells: Array<{ label: string; value: string; width: number }>) => {
    const prepared = cells.map((cell) => ({ ...cell, lines: pdf.splitTextToSize(cell.value || ' ', cell.width - 5) as string[] }))
    const height = Math.max(11, ...prepared.map((cell) => 6 + cell.lines.length * lineHeight))
    let x = margin
    pdf.setDrawColor(75)
    for (const cell of prepared) {
      pdf.rect(x, y, cell.width, height)
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(6.5)
      pdf.setTextColor(80)
      pdf.text(cell.label, x + 2, y + 3.6)
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(8)
      pdf.setTextColor(20)
      pdf.text(cell.lines, x + 2, y + 7.5)
      x += cell.width
    }
    return y + height
  }

  const drawIdentification = () => {
    let y = 40
    y = drawRow(y, [
      { label: 'Contratada', value: data.contractor, width: 96 },
      { label: 'Nº da contratada', value: data.contractorNumber, width: 91 },
      { label: 'Data', value: formatDatePtBr(data.date), width: width - 187 },
    ])
    y = drawRow(y, [
      { label: 'Cliente', value: data.client, width: 96 },
      { label: 'Número do projeto', value: data.projectCode, width: width - 96 },
    ])
    if (data.object || data.valeNumber || data.documentType || data.discipline) {
      y = drawRow(y, [
        { label: 'Objeto / Documento', value: data.object, width: 151 },
        { label: 'Nº VALE', value: data.valeNumber, width: 66 },
        { label: 'Disciplina / Tipo', value: [data.discipline, data.documentType].filter(Boolean).join(' / '), width: width - 217 },
      ])
    }
    y = drawSection('PROFISSIONAL', y)
    y = drawRow(y, [
      { label: 'Nome do profissional', value: data.professional, width: 127 },
      { label: 'Categoria / Função', value: data.category, width: 100 },
      { label: 'Total de horas', value: data.duration, width: width - 227 },
    ])
    y = drawRow(y, [
      { label: 'Hora de início', value: data.startTime, width: 64 },
      { label: 'Hora de fim', value: data.endTime, width: 64 },
      { label: 'Pausa', value: data.lunchBreak, width: width - 128 },
    ])
    return y
  }

  const details = data.details ? pdf.splitTextToSize(data.details, width - 6) as string[] : []
  const pending = details.length ? [...details] : [' ']
  let page = 0
  let lastContentY = 0
  do {
    if (page > 0) pdf.addPage('a4', 'landscape')
    drawHeader()
    let y = drawIdentification()
    y = drawSection(page === 0 ? 'DADOS DO APONTAMENTO' : 'DADOS DO APONTAMENTO - CONTINUAÇÃO', y)
    y = drawRow(y, [
      { label: 'ATIVIDADE REALIZADA', value: data.activity, width },
    ])
    const availableLines = Math.max(1, Math.floor((bottom - y - 30) / lineHeight))
    const pageLines = pending.splice(0, availableLines)
    const detailHeight = Math.max(18, 7 + pageLines.length * lineHeight)
    pdf.setDrawColor(75)
    pdf.rect(margin, y, width, detailHeight)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(6.5)
    pdf.setTextColor(80)
    pdf.text('DETALHAMENTO DAS ATIVIDADES', margin + 2, y + 3.6)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8)
    pdf.setTextColor(20)
    pdf.text(pageLines, margin + 2, y + 8)
    lastContentY = y + detailHeight
    page += 1
  } while (pending.length)

  const signatureY = Math.min(lastContentY + 14, bottom - 10)
  pdf.setDrawColor(75)
  pdf.line(margin + width / 2 - 35, signatureY, margin + width / 2 + 35, signatureY)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)
  pdf.setTextColor(20)
  pdf.text(data.signatureName, margin + width / 2, signatureY + 5, { align: 'center' })

  const pages = pdf.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    pdf.setPage(i)
    pdf.setDrawColor(150)
    pdf.line(margin, 199, margin + width, 199)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(7)
    pdf.setTextColor(90)
    pdf.text('Documento demonstrativo gerado pelo sistema SM&A', margin, 204)
    pdf.text(`Página ${i} de ${pages}`, margin + width, 204, { align: 'right' })
  }
  return pdf
}

export function downloadRdo(pdf: jsPDF, name: string) {
  const blob = pdf.output('blob')
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url; link.download = name
  document.body.appendChild(link)
  link.click(); link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 30_000)
}

function wordCell(label: string, value: string) {
  return new TableCell({
    children: [
      new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 18, color: '505050' })] }),
      new Paragraph({ children: [new TextRun({ text: value || ' ', size: 22 })] }),
    ],
  })
}

export async function generateRdoWord(data: RdoData, logo: Uint8Array) {
  const document = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new ImageRun({ data: logo, transformation: { width: 120, height: 52 }, type: 'jpg' })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 180 },
          children: [new TextRun({ text: 'RELATÓRIO DIÁRIO DE OBRA', bold: true, size: 28, color: '1F3A52' })],
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ children: [wordCell('Contratada', data.contractor), wordCell('Cliente', data.client), wordCell('Data', formatDatePtBr(data.date))] }),
            new TableRow({ children: [wordCell('Número do projeto', data.projectCode), wordCell('Profissional', data.professional), wordCell('Categoria / Função', data.category)] }),
            new TableRow({ children: [wordCell('Hora de início', data.startTime), wordCell('Hora de fim', data.endTime), wordCell('Total de horas', data.duration)] }),
          ],
        }),
        new Paragraph({ spacing: { before: 180 }, children: [new TextRun({ text: 'ATIVIDADE REALIZADA', bold: true, size: 18, color: '505050' })] }),
        new Paragraph({ children: [new TextRun({ text: data.activity || ' ', size: 22 })] }),
        new Paragraph({ spacing: { before: 180 }, children: [new TextRun({ text: 'DETALHAMENTO DAS ATIVIDADES', bold: true, size: 18, color: '505050' })] }),
        new Paragraph({ children: [new TextRun({ text: data.details || ' ', size: 22 })] }),
        new Paragraph({ spacing: { before: 180 }, children: [new TextRun({ text: data.lunchBreak, italics: true, size: 20 })] }),
        new Paragraph({ spacing: { before: 500 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: '___________________________', size: 22 })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: data.signatureName, size: 22 })] }),
      ],
    }],
  })
  const blob = await Packer.toBlob(document)
  saveAs(blob, rdoWordFileName(data))
}
