import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { skipToken } from '@reduxjs/toolkit/query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { AssignSelfAssessmentFormsPage } from './AssignSelfAssessmentFormsPage'

const navigateMock = vi.fn()
const assignFormsMock = vi.fn()
const previewHookMock = vi.fn()

vi.mock('react-router-dom', () => ({
  Link: ({ to, children, ...props }: { to: string; children: ReactNode }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  useNavigate: () => navigateMock,
}))

vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('../../features/department/api/departmentApi', () => ({
  useGetDepartmentsQuery: () => ({
    data: {
      data: [
        { departmentId: 10, departmentName: 'Engineering' },
        { departmentId: 11, departmentName: 'Finance' },
      ],
    },
  }),
}))

vi.mock('../../features/position/api/positionApi', () => ({
  useGetPositionsQuery: () => ({
    data: {
      data: {
        content: [
          { positionId: 20, positionName: 'Developer' },
          { positionId: 21, positionName: 'Analyst' },
          { positionId: 22, positionName: 'Designer' },
        ],
      },
    },
  }),
}))

vi.mock('../../features/hrEmployeeList/hrEmployeeApi', () => ({
  useGetEmployeesQuery: () => ({
    data: {
      data: {
        content: [
          {
            employeeActiveStatus: 'ACTIVE',
            employmentStatus: 'Active',
            departmentName: 'Engineering',
            positionName: 'Developer',
          },
        ],
      },
    },
  }),
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
  formatCycleDate: (value: string) => value,
  SelfAssessmentReviewCycleInfo: () => <div>Cycle info</div>,
}))

vi.mock('../../features/selfAssessmentForm/api/selfAssessmentFormApi', () => ({
  useAssignSelfAssessmentFormsMutation: () => [assignFormsMock, { isLoading: false }],
  usePreviewSelfAssessmentAssignmentsQuery: (arg: unknown) => previewHookMock(arg),
}))

const previewData = [
  {
    departmentId: 10,
    departmentName: 'Engineering',
    positionId: 20,
    positionName: 'Developer',
    templateId: 100,
    templateTitle: 'Engineering Developer Review',
    ratingSystem: 'FIVE_POINT',
    questionCount: 3,
    assignmentStatus: 'NOT_ASSIGNED',
    assignedCount: 0,
  },
  {
    departmentId: 11,
    departmentName: 'Finance',
    positionId: 21,
    positionName: 'Analyst',
    templateId: 101,
    templateTitle: 'Finance Analyst Review',
    ratingSystem: 'TEN_POINT',
    questionCount: 4,
    assignmentStatus: 'ALREADY_ASSIGNED',
    assignedCount: 2,
  },
  {
    departmentId: 10,
    departmentName: 'Engineering',
    positionId: 22,
    positionName: 'Designer',
    templateId: null,
    templateTitle: null,
    ratingSystem: null,
    questionCount: 0,
    assignmentStatus: 'NO_TEMPLATE',
    assignedCount: 0,
  },
]

describe('AssignSelfAssessmentFormsPage hybrid preview', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    navigateMock.mockReset()
    assignFormsMock.mockReset()
    previewHookMock.mockReset()
    previewHookMock.mockReturnValue({
      data: previewData,
      isFetching: false,
      isError: false,
    })
  })

  it('skips preview until a hybrid department and position target is available', () => {
    render(<AssignSelfAssessmentFormsPage />)

    expect(previewHookMock).toHaveBeenLastCalledWith(skipToken)
  })

  it('renders preview groups from mocked responses', async () => {
    const user = userEvent.setup()
    render(<AssignSelfAssessmentFormsPage />)

    await user.click(screen.getByText('Hybrid Selection'))
    const selects = screen.getAllByRole('combobox')
    await user.selectOptions(selects[0], '10')
    await user.selectOptions(selects[1], '20')

    expect(await screen.findByText('Not assigned')).toBeTruthy()
    expect(screen.getByText('Already assigned')).toBeTruthy()
    expect(screen.getByText('No template')).toBeTruthy()
    expect(screen.getByText('Engineering Developer Review')).toBeTruthy()
    expect(screen.getByText('Finance Analyst Review')).toBeTruthy()
    expect(screen.getByText('No matching template for the active employee-submission cycle')).toBeTruthy()
  })

  it('returns to the overview tab after successful assignment', async () => {
    const user = userEvent.setup()
    assignFormsMock.mockReturnValue({
      unwrap: vi.fn().mockResolvedValue({
        createdCount: 1,
        skippedExistingCount: 0,
        skippedNoTemplateCount: 0,
      }),
    })

    render(<AssignSelfAssessmentFormsPage />)

    await user.click(screen.getByText('Engineering'))
    await user.click(screen.getByRole('button', { name: /Assign Forms/i }))

    expect(navigateMock).toHaveBeenCalledWith('/hr/self-assessment/assignments?tab=overview')
  })
})
