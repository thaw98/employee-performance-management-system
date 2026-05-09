import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { SelfAssessmentAssignmentsPage } from './SelfAssessmentAssignmentsPage'

let templatesMock: unknown[] = []
let activeCycleFormsMock: { forms: unknown[] } = { forms: [] }

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

vi.mock('./SelfAssessmentReviewCycleInfo', () => ({
  SelfAssessmentReviewCycleInfo: () => <div>Cycle info</div>,
}))

vi.mock('../../features/selfAssessmentForm/api/selfAssessmentFormApi', () => ({
  useGetAllTemplatesQuery: () => ({
    data: templatesMock,
    isLoading: false,
    isError: false,
  }),
  useGetActiveCycleFormsForHrQuery: () => ({
    data: activeCycleFormsMock,
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
  })

  afterEach(() => {
    cleanup()
  })

  it('renders assigned rows with View and opens a details modal', async () => {
    const user = userEvent.setup()
    render(<SelfAssessmentAssignmentsPage />)

    expect(screen.getAllByRole('button', { name: 'View' })).toHaveLength(2)
    expect(screen.queryByText('Aye Aye (EMP-200)')).not.toBeInTheDocument()
    expect(screen.queryByText('Assigned employees already exist for this department and position.')).not.toBeInTheDocument()

    await user.click(screen.getAllByRole('button', { name: 'View' })[0])

    const dialog = screen.getByRole('dialog', { name: 'Assigned Employees' })
    expect(within(dialog).getByText('Aye Aye (EMP-200)')).toBeInTheDocument()
    expect(within(dialog).getByText('Engineering')).toBeInTheDocument()
    expect(within(dialog).getByText('Developer')).toBeInTheDocument()
    expect(within(dialog).getByText('May 5, 2026')).toBeInTheDocument()
    expect(within(dialog).getByText('May 1, 2026')).toBeInTheDocument()
    expect(within(dialog).getByText('May 15, 2026')).toBeInTheDocument()
    expect(within(dialog).getByText('May 20, 2026')).toBeInTheDocument()
    expect(within(dialog).getByText('Not Submitted')).toBeInTheDocument()
  })

  it('shows an empty modal state when an assigned template has no matching current-cycle forms', async () => {
    const user = userEvent.setup()
    activeCycleFormsMock = { forms: [] }

    render(<SelfAssessmentAssignmentsPage />)

    await user.click(screen.getAllByRole('button', { name: 'View' })[0])

    expect(screen.getByRole('dialog', { name: 'Assigned Employees' })).toBeInTheDocument()
    expect(screen.getByText('No current-cycle employees found')).toBeInTheDocument()
  })
})
