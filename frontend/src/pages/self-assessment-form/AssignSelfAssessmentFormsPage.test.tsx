import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { skipToken } from '@reduxjs/toolkit/query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { AssignSelfAssessmentFormsPage } from './AssignSelfAssessmentFormsPage'

const navigateMock = vi.fn()
const assignFormsMock = vi.fn()
const previewHookMock = vi.fn()
let locationSearch = ''

vi.mock('react-router-dom', () => ({
  Link: ({ to, children, ...props }: { to: string; children: ReactNode }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  useNavigate: () => navigateMock,
  useLocation: () => ({ search: locationSearch }),
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
            employeeId: 1,
            employeeName: 'Alex Chen',
            staffNo: 'EMP-001',
            employeeActiveStatus: 'ACTIVE',
            employmentStatus: 'Active',
            departmentName: 'Engineering',
            positionName: 'Developer',
          },
          {
            employeeId: 2,
            employeeName: 'Sam Rivera',
            staffNo: 'EMP-002',
            employeeActiveStatus: 'ACTIVE',
            employmentStatus: 'Active',
            departmentName: 'Engineering',
            positionName: 'Designer',
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

describe('AssignSelfAssessmentFormsPage assignment preview', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    navigateMock.mockReset()
    assignFormsMock.mockReset()
    previewHookMock.mockReset()
    locationSearch = ''
    previewHookMock.mockReturnValue({
      data: previewData,
      isFetching: false,
      isError: false,
    })
  })

  it('skips preview until a target is available', () => {
    render(<AssignSelfAssessmentFormsPage />)

    expect(previewHookMock).toHaveBeenLastCalledWith(skipToken)
  })

  it('requests preview for selected departments', async () => {
    const user = userEvent.setup()
    render(<AssignSelfAssessmentFormsPage />)

    await user.click(screen.getByText('Engineering'))

    expect(previewHookMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        targets: expect.arrayContaining([
          { departmentId: 10, positionId: 20 },
          { departmentId: 10, positionId: 22 },
        ]),
      }),
    )
    expect(await screen.findByText('Template Preview')).toBeTruthy()
  })

  it('requests preview for selected positions', async () => {
    const user = userEvent.setup()
    render(<AssignSelfAssessmentFormsPage />)

    await user.click(screen.getByText('Specific Positions'))
    await user.click(screen.getByText('Developer'))

    expect(previewHookMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        targets: [{ departmentId: 10, positionId: 20 }],
      }),
    )
    expect(await screen.findByText('Template Preview')).toBeTruthy()
  })

  it('shows employee names in preview cards for specific employees', async () => {
    const user = userEvent.setup()
    previewHookMock.mockReturnValue({
      data: [
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
      ],
      isFetching: false,
      isError: false,
    })

    render(<AssignSelfAssessmentFormsPage />)

    await user.click(screen.getByText('Employee Name'))
    await user.click(screen.getByText('Sam Rivera'))

    expect(screen.getAllByText('Sam Rivera').length).toBeGreaterThanOrEqual(2)
    expect(await screen.findByText('Engineering · Designer')).toBeTruthy()
    expect(screen.getByText('No matching template for the active employee-submission cycle')).toBeTruthy()
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

  it('assigns hybrid targets from the current department and position pair without clicking Add Rule', async () => {
    const user = userEvent.setup()
    assignFormsMock.mockReturnValue({
      unwrap: vi.fn().mockResolvedValue({
        createdCount: 1,
        skippedExistingCount: 0,
        skippedNoTemplateCount: 0,
        skippedIneligibleCount: 0,
      }),
    })

    render(<AssignSelfAssessmentFormsPage />)

    await user.click(screen.getByText('Hybrid Selection'))
    const selects = screen.getAllByRole('combobox')
    await user.selectOptions(selects[0], '10')
    await user.selectOptions(selects[1], '20')
    await user.click(screen.getByRole('button', { name: /Assign Forms/i }))

    await waitFor(() => {
      expect(assignFormsMock).toHaveBeenCalledWith({
        assignmentMode: 'HYBRID',
        departmentIds: [10],
        positionIds: [20],
        startDate: '2026-05-01',
        deadlineDate: '2026-05-31',
        managerReviewDeadlineDate: '2026-05-31',
        timelineMode: 'REVIEW_CYCLE',
        manualStartDate: null,
        manualEndDate: null,
      })
    })
  })

  it('shows hybrid rule count and employee reach before adding a rule', async () => {
    const user = userEvent.setup()
    render(<AssignSelfAssessmentFormsPage />)

    await user.click(screen.getByText('Hybrid Selection'))
    const selects = screen.getAllByRole('combobox')
    await user.selectOptions(selects[0], '10')
    await user.selectOptions(selects[1], '20')

    expect(await screen.findByText('1 rule')).toBeTruthy()
    expect(screen.getAllByText('1 employee').length).toBeGreaterThanOrEqual(2)
    expect(screen.getAllByText('Engineering + Developer').length).toBeGreaterThanOrEqual(1)
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

    expect(navigateMock).toHaveBeenCalledWith('/hr/self-assessment/assignments')
  })
})
