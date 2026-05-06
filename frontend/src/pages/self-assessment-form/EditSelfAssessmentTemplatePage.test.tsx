import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { EditSelfAssessmentTemplatePage } from './EditSelfAssessmentTemplatePage'

const navigateMock = vi.fn()
const updateTemplateMock = vi.fn()

let roleId = 2
let templateData = {
  id: 10,
  title: 'Engineering Self Assessment',
  departmentId: 3,
  departmentName: 'Engineering',
  positionId: 7,
  positionName: 'Manager',
  reviewCycleId: 1,
  reviewCycleName: 'Q1',
  isActive: true,
  ratingSystem: 'FIVE_POINT',
  tenPointYesMinRating: 5,
  isLocked: false,
  createdOn: '',
  createdBy: 1,
  questions: [
    {
      id: 101,
      questionText: 'HR-created question',
      sortOrder: 0,
      createdBy: 1,
      createdByRoleId: 1,
      isManagerAdded: false,
      canEdit: false,
      canDeactivate: false,
      canHighlight: false,
      createdOn: '',
      deletedAt: null,
      deletedBy: null,
    },
  ],
  deletedQuestions: [],
}

vi.mock('react-redux', () => ({
  useSelector: (selector: (state: unknown) => unknown) => selector({ auth: { user: { roleId } } }),
}))

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
  useParams: () => ({ templateId: '10' }),
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
    data: { data: [{ id: 7, name: 'Manager' }] },
  }),
}))

vi.mock('../../features/selfAssessmentForm/api/selfAssessmentFormApi', () => ({
  useCreateQuestionBankItemMutation: () => [vi.fn(), { isLoading: false }],
  useGetTemplateByIdQuery: () => ({
    currentData: templateData,
    refetch: vi.fn(),
    isLoading: false,
    isFetching: false,
    isError: false,
    error: undefined,
  }),
  useGetQuestionBankQuery: () => ({ data: [], isLoading: false }),
  useUpdateTemplateMutation: () => [updateTemplateMock, { isLoading: false }],
}))

const managerQuestion = {
  id: 202,
  questionText: 'Manager-added question',
  sortOrder: 1,
  createdBy: 2,
  createdByRoleId: 2,
  isManagerAdded: true,
  canEdit: true,
  canDeactivate: true,
  canHighlight: true,
  createdOn: '',
  deletedAt: null,
  deletedBy: null,
}

describe('EditSelfAssessmentTemplatePage manager question permissions', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    roleId = 2
    templateData = {
      ...templateData,
      isLocked: false,
      questions: [
        {
          ...templateData.questions[0],
          canEdit: false,
          canDeactivate: false,
          isManagerAdded: false,
          canHighlight: false,
        },
      ],
      deletedQuestions: [],
    }
    navigateMock.mockReset()
    updateTemplateMock.mockReset()
    updateTemplateMock.mockReturnValue({ unwrap: () => Promise.resolve({}) })
  })

  it('lets an unlocked manager add and submit their own question while keeping template details read-only', async () => {
    const user = userEvent.setup()
    render(<EditSelfAssessmentTemplatePage />)

    const title = await screen.findByPlaceholderText('e.g. Q1 Performance Self-Evaluation')
    expect(title).toHaveAttribute('readonly')
    expect(screen.getByPlaceholderText('Question 1')).toHaveAttribute('readonly')

    await user.click(screen.getByRole('button', { name: 'Add Question' }))
    await user.type(screen.getByPlaceholderText('Question 2'), 'Manager follow-up question')
    await user.click(screen.getByRole('button', { name: 'Save Changes' }))

    await waitFor(() => {
      expect(updateTemplateMock).toHaveBeenCalledWith({
        id: 10,
        request: {
          title: 'Engineering Self Assessment',
          departmentId: 3,
          positionId: 7,
          isActive: true,
          questions: [
            { id: 101, questionText: 'HR-created question', sortOrder: 0 },
            { questionText: 'Manager follow-up question', sortOrder: 1 },
          ],
        },
      })
    })
  })

  it('keeps HR-created rows read-only for managers', async () => {
    render(<EditSelfAssessmentTemplatePage />)

    expect(await screen.findByPlaceholderText('Question 1')).toHaveAttribute('readonly')
    expect(screen.queryByLabelText('Remove question')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add Question' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Question Bank' })).toBeInTheDocument()
  })

  it('lets HR edit and remove manager-added rows with the Manager badge visible', async () => {
    roleId = 1
    templateData = {
      ...templateData,
      questions: [
        { ...templateData.questions[0], canEdit: true, canDeactivate: true },
        managerQuestion,
      ],
    }

    render(<EditSelfAssessmentTemplatePage />)

    await screen.findByPlaceholderText('Question 2')
    expect(screen.getAllByText('Manager').length).toBeGreaterThan(0)
    expect(screen.getByPlaceholderText('Question 2')).not.toHaveAttribute('readonly')
    expect(screen.getAllByLabelText('Remove question')).toHaveLength(2)
  })

  it('blocks question edits when the template is locked', async () => {
    roleId = 1
    templateData = {
      ...templateData,
      isLocked: true,
      questions: [{ ...templateData.questions[0], canEdit: true, canDeactivate: true }],
    }

    render(<EditSelfAssessmentTemplatePage />)

    expect(await screen.findByPlaceholderText('Question 1')).toHaveAttribute('readonly')
    expect(screen.queryByRole('button', { name: 'Add Question' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Question Bank' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Go Back' })).toBeInTheDocument()
  })
})
