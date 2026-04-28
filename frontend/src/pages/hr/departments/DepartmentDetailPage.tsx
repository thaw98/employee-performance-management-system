import { useMemo, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import toast from 'react-hot-toast'
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  LayoutGrid,
  Loader2,
  Plus,
  Search,
  Shield,
  Trash2,
  UserRound,
  XCircle,
} from 'lucide-react'
import { useGetDepartmentByIdQuery } from '../../../features/department/api/departmentApi'
import {
  useGetPositionsByDepartmentQuery,
  useRemoveDepartmentPositionMutation,
  type DepartmentPositionMappingDto,
} from '../../../features/departmentPositions/api/departmentPositionsApi'
import AddPositionToDepartmentDrawer from '../../../features/departmentPositions/components/AddPositionToDepartmentDrawer'
import ConfirmActionModal from '../../../features/hrEmployeeList/components/ConfirmActionModal'

const isActive = (status: unknown) => String(status ?? '').trim().toLowerCase() === 'active'

export default function DepartmentDetailPage() {
  const { departmentId: departmentIdParam } = useParams()
  const departmentId = Number(departmentIdParam)
  const isValidDepartmentId = Number.isFinite(departmentId) && departmentId > 0

  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isRemoveOpen, setIsRemoveOpen] = useState(false)
  const [selectedMapping, setSelectedMapping] = useState<DepartmentPositionMappingDto | null>(null)

  const {
    data: departmentResponse,
    isLoading: isDepartmentLoading,
    isError: isDepartmentError,
    refetch: refetchDepartment,
  } = useGetDepartmentByIdQuery(departmentId, { skip: !isValidDepartmentId })
  const {
    data: positions = [],
    isLoading: isPositionsLoading,
    isError: isPositionsError,
    refetch: refetchPositions,
  } = useGetPositionsByDepartmentQuery(departmentId, { skip: !isValidDepartmentId })
  const [removePosition, { isLoading: isRemoving }] = useRemoveDepartmentPositionMutation()

  const department = departmentResponse?.data
  const isLoading = isDepartmentLoading || isPositionsLoading
  const isError = isDepartmentError || isPositionsError
  const existingPositionIds = useMemo(() => positions.map((position) => position.positionId), [positions])

  const handleRemove = async () => {
    if (!selectedMapping) return
    try {
      await removePosition({ id: selectedMapping.id, departmentId }).unwrap()
      toast.success('Position removed from department.')
      setIsRemoveOpen(false)
      setSelectedMapping(null)
    } catch (error: unknown) {
      toast.error((error as { data?: { message?: string } })?.data?.message || 'Failed to remove position.')
    }
  }

  const columns = useMemo<ColumnDef<DepartmentPositionMappingDto>[]>(
    () => [
      {
        id: 'rowNumber',
        enableSorting: false,
        header: '#',
        cell: (info) => (
          <span className="text-slate-400 font-medium text-xs tabular-nums">
            {info.row.index + 1}
          </span>
        ),
      },
      {
        accessorKey: 'positionCode',
        header: 'Position Code',
        cell: (info) => (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-100 font-mono font-semibold text-blue-700 text-xs tracking-wide">
            {String(info.getValue() ?? '').trim() || '-'}
          </span>
        ),
      },
      {
        accessorKey: 'positionName',
        header: 'Position Name',
        cell: (info) => (
          <div className="flex items-center gap-2.5">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-sm">
              <BriefcaseBusiness size={14} className="text-white" />
            </div>
            <span className="font-semibold text-slate-800 text-sm">{info.getValue() as string}</span>
          </div>
        ),
      },
      {
        id: 'actions',
        enableSorting: false,
        header: 'Actions',
        cell: (info) => (
          <button
            type="button"
            onClick={() => {
              setSelectedMapping(info.row.original)
              setIsRemoveOpen(true)
            }}
            className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-600 hover:text-white border border-rose-100 hover:border-rose-600 transition-all duration-200"
            title="Remove Position"
          >
            <Trash2 size={13} />
            Remove
          </button>
        ),
      },
    ],
    []
  )

  const table = useReactTable({
    data: positions,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  if (!isValidDepartmentId) {
    return <Navigate to="/hr/departments" replace />
  }

  const getSortIcon = (isSorted: false | 'asc' | 'desc') => {
    if (isSorted === 'asc') return <ArrowUp size={13} className="text-blue-500" />
    if (isSorted === 'desc') return <ArrowDown size={13} className="text-blue-500" />
    return <ArrowUpDown size={13} className="text-slate-300 group-hover:text-slate-400 transition-colors" />
  }

  const filteredCount = table.getFilteredRowModel().rows.length

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center">
          <AlertTriangle className="text-rose-500" size={32} />
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-slate-800">Failed to load department</p>
          <p className="text-sm text-slate-500 mt-1">Something went wrong. Please try again.</p>
        </div>
        <button
          onClick={() => {
            void refetchDepartment()
            void refetchPositions()
          }}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 px-6 pt-8 pb-20">
        <div className="absolute -top-10 -right-10 w-64 h-64 bg-white/5 rounded-full pointer-events-none" />
        <div className="absolute top-8 right-20 w-32 h-32 bg-white/5 rounded-full pointer-events-none" />
        <div className="absolute -bottom-16 -left-8 w-48 h-48 bg-white/5 rounded-full pointer-events-none" />
        <div className="absolute top-24 left-1/4 w-24 h-24 bg-white/5 rounded-full pointer-events-none" />

        <div className="relative max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start gap-5">
              <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20 shadow-2xl flex-shrink-0">
                <Building2 size={32} className="text-white" />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-white/15 border border-white/20 font-mono font-bold text-white text-sm tracking-wide">
                    {department?.departmentCode || '...'}
                  </span>
                  {department && (
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
                      isActive(department.status)
                        ? 'bg-emerald-400/15 text-emerald-50 border-emerald-200/30'
                        : 'bg-amber-400/15 text-amber-50 border-amber-200/30'
                    }`}>
                      {isActive(department.status) ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                      {isActive(department.status) ? 'Active' : 'Inactive'}
                    </span>
                  )}
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-1.5">
                  {isDepartmentLoading ? 'Loading...' : department?.departmentName}
                </h1>
                <p className="text-blue-100 text-base">Manage positions and organizational structure</p>
                <p className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-white/90">
                  <UserRound size={16} className="text-blue-100" />
                  Manager: {department?.managerName || 'Unassigned'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsAddOpen(true)}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-blue-700 rounded-xl font-bold text-sm shadow-2xl hover:bg-blue-50 active:scale-95 transition-all"
              >
                <Plus size={18} />
                Add Position
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-12 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-md">
              <LayoutGrid size={22} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Positions</p>
              {isLoading ? (
                <div className="h-8 w-16 bg-slate-100 rounded animate-pulse" />
              ) : (
                <p className="text-3xl font-extrabold text-slate-800 leading-tight">{positions.length}</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0 shadow-md">
              <Shield size={22} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Status</p>
              {isDepartmentLoading ? (
                <div className="h-8 w-20 bg-slate-100 rounded animate-pulse" />
              ) : (
                <p className={`text-lg font-bold leading-tight ${isActive(department?.status) ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {isActive(department?.status) ? 'Active Dept' : 'Inactive Dept'}
                </p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-md">
              <UserRound size={22} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Manager</p>
              {isDepartmentLoading ? (
                <div className="h-8 w-28 bg-slate-100 rounded animate-pulse" />
              ) : (
                <p className="text-lg font-bold leading-tight text-slate-800">{department?.managerName || 'Unassigned'}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <BriefcaseBusiness size={16} className="text-slate-500" />
              Department Positions
            </h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  type="text"
                  value={globalFilter ?? ''}
                  onChange={(event) => setGlobalFilter(event.target.value)}
                  placeholder="Search..."
                  className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all placeholder:text-slate-400 w-48"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="bg-slate-50 border-b border-slate-200">
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className={`px-5 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-widest transition-colors group ${header.column.getCanSort() ? 'cursor-pointer select-none hover:bg-slate-100/70' : ''}`}
                        onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                      >
                        <div className="flex items-center gap-1.5">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanSort() && getSortIcon(header.column.getIsSorted())}
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={columns.length}>
                      <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <Loader2 size={40} className="animate-spin text-blue-500" />
                        <p className="text-sm font-semibold text-slate-500">Loading positions...</p>
                      </div>
                    </td>
                  </tr>
                ) : table.getRowModel().rows.length > 0 ? (
                  table.getRowModel().rows.map((row, idx) => (
                    <tr key={row.id} className={`transition-colors hover:bg-blue-50/50 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-5 py-4 whitespace-nowrap">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={columns.length} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                          <BriefcaseBusiness size={40} className="text-slate-300" />
                        </div>
                        <div>
                          <p className="text-lg font-bold text-slate-700">No positions found</p>
                          <p className="text-sm text-slate-500 mt-1">
                            {globalFilter ? 'Try a different search term.' : 'Add positions to this department to get started.'}
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {table.getPageCount() > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4 border-t border-slate-200 bg-slate-50/50">
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span>
                  Showing <span className="font-bold text-slate-700">{filteredCount === 0 ? 0 : table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}</span>
                  {' - '}
                  <span className="font-bold text-slate-700">
                    {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, filteredCount)}
                  </span>
                  {' of '}
                  <span className="font-bold text-slate-700">{filteredCount}</span>
                  {' entries'}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">Rows:</span>
                  <select
                    value={table.getState().pagination.pageSize}
                    onChange={(event) => table.setPageSize(Number(event.target.value))}
                    className="py-1 pl-2 pr-6 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer appearance-none"
                  >
                    {[5, 10, 20, 50].map((size) => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()} className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all" title="First page">
                  <ChevronsLeft size={15} />
                </button>
                <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all" title="Previous page">
                  <ChevronLeft size={15} />
                </button>
                <span className="px-3 text-xs font-bold text-slate-600">
                  Page {table.getState().pagination.pageIndex + 1} of {Math.max(table.getPageCount(), 1)}
                </span>
                <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all" title="Next page">
                  <ChevronRight size={15} />
                </button>
                <button onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()} className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all" title="Last page">
                  <ChevronsRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <AddPositionToDepartmentDrawer
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        departmentId={departmentId}
        existingPositionIds={existingPositionIds}
        onSuccess={() => {
          void refetchPositions()
        }}
      />
      <ConfirmActionModal
        isOpen={isRemoveOpen}
        onClose={() => setIsRemoveOpen(false)}
        onConfirm={handleRemove}
        title="Remove Position"
        message={`Remove "${selectedMapping?.positionName}" from this department? This action cannot be undone.`}
        confirmText="Remove"
        variant="danger"
        isLoading={isRemoving}
      />
    </div>
  )
}
