import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { SelfAssessmentAssignedEmployeesPage } from './SelfAssessmentAssignedEmployeesPage'

let templatesMock: unknown[] = []
let activeCycleFormsMock: { activeCycle: unknown; forms: unknown[] } = { activeCycle: null, forms: [] }

vi.mock('react-router-dom', () => ({
  Link: ({ to, children, ...props }: { to: string; children: ReactNode }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  useParams: () => ({ templateId: '100' }),
}))

vi.mock('../../features/selfAssessmentForm/api/selfAssessmentFormApi', () => ({
  useGetAllTemplatesQuery: () => ({
    data: templatesMock,
    isLoading: false,
    isError: false,
  }),
  useGetActiveCycleFormsForHrQuery: () => ({
    data: activeCycleFormsMock,
    isLoading: false,
    isError: false,
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

describe('SelfAssessmentAssignedEmployeesPage', () => {
  beforeEach(() => {
    templatesMock = [assignedTemplate]
    activeCycleFormsMock = {
      activeCycle: {
        id: 7,
        name: 'Q2 2026',
        code: 'Q2-2026',
        startDate: '2026-05-01',
        endDate: '2026-05-31',
      },
      forms: [matchingForm],
    }
  })

  afterEach(() => {
    cleanup()
  })

  it('renders assigned employees as a page', () => {
    render(<SelfAssessmentAssignedEmployeesPage />)

    expect(screen.getByRole('heading', { name: 'Assigned Employees' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to Assignments' })).toHaveAttribute(
      'href',
      '/hr/self-assessment/assignments'
    )
    expect(screen.getByText('Aye Aye')).toBeInTheDocument()
    expect(screen.getByText('EMP-200')).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Staff No.' })).toBeInTheDocument()
    expect(screen.getByText('Engineering')).toBeInTheDocument()
    expect(screen.getByText('Developer')).toBeInTheDocument()
    expect(screen.getByText('May 5, 2026')).toBeInTheDocument()
    expect(screen.getByText('May 1, 2026')).toBeInTheDocument()
    expect(screen.getByText('May 15, 2026')).toBeInTheDocument()
    expect(screen.getByText('May 20, 2026')).toBeInTheDocument()
    expect(screen.getByText('Not Submitted')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'View' })).toHaveAttribute(
      'href',
      '/hr/self-assessment/reviews/500'
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows an empty page state when an assigned template has no matching current-cycle forms', () => {
    activeCycleFormsMock = { ...activeCycleFormsMock, forms: [] }

    render(<SelfAssessmentAssignedEmployeesPage />)

    expect(screen.getByText('No current-cycle employees found')).toBeInTheDocument()
  })
})
