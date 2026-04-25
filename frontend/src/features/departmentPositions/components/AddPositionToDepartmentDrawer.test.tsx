import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import AddPositionToDepartmentDrawer from './AddPositionToDepartmentDrawer'

const addPositionMock = vi.fn()

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('../api/departmentPositionsApi', () => ({
  useAddPositionToDepartmentMutation: () => [
    addPositionMock,
    { isLoading: false },
  ],
}))

vi.mock('../../position/api/positionApi', () => ({
  useGetPositionsQuery: () => ({
    data: {
      data: {
        content: [
          {
            positionId: 10,
            positionCode: 'ACC',
            positionName: 'Accountant',
            status: 'Active',
            levelCodeId: 1,
            levelCodeName: 'L1',
            roleId: 1,
            roleName: 'Finance',
            createdDate: '',
            updatedDate: '',
          },
        ],
      },
    },
    isFetching: false,
  }),
}))

describe('AddPositionToDepartmentDrawer', () => {
  beforeEach(() => {
    addPositionMock.mockReset()
    addPositionMock.mockReturnValue({
      unwrap: () => Promise.resolve({}),
    })
  })

  it('submits selected position when clicking Add Position button', async () => {
    const onClose = vi.fn()
    const onSuccess = vi.fn()
    const user = userEvent.setup()

    render(
      <AddPositionToDepartmentDrawer
        isOpen
        onClose={onClose}
        departmentId={1}
        existingPositionIds={[]}
        onSuccess={onSuccess}
      />
    )

    await user.click(screen.getByPlaceholderText('Type to search positions...'))
    await user.click(screen.getByText('Accountant'))
    await user.click(screen.getByRole('button', { name: 'Add Position' }))

    await waitFor(() => {
      expect(addPositionMock).toHaveBeenCalledWith({
        departmentId: 1,
        positionId: 10,
        status: 'Active',
      })
    })
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled()
      expect(onClose).toHaveBeenCalled()
    })
  })
})
