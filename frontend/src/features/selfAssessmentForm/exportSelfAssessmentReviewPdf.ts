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

const formatDate = (value: string | null | undefined): string => {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

const formatValue = (value: unknown): string => {
  if (value == null || value === '') return '-'
  if (typeof value === 'number') return Number.isInteger(value) ? String(value) : value.toFixed(1)
  return String(value)
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
    name: 'HR Final Approval',
    data: form.hrFinalSignatureData ?? form.hrSignatureData,
    date: form.hrFinalSignatureData ? form.hrFinalSignatureDate : form.hrSignatureDate,
  },
]

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
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text(title, pageMargin, nextY)
  return nextY + 4
}

export async function exportSelfAssessmentReviewPdf(form: SelfAssessmentFormDto): Promise<void> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('Self-Assessment Final Record', pageMargin, 16)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(`Form #${form.id}`, pageMargin, 22)

  autoTable(doc, {
    startY: 28,
    theme: 'grid',
    head: [['Field', 'Value', 'Field', 'Value']],
    body: [
      ['Employee', form.employee?.employeeName ?? '-', 'Employee ID', form.employee?.employeeId ?? '-'],
      ['Department', form.employee?.departmentName ?? '-', 'Position', form.employee?.positionName ?? '-'],
      ['Title', form.title, 'Status', form.status],
      ['Cycle', form.cycleName ?? '-', 'Assessment Date', formatDate(form.assessmentDate)],
      ['Submitted', formatDate(form.submittedDate), 'Created', formatDate(form.createdDate)],
    ],
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [35, 45, 70] },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 28 },
      2: { fontStyle: 'bold', cellWidth: 28 },
    },
  })

  autoTable(doc, {
    startY: lastTableY(doc) + 7,
    theme: 'striped',
    head: [['Score', 'Value']],
    body: [
      ['Self score', form.totalScore == null ? '-' : `${form.totalScore.toFixed(1)}%`],
      ['Rating category', form.ratingCategory ?? '-'],
      ['Manager revised score', form.managerRevisedTotalScore == null ? '-' : `${form.managerRevisedTotalScore.toFixed(1)}%`],
      ['Final approved score', form.finalApprovedTotalScore == null ? '-' : `${form.finalApprovedTotalScore.toFixed(1)}%`],
    ],
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [35, 45, 70] },
  })

  let y = addSectionTitle(doc, 'Assessment Answers', lastTableY(doc) + 9)
  autoTable(doc, {
    startY: y,
    theme: 'grid',
    head: [['#', 'Question', 'Employee', 'Rating', 'Remarks', 'Manager Proposed', 'Final']],
    body: form.answers.map((answer, index) => [
      index + 1,
      answer.questionText,
      answer.yesNoAnswer ?? '-',
      formatValue(answer.rating),
      answer.remarks ?? '-',
      answer.managerProposedYesNo ? `${answer.managerProposedYesNo} (${formatValue(answer.managerProposedRating)})` : '-',
      answer.finalApprovedYesNo ? `${answer.finalApprovedYesNo} (${formatValue(answer.finalApprovedRating)})` : '-',
    ]),
    styles: { fontSize: 7, cellPadding: 1.8, overflow: 'linebreak' },
    headStyles: { fillColor: [35, 45, 70] },
    columnStyles: {
      0: { cellWidth: 8 },
      1: { cellWidth: 48 },
      2: { cellWidth: 18 },
      3: { cellWidth: 15 },
      4: { cellWidth: 38 },
      5: { cellWidth: 28 },
      6: { cellWidth: 25 },
    },
  })

  if (form.adjustments.length > 0) {
    y = addSectionTitle(doc, 'Adjustment Records', lastTableY(doc) + 9)
    autoTable(doc, {
      startY: y,
      theme: 'grid',
      head: [['Question', 'Original', 'Proposed', 'Decision', 'Manager Comment', 'HR Reason']],
      body: form.adjustments.map(adjustment => [
        adjustment.questionText,
        `${formatValue(adjustment.originalYesNo)} (${formatValue(adjustment.originalRating)})`,
        `${formatValue(adjustment.proposedYesNo)} (${formatValue(adjustment.proposedRating)})`,
        adjustment.hrDecision ?? '-',
        adjustment.managerComment ?? '-',
        adjustment.hrRejectionReason ?? '-',
      ]),
      styles: { fontSize: 7, cellPadding: 1.8, overflow: 'linebreak' },
      headStyles: { fillColor: [35, 45, 70] },
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
      styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
      headStyles: { fillColor: [35, 45, 70] },
      columnStyles: { 0: { cellWidth: 42, fontStyle: 'bold' } },
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
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [35, 45, 70] },
    })
  }

  doc.save(`self-assessment-review-${form.id}.pdf`)
}
