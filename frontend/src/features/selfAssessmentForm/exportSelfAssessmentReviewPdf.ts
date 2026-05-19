import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type {
  SelfAssessmentAttemptAnswerDto,
  SelfAssessmentFormDto,
  SelfAssessmentSubmissionAttemptDto,
} from './api/selfAssessmentFormApi'
import { resolveMediaSrc } from '../../utils/mediaUrl'

interface SignatureExportItem {
  label: string
  name: string
  data: string | null
  date: string | null
}

export interface ExportSelfAssessmentReviewPdfOptions {
  roleId?: number
}

/** A4 side margins: 0.3 in (7.62 mm) on each side. */
const pageMargin = 0.3 * 25.4
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

const isEmployeeExportRole = (roleId?: number): boolean => roleId === 3 || roleId === 4

const buildAttemptAnswerRows = (
  answers: SelfAssessmentAttemptAnswerDto[],
  includeRetakeReason: boolean,
): Array<Array<string | number>> => answers.map((answer, index) => {
  const row: Array<string | number> = [
    index + 1,
    answer.questionText,
    formatValue(answer.yesNoAnswer),
    formatValue(answer.rating),
    answer.remarks?.trim() || '-',
  ]
  if (includeRetakeReason) {
    row.push(answer.retakeReason?.trim() || '-')
  }
  return row
})

const buildSubmissionAttemptsFallback = (
  form: SelfAssessmentFormDto,
): SelfAssessmentSubmissionAttemptDto[] => {
  const sortedAnswers = [...form.answers].sort((a, b) => a.sortOrder - b.sortOrder)
  const attempts: SelfAssessmentSubmissionAttemptDto[] = []

  if (form.submittedDate) {
    attempts.push({
      attemptNumber: 1,
      submittedAt: form.submittedDate,
      retakeReason: null,
      answers: sortedAnswers.map(answer => ({
        answerId: answer.id,
        questionText: answer.questionText,
        sortOrder: answer.sortOrder,
        yesNoAnswer: answer.yesNoAnswer,
        rating: answer.rating,
        remarks: answer.remarks,
        retakeReason: null,
      })),
    })
  }

  const hasRetakeSubmission = Boolean(form.retakeSubmittedAt)
    || sortedAnswers.some(answer => answer.retakeYesNoAnswer != null)
  if (hasRetakeSubmission) {
    const retakeSubmittedAt = form.retakeSubmittedAt
      ?? sortedAnswers
        .map(answer => answer.retakeSubmittedAt)
        .filter((value): value is string => Boolean(value))
        .sort()
        .at(-1)
      ?? null

    const retakeReasons = sortedAnswers
      .map(answer => answer.retakeReason?.trim())
      .filter((value): value is string => Boolean(value))
    const uniqueRetakeReasons = [...new Set(retakeReasons)]

    attempts.push({
      attemptNumber: attempts.length + 1,
      submittedAt: retakeSubmittedAt,
      retakeReason: uniqueRetakeReasons.length > 0 ? uniqueRetakeReasons.join('; ') : null,
      answers: sortedAnswers.map(answer => {
        if (answer.retakeRequested && answer.retakeYesNoAnswer != null) {
          return {
            answerId: answer.id,
            questionText: answer.questionText,
            sortOrder: answer.sortOrder,
            yesNoAnswer: answer.retakeYesNoAnswer,
            rating: answer.retakeRating,
            remarks: answer.remarks,
            retakeReason: answer.retakeReason,
          }
        }
        return {
          answerId: answer.id,
          questionText: answer.questionText,
          sortOrder: answer.sortOrder,
          yesNoAnswer: answer.yesNoAnswer,
          rating: answer.rating,
          remarks: answer.remarks,
          retakeReason: null,
        }
      }),
    })
  }

  return attempts
}

const resolveSubmissionAttempts = (form: SelfAssessmentFormDto): SelfAssessmentSubmissionAttemptDto[] => {
  if (form.submissionAttempts?.length) {
    return [...form.submissionAttempts].sort((a, b) => a.attemptNumber - b.attemptNumber)
  }
  return buildSubmissionAttemptsFallback(form)
}

const resolveAttemptsForExport = (
  form: SelfAssessmentFormDto,
  roleId?: number,
): SelfAssessmentSubmissionAttemptDto[] => {
  const attempts = resolveSubmissionAttempts(form)
  if (attempts.length === 0) {
    return [{
      attemptNumber: 1,
      submittedAt: form.submittedDate,
      retakeReason: null,
      answers: [...form.answers]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(answer => ({
          answerId: answer.id,
          questionText: answer.questionText,
          sortOrder: answer.sortOrder,
          yesNoAnswer: answer.yesNoAnswer,
          rating: answer.rating,
          remarks: answer.remarks,
          retakeReason: null,
        })),
    }]
  }

  if (isEmployeeExportRole(roleId)) {
    return [attempts[attempts.length - 1]]
  }

  return attempts
}

const addReportHeader = (doc: jsPDF, form: SelfAssessmentFormDto): number => {
  const pageWidth = doc.internal.pageSize.getWidth()
  const contentWidth = pageWidth - pageMargin * 2

  doc.setFillColor(...navy)
  doc.rect(0, 0, pageWidth, 26, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.text('Self-Assessment Review Report', pageMargin, 11)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text('Review Record', pageMargin, 17)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.text(`Form ID: ${form.id}`, pageWidth - pageMargin, 10, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.text(`Exported: ${formatDate(new Date().toISOString())}`, pageWidth - pageMargin, 16, { align: 'right' })

  doc.setTextColor(0, 0, 0)
  autoTable(doc, {
    startY: 32,
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
      ['Self Score', scoreValue(form.totalScore)],
      ['Manager Revised', scoreValue(form.managerRevisedTotalScore)],
      ['Final Score', scoreValue(form.finalApprovedTotalScore)],
      ['Rating category', formatValue(form.ratingCategory)],
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
  const signatureBlockHeight = 36
  let y = ensureSpace(doc, startY, signatureBlockHeight)
  const pageWidth = doc.internal.pageSize.getWidth()
  const usableWidth = pageWidth - pageMargin * 2
  const columnWidth = usableWidth / 3
  const items = signatureRows(form)
  const cardH = 28
  const cardPad = 2.2
  const colGap = 2

  doc.setFontSize(9.5)
  doc.setFont('helvetica', 'bold')
  doc.text('Final Record Signatures', pageMargin, y)
  y += 4.5

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index]
    const x = pageMargin + index * columnWidth
    const cardW = columnWidth - colGap
    doc.setDrawColor(215, 220, 230)
    doc.roundedRect(x, y, cardW, cardH, 1, 1)
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'bold')
    doc.text(item.label, x + cardPad, y + 4.8)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.8)
    doc.text(item.name, x + cardPad, y + 8.6, { maxWidth: cardW - cardPad * 2 })

    const dataUrl = await signatureToDataUrl(item.data)
    const imgW = cardW - cardPad * 2 - 1
    const imgH = 8.5
    const imgY = y + 10.2
    if (dataUrl) {
      try {
        doc.addImage(dataUrl, inferImageFormat(dataUrl), x + cardPad + 0.5, imgY, imgW, imgH)
      } catch {
        doc.setFontSize(6.5)
        doc.text('Signature image unavailable', x + cardPad, imgY + imgH * 0.45)
      }
    } else {
      doc.setFontSize(6.5)
      doc.text('Not signed', x + cardPad, imgY + imgH * 0.45)
    }

    doc.setTextColor(95, 105, 120)
    doc.setFontSize(6)
    doc.text(`Signed: ${formatDate(item.date)}`, x + cardPad, y + cardH - 2.2, { maxWidth: cardW - cardPad * 2 })
    doc.setTextColor(0, 0, 0)
  }

  return y + cardH + 5
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

const addAttemptMetadata = (
  doc: jsPDF,
  attempt: SelfAssessmentSubmissionAttemptDto,
  y: number,
): number => {
  const rows: Array<[string, string]> = [
    ['Attempt #', String(attempt.attemptNumber)],
    ['Submitted At', formatDate(attempt.submittedAt)],
  ]

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    body: rows,
    styles: tableBaseStyles,
    alternateRowStyles: { fillColor: lightFill },
    columnStyles: {
      0: { cellWidth: 34, fontStyle: 'bold', textColor: navy, fillColor: sectionFill },
      1: { cellWidth: 'auto' },
    },
    margin: { left: pageMargin, right: pageMargin },
  })

  return lastTableY(doc) + 5
}

const addAnswerTable = (
  doc: jsPDF,
  answers: SelfAssessmentAttemptAnswerDto[],
  y: number,
  attemptNumber: number,
): number => {
  const includeRetakeReason = attemptNumber > 1
  const head = includeRetakeReason
    ? [['#', 'Question', 'Employee', 'Rating', 'Remarks', 'Retake Reason']]
    : [['#', 'Question', 'Employee', 'Rating', 'Remarks']]

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    head,
    body: buildAttemptAnswerRows(answers, includeRetakeReason),
    styles: { ...tableBaseStyles, fontSize: 7.5, cellPadding: 2 },
    headStyles,
    alternateRowStyles: { fillColor: lightFill },
    columnStyles: includeRetakeReason
      ? {
          0: { cellWidth: 10 },
          1: { cellWidth: 48 },
          2: { cellWidth: 20 },
          3: { cellWidth: 16 },
          4: { cellWidth: 28 },
          5: { cellWidth: 'auto' },
        }
      : {
          0: { cellWidth: 10 },
          1: { cellWidth: 62 },
          2: { cellWidth: 22 },
          3: { cellWidth: 18 },
          4: { cellWidth: 'auto' },
        },
    margin: { left: pageMargin, right: pageMargin },
  })

  return lastTableY(doc) + 8
}

const addAssessmentAnswers = (
  doc: jsPDF,
  attempts: SelfAssessmentSubmissionAttemptDto[],
  y: number,
): number => {
  let cursor = addSectionTitle(doc, 'Assessment Answers', y + 2)
  const showAttemptHistory = attempts.length > 1

  attempts.forEach((attempt, index) => {
    if (showAttemptHistory) {
      cursor = addSectionTitle(
        doc,
        `Attempt #${attempt.attemptNumber}`,
        index === 0 ? cursor : lastTableY(doc) + 6,
      )
      cursor = addAttemptMetadata(doc, attempt, cursor)
    }
    cursor = addAnswerTable(doc, attempt.answers, cursor, attempt.attemptNumber)
  })

  return cursor
}

export async function exportSelfAssessmentReviewPdf(
  form: SelfAssessmentFormDto,
  options: ExportSelfAssessmentReviewPdfOptions = {},
): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const attempts = resolveAttemptsForExport(form, options.roleId)

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
  y = addAssessmentAnswers(doc, attempts, y)

  const remarks = [
    ['Employee Remarks:', form.employeeRemarks ?? '-'],
    ['Overall Remarks:', form.overallRemarks ?? '-'],
  ].filter(([, value]) => value !== '-')

  if (remarks.length > 0) {
    y = addSectionTitle(doc, 'Remarks', lastTableY(doc) + 4)
    autoTable(doc, {
      startY: y,
      theme: 'grid',
      body: remarks,
      styles: tableBaseStyles,
      alternateRowStyles: { fillColor: lightFill },
      columnStyles: {
        0: {
          cellWidth: 42,
          fontStyle: 'bold',
          fillColor: navy,
          textColor: [255, 255, 255] as [number, number, number],
        },
        1: { cellWidth: 'auto' },
      },
      margin: { left: pageMargin, right: pageMargin },
    })
  }

  await drawSignatures(doc, form, lastTableY(doc) + 10)
  addPageFooters(doc)
  doc.save(`self-assessment-review-${form.id}.pdf`)
}
