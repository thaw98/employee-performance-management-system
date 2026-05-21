import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SelfAssessmentActiveFormsPage } from './SelfAssessmentActiveFormsPage'

const navigateMock = vi.fn()
const hrActiveCycleHookMock = vi.fn()
const managerActiveCycleHookMock = vi.fn()
const hrUnlockRetakeMock = vi.fn()
const toastSuccessMock = vi.fn()
const toastErrorMock = vi.fn()

let currentRoleId = 1

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
}))

vi.mock('react-redux', () => ({
  useSelector: (selector: (state: unknown) => unknown) =>
    selector({
      auth: { user: { roleId: currentRoleId, name: 'Test User', email: 'test@example.com' } },
    }),
}))

vi.mock('../../features/reviewCycle/api/reviewCycleApi', () => ({
  useGetActiveReviewCyclesQuery: () => ({ data: [], isLoading: false }),
  useGetReviewCyclesQuery: () => ({ data: [], isLoading: false }),
}))

vi.mock('../../features/selfAssessmentForm/api/selfAssessmentFormApi', () => ({
  useGetActiveCycleFormsForHrQuery: (...args: unknown[]) => hrActiveCycleHookMock(...args),
  useGetActiveCycleFormsForManagerQuery: (...args: unknown[]) => managerActiveCycleHookMock(...args),
  useHrUnlockRetakeMutation: () => [hrUnlockRetakeMock, { isLoading: false }],
}))

vi.mock('react-hot-toast', () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccessMock(...args),
    error: (...args: unknown[]) => toastErrorMock(...args),
  },
}))

const activeCycleResponse = {
  activeCycle: {
    id: 7,
    name: 'Q2 2026',
    code: 'Q2-2026',
    startDate: '2026-05-01',
    endDate: '2026-05-31',
  },
  forms: [
    {
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
        roleId: 3,
      },
      status: 'SUBMITTED',
      totalScore: null,
      ratingCategory: null,
      submittedDate: null,
      assessmentDate: null,
      retakeSubmittedAt: null,
      createdDate: '2026-05-05T09:30:00Z',
    },
  ],
}

describe('SelfAssessmentActiveFormsPage', () => {
  beforeEach(() => {
    currentRoleId = 1
    navigateMock.mockReset()
    hrActiveCycleHookMock.mockReset()
    managerActiveCycleHookMock.mockReset()
    hrUnlockRetakeMock.mockReset()
    toastSuccessMock.mockReset()
    toastErrorMock.mockReset()
    hrUnlockRetakeMock.mockReturnValue({ unwrap: () => Promise.resolve({}) })
    hrActiveCycleHookMock.mockReturnValue({ data: activeCycleResponse, isLoading: false, isError: false, refetch: vi.fn() })
    managerActiveCycleHookMock.mockReturnValue({ data: activeCycleResponse, isLoading: false, isError: false, refetch: vi.fn() })
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('uses the manager active-cycle query for manager users', () => {
    currentRoleId = 2

    render(<SelfAssessmentActiveFormsPage />)

    expect(managerActiveCycleHookMock).toHaveBeenCalledWith(undefined, { skip: false })
    expect(hrActiveCycleHookMock).toHaveBeenCalledWith(undefined, { skip: true })
    expect(screen.getByText('Team Assigned Self-Assessment Forms')).toBeTruthy()
    expect(screen.getByText('Aye Aye')).toBeTruthy()
    expect(screen.getByText('Manager Review Deadline')).toBeTruthy()
    expect(screen.getByText('May 20, 2026')).toBeTruthy()
  })

  it('routes manager View to the manager review detail page', async () => {
    currentRoleId = 2
    const user = userEvent.setup()
    render(<SelfAssessmentActiveFormsPage />)

    await user.click(screen.getByText('View'))

    expect(navigateMock).toHaveBeenCalledWith('/manager/self-assessment-forms/reviews/500')
  })

  it('shows Unlock for eligible HR retake rows and confirms the mutation', async () => {
    const refetch = vi.fn()
    hrActiveCycleHookMock.mockReturnValue({
      data: {
        ...activeCycleResponse,
        forms: [
          {
            ...activeCycleResponse.forms[0],
            id: 501,
            status: 'PENDING_RETAKE_MANAGER_REVIEW',
            retakeSubmittedAt: '2026-05-18T10:00:00Z',
          },
        ],
      },
      isLoading: false,
      isError: false,
      refetch,
    })
    const user = userEvent.setup()

    render(<SelfAssessmentActiveFormsPage />)
    await user.click(screen.getByText('Unlock'))
    expect(screen.getAllByText('Unlock Retake').length).toBeGreaterThan(0)

    await user.click(screen.getByRole('button', { name: 'Unlock Retake' }))

    expect(hrUnlockRetakeMock).toHaveBeenCalledWith({ formId: 501 })
    expect(toastSuccessMock).toHaveBeenCalledWith('Retake unlocked for editing')
    expect(refetch).toHaveBeenCalled()
  })

  it('shows Unlock for submitted manager self-assessment rows pending final approval', () => {
    hrActiveCycleHookMock.mockReturnValue({
      data: {
        ...activeCycleResponse,
        forms: [
          {
            ...activeCycleResponse.forms[0],
            id: 502,
            status: 'PENDING_FINAL_APPROVAL',
            retakeSubmittedAt: '2026-05-18T10:00:00Z',
            employee: {
              ...activeCycleResponse.forms[0].employee,
              roleId: 2,
            },
          },
        ],
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    })

    render(<SelfAssessmentActiveFormsPage />)

    expect(screen.getByText('Unlock')).toBeTruthy()
  })

  it('does not show Unlock for manager users or ineligible HR rows', () => {
    currentRoleId = 2

    render(<SelfAssessmentActiveFormsPage />)

    expect(screen.queryByText('Unlock')).toBeNull()

    cleanup()
    currentRoleId = 1
    hrActiveCycleHookMock.mockReturnValue({
      data: activeCycleResponse,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    })

    render(<SelfAssessmentActiveFormsPage />)

    expect(screen.queryByText('Unlock')).toBeNull()
  })
})
