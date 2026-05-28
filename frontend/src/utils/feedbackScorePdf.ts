import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export type FeedbackPerformanceRemark =
  | 'Outstanding'
  | 'Good'
  | 'Meet Requirement'
  | 'Need Improvement'
  | 'Unsatisfactory'

export type FeedbackScoreRange = {
  min: number
  max: number | null
  label: string
  remark: FeedbackPerformanceRemark
}

export const FEEDBACK_SCORE_RANGES: FeedbackScoreRange[] = [
  { min: 86, max: 100, label: '86% - 100%', remark: 'Outstanding' },
  { min: 71, max: 85, label: '71% - 85%', remark: 'Good' },
  { min: 60, max: 70, label: '60% - 70%', remark: 'Meet Requirement' },
  { min: 40, max: 59, label: '40% - 59%', remark: 'Need Improvement' },
  { min: Number.NEGATIVE_INFINITY, max: 39, label: 'Below 40%', remark: 'Unsatisfactory' },
]

type LastAutoTableDoc = jsPDF & { lastAutoTable?: { finalY?: number } }

export function feedbackRemarkForPercentage(score: number): FeedbackPerformanceRemark {
  if (score >= 86) return 'Outstanding'
  if (score >= 71) return 'Good'
  if (score >= 60) return 'Meet Requirement'
  if (score >= 40) return 'Need Improvement'
  return 'Unsatisfactory'
}

export function feedbackPercentageFromAverage(average: number | null | undefined): number {
  return typeof average === 'number' && Number.isFinite(average) ? average * 20 : 0
}

export function formatFeedbackPercentage(score: number | null | undefined): string {
  return typeof score === 'number' && Number.isFinite(score) ? `${score.toFixed(1)}%` : '0.0%'
}

export function findFeedbackScoreRange(score: number, remark = feedbackRemarkForPercentage(score)): FeedbackScoreRange {
  return FEEDBACK_SCORE_RANGES.find((range) => range.remark === remark) ?? FEEDBACK_SCORE_RANGES[FEEDBACK_SCORE_RANGES.length - 1]
}

function getLastAutoTableFinalY(doc: jsPDF) {
  return (doc as LastAutoTableDoc).lastAutoTable?.finalY
}

function ensurePdfSpace(doc: jsPDF, y: number, requiredHeight: number, marginTop: number, marginBottom: number) {
  const pageHeight = doc.internal.pageSize.getHeight()
  if (y + requiredHeight <= pageHeight - marginBottom) return y
  doc.addPage()
  return marginTop
}

const PERFORMANCE_COLORS: Record<string, [number, number, number]> = {
  Outstanding: [5, 150, 105],
  Good: [37, 99, 235],
  'Meet Requirement': [217, 119, 6],
  'Need Improvement': [234, 88, 12],
  Unsatisfactory: [220, 38, 38],
}

function drawScoreCard(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  title: string,
  value: string,
  helper: string,
  accent: [number, number, number],
  bgColor?: [number, number, number],
) {
  const cardBg = bgColor ?? [248, 250, 252]

  doc.setFillColor(241, 245, 249)
  doc.roundedRect(x + 1, y + 1, width, 34, 4, 4, 'F')

  doc.setFillColor(cardBg[0], cardBg[1], cardBg[2])
  doc.setDrawColor(226, 232, 240)
  doc.roundedRect(x, y, width, 34, 4, 4, 'FD')

  doc.setFillColor(accent[0], accent[1], accent[2])
  doc.roundedRect(x, y, width, 3, 2, 2, 'F')
  doc.setFillColor(accent[0], accent[1], accent[2])
  doc.rect(x, y + 1, width, 2, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(100, 116, 139)
  doc.text(title.toUpperCase(), x + 8, y + 10)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(value.length > 18 ? 14 : 18)
  doc.setTextColor(accent[0], accent[1], accent[2])
  doc.text(value, x + 8, y + 24)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.setTextColor(148, 163, 184)
  doc.text(doc.splitTextToSize(helper, width - 16), x + 8, y + 31)
}

export function addFeedbackScorePerformanceSection(
  doc: jsPDF,
  startY: number,
  {
    scorePercentage,
    remark,
    formulaText = 'Formula: average rating x 20.',
    marginLeft = 14,
    marginRight = 14,
    marginTop = 14,
    marginBottom = 14,
    primaryColor = [37, 99, 235],
  }: {
    scorePercentage: number
    remark?: string | null
    formulaText?: string
    marginLeft?: number
    marginRight?: number
    marginTop?: number
    marginBottom?: number
    primaryColor?: readonly [number, number, number]
  },
): number {
  const primaryRgb: [number, number, number] = [primaryColor[0], primaryColor[1], primaryColor[2]]
  const safeScore = Number.isFinite(scorePercentage) ? Math.max(0, Math.min(100, scorePercentage)) : 0
  const resolvedRemark = (remark?.trim() || feedbackRemarkForPercentage(safeScore)) as FeedbackPerformanceRemark
  const activeRange = findFeedbackScoreRange(safeScore, resolvedRemark)
  const perfColor = PERFORMANCE_COLORS[resolvedRemark] ?? primaryRgb
  const pageWidth = doc.internal.pageSize.getWidth()
  const usableWidth = pageWidth - marginLeft - marginRight
  let y = ensurePdfSpace(doc, startY, 90, marginTop, marginBottom)

  doc.setFillColor(primaryRgb[0], primaryRgb[1], primaryRgb[2])
  doc.rect(marginLeft, y, 3, 14, 'F')
  doc.setFillColor(248, 250, 252)
  doc.rect(marginLeft + 3, y, usableWidth - 3, 14, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(30, 41, 59)
  doc.text('Score & Performance', marginLeft + 12, y + 10)
  y += 20

  const gap = 8
  const cardWidth = (usableWidth - gap) / 2
  drawScoreCard(doc, marginLeft, y, cardWidth, 'TOTAL SCORE', formatFeedbackPercentage(safeScore), formulaText, primaryRgb, [239, 246, 255])
  drawScoreCard(doc, marginLeft + cardWidth + gap, y, cardWidth, 'PERFORMANCE REMARK', resolvedRemark, 'Based on 360 feedback threshold', perfColor, [248, 250, 252])
  y += 42

  autoTable(doc, {
    startY: y,
    head: [['Score Range', 'Performance Remark']],
    body: FEEDBACK_SCORE_RANGES.map((range) => [range.label, range.remark]),
    theme: 'grid',
    margin: { left: marginLeft, right: marginRight },
    tableWidth: usableWidth,
    styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak' },
    headStyles: {
      fillColor: primaryRgb,
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: usableWidth * 0.35, fontStyle: 'bold' },
      1: { cellWidth: usableWidth * 0.65 },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && FEEDBACK_SCORE_RANGES[data.row.index]?.remark === activeRange.remark) {
        data.cell.styles.fillColor = perfColor
        data.cell.styles.textColor = 255
        data.cell.styles.fontStyle = 'bold'
      }
    },
  })

  return (getLastAutoTableFinalY(doc) ?? y) + 8
}
