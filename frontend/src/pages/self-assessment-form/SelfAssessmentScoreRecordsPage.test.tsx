import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { SelfAssessmentScoreRecordsPage } from './SelfAssessmentScoreRecordsPage'

const navigateMock = vi.fn()
const scoreRecordsHookMock = vi.fn()

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
  useLocation: () => ({ pathname: '/hr/self-assessment/score-records' }),
  Link: ({ to, children, ...props }: { to: string; children: ReactNode }) => (
    <a href={to} {...props}>{children}</a>
  ),
}))

vi.mock('react-redux', () => ({
  useSelector: (selector: (state: unknown) => unknown) =>
    selector({
      auth: { user: { roleId: currentRoleId, name: 'Test User', email: 'test@example.com' } },
    }),
  useDispatch: () => vi.fn(),
}))

vi.mock('react-hot-toast', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('../../features/selfAssessmentForm/api/selfAssessmentFormApi', () => ({
  useGetScoreRecordsQuery: (...args: unknown[]) => scoreRecordsHookMock(...args),
}))

const mockRecords = [
  {
    id: 1,
    employee: {
      id: 10,
      employeeId: 'EMP-10',
      employeeName: 'Alice Johnson',
      email: 'alice@example.com',
      departmentId: 100,
      departmentName: 'Engineering',
      departmentCode: 'ENG',
      positionId: 200,
      positionName: 'Developer',
      positionCode: 'DEV',
    },
    status: 'FINALIZED_LOCKED',
    finalApprovedScore: 88.5,
    performance: 'Outstanding',
    cycleId: 7,
    cycleName: 'Q2 2026',
    submittedDate: '2026-05-02T00:00:00Z',
    createdDate: '2026-05-01T00:00:00Z',
    finalApprovalDate: '2026-05-05T00:00:00Z',
  },
  {
    id: 2,
    employee: {
      id: 11,
      employeeId: 'EMP-11',
      employeeName: 'Bob Smith',
      email: 'bob@example.com',
      departmentId: 101,
      departmentName: 'Finance',
      departmentCode: 'FIN',
      positionId: 201,
      positionName: 'Analyst',
      positionCode: 'ANA',
    },
    status: 'APPROVED',
    finalApprovedScore: 72.0,
    performance: 'Good',
    cycleId: 7,
    cycleName: 'Q2 2026',
    submittedDate: '2026-05-03T00:00:00Z',
    createdDate: '2026-05-02T00:00:00Z',
    finalApprovalDate: '2026-05-06T00:00:00Z',
  },
  {
    id: 3,
    employee: {
      id: 12,
      employeeId: 'EMP-12',
      employeeName: 'Carol White',
      email: 'carol@example.com',
      departmentId: 100,
      departmentName: 'Engineering',
      departmentCode: 'ENG',
      positionId: 202,
      positionName: 'Designer',
      positionCode: 'DES',
    },
    status: 'PENDING_FINAL_APPROVAL',
    finalApprovedScore: null,
    performance: null,
    cycleId: 8,
    cycleName: 'Q3 2026',
    submittedDate: null,
    createdDate: '2026-06-01T00:00:00Z',
    finalApprovalDate: null,
  },
]

let currentRoleId = 1

function expectMetricCard(label: string, value: string) {
  const labelElement = screen.getByText(label)
  expect(labelElement).toBeTruthy()
  expect(within(labelElement.parentElement!).getByText(value)).toBeTruthy()
}

describe('SelfAssessmentScoreRecordsPage', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  beforeEach(() => {
    navigateMock.mockReset()
    scoreRecordsHookMock.mockReset()
    scoreRecordsHookMock.mockReturnValue({ data: mockRecords, isLoading: false, isError: false })
    currentRoleId = 1
  })

  it('renders score records table with HR columns', () => {
    render(<SelfAssessmentScoreRecordsPage />)

    expect(screen.getByText('Score Records')).toBeTruthy()
    expect(screen.getByText('Alice Johnson')).toBeTruthy()
    expect(screen.getByText('Bob Smith')).toBeTruthy()
    expect(screen.getAllByText('Engineering').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Finance')).toBeTruthy()
    expect(screen.getByText('Developer')).toBeTruthy()
    expect(screen.getByText('Outstanding')).toBeTruthy()
    expect(screen.getByText('Good')).toBeTruthy()
  })

  it('shows Department column for HR role', () => {
    render(<SelfAssessmentScoreRecordsPage />)

    expect(screen.getByText('Department')).toBeTruthy()
  })

  it('hides Department column for Manager role', () => {
    currentRoleId = 2
    render(<SelfAssessmentScoreRecordsPage />)

    const headers = screen.getAllByRole('columnheader').map(h => h.textContent)
    expect(headers.some(h => h.includes('Department'))).toBe(false)
  })

  it('displays score bar with numeric value', () => {
    render(<SelfAssessmentScoreRecordsPage />)

    expect(screen.getAllByText('88.5%').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('72.0%')).toBeTruthy()
  })

  it('displays dash for null score', () => {
    render(<SelfAssessmentScoreRecordsPage />)

    const carolRow = screen.getByText('Carol White').closest('tr')
    expect(carolRow).toBeTruthy()
    const scoreCells = within(carolRow!).getAllByText('-')
    expect(scoreCells.length).toBeGreaterThanOrEqual(1)
  })

  it('displays dash for null performance', () => {
    render(<SelfAssessmentScoreRecordsPage />)

    const carolRow = screen.getByText('Carol White').closest('tr')
    expect(carolRow).toBeTruthy()
    expect(within(carolRow!).getAllByText('-').length).toBeGreaterThanOrEqual(1)
  })

  it('filters by cycle', async () => {
    const user = userEvent.setup()
    render(<SelfAssessmentScoreRecordsPage />)

    const cycleSelects = screen.getAllByRole('combobox')
    const cycleSelect = cycleSelects.find(s => (s as HTMLSelectElement).options?.length > 1 && Array.from((s as HTMLSelectElement).options).some(o => o.text === 'Q3 2026'))
    expect(cycleSelect).toBeTruthy()
    await user.selectOptions(cycleSelect!, 'Q3 2026')

    expect(screen.getByText('Carol White')).toBeTruthy()
    expect(screen.queryByText('Alice Johnson')).toBeNull()
  })

  it('searches by employee name via global filter', async () => {
    const user = userEvent.setup()
    render(<SelfAssessmentScoreRecordsPage />)

    const searchInput = screen.getByPlaceholderText('Search employees, departments...')
    await user.type(searchInput, 'Alice')

    expect(screen.getByText('Alice Johnson')).toBeTruthy()
    expect(screen.queryByText('Bob Smith')).toBeNull()
  })

  it('navigates to review page on View click', async () => {
    const user = userEvent.setup()
    render(<SelfAssessmentScoreRecordsPage />)

    const viewButtons = screen.getAllByText('View')
    await user.click(viewButtons[0])

    expect(navigateMock).toHaveBeenCalledWith('/hr/self-assessment/reviews/1')
  })

  it('navigates to manager review page for manager role', async () => {
    currentRoleId = 2
    const user = userEvent.setup()
    render(<SelfAssessmentScoreRecordsPage />)

    const viewButtons = screen.getAllByText('View')
    await user.click(viewButtons[0])

    expect(navigateMock).toHaveBeenCalledWith('/manager/self-assessment-forms/reviews/1')
  })

  it('shows all metric cards for HR role', () => {
    render(<SelfAssessmentScoreRecordsPage />)

    expectMetricCard('Total Records', '3')
    expectMetricCard('Average Score', '80.3%')
    expectMetricCard('Top Score', '88.5%')
    expectMetricCard('Finalized / Approved', '2')
  })

  it('shows all metric cards for Manager role', () => {
    currentRoleId = 2
    render(<SelfAssessmentScoreRecordsPage />)

    expectMetricCard('Total Records', '3')
    expectMetricCard('Average Score', '80.3%')
    expectMetricCard('Top Score', '88.5%')
    expectMetricCard('Finalized / Approved', '2')
  })

  it('ignores null scores for Average Score and Top Score cards', () => {
    render(<SelfAssessmentScoreRecordsPage />)

    expectMetricCard('Average Score', `${((88.5 + 72.0) / 2).toFixed(1)}%`)
    expectMetricCard('Top Score', '88.5%')
  })

  it('counts only finalized locked and approved records in Finalized / Approved card', () => {
    render(<SelfAssessmentScoreRecordsPage />)

    expectMetricCard('Finalized / Approved', '2')
  })

  it('updates metric cards after applying the cycle filter', async () => {
    const user = userEvent.setup()
    render(<SelfAssessmentScoreRecordsPage />)

    const cycleSelects = screen.getAllByRole('combobox')
    const cycleSelect = cycleSelects.find(s => Array.from((s as HTMLSelectElement).options).some(o => o.text === 'Q3 2026'))
    expect(cycleSelect).toBeTruthy()
    await user.selectOptions(cycleSelect!, 'Q3 2026')

    expectMetricCard('Total Records', '1')
    expectMetricCard('Average Score', '-')
    expectMetricCard('Top Score', '-')
    expectMetricCard('Finalized / Approved', '0')
  })

  it('updates metric cards after typing in the search box', async () => {
    const user = userEvent.setup()
    render(<SelfAssessmentScoreRecordsPage />)

    const searchInput = screen.getByPlaceholderText('Search employees, departments...')
    await user.type(searchInput, 'Alice')

    expectMetricCard('Total Records', '1')
    expectMetricCard('Average Score', '88.5%')
    expectMetricCard('Top Score', '88.5%')
    expectMetricCard('Finalized / Approved', '1')
  })

  it('shows zero total and dashes for score cards when filters return no records', async () => {
    const user = userEvent.setup()
    render(<SelfAssessmentScoreRecordsPage />)

    const searchInput = screen.getByPlaceholderText('Search employees, departments...')
    await user.type(searchInput, 'No matching employee')

    expectMetricCard('Total Records', '0')
    expectMetricCard('Average Score', '-')
    expectMetricCard('Top Score', '-')
    expectMetricCard('Finalized / Approved', '0')
  })

  it('shows loading spinner', () => {
    scoreRecordsHookMock.mockReturnValue({ data: [], isLoading: true, isError: false })
    render(<SelfAssessmentScoreRecordsPage />)

    expect(document.querySelector('.animate-spin')).toBeTruthy()
  })

  it('shows error message on API failure', () => {
    scoreRecordsHookMock.mockReturnValue({ data: [], isLoading: false, isError: true })
    render(<SelfAssessmentScoreRecordsPage />)

    expect(screen.getByText('Failed to load score records.')).toBeTruthy()
  })

  it('shows empty state when no records', () => {
    scoreRecordsHookMock.mockReturnValue({ data: [], isLoading: false, isError: false })
    render(<SelfAssessmentScoreRecordsPage />)

    expect(screen.getByText('No score records found.')).toBeTruthy()
  })

  it('paginates records correctly', () => {
    const manyRecords = Array.from({ length: 12 }, (_, i) => ({
      id: i + 1,
      employee: {
        id: 10 + i,
        employeeId: `EMP-${10 + i}`,
        employeeName: `Employee ${i + 1}`,
        email: `emp${i}@example.com`,
        departmentId: 100,
        departmentName: 'Engineering',
        departmentCode: 'ENG',
        positionId: 200,
        positionName: 'Developer',
        positionCode: 'DEV',
      },
      status: 'FINALIZED_LOCKED',
      finalApprovedScore: 50.0 + i,
      performance: 'Good',
      cycleId: 7,
      cycleName: 'Q2 2026',
      submittedDate: '2026-05-02T00:00:00Z',
      createdDate: '2026-05-01T00:00:00Z',
      finalApprovalDate: '2026-05-05T00:00:00Z',
    }))
    scoreRecordsHookMock.mockReturnValue({ data: manyRecords, isLoading: false, isError: false })
    render(<SelfAssessmentScoreRecordsPage />)

    expect(screen.getByText(/Page 1 of 2/)).toBeTruthy()
    expect(screen.getByText('Employee 1')).toBeTruthy()
    expect(screen.queryByText('Employee 11')).toBeNull()
  })
})
