import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type React from 'react'
import SelfAssessmentReportPage from './SelfAssessmentReportPage'

const reviewCyclesHookMock = vi.hoisted(() => vi.fn())
const reportHookMock = vi.hoisted(() => vi.fn())
const exportPdfMock = vi.hoisted(() => vi.fn())

vi.mock('../../features/reviewCycle/api/reviewCycleApi', () => ({
  useGetReviewCyclesQuery: (...args: unknown[]) => reviewCyclesHookMock(...args),
}))

vi.mock('../../features/selfAssessmentForm/api/selfAssessmentReportApi', () => ({
  useGetSelfAssessmentReportQuery: (...args: unknown[]) => reportHookMock(...args),
}))

vi.mock('../../features/selfAssessmentForm/exportSelfAssessmentReportPdf', () => ({
  exportSelfAssessmentReportPdf: (...args: unknown[]) => exportPdfMock(...args),
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
  highestDepartment: { groupName: 'Engineering', employeeCount: 2, averageScore: 45, highestScore: 90, lowestScore: 0, missedCount: 1 },
  lowestDepartment: { groupName: 'Engineering', employeeCount: 2, averageScore: 45, highestScore: 90, lowestScore: 0, missedCount: 1 },
  departmentSummaries: [{ groupName: 'Engineering', employeeCount: 2, averageScore: 45, highestScore: 90, lowestScore: 0, missedCount: 1 }],
  positionSummaries: [],
  performanceBandRadar: [{ groupName: 'Engineering', outstanding: 1, good: 0, meetRequirement: 0, needImprovement: 0, unsatisfactory: 1, outstandingPercent: 50, goodPercent: 0, meetRequirementPercent: 0, needImprovementPercent: 0, unsatisfactoryPercent: 50 }],
  performerHighlights: [{ groupName: 'Engineering', highestPerformers: [{ employeeName: 'Alice', score: 90 }], lowestPerformers: [{ employeeName: 'Bob', score: 0 }] }],
  employeeDirectory: [],
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
    expect(screen.getByTestId('radar-chart')).toBeTruthy()
    expect(screen.getByRole('button', { name: /export pdf/i })).toBeEnabled()
  })

  it('renders manager position comparison, employee directory, and delta', () => {
    reviewCyclesHookMock.mockReturnValue({ data: cycles })
    reportHookMock.mockReturnValue({
      data: {
        ...baseReport,
        role: 'manager',
        departmentSummaries: [],
        positionSummaries: [{ groupName: 'Developer', employeeCount: 1, averageScore: 90, highestScore: 90, lowestScore: 90, missedCount: 0 }],
        employeeDirectory: [{ employeeId: 1, staffNo: 'EMP-1', employeeName: 'Alice', positionName: 'Developer', selectedCycleScore: 90, performance: 'Outstanding', status: 'FINALIZED_LOCKED', previousCycleScore: 80, previousCycleDelta: 10 }],
      },
      isFetching: false,
      isError: false,
    })

    render(<SelfAssessmentReportPage mode="manager" />)

    expect(screen.getByText('Position Summary')).toBeTruthy()
    expect(screen.getByText('Employee Directory')).toBeTruthy()
    expect(screen.getByText('+10.0%')).toBeTruthy()
  })

  it('disables PDF export until a cycle report is loaded and exports the current report', async () => {
    reviewCyclesHookMock.mockReturnValue({ data: [] })
    reportHookMock.mockReturnValue({ data: undefined, isFetching: false, isError: false })
    const { rerender } = render(<SelfAssessmentReportPage mode="hr" />)

    expect(screen.getByRole('button', { name: /export pdf/i })).toBeDisabled()

    reviewCyclesHookMock.mockReturnValue({ data: cycles })
    reportHookMock.mockReturnValue({ data: baseReport, isFetching: false, isError: false })
    rerender(<SelfAssessmentReportPage mode="hr" />)
    await userEvent.click(screen.getByRole('button', { name: /export pdf/i }))

    expect(exportPdfMock).toHaveBeenCalledWith(baseReport)
  })
})
