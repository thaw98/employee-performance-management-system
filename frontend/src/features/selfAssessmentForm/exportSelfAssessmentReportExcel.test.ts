import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SelfAssessmentReportDto } from './api/selfAssessmentReportApi'
import { exportSelfAssessmentReportExcel } from './exportSelfAssessmentReportExcel'

const xlsxMock = vi.hoisted(() => {
  const columnName = (index: number) => {
    let name = ''
    let current = index + 1
    while (current > 0) {
      const remainder = (current - 1) % 26
      name = String.fromCharCode(65 + remainder) + name
      current = Math.floor((current - 1) / 26)
    }
    return name
  }

  const parseCell = (cell: string) => {
    const [, letters, row] = /^([A-Z]+)(\d+)$/.exec(cell) ?? ['', 'A', '1']
    const c = letters.split('').reduce((total, char) => total * 26 + char.charCodeAt(0) - 64, 0) - 1
    return { c, r: Number(row) - 1 }
  }

  const appended: { name: string; rows: unknown[][] }[] = []

  return {
    appended,
    bookNew: vi.fn(() => ({ SheetNames: [], Sheets: {} })),
    bookAppendSheet: vi.fn((workbook: { SheetNames: string[]; Sheets: Record<string, unknown> }, sheet: { __rows: unknown[][] }, name: string) => {
      workbook.SheetNames.push(name)
      workbook.Sheets[name] = sheet
      appended.push({ name, rows: sheet.__rows })
    }),
    aoaToSheet: vi.fn((rows: unknown[][]) => {
      const sheet: Record<string, unknown> & { __rows: unknown[][]; '!ref': string } = {
        __rows: rows,
        '!ref': `A1:${columnName(Math.max(...rows.map((row) => row.length), 1) - 1)}${rows.length}`,
      }
      rows.forEach((row, rowIndex) => {
        row.forEach((value, colIndex) => {
          sheet[`${columnName(colIndex)}${rowIndex + 1}`] = { v: value }
        })
      })
      return sheet
    }),
    decodeRange: vi.fn((ref: string) => {
      const [start, end] = ref.split(':')
      return { s: parseCell(start), e: parseCell(end) }
    }),
    encodeCell: vi.fn(({ r, c }: { r: number; c: number }) => `${columnName(c)}${r + 1}`),
    writeFile: vi.fn(),
  }
})

vi.mock('xlsx-js-style', () => ({
  utils: {
    book_new: xlsxMock.bookNew,
    book_append_sheet: xlsxMock.bookAppendSheet,
    aoa_to_sheet: xlsxMock.aoaToSheet,
    decode_range: xlsxMock.decodeRange,
    encode_cell: xlsxMock.encodeCell,
  },
  writeFile: xlsxMock.writeFile,
}))

const report: SelfAssessmentReportDto = {
  role: 'manager',
  selectedCycle: { id: 7, name: 'Q2 2026 Review', startDate: '2026-04-01', endDate: '2026-06-30' },
  previousCycle: { id: 6, name: 'Q1 2026 Review', startDate: '2026-01-01', endDate: '2026-03-31' },
  overallTotals: { recordCount: 3, averageScore: 72.25, highestScore: 95, lowestScore: 40, missedCount: 1 },
  highestDepartment: null,
  lowestDepartment: null,
  departmentSummaries: [
    { groupId: 10, groupCode: 'ENG', departmentId: 10, departmentName: 'Engineering', groupName: 'Engineering', employeeCount: 2, averageScore: 80, highestScore: 95, lowestScore: 65, missedCount: 0 },
  ],
  positionSummaries: [
    { groupId: 20, groupCode: 'DEV', departmentId: 10, departmentName: 'Engineering', groupName: 'Developer', employeeCount: 2, averageScore: 80, highestScore: 95, lowestScore: 65, missedCount: 0 },
  ],
  performanceBandRadar: [
    { groupName: 'Engineering', outstanding: 1, good: 1, meetRequirement: 0, needImprovement: 0, unsatisfactory: 1, outstandingPercent: 33.333, goodPercent: 33.333, meetRequirementPercent: 0, needImprovementPercent: 0, unsatisfactoryPercent: 33.333 },
  ],
  performerHighlights: [
    {
      groupName: 'Engineering',
      highestPerformers: [{ employeeId: 1, staffNo: 'EMP-1', employeeName: 'Alice', departmentName: 'Engineering', positionName: 'Developer', score: 95, performance: 'Outstanding', status: 'FINALIZED_LOCKED' }],
      lowestPerformers: [{ employeeId: 2, staffNo: 'EMP-2', employeeName: 'Bob', departmentName: 'Engineering', positionName: 'Developer', score: 40, performance: 'Need Improvement', status: 'NOT_SUBMITTED' }],
    },
  ],
  employeeDirectory: [
    { employeeId: 1, staffNo: 'EMP-1', employeeName: 'Alice', departmentId: 10, departmentName: 'Engineering', positionId: 20, positionName: 'Developer', selectedCycleScore: 95, performance: 'Outstanding', status: 'FINALIZED_LOCKED', previousCycleScore: 90, previousCycleDelta: 5 },
    { employeeId: 2, staffNo: '', employeeName: 'Bob', departmentId: 10, departmentName: 'Engineering', positionId: 20, positionName: 'Developer', selectedCycleScore: 40, performance: '', status: 'NOT_SUBMITTED', previousCycleScore: null, previousCycleDelta: null },
  ],
}

beforeEach(() => {
  vi.clearAllMocks()
  xlsxMock.appended.length = 0
})

describe('exportSelfAssessmentReportExcel', () => {
  it('creates workbook sheets, writes the expected filename, and includes report rows', () => {
    exportSelfAssessmentReportExcel(report)

    expect(xlsxMock.bookNew).toHaveBeenCalledTimes(1)
    expect(xlsxMock.appended.map((sheet) => sheet.name)).toEqual([
      'Overview',
      'Department Summary',
      'Position Summary',
      'Performance Bands',
      'Performer Highlights',
      'Employee Directory',
    ])
    expect(xlsxMock.writeFile).toHaveBeenCalledWith(
      expect.anything(),
      'self-assessment-report-manager-q2-2026-review.xlsx',
    )

    expect(xlsxMock.appended.find((sheet) => sheet.name === 'Overview')?.rows).toContainEqual(['Cycle Name', 'Q2 2026 Review'])
    expect(xlsxMock.appended.find((sheet) => sheet.name === 'Overview')?.rows).toContainEqual(['Average', '72.3%'])
    expect(xlsxMock.appended.find((sheet) => sheet.name === 'Overview')?.rows).toContainEqual(['Previous Cycle', 'Q1 2026 Review'])
    expect(xlsxMock.appended.find((sheet) => sheet.name === 'Department Summary')?.rows).toContainEqual(['Engineering', 2, '80.0%', '95.0%', '65.0%', 0])
    expect(xlsxMock.appended.find((sheet) => sheet.name === 'Position Summary')?.rows).toContainEqual(['Engineering', 'Developer', 2, '80.0%', '95.0%', '65.0%', 0])
    expect(xlsxMock.appended.find((sheet) => sheet.name === 'Performance Bands')?.rows).toContainEqual(['Engineering', 1, '33.3%', 1, '33.3%', 0, '0.0%', 0, '0.0%', 1, '33.3%'])
    expect(xlsxMock.appended.find((sheet) => sheet.name === 'Performer Highlights')?.rows).toContainEqual(['Engineering', 'Alice (95.0%)', 'Bob (40.0%)'])
    expect(xlsxMock.appended.find((sheet) => sheet.name === 'Employee Directory')?.rows).toContainEqual(['EMP-1', 'Alice', 'Engineering', 'Developer', '95.0%', 'Outstanding', 'Finalized Locked', '90.0%', '+5.0%'])
    expect(xlsxMock.appended.find((sheet) => sheet.name === 'Employee Directory')?.rows).toContainEqual(['-', 'Bob', 'Engineering', 'Developer', '40.0%', '-', 'Not Submitted', '-', '-'])
  })
})
