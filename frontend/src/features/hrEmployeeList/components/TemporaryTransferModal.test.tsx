import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { TemporaryTransferModal } from './TemporaryTransferModal'

const temporaryTransferMock = vi.fn()
const permanentTransferMock = vi.fn()

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('../../hrCreateEmployee/hrEmployeeAccountApi', () => ({
  useGetDepartmentsQuery: () => ({
    data: { data: [{ id: 1, name: 'Engineering' }, { id: 2, name: 'Marketing' }] },
    isLoading: false,
  }),
  useGetDepartmentPositionsQuery: () => ({
    data: { data: [{ positionId: 10, positionName: 'Developer', positionCode: 'DEV' }] },
    isLoading: false,
  }),
}))

vi.mock('../employeeTransferApi', () => ({
  useGetCurrentTransferQuery: () => ({
    data: { data: { effectiveStartDate: '2024-01-01' } },
  }),
  useTemporaryTransferMutation: () => [temporaryTransferMock, { isLoading: false }],
  usePermanentTransferMutation: () => [permanentTransferMock, { isLoading: false }],
}))

const onClose = vi.fn()
const onSuccess = vi.fn()

function renderModal() {
  return render(
    <TemporaryTransferModal
      isOpen
      employeeId={100}
      employeeName="Test Employee"
      onClose={onClose}
      onSuccess={onSuccess}
    />
  )
}

describe('TemporaryTransferModal (unified transfer modal)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    temporaryTransferMock.mockReturnValue({ unwrap: () => Promise.resolve({}) })
    permanentTransferMock.mockReturnValue({ unwrap: () => Promise.resolve({}) })

    cleanup()
    const portalRoot = document.getElementById('headlessui-portal-root')
    if (portalRoot) portalRoot.remove()
  })

  it('renders the modal title as Transfer', () => {
    renderModal()
    expect(screen.getByText('Transfer')).toBeDefined()
  })

  it('shows transfer type options in the first select', () => {
    renderModal()
    const selects = screen.getAllByRole('combobox')
    expect(selects.length).toBeGreaterThanOrEqual(1)
    const typeSelect = selects[0]
    const options = Array.from(typeSelect.querySelectorAll('option')).map(o => o.textContent)
    expect(options).toContain('Temporary Transfer')
    expect(options).toContain('Permanent Transfer')
  })

  it('shows Effective End field initially (temporary selected by default)', () => {
    renderModal()
    const dateInputs = document.querySelectorAll('input[type="date"]')
    expect(dateInputs.length).toBe(2)
  })

  it('hides Effective End field when Permanent is selected', async () => {
    const user = userEvent.setup()
    renderModal()

    const selects = screen.getAllByRole('combobox')
    await user.selectOptions(selects[0], 'PERMANENT')

    const dateInputs = document.querySelectorAll('input[type="date"]')
    expect(dateInputs.length).toBe(1)
  })

  it('shows Effective Date label when Permanent is selected', async () => {
    const user = userEvent.setup()
    renderModal()

    const selects = screen.getAllByRole('combobox')
    await user.selectOptions(selects[0], 'PERMANENT')

    expect(screen.getAllByText(/effective date/i).length).toBeGreaterThanOrEqual(1)
  })

  it('calls temporaryTransfer mutation on submit with Temporary selected', async () => {
    const user = userEvent.setup()
    renderModal()

    const selects = screen.getAllByRole('combobox')
    await user.selectOptions(selects[1], '1')
    await user.selectOptions(selects[2], '10')

    const dateInputs = document.querySelectorAll('input[type="date"]')
    await user.clear(dateInputs[0])
    await user.type(dateInputs[0], '2025-06-01')
    await user.clear(dateInputs[1])
    await user.type(dateInputs[1], '2025-12-31')

    const buttons = screen.getAllByText('Confirm Temporary Transfer')
    await user.click(buttons[0])

    await waitFor(() => {
      expect(temporaryTransferMock).toHaveBeenCalledWith({
        employeeId: 100,
        body: {
          toDepartmentId: 1,
          toPositionId: 10,
          effectiveStartDate: '2025-06-01',
          effectiveEndDate: '2025-12-31',
          reason: undefined,
          remarks: undefined,
        },
      })
    })
  })

  it('calls permanentTransfer mutation on submit with Permanent selected', async () => {
    const user = userEvent.setup()
    renderModal()

    const selects = screen.getAllByRole('combobox')
    await user.selectOptions(selects[0], 'PERMANENT')
    await user.selectOptions(selects[1], '1')
    await user.selectOptions(selects[2], '10')

    const dateInputs = document.querySelectorAll('input[type="date"]')
    await user.clear(dateInputs[0])
    await user.type(dateInputs[0], '2025-06-01')

    const submitButton = screen.getByText('Confirm Permanent Transfer')
    await user.click(submitButton)

    await waitFor(() => {
      expect(permanentTransferMock).toHaveBeenCalledWith({
        employeeId: 100,
        body: {
          toDepartmentId: 1,
          toPositionId: 10,
          effectiveStartDate: '2025-06-01',
          reason: undefined,
          remarks: undefined,
        },
      })
    })
  })

  it('allows effective date equal to previous transfer start', async () => {
    const user = userEvent.setup()
    renderModal()

    const selects = screen.getAllByRole('combobox')
    await user.selectOptions(selects[0], 'PERMANENT')
    await user.selectOptions(selects[1], '1')
    await user.selectOptions(selects[2], '10')

    const dateInputs = document.querySelectorAll('input[type="date"]')
    await user.clear(dateInputs[0])
    // Mocked current transfer start date (see vi.mock above)
    await user.type(dateInputs[0], '2024-01-01')

    const submitButton = screen.getByText('Confirm Permanent Transfer')
    await user.click(submitButton)

    await waitFor(() => {
      expect(permanentTransferMock).toHaveBeenCalledWith({
        employeeId: 100,
        body: {
          toDepartmentId: 1,
          toPositionId: 10,
          effectiveStartDate: '2024-01-01',
          reason: undefined,
          remarks: undefined,
        },
      })
    })
  })
})
