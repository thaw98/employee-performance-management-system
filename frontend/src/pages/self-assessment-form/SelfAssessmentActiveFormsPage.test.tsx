import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SelfAssessmentActiveFormsPage } from './SelfAssessmentActiveFormsPage'

const navigateMock = vi.fn()
const hrActiveCycleHookMock = vi.fn()
const managerActiveCycleHookMock = vi.fn()

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
      },
      status: 'SUBMITTED',
      totalScore: null,
      ratingCategory: null,
      submittedDate: null,
      assessmentDate: null,
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
    hrActiveCycleHookMock.mockReturnValue({ data: activeCycleResponse, isLoading: false, isError: false })
    managerActiveCycleHookMock.mockReturnValue({ data: activeCycleResponse, isLoading: false, isError: false })
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
})
