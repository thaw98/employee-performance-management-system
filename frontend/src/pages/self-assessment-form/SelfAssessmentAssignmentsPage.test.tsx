import { cleanup, render, screen } from '@testing-library/react'

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

    expect(screen.queryByRole('heading', { name: 'Assignment Coverage' })).not.toBeInTheDocument()

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

})


