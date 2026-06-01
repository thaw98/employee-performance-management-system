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

vi.mock('react-redux', () => ({
  useSelector: (selector: (state: unknown) => unknown) => selector({ auth: { user: { roleId: 1 } } }),
}))

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

let selfAssessmentSettings = {
  ratingSystem: 'TEN_POINT' as const,
  tenPointYesMinRating: 6,
  fivePointYesMinRating: 3,
  yesMinRating: null,
  includeYesNo: true,
  ratingSystemEditable: true,
  ratingSystemLockReason: null,
}

vi.mock('../../features/selfAssessmentForm/api/selfAssessmentFormApi', () => ({
  useCreateQuestionBankItemMutation: () => [vi.fn(), { isLoading: false }],
  useCreateTemplateMutation: () => [createTemplateMock, { isLoading: false }],
  useCheckActiveTemplateConflictsMutation: () => [checkConflictsMock],
  useDeleteCopiedTemplateMutation: () => [vi.fn()],
  useGetCopiedTemplateQuery: () => ({ data: undefined }),
  useGetQuestionBankQuery: () => ({ data: [], isLoading: false }),
  useGetSelfAssessmentSettingsQuery: () => ({
    data: selfAssessmentSettings,
    isLoading: false,
    isError: false,
  }),
}))

vi.mock('../../features/reviewCycle/api/reviewCycleApi', () => ({
  useGetActiveReviewCyclesQuery: () => ({ data: reviewCycles, isLoading: false }),
  useGetReviewCyclesQuery: () => ({ data: reviewCycles, isLoading: false }),
}))

vi.mock('../../features/scoreExplanation/scoreExplanationApi', () => ({
  useGetScoreExplanationsQuery: () => ({
    data: null,
    isLoading: false,
    isError: false,
  }),
}))

describe('CreateSelfAssessmentTemplatePage preview', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    selfAssessmentSettings = {
      ratingSystem: 'TEN_POINT',
      tenPointYesMinRating: 6,
      fivePointYesMinRating: 3,
      yesMinRating: null,
      includeYesNo: true,
      ratingSystemEditable: true,
      ratingSystemLockReason: null,
    }
    navigateMock.mockReset()
    createTemplateMock.mockReset()
    checkConflictsMock.mockReset()
    checkConflictsMock.mockReturnValue({ unwrap: () => Promise.resolve([]) })
  })

  it('initializes rating controls from global settings', async () => {
    render(<CreateSelfAssessmentTemplatePage />)

    const labels = screen.getAllByText('1-10 Scale')
    expect(labels.length).toBeGreaterThan(0)
  })

  it('initializes rating controls from global settings with yesMinRating', async () => {
    selfAssessmentSettings = {
      ...selfAssessmentSettings,
      yesMinRating: 7,
    }

    render(<CreateSelfAssessmentTemplatePage />)

    const labels = await screen.findAllByText(/and above/)
    const thresholdLabel = labels.find((el) => el.textContent?.startsWith('7'))
    expect(thresholdLabel).toBeTruthy()
  })

  it('hides Yes/No in preview when self-assessment settings disable it', async () => {
    const user = userEvent.setup()
    selfAssessmentSettings = {
      ...selfAssessmentSettings,
      includeYesNo: false,
    }

    render(<CreateSelfAssessmentTemplatePage />)

    await user.type(screen.getByPlaceholderText('e.g. Q1 Performance Self-Evaluation'), 'Rating Only Preview')
    await user.type(screen.getByPlaceholderText('Question 1'), 'Delivery quality question')
    await user.click(screen.getByRole('button', { name: 'Preview Template' }))

    const dialog = screen.getByRole('dialog', { name: 'Rating Only Preview' })
    expect(within(dialog).queryByText('Yes Scores')).not.toBeInTheDocument()
    expect(within(dialog).queryByText('Answer')).not.toBeInTheDocument()
    expect(within(dialog).getByText('(Rating Only)')).toBeInTheDocument()
  })

  it('opens a preview from unsaved form data without creating a template', async () => {
    const user = userEvent.setup()
    render(<CreateSelfAssessmentTemplatePage />)

    await user.type(screen.getByPlaceholderText('e.g. Q1 Performance Self-Evaluation'), 'Draft Growth Template')
    await user.type(screen.getByPlaceholderText('Question 1'), 'Describe your biggest delivery improvement')
    await user.click(screen.getByRole('button', { name: 'Add Question' }))

    await user.click(screen.getByRole('button', { name: 'Preview Template' }))

    const dialog = screen.getByRole('dialog', { name: 'Draft Growth Template' })
    expect(dialog).toHaveTextContent('Describe your biggest delivery improvement')
    expect(dialog).toHaveTextContent('1-10 Scale')
    expect(createTemplateMock).not.toHaveBeenCalled()
    expect(checkConflictsMock).not.toHaveBeenCalled()
  })

  it('preview reflects changed Rating Scale', async () => {
    const user = userEvent.setup()
    render(<CreateSelfAssessmentTemplatePage />)

    const selects = screen.getAllByRole('combobox')
    const ratingSelect = selects.find(
      (s) => s.tagName === 'SELECT' && Array.from(s.options).some((o) => o.value === 'TWO_POINT')
    ) as HTMLSelectElement
    expect(ratingSelect).toBeTruthy()
    await user.selectOptions(ratingSelect, 'TWO_POINT')

    // The page's inline preview should update immediately
    const labels = screen.getAllByText('1-2 Scale')
    expect(labels.length).toBeGreaterThan(0)
  })

  it('save payload includes changed rating settings', async () => {
    const user = userEvent.setup()
    createTemplateMock.mockReturnValue({ unwrap: () => Promise.resolve({}) })
    render(<CreateSelfAssessmentTemplatePage />)

    await user.type(screen.getByPlaceholderText('e.g. Q1 Performance Self-Evaluation'), 'Test Template')
    await user.click(screen.getByText('All Employees'))

    const selects = screen.getAllByRole('combobox')
    const ratingSelect = selects.find(
      (s) => s.tagName === 'SELECT' && Array.from(s.options).some((o) => o.value === 'FIVE_POINT')
    ) as HTMLSelectElement
    if (ratingSelect) {
      await user.selectOptions(ratingSelect, 'FIVE_POINT')
    }

    const checkboxes = screen.getAllByRole('checkbox') as HTMLInputElement[]
    const yesNoCheckbox = checkboxes.find((cb) => {
      const label = cb.parentElement
      if (!label || label.tagName !== 'LABEL') return false
      const container = label.parentElement
      return container && container.textContent?.includes('Include Yes/No')
    })
    expect(yesNoCheckbox).toBeTruthy()
    if (yesNoCheckbox) {
      await user.click(yesNoCheckbox)
    }

    await user.type(screen.getByPlaceholderText('Question 1'), 'Test question')
    await user.click(screen.getByRole('button', { name: 'Create Template' }))

    await vi.waitFor(() => {
      expect(createTemplateMock).toHaveBeenCalled()
      const callArg = createTemplateMock.mock.calls[0][0]
      expect(callArg.ratingSystem).toBe('FIVE_POINT')
      expect(callArg.includeYesNo).toBe(false)
      expect(callArg.yesMinRating).toBe(5)
    })
  })
})

describe('CreateSelfAssessmentTemplatePage rating controls behavior', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    selfAssessmentSettings = {
      ratingSystem: 'TEN_POINT',
      tenPointYesMinRating: 6,
      fivePointYesMinRating: 3,
      yesMinRating: null,
      includeYesNo: true,
      ratingSystemEditable: true,
      ratingSystemLockReason: null,
    }
    navigateMock.mockReset()
    createTemplateMock.mockReset()
    checkConflictsMock.mockReset()
    checkConflictsMock.mockReturnValue({ unwrap: () => Promise.resolve([]) })
  })

  it('changing Rating Scale normalizes the Yes Threshold', async () => {
    const user = userEvent.setup()
    selfAssessmentSettings = {
      ...selfAssessmentSettings,
      ratingSystem: 'TEN_POINT',
      yesMinRating: 9,
    }

    render(<CreateSelfAssessmentTemplatePage />)

    const selects = screen.getAllByRole('combobox')
    const ratingSelect = selects.find(
      (s) => s.tagName === 'SELECT' && Array.from(s.options).some((o) => o.value === 'FIVE_POINT')
    ) as HTMLSelectElement
    if (ratingSelect) {
      await user.selectOptions(ratingSelect, 'FIVE_POINT')
    }

    expect(ratingSelect?.value).toBe('FIVE_POINT')
    await screen.findByText('5 and above')
  })
})
