import { useState, useCallback, useRef, useMemo } from 'react'
import type { SortingState } from '@tanstack/react-table'
import toast from 'react-hot-toast'
import { useGetPositionsQuery, useCreatePositionMutation, useUpdatePositionMutation, useDeletePositionMutation, useGetActiveLevelCodesQuery, useGetActiveRolesQuery, type PositionDto } from '../api/positionApi'
import PositionTable from '../components/PositionTable'
import PositionModal from '../components/PositionModal'
import PositionFilters from '../components/PositionFilters'
import ConfirmActionModal from '../../hrEmployeeList/components/ConfirmActionModal'

function PositionListPage() {
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null)
  const [sorting, setSorting] = useState<SortingState>([{ id: 'positionCode', desc: false }])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPosition, setEditingPosition] = useState<PositionDto | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [removingPosition, setRemovingPosition] = useState<PositionDto | null>(null)
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
    sortBy: sortParams.sortBy,
    sortDir: sortParams.sortDir,
  })

  const { data: levelCodesData } = useGetActiveLevelCodesQuery()
  const { data: rolesData } = useGetActiveRolesQuery()
  const [createPosition] = useCreatePositionMutation()
  const [updatePosition] = useUpdatePositionMutation()
  const [deletePosition, { isLoading: isDeleting }] = useDeletePositionMutation()

  const levelCodes = levelCodesData?.data || []
  const roles = rolesData?.data || []
  const positions = positionsData?.data?.content || []
  const totalElements = positionsData?.data?.totalElements || 0
  const totalPages = positionsData?.data?.totalPages || 0

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

  const handleOpenRemove = useCallback((position: PositionDto) => {
    setRemovingPosition(position)
    setIsDeleteOpen(true)
  }, [])

  const handleRemovePosition = useCallback(async () => {
    if (!removingPosition) return
    try {
      await deletePosition(removingPosition.positionId).unwrap()
      toast.success('Position removed successfully')
      setIsDeleteOpen(false)
      setRemovingPosition(null)
      refetch()
    } catch (error: unknown) {
      const err = error as { data?: { message?: string } }
      toast.error(err?.data?.message || 'Failed to remove position. It may have connected data.')
    }
  }, [deletePosition, removingPosition, refetch])

  const handleCreatePosition = useCallback(async (data: { positionCode: string; positionName: string; levelCodeId: number; roleId: number }) => {
    const normalizedCode = data.positionCode.trim().toLowerCase()
    const hasDuplicate = positions.some((position) => position.positionCode.trim().toLowerCase() === normalizedCode)

    if (hasDuplicate) {
      toast.error('Position code already exists')
      return
    }

    try {
      await createPosition({ ...data, status: 'ACTIVE' }).unwrap()
      toast.success('Position created successfully')
      setIsModalOpen(false)
      setEditingPosition(null)
      refetch()
    } catch (error: unknown) {
      const err = error as { data?: { message?: string } }
      toast.error(err?.data?.message || 'Failed to create position')
      throw error
    }
  }, [createPosition, positions, refetch])

  const handleUpdatePosition = useCallback(async (data: { positionCode: string; positionName: string; levelCodeId: number; roleId: number }) => {
    if (!editingPosition) return

    const normalizedCode = data.positionCode.trim().toLowerCase()
    const hasDuplicate = positions.some(
      (position) =>
        position.positionId !== editingPosition.positionId &&
        position.positionCode.trim().toLowerCase() === normalizedCode,
    )

    if (hasDuplicate) {
      toast.error('Position code already exists')
      return
    }

    try {
      await updatePosition({
        id: editingPosition.positionId,
        body: { ...data, status: editingPosition.status ?? 'ACTIVE' },
      }).unwrap()
      toast.success('Position updated successfully')
      setIsModalOpen(false)
      setEditingPosition(null)
      refetch()
    } catch (error: unknown) {
      const err = error as { data?: { message?: string } }
      toast.error(err?.data?.message || 'Failed to update position')
      throw error
    }
  }, [updatePosition, editingPosition, positions, refetch])

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false)
    setEditingPosition(null)
  }, [])

  const handleOpenCreate = useCallback(() => {
    setEditingPosition(null)
    setIsModalOpen(true)
  }, [])

  const handleCloseDeleteModal = useCallback(() => {
    if (isDeleting) return
    setIsDeleteOpen(false)
    setRemovingPosition(null)
  }, [isDeleting])

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
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Position Management</h1>
          <p className="text-slate-500 font-medium text-xs mt-1">Manage and organize positions across your organization</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#115e59] text-white text-xs font-black rounded-xl hover:shadow-lg transition-all"
        >
          <i className="bi bi-plus-lg text-sm"></i>
          Create Position
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Positions</p>
            <h3 className="text-3xl font-black text-slate-900">{totalElements}</h3>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm">
            <i className="bi bi-briefcase text-xl"></i>
          </div>
        </div>
      </div>

        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
          <PositionFilters
            search={search}
            onSearchChange={handleSearchChange}
            selectedRoleId={selectedRoleId}
            onRoleChange={setSelectedRoleId}
            roles={roles}
          />

          <PositionTable
            data={positions}
            isLoading={isLoading}
            onEdit={handleEdit}
            onRemove={handleOpenRemove}
            sorting={sorting}
            setSorting={setSorting}
          />

          {totalPages > 0 && (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 pt-6">
              <div className="flex items-center gap-3">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Rows per page:</span>
                <select
                  value={size}
                  onChange={(e) => handleRowsPerPageChange(Number(e.target.value))}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 bg-white focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition-all cursor-pointer"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handlePageChange(0)}
                  disabled={page === 0}
                  className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  title="First page"
                >
                  <i className="bi bi-chevron-bar-left text-slate-500"></i>
                </button>
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 0}
                  className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  title="Previous page"
                >
                  <i className="bi bi-chevron-left text-slate-500"></i>
                </button>

                <div className="flex items-center gap-1">
                  {getPageNumbers().map((pageNum, idx) => (
                    typeof pageNum === 'number' ? (
                      <button
                        key={idx}
                        onClick={() => handlePageChange(pageNum - 1)}
                        className={`min-w-[36px] h-9 px-3 rounded-lg text-sm font-semibold transition-all ${
                          page === pageNum - 1
                            ? 'bg-[#115e59] text-white shadow-sm'
                            : 'border border-slate-200 text-slate-600 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    ) : (
                      <span key={idx} className="px-2 text-slate-400 text-sm select-none">
                        {pageNum}
                      </span>
                    )
                  ))}
                </div>

                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages - 1}
                  className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  title="Next page"
                >
                  <i className="bi bi-chevron-right text-slate-500"></i>
                </button>
                <button
                  onClick={() => handlePageChange(totalPages - 1)}
                  disabled={page >= totalPages - 1}
                  className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  title="Last page"
                >
                  <i className="bi bi-chevron-bar-right text-slate-500"></i>
                </button>
              </div>
            </div>
          )}
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

      <ConfirmActionModal
        isOpen={isDeleteOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleRemovePosition}
        title="Remove Position"
        message={`Are you sure you want to remove "${removingPosition?.positionName ?? ''}"? You can only remove positions with no connected data.`}
        confirmText="Remove"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  )
}

export default PositionListPage