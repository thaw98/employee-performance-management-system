import { useState, useCallback, useRef, useMemo } from 'react'
import type { SortingState } from '@tanstack/react-table'
import toast from 'react-hot-toast'
import { useGetPositionsQuery, useCreatePositionMutation, useUpdatePositionMutation, useTogglePositionStatusMutation, useGetActiveLevelCodesQuery, useGetActiveRolesQuery, type PositionDto } from '../api/positionApi'
import PositionTable from '../components/PositionTable'
import PositionModal from '../components/PositionModal'
import PositionFilters from '../components/PositionFilters'

function PositionListPage() {
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [sorting, setSorting] = useState<SortingState>([{ id: 'positionCode', desc: false }])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPosition, setEditingPosition] = useState<PositionDto | null>(null)
  const searchDebounceRef = useRef<number | null>(null)

  const sortParams = useMemo(() => {
    if (sorting.length > 0) {
      return {
        sortBy: sorting[0].id,
        sortDir: sorting[0].desc ? 'desc' : 'asc'
      }
    }
    return { sortBy: 'positionCode', sortDir: 'asc' }
  }, [sorting])

  const { data: positionsData, isLoading, refetch } = useGetPositionsQuery({
    page,
    size,
    search: debouncedSearch,
    roleId: selectedRoleId || undefined,
    status: selectedStatus || undefined,
    sortBy: sortParams.sortBy,
    sortDir: sortParams.sortDir,
  })

  const { data: levelCodesData } = useGetActiveLevelCodesQuery()
  const { data: rolesData } = useGetActiveRolesQuery()
  const [createPosition] = useCreatePositionMutation()
  const [updatePosition] = useUpdatePositionMutation()
  const [togglePositionStatus] = useTogglePositionStatusMutation()

  const levelCodes = levelCodesData?.data || []
  const roles = rolesData?.data || []
  const positions = positionsData?.data?.content || []
  const totalElements = positionsData?.data?.totalElements || 0
  const totalPages = positionsData?.data?.totalPages || 0

  const stats = useMemo(() => {
    const activeCount = positionsData?.data?.content.filter(p => p.status === 'ACTIVE').length || 0
    const inactiveCount = positionsData?.data?.content.filter(p => p.status === 'INACTIVE').length || 0
    return {
      total: totalElements,
      active: activeCount,
      inactive: inactiveCount,
    }
  }, [positionsData, totalElements])

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value)
    if (searchDebounceRef.current) {
      window.clearTimeout(searchDebounceRef.current)
    }
    searchDebounceRef.current = window.setTimeout(() => {
      setDebouncedSearch(value)
      setPage(0)
    }, 300)
  }, [])

  const handleEdit = useCallback((id: number) => {
    const position = positionsData?.data?.content.find(p => p.positionId === id)
    if (position) {
      setEditingPosition(position)
      setIsModalOpen(true)
    }
  }, [positionsData])

  const handleToggleStatus = useCallback(async (id: number, currentStatus: string) => {
    try {
      await togglePositionStatus(id).unwrap()
      toast.success(`Position ${currentStatus === 'ACTIVE' ? 'deactivated' : 'activated'} successfully`)
      refetch()
    } catch (error: unknown) {
      const err = error as { data?: { message?: string } }
      toast.error(err?.data?.message || 'Failed to update position status')
    }
  }, [togglePositionStatus, refetch])

  const handleCreatePosition = useCallback(async (data: { positionCode: string; positionName: string; levelCodeId: number; roleId: number; status: string }) => {
    try {
      await createPosition(data).unwrap()
      toast.success('Position created successfully')
      setIsModalOpen(false)
      setEditingPosition(null)
      refetch()
    } catch (error: unknown) {
      const err = error as { data?: { message?: string } }
      toast.error(err?.data?.message || 'Failed to create position')
      throw error
    }
  }, [createPosition, refetch])

  const handleUpdatePosition = useCallback(async (data: { positionCode: string; positionName: string; levelCodeId: number; roleId: number; status: string }) => {
    if (!editingPosition) return
    try {
      await updatePosition({ id: editingPosition.positionId, body: data }).unwrap()
      toast.success('Position updated successfully')
      setIsModalOpen(false)
      setEditingPosition(null)
      refetch()
    } catch (error: unknown) {
      const err = error as { data?: { message?: string } }
      toast.error(err?.data?.message || 'Failed to update position')
      throw error
    }
  }, [updatePosition, editingPosition, refetch])

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false)
    setEditingPosition(null)
  }, [])

  const handleOpenCreate = useCallback(() => {
    setEditingPosition(null)
    setIsModalOpen(true)
  }, [])

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage)
  }, [])

  const handleRowsPerPageChange = useCallback((newSize: number) => {
    setSize(newSize)
    setPage(0)
  }, [])

  const getPageNumbers = useCallback(() => {
    const delta = 2
    const range: number[] = []
    const rangeWithDots: (number | string)[] = []
    let l: number | undefined

    range.push(1)

    for (let i = page - delta; i <= page + delta; i++) {
      if (i < totalPages && i > 1) {
        range.push(i)
      }
    }

    if (totalPages !== 1) {
      range.push(totalPages)
    }

    for (const i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1)
        } else if (i - l !== 1) {
          rangeWithDots.push('...')
        }
      }
      rangeWithDots.push(i)
      l = i
    }

    return rangeWithDots
  }, [page, totalPages])

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {isLoading && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center justify-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-20 w-20 border-4 border-indigo-200 border-t-indigo-600"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-10 h-10 bg-indigo-600 rounded-lg animate-pulse"></div>
              </div>
            </div>
            <p className="mt-6 text-lg font-semibold text-gray-700">Loading Position Management...</p>
            <p className="text-sm text-gray-500 mt-2">Please wait while we fetch your data</p>
          </div>
        </div>
      )}
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Position Management</h1>
            <p className="text-gray-600 mt-1">Manage and organize positions across your organization</p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300"
          >
            <i className="bi bi-plus-lg text-lg"></i>
            <span>Create Position</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Positions</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                <i className="bi bi-briefcase text-2xl text-indigo-600"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Active Positions</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{stats.active}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <i className="bi bi-check-circle text-2xl text-green-600"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Inactive Positions</p>
                <p className="text-3xl font-bold text-gray-400 mt-2">{stats.inactive}</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                <i className="bi bi-x-circle text-2xl text-gray-400"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
          <PositionFilters
            search={search}
            onSearchChange={handleSearchChange}
            selectedRoleId={selectedRoleId}
            onRoleChange={setSelectedRoleId}
            selectedStatus={selectedStatus}
            onStatusChange={setSelectedStatus}
            roles={roles}
          />

          <PositionTable
            data={positions}
            isLoading={isLoading}
            onEdit={handleEdit}
            onToggleStatus={handleToggleStatus}
            sorting={sorting}
            setSorting={setSorting}
          />

          {totalPages > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-gray-200 gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Rows per page:</span>
                <select
                  value={size}
                  onChange={(e) => handleRowsPerPageChange(Number(e.target.value))}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span className="text-sm text-gray-500">
                  Showing {page * size + 1} to {Math.min((page + 1) * size, totalElements)} of {totalElements} entries
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handlePageChange(0)}
                  disabled={page === 0}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="First page"
                >
                  <i className="bi bi-chevron-bar-left text-gray-600"></i>
                </button>
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 0}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Previous page"
                >
                  <i className="bi bi-chevron-left text-gray-600"></i>
                </button>

                <div className="flex items-center gap-1">
                  {getPageNumbers().map((pageNum, idx) => (
                    typeof pageNum === 'number' ? (
                      <button
                        key={idx}
                        onClick={() => handlePageChange(pageNum - 1)}
                        className={`min-w-[36px] h-10 px-3 rounded-lg text-sm font-medium transition-colors ${
                          page === pageNum - 1
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                            : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    ) : (
                      <span key={idx} className="px-2 text-gray-400">
                        {pageNum}
                      </span>
                    )
                  ))}
                </div>

                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages - 1}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Next page"
                >
                  <i className="bi bi-chevron-right text-gray-600"></i>
                </button>
                <button
                  onClick={() => handlePageChange(totalPages - 1)}
                  disabled={page >= totalPages - 1}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Last page"
                >
                  <i className="bi bi-chevron-bar-right text-gray-600"></i>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <PositionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={editingPosition ? handleUpdatePosition : handleCreatePosition}
        position={editingPosition}
        levelCodes={levelCodes}
        roles={roles}
        isLoading={isLoading}
        isEdit={!!editingPosition}
      />
    </div>
  )
}

export default PositionListPage