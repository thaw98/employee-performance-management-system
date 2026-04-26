import { useState, useCallback, useRef, useMemo } from 'react'
import type { SortingState } from '@tanstack/react-table'
import toast from 'react-hot-toast'
import {
  Briefcase, Users, Layers, Shield,
  Plus, Filter, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
} from 'lucide-react'
import { useGetPositionsQuery, useCreatePositionMutation, useUpdatePositionMutation, useDeletePositionMutation, useGetActiveLevelCodesQuery, useGetActiveRolesQuery, type PositionDto } from '../api/positionApi'
import { useAppSelector } from '../../../app/hooks'
import PositionTable from '../components/PositionTable'
import PositionModal from '../components/PositionModal'
import PositionFilters from '../components/PositionFilters'
import AssignedDepartmentsDrawer from '../components/AssignedDepartmentsDrawer'
import ConfirmActionModal from '../../hrEmployeeList/components/ConfirmActionModal'

function PositionListPage() {
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null)
  const [selectedLevelCodeId, setSelectedLevelCodeId] = useState<number | null>(null)
  const [sorting, setSorting] = useState<SortingState>([{ id: 'positionCode', desc: false }])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPosition, setEditingPosition] = useState<PositionDto | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [removingPosition, setRemovingPosition] = useState<PositionDto | null>(null)
  const [assignedDepartmentsPosition, setAssignedDepartmentsPosition] = useState<PositionDto | null>(null)
  const searchDebounceRef = useRef<number | null>(null)
  const user = useAppSelector((state) => state.auth.user)
  const canViewAssignedDepartments = user?.roleId === 1

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
    levelCodeId: selectedLevelCodeId || undefined,
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
  const selectedLevelCodeLabel = useMemo(
    () =>
      selectedLevelCodeId != null
        ? levelCodes.find((l) => l.id === selectedLevelCodeId)?.code
        : null,
    [levelCodes, selectedLevelCodeId],
  )
  const positions = useMemo(() => positionsData?.data?.content ?? [], [positionsData?.data?.content])
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

  const handleShowAssignedDepartments = useCallback((position: PositionDto) => {
    setAssignedDepartmentsPosition(position)
  }, [])

  const handleCloseAssignedDepartments = useCallback(() => {
    setAssignedDepartmentsPosition(null)
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                  <Briefcase className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Position Management</h1>
                  <p className="text-slate-500 text-sm font-medium">Manage and organize positions across your organization</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleOpenCreate}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Create Position
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 group">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Total Positions</p>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-3xl font-bold text-slate-900">{totalElements}</h3>
                  </div>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <Briefcase className="w-7 h-7 text-emerald-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded-full">
                  <Users className="w-3 h-3" />
                  <span>Active roles</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 group">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Level Codes</p>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-3xl font-bold text-slate-900 tabular-nums">
                      {selectedLevelCodeId != null
                        ? (selectedLevelCodeLabel ?? '—')
                        : levelCodes.length}
                    </h3>
                  </div>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <Layers className="w-7 h-7 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <div className="flex items-center gap-1 text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded-full">
                  <Shield className="w-3 h-3" />
                  <span>
                    {selectedLevelCodeId != null
                      ? 'Filter: selected level'
                      : 'Available levels'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 group">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">System Roles</p>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-3xl font-bold text-slate-900">{roles.length}</h3>
                  </div>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <Shield className="w-7 h-7 text-purple-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <div className="flex items-center gap-1 text-xs text-purple-600 font-medium bg-purple-50 px-2 py-1 rounded-full">
                  <Shield className="w-3 h-3" />
                  <span>Configured roles</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-slate-400" />
                  <h2 className="text-lg font-semibold text-slate-900">Filters</h2>
                </div>
                {(search || selectedRoleId || selectedLevelCodeId) && (
                  <button
                    onClick={() => {
                      setSearch('')
                      setDebouncedSearch('')
                      setSelectedRoleId(null)
                      setSelectedLevelCodeId(null)
                    }}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <PositionFilters
                search={search}
                onSearchChange={handleSearchChange}
                selectedRoleId={selectedRoleId}
                onRoleChange={(id) => {
                  setSelectedRoleId(id)
                  setPage(0)
                }}
                roles={roles}
                selectedLevelCodeId={selectedLevelCodeId}
                onLevelCodeChange={(id) => {
                  setSelectedLevelCodeId(id)
                  setPage(0)
                }}
                levelCodes={levelCodes}
              />
            </div>

            <div className="p-6">
              <PositionTable
                data={positions}
                isLoading={isLoading}
                onEdit={handleEdit}
                onRemove={handleOpenRemove}
                onShowAssignedDepartments={canViewAssignedDepartments ? handleShowAssignedDepartments : undefined}
                sorting={sorting}
                setSorting={setSorting}
              />
            </div>

            {totalPages > 0 && (
              <div className="px-6 py-4 border-t border-slate-200 bg-gradient-to-r from-slate-50 to-white">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-slate-500">Rows per page:</span>
                    <select
                      value={size}
                      onChange={(e) => handleRowsPerPageChange(Number(e.target.value))}
                      className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-all cursor-pointer hover:border-slate-300"
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
                      className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:border-slate-300"
                      title="First page"
                    >
                      <ChevronsLeft className="w-4 h-4 text-slate-600" />
                    </button>
                    <button
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 0}
                      className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:border-slate-300"
                      title="Previous page"
                    >
                      <ChevronLeft className="w-4 h-4 text-slate-600" />
                    </button>

                    <div className="flex items-center gap-1">
                      {getPageNumbers().map((pageNum, idx) => (
                        typeof pageNum === 'number' ? (
                          <button
                            key={idx}
                            onClick={() => handlePageChange(pageNum - 1)}
                            className={`min-w-[38px] h-10 px-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                              page === pageNum - 1
                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md hover:shadow-lg'
                                : 'border border-slate-200 text-slate-700 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700'
                            }`}
                          >
                            {pageNum}
                          </button>
                        ) : (
                          <span key={idx} className="px-2 text-slate-400 text-sm select-none font-medium">
                            {pageNum}
                          </span>
                        )
                      ))}
                    </div>

                    <button
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page >= totalPages - 1}
                      className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:border-slate-300"
                      title="Next page"
                    >
                      <ChevronRight className="w-4 h-4 text-slate-600" />
                    </button>
                    <button
                      onClick={() => handlePageChange(totalPages - 1)}
                      disabled={page >= totalPages - 1}
                      className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:border-slate-300"
                      title="Last page"
                    >
                      <ChevronsRight className="w-4 h-4 text-slate-600" />
                    </button>
                  </div>
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

        <AssignedDepartmentsDrawer
          isOpen={!!assignedDepartmentsPosition}
          onClose={handleCloseAssignedDepartments}
          position={assignedDepartmentsPosition ? {
            id: assignedDepartmentsPosition.positionId,
            name: assignedDepartmentsPosition.positionName,
          } : null}
        />
      </div>
    </div>
  )
}

export default PositionListPage
