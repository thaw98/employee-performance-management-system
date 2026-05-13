import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CreateSelfAssessmentTemplatePage } from './CreateSelfAssessmentTemplatePage'

const navigateMock = vi.fn()
const createTemplateMock = vi.fn()
const checkConflictsMock = vi.fn()

const reviewCycles = [
  {
    id: 1,
    name: 'Q1 Review',
    yearLabel: '2026',
    cycleType: 'QUARTERLY',
    status: 'ACTIVE',
    startDate: '2026-01-01',
    endDate: '2026-03-31',
    requiresEmployeeSubmission: true,
  },
]

vi.mock('react-router-dom', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
  useLocation: () => ({ search: '' }),
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
    data: { data: [{ departmentId: 3, departmentName: 'Engineering' }] },
  }),
}))

vi.mock('../../features/position/api/positionApi', () => ({
  useGetPositionsByDepartmentQuery: () => ({
    data: { data: [{ id: 7, positionId: 7, name: 'Developer', positionName: 'Developer' }] },
  }),
}))

vi.mock('../../features/hrEmployeeList/hrEmployeeApi', () => ({
  useGetEmployeesQuery: () => ({
    data: {
      data: {
        content: [
          {
            employeeId: 1001,
            departmentName: 'Engineering',
            positionName: 'Developer',
            employeeActiveStatus: 'ACTIVE',
            employmentStatus: 'Active',
          },
        ],
      },
    },
  }),
}))

vi.mock('../../features/selfAssessmentForm/api/selfAssessmentFormApi', () => ({
  useCreateQuestionBankItemMutation: () => [vi.fn(), { isLoading: false }],
  useCreateTemplateMutation: () => [createTemplateMock, { isLoading: false }],
  useCheckActiveTemplateConflictsMutation: () => [checkConflictsMock],
  useDeleteCopiedTemplateMutation: () => [vi.fn()],
  useGetCopiedTemplateQuery: () => ({ data: undefined }),
  useGetQuestionBankQuery: () => ({ data: [], isLoading: false }),
  useGetSelfAssessmentSettingsQuery: () => ({
    data: { ratingSystem: 'TEN_POINT', tenPointYesMinRating: 6 },
    isLoading: false,
    isError: false,
  }),
}))

vi.mock('../../features/reviewCycle/api/reviewCycleApi', () => ({
  useGetActiveReviewCyclesQuery: () => ({ data: reviewCycles, isLoading: false }),
  useGetReviewCyclesQuery: () => ({ data: reviewCycles, isLoading: false }),
}))

describe('CreateSelfAssessmentTemplatePage preview', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    navigateMock.mockReset()
    createTemplateMock.mockReset()
    checkConflictsMock.mockReset()
    checkConflictsMock.mockReturnValue({ unwrap: () => Promise.resolve([]) })
  })

  it('opens a preview from unsaved form data without creating a template', async () => {
    const user = userEvent.setup()
    render(<CreateSelfAssessmentTemplatePage />)

    await user.type(screen.getByPlaceholderText('e.g. Q1 Performance Self-Evaluation'), 'Draft Growth Template')
    await user.type(screen.getByPlaceholderText('Question 1'), 'Describe your biggest delivery improvement')
    await user.click(screen.getByRole('button', { name: 'Add Question' }))

    await user.click(screen.getByRole('button', { name: 'Preview Template' }))

    const dialog = screen.getByRole('dialog', { name: 'Draft Growth Template' })
    expect(within(dialog).getByText('Describe your biggest delivery improvement')).toBeInTheDocument()
    expect(within(dialog).queryByText('Question 2')).not.toBeInTheDocument()
    expect(within(dialog).getByText('1-10 scale')).toBeInTheDocument()
    expect(createTemplateMock).not.toHaveBeenCalled()
    expect(checkConflictsMock).not.toHaveBeenCalled()
  })
})
