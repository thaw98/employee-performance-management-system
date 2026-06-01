import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { EmployeeDirectoryRow, GroupSummary, SelfAssessmentReportDto } from './api/selfAssessmentReportApi'
import { addPdfFooterBranding, addPdfHeaderBranding, addPdfHeaderLogo, getPdfHeaderTextX, loadPdfLogo } from '../../utils/pdfBranding'
import { selfAssessmentReportExportSuffix, type SelfAssessmentReportExportContext } from './selfAssessmentReportExportTypes'

const MARGIN = 12.7

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'cycle'

const formatDateDDMMYYYY = (date: Date = new Date()): string => {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

const score = (value: number | null | undefined) => `${Number(value ?? 0).toFixed(1)}%`

const statusLabel = (value: string) =>
  value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())

const lastY = (doc: jsPDF) => (doc as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? MARGIN

const addTitle = (doc: jsPDF, text: string, y: number) => {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text(text, MARGIN, y)
  return y + 5
}

const addTable = (doc: jsPDF, y: number, head: string[][], body: (string | number)[][]) => {
  autoTable(doc, {
    startY: y,
    margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
    head,
    body: body.length ? body : [['No data']],
    styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
    headStyles: { fillColor: [36, 99, 235], textColor: 255, fontStyle: 'bold' },
  })
  return lastY(doc) + 8
}

const summaryBody = (rows: GroupSummary[], includeDepartment: boolean) =>
  rows.map((item) =>
    includeDepartment
      ? [
          item.departmentName || '-',
          item.groupName,
          item.employeeCount,
          score(item.averageScore),
          score(item.highestScore),
          score(item.lowestScore),
          item.missedCount,
        ]
      : [
          item.groupName,
          item.employeeCount,
          score(item.averageScore),
          score(item.highestScore),
          score(item.lowestScore),
          item.missedCount,
        ],
  )

const directoryBody = (rows: EmployeeDirectoryRow[]) =>
  rows.map((item) => [
    item.staffNo || '-',
    item.employeeName,
    item.departmentName || '-',
    item.positionName || '-',
    score(item.selectedCycleScore),
    item.performance || '-',
    statusLabel(item.status),
  ])

const sectionTitleForTab = (context: SelfAssessmentReportExportContext, role: string) => {
  if (context.tab === 'department') {
    return role === 'manager' ? 'Department Context' : 'Department Summary'
  }
  if (context.tab === 'positions') {
    return 'Position Summary'
  }
  return 'Employee Directory'
}

export async function exportSelfAssessmentReportPdf(
  report: SelfAssessmentReportDto,
  context: SelfAssessmentReportExportContext,
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const role = report.role === 'manager' ? 'manager' : 'hr'
  let y = MARGIN

  const logoDataUrl = await loadPdfLogo()
  const logoWidth = 24
  const headerTextX = getPdfHeaderTextX(MARGIN, !!logoDataUrl, { logoWidth })
  if (logoDataUrl) {
    addPdfHeaderLogo(doc, logoDataUrl, { x: MARGIN, y: 3, width: logoWidth, height: 12 })
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('Self-Assessment Report', headerTextX, y)
  addPdfHeaderBranding(doc, { margin: MARGIN, y })
  y += 7
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(`Cycle: ${report.selectedCycle.name}`, headerTextX, y)
  y += 5
  doc.text(`Generated: ${formatDateDDMMYYYY()}`, headerTextX, y)
  y += 8

  y = addTable(doc, y, [['Records', 'Average', 'Highest', 'Lowest', 'Missed']], [[
    report.overallTotals.recordCount,
    score(report.overallTotals.averageScore),
    score(report.overallTotals.highestScore),
    score(report.overallTotals.lowestScore),
    report.overallTotals.missedCount,
  ]])

  y = addTitle(doc, sectionTitleForTab(context, role), y)

  if (context.tab === 'department') {
    y = addTable(
      doc,
      y,
      [['Department', 'Employees', 'Average', 'Highest', 'Lowest', 'Missed']],
      summaryBody(context.departmentRows, false),
    )
  } else if (context.tab === 'positions') {
    y = addTable(
      doc,
      y,
      [['Department', 'Position', 'Employees', 'Average', 'Highest', 'Lowest', 'Missed']],
      summaryBody(context.positionRows, true),
    )
  } else {
    addTable(
      doc,
      y,
      [['Staff No', 'Name', 'Department', 'Position', 'Score', 'Performance', 'Status']],
      directoryBody(context.directoryRows),
    )
  }

  const pageCount = (doc as jsPDF & { getNumberOfPages: () => number }).getNumberOfPages()
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page)
    doc.setFontSize(8)
    doc.setTextColor(100)
    addPdfFooterBranding(doc, { margin: MARGIN, y: 297 - 7, textColor: [100, 100, 100] })
    doc.text(`Page ${page} of ${pageCount}`, 210 - MARGIN, 297 - 7, { align: 'right' })
  }

  const cycleSlug = slugify(report.selectedCycle.name || String(report.selectedCycle.id))
  const tabSlug = selfAssessmentReportExportSuffix(context.tab)
  doc.save(`self-assessment-report-${role}-${tabSlug}-${cycleSlug}.pdf`)
}
