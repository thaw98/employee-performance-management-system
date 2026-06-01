import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { SelfAssessmentAssignmentCoveragePage } from './SelfAssessmentAssignmentCoveragePage'

let coverageMock: unknown = null
let coverageLoadingMock = false

vi.mock('react-router-dom', () => ({
  Link: ({ to, children, ...props }: { to: string; children: ReactNode }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}))

vi.mock('../../features/reviewCycle/api/reviewCycleApi', () => ({
  useGetActiveReviewCyclesQuery: () => ({
    data: [
      {
        id: 7,
        name: 'Q2 2026',
        code: 'Q2-2026',
        startDate: '2026-05-01',
        endDate: '2026-05-31',
        requiresEmployeeSubmission: true,
      },
    ],
  }),
}))

vi.mock('./SelfAssessmentReviewCycleInfo', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./SelfAssessmentReviewCycleInfo')>()
  return {
    ...actual,
    SelfAssessmentReviewCycleInfo: () => <div>Cycle info</div>,
  }
})

vi.mock('../../features/selfAssessmentForm/api/selfAssessmentFormApi', () => ({
  useGetAssignmentCoverageQuery: () => ({
    data: coverageMock,
    isLoading: coverageLoadingMock,
  }),
}))

describe('SelfAssessmentAssignmentCoveragePage', () => {
  beforeEach(() => {
    coverageMock = null
    coverageLoadingMock = false
  })

  afterEach(() => {
    cleanup()
  })

  it('renders coverage summary counts when coverage data is available', () => {
    coverageMock = {
      activeCycle: { id: 7, name: 'Q2 2026', code: 'Q2-2026', startDate: '2026-05-01', endDate: '2026-05-31' },
      eligibleCount: 10,
      assignedCount: 6,
      leftToAssignCount: 4,
      noTemplateCount: 2,
      coveragePercent: 60,
      assignedEmployees: [
        { employeeId: 1, employeeCode: 'EMP-1', employeeName: 'Alice', departmentName: 'Eng', positionName: 'Dev', managerName: 'Bob', assignmentStatus: 'ASSIGNED', assignedDate: '2026-05-01T00:00:00Z', templateTitle: 'Dev Review', unassignedReason: null },
      ],
      unassignedEmployees: [
        { employeeId: 2, employeeCode: 'EMP-2', employeeName: 'Carol', departmentName: 'Eng', positionName: 'QA', managerName: null, assignmentStatus: 'UNASSIGNED', assignedDate: null, templateTitle: null, unassignedReason: 'NO_MATCHING_TEMPLATE' },
      ],
    }
    coverageLoadingMock = false

    render(<SelfAssessmentAssignmentCoveragePage />)

    expect(screen.getByRole('heading', { name: 'Assignment Coverage' })).toBeInTheDocument()
    expect(screen.getByText('Eligible')).toBeInTheDocument()
    expect(screen.getByText('Coverage')).toBeInTheDocument()
    expect(screen.getByText('60%')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Left to Assign/ })).toBeInTheDocument()
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Dev Review')).toBeInTheDocument()
  })

  it('switches between Assigned and Left to Assign tabs', async () => {
    coverageMock = {
      activeCycle: { id: 7, name: 'Q2 2026', code: 'Q2-2026', startDate: '2026-05-01', endDate: '2026-05-31' },
      eligibleCount: 2,
      assignedCount: 1,
      leftToAssignCount: 1,
      noTemplateCount: 0,
      coveragePercent: 50,
      assignedEmployees: [
        { employeeId: 1, employeeCode: 'EMP-1', employeeName: 'Alice', departmentName: 'Eng', positionName: 'Dev', managerName: null, assignmentStatus: 'ASSIGNED', assignedDate: '2026-05-01T00:00:00Z', templateTitle: 'Dev Review', unassignedReason: null },
      ],
      unassignedEmployees: [
        { employeeId: 2, employeeCode: 'EMP-2', employeeName: 'Bob', departmentName: 'Eng', positionName: 'QA', managerName: null, assignmentStatus: 'UNASSIGNED', assignedDate: null, templateTitle: null, unassignedReason: null },
      ],
    }
    coverageLoadingMock = false

    const user = userEvent.setup()
    render(<SelfAssessmentAssignmentCoveragePage />)

    expect(screen.getByText('Alice')).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: /Left to Assign/ }))

    expect(screen.getByText('Bob')).toBeInTheDocument()
  })

  it('shows no-template reason for unassigned employees', async () => {
    coverageMock = {
      activeCycle: { id: 7, name: 'Q2 2026', code: 'Q2-2026', startDate: '2026-05-01', endDate: '2026-05-31' },
      eligibleCount: 1,
      assignedCount: 0,
      leftToAssignCount: 1,
      noTemplateCount: 1,
      coveragePercent: 0,
      assignedEmployees: [],
      unassignedEmployees: [
        { employeeId: 3, employeeCode: 'EMP-3', employeeName: 'Dave', departmentName: 'HR', positionName: 'Recruiter', managerName: null, assignmentStatus: 'UNASSIGNED', assignedDate: null, templateTitle: null, unassignedReason: 'NO_MATCHING_TEMPLATE' },
      ],
    }
    coverageLoadingMock = false

    const user = userEvent.setup()
    render(<SelfAssessmentAssignmentCoveragePage />)

    await user.click(screen.getByRole('tab', { name: /Left to Assign/ }))

    const noTemplateBadges = screen.getAllByText('No Template')
    expect(noTemplateBadges.length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Dave')).toBeInTheDocument()
  })

  it('filters employees by search query', async () => {
    coverageMock = {
      activeCycle: { id: 7, name: 'Q2 2026', code: 'Q2-2026', startDate: '2026-05-01', endDate: '2026-05-31' },
      eligibleCount: 2,
      assignedCount: 2,
      leftToAssignCount: 0,
      noTemplateCount: 0,
      coveragePercent: 100,
      assignedEmployees: [
        { employeeId: 1, employeeCode: 'EMP-1', employeeName: 'Alice', departmentName: 'Eng', positionName: 'Dev', managerName: 'Bob', assignmentStatus: 'ASSIGNED', assignedDate: '2026-05-01T00:00:00Z', templateTitle: 'Dev Review', unassignedReason: null },
        { employeeId: 2, employeeCode: 'EMP-2', employeeName: 'Charlie', departmentName: 'HR', positionName: 'Recruiter', managerName: null, assignmentStatus: 'ASSIGNED', assignedDate: '2026-05-01T00:00:00Z', templateTitle: 'HR Review', unassignedReason: null },
      ],
      unassignedEmployees: [],
    }
    coverageLoadingMock = false

    const user = userEvent.setup()
    render(<SelfAssessmentAssignmentCoveragePage />)

    await user.type(screen.getByPlaceholderText(/Search by name/i), 'Alice')

    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.queryByText('Charlie')).not.toBeInTheDocument()
  })

  it('paginates employee rows', async () => {
    coverageMock = {
      activeCycle: { id: 7, name: 'Q2 2026', code: 'Q2-2026', startDate: '2026-05-01', endDate: '2026-05-31' },
      eligibleCount: 12,
      assignedCount: 12,
      leftToAssignCount: 0,
      noTemplateCount: 0,
      coveragePercent: 100,
      assignedEmployees: Array.from({ length: 12 }, (_, i) => ({
        employeeId: i + 1,
        employeeCode: `EMP-${i + 1}`,
        employeeName: `Employee ${i + 1}`,
        departmentName: 'Eng',
        positionName: 'Dev',
        managerName: null,
        assignmentStatus: 'ASSIGNED',
        assignedDate: '2026-05-01T00:00:00Z',
        templateTitle: 'Dev Review',
        unassignedReason: null,
      })),
      unassignedEmployees: [],
    }
    coverageLoadingMock = false

    const user = userEvent.setup()
    render(<SelfAssessmentAssignmentCoveragePage />)

    expect(screen.getByText('Employee 1')).toBeInTheDocument()
    expect(screen.queryByText('Employee 11')).not.toBeInTheDocument()
    expect(screen.getByText(/Showing/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '2' }))

    expect(screen.getByText('Employee 11')).toBeInTheDocument()
    expect(screen.queryByText('Employee 1')).not.toBeInTheDocument()
  })

  it('shows empty state when no eligible employees', () => {
    coverageMock = {
      activeCycle: { id: 7, name: 'Q2 2026', code: 'Q2-2026', startDate: '2026-05-01', endDate: '2026-05-31' },
      eligibleCount: 0,
      assignedCount: 0,
      leftToAssignCount: 0,
      noTemplateCount: 0,
      coveragePercent: 0,
      assignedEmployees: [],
      unassignedEmployees: [],
    }
    coverageLoadingMock = false

    render(<SelfAssessmentAssignmentCoveragePage />)

    expect(screen.getByText('No eligible employees')).toBeInTheDocument()
  })
})
