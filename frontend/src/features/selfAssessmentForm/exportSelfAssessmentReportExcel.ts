import * as XLSX from 'xlsx-js-style'
import type { GroupSummary, SelfAssessmentReportDto } from './api/selfAssessmentReportApi'
import { selfAssessmentReportExportSuffix, type SelfAssessmentReportExportContext } from './selfAssessmentReportExportTypes'

type SheetRow = (string | number)[]

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'cycle'

const score = (value: number | null | undefined) => `${Number(value ?? 0).toFixed(1)}%`

const valueOrDash = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === '') return '-'
  return value
}

const statusLabel = (value: string | null | undefined) =>
  valueOrDash(value) === '-'
    ? '-'
    : String(value)
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase())

const summaryRows = (rows: GroupSummary[], includeDepartment: boolean): SheetRow[] => [
  includeDepartment
    ? ['Department', 'Position', 'Employees', 'Average', 'Highest', 'Lowest', 'Missed']
    : ['Department', 'Employees', 'Average', 'Highest', 'Lowest', 'Missed'],
  ...rows.map((item) =>
    includeDepartment
      ? [
          valueOrDash(item.departmentName),
          valueOrDash(item.groupName),
          item.employeeCount,
          score(item.averageScore),
          score(item.highestScore),
          score(item.lowestScore),
          item.missedCount,
        ]
      : [
          valueOrDash(item.groupName),
          item.employeeCount,
          score(item.averageScore),
          score(item.highestScore),
          score(item.lowestScore),
          item.missedCount,
        ],
  ),
]

const directoryRows = (rows: SelfAssessmentReportExportContext['directoryRows']): SheetRow[] => [
  ['Staff No', 'Name', 'Department', 'Position', 'Score', 'Performance', 'Status'],
  ...rows.map((item) => [
    valueOrDash(item.staffNo),
    valueOrDash(item.employeeName),
    valueOrDash(item.departmentName),
    valueOrDash(item.positionName),
    score(item.selectedCycleScore),
    valueOrDash(item.performance),
    statusLabel(item.status),
  ]),
]

const setColumnWidths = (sheet: XLSX.WorkSheet, widths: number[]) => {
  sheet['!cols'] = widths.map((wch) => ({ wch }))
}

const styleSheet = (sheet: XLSX.WorkSheet, rows: SheetRow[]) => {
  const range = XLSX.utils.decode_range(sheet['!ref'] ?? 'A1:A1')
  for (let rowIndex = range.s.r; rowIndex <= range.e.r; rowIndex += 1) {
    for (let colIndex = range.s.c; colIndex <= range.e.c; colIndex += 1) {
      const ref = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex })
      if (!sheet[ref]) continue
      sheet[ref].s = {
        font: {
          name: 'Segoe UI',
          sz: rowIndex === 0 ? 11 : 10,
          bold: rowIndex === 0,
          color: { rgb: rowIndex === 0 ? '1D4ED8' : '334155' },
        },
        fill: rowIndex === 0 ? { fgColor: { rgb: 'DBEAFE' } } : undefined,
        alignment: { horizontal: rowIndex === 0 ? 'center' : 'left', vertical: 'center', wrapText: true },
        border: {
          bottom: { style: 'thin', color: { rgb: rowIndex === 0 ? '2463EB' : 'E2E8F0' } },
        },
      }
    }
  }
  sheet['!autofilter'] = { ref: `A1:${XLSX.utils.encode_cell({ r: 0, c: Math.max(rows[0]?.length ?? 1, 1) - 1 }).replace(/\d+/g, '')}${rows.length}` }
}

const appendSheet = (workbook: XLSX.WorkBook, name: string, rows: SheetRow[], widths: number[]) => {
  const sheet = XLSX.utils.aoa_to_sheet(rows.length ? rows : [['No data']])
  setColumnWidths(sheet, widths)
  styleSheet(sheet, rows.length ? rows : [['No data']])
  XLSX.utils.book_append_sheet(workbook, sheet, name)
}

const overviewRows = (report: SelfAssessmentReportDto, role: string): SheetRow[] => [
  ['Metric', 'Value'],
  ['Cycle Name', valueOrDash(report.selectedCycle.name)],
  ['Role', role],
  ['Generated Date', new Date().toLocaleDateString()],
  ['Records', report.overallTotals.recordCount],
  ['Average', score(report.overallTotals.averageScore)],
  ['Highest', score(report.overallTotals.highestScore)],
  ['Lowest', score(report.overallTotals.lowestScore)],
  ['Missed', report.overallTotals.missedCount],
]

const sheetNameForTab = (context: SelfAssessmentReportExportContext, role: string) => {
  if (context.tab === 'department') {
    return role === 'manager' ? 'Department Context' : 'Department Summary'
  }
  if (context.tab === 'positions') {
    return 'Position Summary'
  }
  return 'Employee Directory'
}

export function exportSelfAssessmentReportExcel(
  report: SelfAssessmentReportDto,
  context: SelfAssessmentReportExportContext,
) {
  const workbook = XLSX.utils.book_new()
  const role = report.role === 'manager' ? 'manager' : 'hr'
  const cycleName = report.selectedCycle.name || String(report.selectedCycle.id)
  const sheetName = sheetNameForTab(context, role)

  const rows: SheetRow[] = [
    ...overviewRows(report, role),
    [],
    ...(context.tab === 'department'
      ? summaryRows(context.departmentRows, false)
      : context.tab === 'positions'
        ? summaryRows(context.positionRows, true)
        : directoryRows(context.directoryRows)),
  ]

  const widths =
    context.tab === 'directory'
      ? [14, 24, 22, 22, 12, 18, 20]
      : context.tab === 'positions'
        ? [24, 24, 12, 14, 14, 14, 12]
        : [24, 12, 14, 14, 14, 12]

  appendSheet(workbook, sheetName, rows, widths)

  const tabSlug = selfAssessmentReportExportSuffix(context.tab)
  XLSX.writeFile(workbook, `self-assessment-report-${role}-${tabSlug}-${slugify(cycleName)}.xlsx`)
}
