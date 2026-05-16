import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { SelfAssessmentFormDto } from './api/selfAssessmentFormApi'
import { resolveMediaSrc } from '../../utils/mediaUrl'

interface SignatureExportItem {
  label: string
  name: string
  data: string | null
  date: string | null
}

const pageMargin = 14
const navy: [number, number, number] = [28, 40, 65]
const slate: [number, number, number] = [88, 99, 115]
const lightFill: [number, number, number] = [245, 247, 250]
const borderColor: [number, number, number] = [220, 226, 235]
const sectionFill: [number, number, number] = [237, 242, 247]

const pad2 = (n: number): string => String(n).padStart(2, '0')

const humanizeWord = (word: string): string => {
  if (!word) return word
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
}

const humanizeAllCapsToken = (token: string): string => {
  if (/^[A-Z][A-Z0-9]*$/.test(token) && /[A-Z]/.test(token)) {
    return humanizeWord(token)
  }
  return token
}

/** Turn API enums (e.g. FINALIZED_LOCKED) into readable PDF text (no underscores, no all-caps). */
const humanizeEnumLikeString = (raw: string): string => {
  const text = raw.trim()
  if (!text) return text
  const withSpaces = text.replace(/_/g, ' ')
  const parts = withSpaces.split(/\s+/).filter(Boolean)
  if (raw.includes('_')) {
    return parts.map(humanizeWord).join(' ')
  }
  return parts.map(humanizeAllCapsToken).join(' ')
}

/** PDF dates: DD/MM/YYYY and local 12-hour time with seconds (e.g. 11:05:09PM), not locale-dependent. */
const formatDate = (value: string | null | undefined): string => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const day = pad2(date.getDate())
  const month = pad2(date.getMonth() + 1)
  const year = String(date.getFullYear())
  const h24 = date.getHours()
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12
  const mm = pad2(date.getMinutes())
  const ss = pad2(date.getSeconds())
  const ampm = h24 >= 12 ? 'PM' : 'AM'
  return `${day}/${month}/${year}, ${h12}:${mm}:${ss}${ampm}`
}

const formatValue = (value: unknown): string => {
  if (value == null || value === '') return '-'
  if (typeof value === 'number') return Number.isInteger(value) ? String(value) : value.toFixed(1)
  return humanizeEnumLikeString(String(value))
}

/** ISO calendar date (YYYY-MM-DD) to DD/MM/YYYY for PDF. */
const formatCycleCalendarDate = (value: string | null | undefined): string | null => {
  if (!value?.trim()) return null
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim())
  if (!match) return value.trim()
  return `${match[3]}/${match[2]}/${match[1]}`
}

const formatCycleForPdf = (form: SelfAssessmentFormDto): string => {
  const name = form.cycleName?.trim() || null
  const start = formatCycleCalendarDate(form.cycleStartDate)
  const end = formatCycleCalendarDate(form.cycleEndDate)

  if (!start && !end) {
    return name ?? '-'
  }

  const range = start && end ? `${start} - ${end}` : start ?? end ?? ''

  if (!name) return range
  return `${name} (${range})`
}

const lastTableY = (doc: jsPDF): number => {
  const finalY = (doc as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY
  return typeof finalY === 'number' ? finalY : pageMargin
}

const ensureSpace = (doc: jsPDF, y: number, height: number): number => {
  if (y + height <= doc.internal.pageSize.getHeight() - pageMargin) {
    return y
  }
  doc.addPage()
  return pageMargin
}

const inferImageFormat = (dataUrl: string): 'PNG' | 'JPEG' | 'WEBP' => {
  const match = /^data:image\/([^;]+);/i.exec(dataUrl)
  const mime = match?.[1]?.toLowerCase()
  if (mime === 'jpg' || mime === 'jpeg') return 'JPEG'
  if (mime === 'webp') return 'WEBP'
  return 'PNG'
}

const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })

const signatureToDataUrl = async (value: string | null): Promise<string | null> => {
  const signature = value?.trim()
  if (!signature) return null
  if (signature.startsWith('data:image/')) return signature
  if (/^[A-Za-z0-9+/=\s]+$/.test(signature) && signature.length > 120) {
    return `data:image/png;base64,${signature.replace(/\s/g, '')}`
  }

  const src = resolveMediaSrc(signature)
  if (!src) return null
  const response = await fetch(src)
  if (!response.ok) return null
  return blobToDataUrl(await response.blob())
}

const signatureRows = (form: SelfAssessmentFormDto): SignatureExportItem[] => [
  {
    label: 'Employee',
    name: form.employee?.employeeName ?? 'Employee',
    data: form.employeeSignatureData,
    date: form.employeeSignatureDate,
  },
  {
    label: 'Manager',
    name: form.managerName ?? 'Manager',
    data: form.managerSignatureData,
    date: form.managerSignatureDate,
  },
  {
    label: 'HR',
    name: form.hrName ?? 'HR Department',
    data: form.hrFinalSignatureData ?? form.hrSignatureData,
    date: form.hrFinalSignatureData ? form.hrFinalSignatureDate : form.hrSignatureDate,
  },
]

const scoreValue = (value: number | null | undefined): string => (
  value == null ? '-' : `${value.toFixed(1)}%`
)

const formatYesNoColumn = (
  value: string | null | undefined,
  expected: 'Yes' | 'No',
): string => {
  if (!value) return '-'
  return value.toLowerCase() === expected.toLowerCase() ? formatValue(expected) : '-'
}

const tableBaseStyles = {
  fontSize: 8,
  cellPadding: 2.4,
  overflow: 'linebreak' as const,
  lineColor: borderColor,
  lineWidth: 0.1,
}

const headStyles = {
  fillColor: navy,
  textColor: [255, 255, 255] as [number, number, number],
  fontStyle: 'bold' as const,
}

const addReportHeader = (doc: jsPDF, form: SelfAssessmentFormDto): number => {
  const pageWidth = doc.internal.pageSize.getWidth()
  const contentWidth = pageWidth - pageMargin * 2

  doc.setFillColor(...navy)
  doc.rect(0, 0, pageWidth, 34, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(17)
  doc.text('Self-Assessment Review Report', pageMargin, 15)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.text('Review Record', pageMargin, 22)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text(`Form ID: ${form.id}`, pageWidth - pageMargin, 14, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.text(`Exported: ${formatDate(new Date().toISOString())}`, pageWidth - pageMargin, 21, { align: 'right' })

  doc.setTextColor(0, 0, 0)
  autoTable(doc, {
    startY: 41,
    theme: 'plain',
    body: [
      [
        { content: 'Status', styles: { fontStyle: 'bold', textColor: navy } },
        { content: formatValue(form.status), styles: { fontStyle: 'bold' } },
        { content: 'Employee', styles: { fontStyle: 'bold', textColor: navy } },
        form.employee?.employeeName ?? '-',
        { content: 'Assessment', styles: { fontStyle: 'bold', textColor: navy } },
        form.title ?? '-',
      ],
    ],
    styles: {
      ...tableBaseStyles,
      fillColor: lightFill,
      minCellHeight: 9,
    },
    columnStyles: {
      0: { cellWidth: 18 },
      1: { cellWidth: 28 },
      2: { cellWidth: 22 },
      3: { cellWidth: 40 },
      4: { cellWidth: 24 },
      5: { cellWidth: contentWidth - 132 },
    },
    margin: { left: pageMargin, right: pageMargin },
  })

  return lastTableY(doc) + 8
}

const addInfoSection = (
  doc: jsPDF,
  title: string,
  rows: Array<[string, string]>,
  y: number,
): number => {
  const startY = addSectionTitle(doc, title, y)

  autoTable(doc, {
    startY,
    theme: 'grid',
    body: rows,
    styles: tableBaseStyles,
    alternateRowStyles: { fillColor: lightFill },
    columnStyles: {
      0: { cellWidth: 46, fontStyle: 'bold', textColor: navy, fillColor: sectionFill },
      1: { cellWidth: 'auto' },
    },
    margin: { left: pageMargin, right: pageMargin },
  })

  return lastTableY(doc) + 7
}

const addScoreSummary = (doc: jsPDF, form: SelfAssessmentFormDto, y: number): number => {
  const startY = addSectionTitle(doc, 'Score Summary', y)

  autoTable(doc, {
    startY,
    theme: 'grid',
    head: [['Metric', 'Value']],
    body: [
      ['Self score', scoreValue(form.totalScore)],
      ['Rating category', formatValue(form.ratingCategory)],
      ['Manager revised score', scoreValue(form.managerRevisedTotalScore)],
      ['Final approved score', scoreValue(form.finalApprovedTotalScore)],
    ],
    styles: tableBaseStyles,
    headStyles,
    alternateRowStyles: { fillColor: lightFill },
    columnStyles: {
      0: { cellWidth: 58, fontStyle: 'bold' },
      1: { cellWidth: 'auto' },
    },
    margin: { left: pageMargin, right: pageMargin },
  })

  return lastTableY(doc) + 7
}

const addPageFooters = (doc: jsPDF): void => {
  const pageCount = doc.getNumberOfPages()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    doc.setPage(pageNumber)
    doc.setDrawColor(...borderColor)
    doc.line(pageMargin, pageHeight - 10, pageWidth - pageMargin, pageHeight - 10)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...slate)
    doc.text('Self-Assessment Review Report', pageMargin, pageHeight - 5)
    doc.text(`Page ${pageNumber} of ${pageCount}`, pageWidth - pageMargin, pageHeight - 5, { align: 'right' })
    doc.setTextColor(0, 0, 0)
  }
}

const drawSignatures = async (doc: jsPDF, form: SelfAssessmentFormDto, startY: number): Promise<number> => {
  let y = ensureSpace(doc, startY, 52)
  const pageWidth = doc.internal.pageSize.getWidth()
  const usableWidth = pageWidth - pageMargin * 2
  const columnWidth = usableWidth / 3
  const items = signatureRows(form)

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Final Record Signatures', pageMargin, y)
  y += 6

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index]
    const x = pageMargin + index * columnWidth
    doc.setDrawColor(215, 220, 230)
    doc.roundedRect(x, y, columnWidth - 3, 39, 1.5, 1.5)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text(item.label, x + 3, y + 6)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text(item.name, x + 3, y + 11, { maxWidth: columnWidth - 9 })

    const dataUrl = await signatureToDataUrl(item.data)
    if (dataUrl) {
      try {
        doc.addImage(dataUrl, inferImageFormat(dataUrl), x + 4, y + 14, columnWidth - 11, 13)
      } catch {
        doc.text('Signature image unavailable', x + 3, y + 21)
      }
    } else {
      doc.text('Not signed', x + 3, y + 21)
    }

    doc.setTextColor(95, 105, 120)
    doc.text(`Signed: ${formatDate(item.date)}`, x + 3, y + 34, { maxWidth: columnWidth - 8 })
    doc.setTextColor(0, 0, 0)
  }

  return y + 45
}

const addSectionTitle = (doc: jsPDF, title: string, y: number): number => {
  const nextY = ensureSpace(doc, y, 12)
  doc.setTextColor(...navy)
  doc.setFontSize(11.5)
  doc.setFont('helvetica', 'bold')
  doc.text(title, pageMargin, nextY)
  doc.setTextColor(0, 0, 0)
  return nextY + 5
}

export async function exportSelfAssessmentReviewPdf(form: SelfAssessmentFormDto): Promise<void> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })

  let y = addReportHeader(doc, form)

  y = addInfoSection(doc, 'Employee Information', [
    ['Employee name', form.employee?.employeeName ?? '-'],
    ['Employee ID', form.employee?.employeeId ?? '-'],
    ['Department', form.employee?.departmentName ?? '-'],
    ['Position', form.employee?.positionName ?? '-'],
  ], y)

  y = addInfoSection(doc, 'Assessment Information', [
    ['Title', form.title ?? '-'],
    ['Cycle', formatCycleForPdf(form)],
    ['Assessment date', formatDate(form.assessmentDate)],
    ['Submitted date', formatDate(form.submittedDate)],
    ['Created date', formatDate(form.createdDate)],
  ], y)

  y = addScoreSummary(doc, form, y)

  y = addSectionTitle(doc, 'Assessment Answers', y + 2)
  autoTable(doc, {
    startY: y,
    theme: 'grid',
    head: [
      [
        { content: '#', rowSpan: 2 },
        { content: 'Question', rowSpan: 2 },
        { content: 'Employee', rowSpan: 2 },
        { content: 'Rating', rowSpan: 2 },
        { content: 'Remarks', rowSpan: 2 },
        { content: 'Manager Proposed', colSpan: 3 },
        { content: 'Final', colSpan: 3 },
      ],
      ['Yes', 'No', 'Rating', 'Yes', 'No', 'Rating'],
    ],
    body: form.answers.map((answer, index) => [
      index + 1,
      answer.questionText,
      formatValue(answer.yesNoAnswer),
      formatValue(answer.rating),
      answer.remarks ?? '-',
      formatYesNoColumn(answer.managerProposedYesNo, 'Yes'),
      formatYesNoColumn(answer.managerProposedYesNo, 'No'),
      formatValue(answer.managerProposedRating),
      formatYesNoColumn(answer.finalApprovedYesNo, 'Yes'),
      formatYesNoColumn(answer.finalApprovedYesNo, 'No'),
      formatValue(answer.finalApprovedRating),
    ]),
    styles: { ...tableBaseStyles, fontSize: 7, cellPadding: 1.8 },
    headStyles,
    alternateRowStyles: { fillColor: lightFill },
    columnStyles: {
      0: { cellWidth: 8 },
      1: { cellWidth: 36 },
      2: { cellWidth: 14 },
      3: { cellWidth: 12 },
      4: { cellWidth: 26 },
      5: { cellWidth: 12 },
      6: { cellWidth: 12 },
      7: { cellWidth: 12 },
      8: { cellWidth: 12 },
      9: { cellWidth: 12 },
      10: { cellWidth: 12 },
    },
    margin: { left: pageMargin, right: pageMargin },
  })

  if (form.adjustments.length > 0) {
    y = addSectionTitle(doc, 'Adjustment Records', lastTableY(doc) + 9)
    autoTable(doc, {
      startY: y,
      theme: 'grid',
      head: [
        [
          { content: 'Question', rowSpan: 2 },
          { content: 'Original', colSpan: 3 },
          { content: 'Proposed', colSpan: 3 },
          { content: 'Decision', rowSpan: 2 },
          { content: 'Manager Comment', rowSpan: 2 },
          { content: 'HR Reason', rowSpan: 2 },
        ],
        ['Yes', 'No', 'Rating', 'Yes', 'No', 'Rating'],
      ],
      body: form.adjustments.map(adjustment => [
        adjustment.questionText,
        formatYesNoColumn(adjustment.originalYesNo, 'Yes'),
        formatYesNoColumn(adjustment.originalYesNo, 'No'),
        formatValue(adjustment.originalRating),
        formatYesNoColumn(adjustment.proposedYesNo, 'Yes'),
        formatYesNoColumn(adjustment.proposedYesNo, 'No'),
        formatValue(adjustment.proposedRating),
        formatValue(adjustment.hrDecision),
        adjustment.managerComment ?? '-',
        adjustment.hrRejectionReason ?? '-',
      ]),
      styles: { ...tableBaseStyles, fontSize: 7, cellPadding: 1.8 },
      headStyles,
      alternateRowStyles: { fillColor: lightFill },
      columnStyles: {
        0: { cellWidth: 38 },
        1: { cellWidth: 11 },
        2: { cellWidth: 11 },
        3: { cellWidth: 11 },
        4: { cellWidth: 11 },
        5: { cellWidth: 11 },
        6: { cellWidth: 11 },
        7: { cellWidth: 16 },
        8: { cellWidth: 28 },
        9: { cellWidth: 28 },
      },
      margin: { left: pageMargin, right: pageMargin },
    })
  }

  const remarks = [
    ['Employee Remarks', form.employeeRemarks ?? '-'],
    ['Manager Comments', form.managerComments ?? '-'],
    ['Overall Remarks', form.overallRemarks ?? '-'],
    ['HR Remarks', form.hrReviewReason ?? '-'],
    ['Employee Dispute Reason', form.employeeDisputeReason ?? '-'],
  ].filter(([, value]) => value !== '-')

  if (remarks.length > 0) {
    y = addSectionTitle(doc, 'Remarks', lastTableY(doc) + 9)
    autoTable(doc, {
      startY: y,
      theme: 'grid',
      head: [['Type', 'Text']],
      body: remarks,
      styles: tableBaseStyles,
      headStyles,
      alternateRowStyles: { fillColor: lightFill },
      columnStyles: { 0: { cellWidth: 42, fontStyle: 'bold' } },
      margin: { left: pageMargin, right: pageMargin },
    })
  }

  y = await drawSignatures(doc, form, lastTableY(doc) + 10)

  const workflowRows = [
    ['HR workflow', form.hrSignatureData ? 'Signed' : 'Not signed', formatDate(form.hrSignatureDate)],
    ['HR adjustment/reopen', form.hrAdjustmentSignatureData ? 'Signed' : 'Not signed', formatDate(form.hrAdjustmentSignatureDate)],
  ].filter(([, signed]) => signed === 'Signed')

  if (workflowRows.length > 0) {
    autoTable(doc, {
      startY: ensureSpace(doc, y, 25),
      theme: 'grid',
      head: [['Workflow Signature', 'Status', 'Date']],
      body: workflowRows,
      styles: tableBaseStyles,
      headStyles,
      alternateRowStyles: { fillColor: lightFill },
      margin: { left: pageMargin, right: pageMargin },
    })
  }

  addPageFooters(doc)
  doc.save(`self-assessment-review-${form.id}.pdf`)
}
