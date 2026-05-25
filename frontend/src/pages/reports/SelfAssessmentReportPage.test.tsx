import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type React from 'react'
import SelfAssessmentReportPage from './SelfAssessmentReportPage'

const reviewCyclesHookMock = vi.hoisted(() => vi.fn())
const reportHookMock = vi.hoisted(() => vi.fn())
const exportPdfMock = vi.hoisted(() => vi.fn())
const exportExcelMock = vi.hoisted(() => vi.fn())

vi.mock('../../features/reviewCycle/api/reviewCycleApi', () => ({
  useGetReviewCyclesQuery: (...args: unknown[]) => reviewCyclesHookMock(...args),
}))

vi.mock('../../features/selfAssessmentForm/api/selfAssessmentReportApi', () => ({
  useGetSelfAssessmentReportQuery: (...args: unknown[]) => reportHookMock(...args),
}))

vi.mock('../../features/selfAssessmentForm/exportSelfAssessmentReportPdf', () => ({
  exportSelfAssessmentReportPdf: (...args: unknown[]) => exportPdfMock(...args),
}))

vi.mock('../../features/selfAssessmentForm/exportSelfAssessmentReportExcel', () => ({
  exportSelfAssessmentReportExcel: (...args: unknown[]) => exportExcelMock(...args),
}))

vi.mock('react-hot-toast', () => ({
  toast: { success: vi.fn() },
}))

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>,
  RadarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="radar-chart">{children}</div>,
  Radar: ({ name }: { name: string }) => <div>{name}</div>,
  PolarGrid: () => <div />,
  PolarAngleAxis: () => <div />,
  PolarRadiusAxis: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
}))

const cycles = [{ id: 7, name: 'Q2 2026', requiresEmployeeSubmission: true }]

const baseReport = {
  role: 'hr',
  selectedCycle: { id: 7, name: 'Q2 2026', startDate: '2026-04-01', endDate: '2026-06-30' },
  previousCycle: null,
  overallTotals: { recordCount: 2, averageScore: 45, highestScore: 90, lowestScore: 0, missedCount: 1 },
  highestDepartment: { groupId: 10, groupCode: 'ENG', departmentId: 10, departmentName: 'Engineering', groupName: 'Engineering', employeeCount: 2, averageScore: 45, highestScore: 90, lowestScore: 0, missedCount: 1 },
  lowestDepartment: { groupId: 11, groupCode: 'FIN', departmentId: 11, departmentName: 'Finance', groupName: 'Finance', employeeCount: 1, averageScore: 70, highestScore: 70, lowestScore: 70, missedCount: 0 },
  departmentSummaries: [
    { groupId: 10, groupCode: 'ENG', departmentId: 10, departmentName: 'Engineering', groupName: 'Engineering', employeeCount: 2, averageScore: 45, highestScore: 90, lowestScore: 0, missedCount: 1 },
    { groupId: 11, groupCode: 'FIN', departmentId: 11, departmentName: 'Finance', groupName: 'Finance', employeeCount: 1, averageScore: 70, highestScore: 70, lowestScore: 70, missedCount: 0 },
  ],
  positionSummaries: [
    { groupId: 20, groupCode: 'DEV', departmentId: 10, departmentName: 'Engineering', groupName: 'Developer', employeeCount: 2, averageScore: 45, highestScore: 90, lowestScore: 0, missedCount: 1 },
    { groupId: 21, groupCode: 'ANA', departmentId: 11, departmentName: 'Finance', groupName: 'Analyst', employeeCount: 1, averageScore: 70, highestScore: 70, lowestScore: 70, missedCount: 0 },
  ],
  performanceBandRadar: [{ groupName: 'Engineering', outstanding: 1, good: 0, meetRequirement: 0, needImprovement: 0, unsatisfactory: 1, outstandingPercent: 50, goodPercent: 0, meetRequirementPercent: 0, needImprovementPercent: 0, unsatisfactoryPercent: 50 }],
  performerHighlights: [{ groupName: 'Engineering', highestPerformers: [{ employeeName: 'Alice', score: 90 }], lowestPerformers: [{ employeeName: 'Bob', score: 0 }] }],
  employeeDirectory: [
    { employeeId: 1, staffNo: 'EMP-1', employeeName: 'Alice', departmentId: 10, departmentName: 'Engineering', positionId: 20, positionName: 'Developer', selectedCycleScore: 90, performance: 'Outstanding', status: 'FINALIZED_LOCKED', previousCycleScore: null, previousCycleDelta: null },
    { employeeId: 2, staffNo: 'EMP-2', employeeName: 'Bob', departmentId: 10, departmentName: 'Engineering', positionId: 20, positionName: 'Developer', selectedCycleScore: 0, performance: 'Unsatisfactory', status: 'NOT_SUBMITTED', previousCycleScore: null, previousCycleDelta: null },
    { employeeId: 3, staffNo: 'EMP-3', employeeName: 'Cara', departmentId: 11, departmentName: 'Finance', positionId: 21, positionName: 'Analyst', selectedCycleScore: 70, performance: 'Good', status: 'FINALIZED_LOCKED', previousCycleScore: null, previousCycleDelta: null },
  ],
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('SelfAssessmentReportPage', () => {
  it('renders HR department comparison, radar chart, summary, and export button', () => {
    reviewCyclesHookMock.mockReturnValue({ data: cycles })
    reportHookMock.mockReturnValue({ data: baseReport, isFetching: false, isError: false })

    render(<SelfAssessmentReportPage mode="hr" />)

    expect(screen.getByText('Cross-department performance overview')).toBeTruthy()
    expect(screen.getByText('Department Summary')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Department' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Positions' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Employee Directory' })).toBeTruthy()
    expect(screen.getByTestId('radar-chart')).toBeTruthy()
    expect(screen.getByRole('button', { name: /export pdf/i })).toBeEnabled()
    expect(screen.getByRole('button', { name: /export excel/i })).toBeEnabled()
  })

  it('renders manager position comparison, employee directory, and delta', async () => {
    reviewCyclesHookMock.mockReturnValue({ data: cycles })
    reportHookMock.mockReturnValue({
      data: {
        ...baseReport,
        role: 'manager',
        departmentSummaries: [{ groupId: 10, groupCode: 'ENG', departmentId: 10, departmentName: 'Engineering', groupName: 'Engineering', employeeCount: 1, averageScore: 90, highestScore: 90, lowestScore: 90, missedCount: 0 }],
        positionSummaries: [{ groupId: 20, groupCode: 'DEV', departmentId: 10, departmentName: 'Engineering', groupName: 'Developer', employeeCount: 1, averageScore: 90, highestScore: 90, lowestScore: 90, missedCount: 0 }],
        employeeDirectory: [{ employeeId: 1, staffNo: 'EMP-1', employeeName: 'Alice', departmentId: 10, departmentName: 'Engineering', positionId: 20, positionName: 'Developer', selectedCycleScore: 90, performance: 'Outstanding', status: 'FINALIZED_LOCKED', previousCycleScore: 80, previousCycleDelta: 10 }],
      },
      isFetching: false,
      isError: false,
    })

    render(<SelfAssessmentReportPage mode="manager" />)

    await userEvent.click(screen.getByRole('button', { name: 'Positions' }))
    expect(screen.getByText('Position Summary')).toBeTruthy()
    await userEvent.click(screen.getByRole('button', { name: 'Employee Directory' }))
    expect(screen.getByText('Alice')).toBeTruthy()
    expect(screen.getByText('+10.0%')).toBeTruthy()
  })

  it('HR Department tab row click filters Positions', async () => {
    reviewCyclesHookMock.mockReturnValue({ data: cycles })
    reportHookMock.mockReturnValue({ data: baseReport, isFetching: false, isError: false })
    render(<SelfAssessmentReportPage mode="hr" />)

    await userEvent.click(screen.getByRole('cell', { name: 'Engineering' }))

    expect(screen.getByText('Positions in Engineering')).toBeTruthy()
    expect(screen.getByRole('cell', { name: 'Developer' })).toBeTruthy()
    expect(screen.queryByRole('cell', { name: 'Analyst' })).toBeNull()
  })

  it('position row click filters Employee Directory', async () => {
    reviewCyclesHookMock.mockReturnValue({ data: cycles })
    reportHookMock.mockReturnValue({ data: baseReport, isFetching: false, isError: false })
    render(<SelfAssessmentReportPage mode="hr" />)

    await userEvent.click(screen.getByRole('button', { name: 'Positions' }))
    await userEvent.click(screen.getByRole('cell', { name: 'Analyst' }))

    expect(screen.getByText('Cara')).toBeTruthy()
    expect(screen.queryByText('Alice')).toBeNull()
    expect(screen.queryByText('Bob')).toBeNull()
  })

  it('HR Employee Directory shows employees across departments by default', async () => {
    reviewCyclesHookMock.mockReturnValue({ data: cycles })
    reportHookMock.mockReturnValue({ data: baseReport, isFetching: false, isError: false })
    render(<SelfAssessmentReportPage mode="hr" />)

    await userEvent.click(screen.getByRole('button', { name: 'Employee Directory' }))

    const directory = screen.getByRole('heading', { name: 'Employee Directory' }).closest('section') as HTMLElement
    expect(within(directory).getByText('Alice')).toBeTruthy()
    expect(within(directory).getByText('Cara')).toBeTruthy()
  })

  it('Manager Employee Directory only shows own-department employees from the report', async () => {
    reviewCyclesHookMock.mockReturnValue({ data: cycles })
    reportHookMock.mockReturnValue({
      data: {
        ...baseReport,
        role: 'manager',
        departmentSummaries: [{ groupId: 10, groupCode: 'ENG', departmentId: 10, departmentName: 'Engineering', groupName: 'Engineering', employeeCount: 2, averageScore: 45, highestScore: 90, lowestScore: 0, missedCount: 1 }],
        positionSummaries: [{ groupId: 20, groupCode: 'DEV', departmentId: 10, departmentName: 'Engineering', groupName: 'Developer', employeeCount: 2, averageScore: 45, highestScore: 90, lowestScore: 0, missedCount: 1 }],
        employeeDirectory: baseReport.employeeDirectory.filter((row) => row.departmentId === 10),
      },
      isFetching: false,
      isError: false,
    })
    render(<SelfAssessmentReportPage mode="manager" />)

    await userEvent.click(screen.getByRole('button', { name: 'Employee Directory' }))

    expect(screen.getByText('Alice')).toBeTruthy()
    expect(screen.getByText('Bob')).toBeTruthy()
    expect(screen.queryByText('Cara')).toBeNull()
  })

  it('disables PDF export until a cycle report is loaded and exports the current report', async () => {
    reviewCyclesHookMock.mockReturnValue({ data: [] })
    reportHookMock.mockReturnValue({ data: undefined, isFetching: false, isError: false })
    const { rerender } = render(<SelfAssessmentReportPage mode="hr" />)

    expect(screen.getByRole('button', { name: /export pdf/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /export excel/i })).toBeDisabled()

    reviewCyclesHookMock.mockReturnValue({ data: cycles })
    reportHookMock.mockReturnValue({ data: baseReport, isFetching: false, isError: false })
    rerender(<SelfAssessmentReportPage mode="hr" />)
    await userEvent.click(screen.getByRole('button', { name: /export pdf/i }))
    await userEvent.click(screen.getByRole('button', { name: /export excel/i }))

    expect(exportPdfMock).toHaveBeenCalledWith(baseReport)
    expect(exportExcelMock).toHaveBeenCalledWith(baseReport)
  })
})
