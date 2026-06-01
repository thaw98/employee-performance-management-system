import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { SelfAssessmentAssignmentsPage } from './SelfAssessmentAssignmentsPage'

let templatesMock: unknown[] = []
let activeCycleFormsMock: { forms: unknown[] } = { forms: [] }
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
  useGetAllTemplatesQuery: () => ({
    data: templatesMock,
    isLoading: false,
    isError: false,
  }),
  useGetActiveCycleFormsForHrQuery: () => ({
    data: activeCycleFormsMock,
  }),
  useSetTemplateDeadlineMutation: () =>
    [
      vi.fn(() => ({
        unwrap: async () =>
          ({
            templateId: 100,
            createdCount: 0,
            skippedCount: 0,
          }),
      })),
      { isLoading: false },
    ] as const,
  useGetAssignmentCoverageQuery: () => ({
    data: coverageMock,
    isLoading: coverageLoadingMock,
  }),
}))

const assignedTemplate = {
  id: 100,
  title: 'Engineering Developer Review',
  departmentId: 10,
  departmentName: 'Engineering',
  positionId: 20,
  positionName: 'Developer',
  reviewCycleId: 7,
  reviewCycleName: 'Q2 2026',
  isActive: true,
  ratingSystem: 'FIVE_POINT',
  tenPointYesMinRating: 7,
  fivePointYesMinRating: 3,
  isLocked: false,
  isAssignedToDeadline: true,
  questions: [{ id: 1, questionText: 'Goal progress', sortOrder: 0 }],
  deletedQuestions: [],
  createdOn: '2026-05-01T00:00:00Z',
  createdBy: 1,
}

const emptyAssignedTemplate = {
  ...assignedTemplate,
  id: 101,
  title: 'Finance Analyst Review',
  departmentId: 11,
  departmentName: 'Finance',
  positionId: 21,
  positionName: 'Analyst',
  isAssignedToDeadline: false,
}

const matchingForm = {
  id: 500,
  templateId: 100,
  title: 'Engineering Developer Review',
  cycleId: 7,
  cycleName: 'Q2 2026',
  startDate: '2026-05-01',
  deadlineDate: '2026-05-15',
  managerReviewDeadlineDate: '2026-05-20',
  finalApprovalDeadlineDate: '2026-05-25',
  assignedAt: '2026-05-05T09:30:00Z',
  assignedBy: 1,
  employee: {
    id: 200,
    employeeId: 'EMP-200',
    employeeName: 'Aye Aye',
    email: 'aye@example.com',
    departmentId: 10,
    departmentName: 'Engineering',
    departmentCode: 'ENG',
    positionId: 20,
    positionName: 'Developer',
    positionCode: 'DEV',
  },
  status: 'NOT_SUBMITTED',
  totalScore: null,
  ratingCategory: null,
  submittedDate: null,
  assessmentDate: null,
  createdDate: '2026-05-05T09:30:00Z',
}

describe('SelfAssessmentAssignmentsPage', () => {
  beforeEach(() => {
    templatesMock = [assignedTemplate, emptyAssignedTemplate]
    activeCycleFormsMock = { forms: [matchingForm] }
    coverageMock = null
    coverageLoadingMock = false
  })

  afterEach(() => {
    cleanup()
  })

  it('renders View for assigned templates and Assign Deadline when no deadline assignment yet', () => {
    render(<SelfAssessmentAssignmentsPage />)

    const viewLinks = screen.getAllByRole('link', { name: 'View' })
    expect(viewLinks).toHaveLength(1)
    expect(viewLinks[0]).toHaveAttribute('href', '/hr/self-assessment/assignments/100/assigned-employees')
    expect(screen.getByRole('button', { name: 'Assign Deadline' })).toBeTruthy()
    expect(screen.queryByText('Aye Aye (EMP-200)')).not.toBeInTheDocument()
    expect(screen.queryByText('Assigned employees already exist for this department and position.')).not.toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: 'Assigned Employees' })).not.toBeInTheDocument()
  })

  it('opens Configure Deadlines modal when Assign Deadline is clicked', async () => {
    const user = userEvent.setup()
    render(<SelfAssessmentAssignmentsPage />)

    await user.click(screen.getByRole('button', { name: 'Assign Deadline' }))

    expect(screen.getByRole('dialog', { name: 'Configure Deadlines' })).toBeTruthy()
    expect(
      screen.getByText('Set milestone dates for each stage of the review process')
    ).toBeInTheDocument()
    expect(screen.getByText('HR final approval uses the active review cycle end date:')).toBeInTheDocument()
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

    render(<SelfAssessmentAssignmentsPage />)

    expect(screen.getByText('Assignment Coverage')).toBeInTheDocument()
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
    render(<SelfAssessmentAssignmentsPage />)

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
    render(<SelfAssessmentAssignmentsPage />)

    await user.click(screen.getByRole('tab', { name: /Left to Assign/ }))

    const noTemplateBadges = screen.getAllByText('No Template')
    expect(noTemplateBadges.length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Dave')).toBeInTheDocument()
  })

  it('does not render coverage section when no active cycle', () => {
    coverageMock = null
    coverageLoadingMock = false

    render(<SelfAssessmentAssignmentsPage />)

    expect(screen.queryByText('Assignment Coverage')).not.toBeInTheDocument()
  })

  it('does not render coverage section while loading', () => {
    coverageMock = null
    coverageLoadingMock = true

    render(<SelfAssessmentAssignmentsPage />)

    expect(screen.queryByText('Assignment Coverage')).not.toBeInTheDocument()
  })
})
