import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import {
  flexRender,
  getCoreRowModel,
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
  Building2,
  CheckCircle2,
  ChevronLeft,
  Loader2,
  Search,
  Shield,
  User,
  Users,
  XCircle,
} from 'lucide-react'
import { useAppSelector } from '../../../app/hooks'
import { useGetDepartmentByIdQuery } from '../../../features/department/api/departmentApi'
import {
  useGetEmployeesQuery,
  useLazyGetEmployeeViewByIdQuery,
  type EmployeeListItem,
} from '../../../features/hrEmployeeList/hrEmployeeApi'
import EmployeeProfileCell from '../../../features/hrEmployeeList/components/EmployeeProfileCell'
import EmployeeViewModal from '../../../features/hrEmployeeList/components/EmployeeViewModal'
import {
  departmentsGradientBr,
  departmentsGradientHero,
} from '../../../features/department/departmentsTheme'

const EMPLOYMENT_STATUS_OPTIONS = ['Probation', 'Permanent', 'Resigned', 'Terminated'] as const

const isActive = (status: unknown) => String(status ?? '').trim().toLowerCase() === 'active'

export default function DepartmentEmployeeListPage() {
  const user = useAppSelector((s) => s.auth.user)
  const isAudit = user?.roleId === 5
  const departmentsBasePath = isAudit ? '/audit/departments' : '/hr/departments'

  const { departmentId: departmentIdParam } = useParams()
  const departmentId = Number(departmentIdParam)
  const isValidDepartmentId = Number.isFinite(departmentId) && departmentId > 0

  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [search, setSearch] = useState('')
  const [employmentStatus, setEmploymentStatus] = useState<string | undefined>()
  const [sorting, setSorting] = useState<SortingState>([{ id: 'staffNo', desc: false }])
  const [selectedViewEmployeeId, setSelectedViewEmployeeId] = useState<number | null>(null)

  const {
    data: departmentResponse,
    isLoading: isDepartmentLoading,
    isError: isDepartmentError,
    error: departmentError,
    refetch: refetchDepartment,
  } = useGetDepartmentByIdQuery(departmentId, { skip: !isValidDepartmentId })

  const employeeQueryParams = useMemo(() => ({
    page,
    size,
    search,
    departmentId,
    employmentStatus,
    sortBy: sorting[0]?.id || 'staffNo',
    sortDir: sorting[0]?.desc ? 'desc' : 'asc',
  }), [departmentId, employmentStatus, page, search, size, sorting])

  const {
    data: employeesResponse,
    isLoading: isEmployeesLoading,
    isFetching: isEmployeesFetching,
    isError: isEmployeesError,
    refetch: refetchEmployees,
  } = useGetEmployeesQuery(employeeQueryParams, { skip: !isValidDepartmentId })

  const {
    data: totalEmployeesResponse,
  } = useGetEmployeesQuery({
    page: 0,
    size: 1,
    departmentId,
    sortBy: 'staffNo',
    sortDir: 'asc',
  }, { skip: !isValidDepartmentId })

  const [
    triggerGetEmployeeView,
    { data: viewData, isLoading: isViewLoading, isError: isViewError },
  ] = useLazyGetEmployeeViewByIdQuery()

  const department = departmentResponse?.data
  const employeeRows = useMemo(() => employeesResponse?.data?.content || [], [employeesResponse?.data?.content])
  const totalEmployees = totalEmployeesResponse?.data?.totalElements ?? employeesResponse?.data?.totalElements ?? 0
  const filteredEmployees = employeesResponse?.data?.totalElements ?? 0
  const totalPages = employeesResponse?.data?.totalPages ?? 0
  const isLoading = isDepartmentLoading || isEmployeesLoading || isEmployeesFetching
  const isNotFound = departmentError && typeof departmentError === 'object' && 'status' in departmentError
    ? (departmentError as { status?: number }).status === 404
    : false

  useEffect(() => {
    setPage(0)
  }, [departmentId, employmentStatus, search, size, sorting])

  const handleView = useCallback(async (id: number) => {
    setSelectedViewEmployeeId(id)
    try {
      await triggerGetEmployeeView(id, true).unwrap()
    } catch (error: unknown) {
      const status = error && typeof error === 'object' && 'status' in error
        ? (error as { status?: number }).status
        : undefined
      if (status === 403) {
        toast.error('You are not allowed to view this employee.')
        setSelectedViewEmployeeId(null)
      }
    }
  }, [triggerGetEmployeeView])

  const handleRetryView = useCallback(() => {
    if (selectedViewEmployeeId !== null) {
      triggerGetEmployeeView(selectedViewEmployeeId, true)
    }
  }, [selectedViewEmployeeId, triggerGetEmployeeView])

  const columns = useMemo<ColumnDef<EmployeeListItem>[]>(
    () => [
      {
        accessorKey: 'staffNo',
        header: 'Staff No.',
        cell: (info) => (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-[#eff6ff] border border-[#dbeafe] font-mono font-semibold text-[#1d4ed8] text-xs tracking-wide">
            {String(info.getValue() ?? '').trim() || '-'}
          </span>
        ),
      },
      {
        accessorKey: 'employeeName',
        header: 'Employee',
        cell: (info) => (
          <EmployeeProfileCell
            url={info.row.original.profilePictureUrl}
            name={info.getValue() as string}
          />
        ),
      },
      {
        accessorKey: 'positionName',
        header: 'Current Position',
        cell: (info) => <span className="font-semibold text-slate-700">{String(info.getValue() ?? '').trim() || '-'}</span>,
      },
      {
        accessorKey: 'employmentStatus',
        header: 'Employment Status',
        cell: (info) => {
          const status = String(info.getValue() ?? '').trim()
          const styles: Record<string, string> = {
            Probation: 'bg-amber-50 text-amber-700 border-amber-200',
            Permanent: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            Resigned: 'bg-slate-100 text-slate-600 border-slate-200',
            Terminated: 'bg-rose-50 text-rose-700 border-rose-200',
          }
          return (
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${styles[status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
              {status || '-'}
            </span>
          )
        },
      },
      {
        id: 'actions',
        enableSorting: false,
        header: 'View',
        cell: (info) => (
          <button
            type="button"
            onClick={() => handleView(info.row.original.employeeId)}
            className="p-1.5 text-[#2463eb] hover:bg-[#eff6ff] rounded-lg transition-colors"
            title="View Employee"
          >
            <i className="bi bi-eye text-lg"></i>
          </button>
        ),
      },
    ],
    [handleView]
  )

  const table = useReactTable({
    data: employeeRows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualSorting: true,
  })

  const getSortIcon = (isSorted: false | 'asc' | 'desc') => {
    if (isSorted === 'asc') return <ArrowUp size={13} className="text-[#2463eb]" />
    if (isSorted === 'desc') return <ArrowDown size={13} className="text-[#2463eb]" />
    return <ArrowUpDown size={13} className="text-slate-300 group-hover:text-slate-400 transition-colors" />
  }

  const pageItems = useMemo(() => {
    const pages: (number | 'ellipsis')[] = []
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index)
    }

    pages.push(0)
    const left = Math.max(1, page - 2)
    const right = Math.min(totalPages - 2, page + 2)
    if (left > 1) pages.push('ellipsis')
    for (let index = left; index <= right; index += 1) {
      pages.push(index)
    }
    if (right < totalPages - 2) pages.push('ellipsis')
    pages.push(totalPages - 1)
    return pages
  }, [page, totalPages])

  if (!isValidDepartmentId || isNotFound) {
    return <Navigate to={departmentsBasePath} replace />
  }

  if (isDepartmentError && !isNotFound) {
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
          type="button"
          onClick={() => void refetchDepartment()}
          className="px-5 py-2.5 bg-[#2463eb] text-white rounded-xl text-sm font-bold hover:bg-[#1d4ed8] transition-colors shadow-lg shadow-[#2463eb]/20"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-[#eff6ff]/30 to-[#dbeafe]/30">
      <div className={`relative overflow-hidden ${departmentsGradientHero} px-6 pt-8 pb-20`}>
        <div className="absolute -top-10 -right-10 w-64 h-64 bg-white/5 rounded-full pointer-events-none" />
        <div className="absolute top-8 right-20 w-32 h-32 bg-white/5 rounded-full pointer-events-none" />
        <div className="absolute -bottom-16 -left-8 w-48 h-48 bg-white/5 rounded-full pointer-events-none" />

        <div className="relative max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start gap-5">
              <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20 shadow-2xl flex-shrink-0">
                <Users size={32} className="text-white" />
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
                <p className="text-[#dbeafe] text-base">Department employee list</p>
              </div>
            </div>

            <Link
              to={departmentsBasePath}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-white/15 text-white border border-white/25 rounded-xl font-bold text-sm hover:bg-white/25 transition-all"
            >
              <ChevronLeft size={18} />
              Back to Departments
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-12 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl ${departmentsGradientBr} flex items-center justify-center flex-shrink-0 shadow-md`}>
              <Users size={22} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Employees</p>
              {isLoading ? <div className="h-8 w-16 bg-slate-100 rounded animate-pulse" /> : <p className="text-3xl font-extrabold text-slate-800 leading-tight">{totalEmployees}</p>}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl ${departmentsGradientBr} flex items-center justify-center flex-shrink-0 shadow-md`}>
              <User size={22} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Manager</p>
              {isDepartmentLoading ? (
                <div className="h-8 w-32 bg-slate-100 rounded animate-pulse" />
              ) : (
                <p className="text-lg font-bold leading-tight text-slate-800 truncate">{department?.managerName || '-'}</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl ${departmentsGradientBr} flex items-center justify-center flex-shrink-0 shadow-md`}>
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
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-5 py-4 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Users size={16} className="text-slate-500" />
              Department Employees
            </h2>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search employees..."
                  className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-[#2463eb]/20 focus:border-[#2463eb] outline-none transition-all placeholder:text-slate-400 w-full sm:w-56"
                />
              </div>
              <select
                value={employmentStatus ?? ''}
                onChange={(event) => setEmploymentStatus(event.target.value || undefined)}
                className="py-2 pl-3 pr-8 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-[#2463eb]/20 cursor-pointer"
              >
                <option value="">All statuses</option>
                {EMPLOYMENT_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
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
                        <Loader2 size={40} className="animate-spin text-[#2463eb]" />
                        <p className="text-sm font-semibold text-slate-500">Loading employees...</p>
                      </div>
                    </td>
                  </tr>
                ) : isEmployeesError ? (
                  <tr>
                    <td colSpan={columns.length} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <AlertTriangle className="text-rose-500" size={32} />
                        <p className="text-base font-bold text-slate-700">Failed to load employees</p>
                        <button
                          type="button"
                          onClick={() => void refetchEmployees()}
                          className="px-4 py-2 bg-[#2463eb] text-white rounded-lg text-xs font-bold hover:bg-[#1d4ed8] transition-colors"
                        >
                          Try Again
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : table.getRowModel().rows.length > 0 ? (
                  table.getRowModel().rows.map((row, index) => (
                    <tr key={row.id} className={`transition-colors hover:bg-[#2463eb]/[0.06] ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-5 py-4 whitespace-nowrap text-slate-700">
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
                          <Building2 size={40} className="text-slate-300" />
                        </div>
                        <div>
                          <p className="text-lg font-bold text-slate-700">No employees found</p>
                          <p className="text-sm text-slate-500 mt-1">
                            {search || employmentStatus ? 'Try different filters.' : 'This department has no employees yet.'}
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {employeesResponse?.data && totalPages >= 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4 border-t border-slate-200 bg-slate-50/50">
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span>
                  Showing <span className="font-bold text-slate-700">{filteredEmployees === 0 ? 0 : page * size + 1}</span>
                  {' - '}
                  <span className="font-bold text-slate-700">{Math.min((page + 1) * size, filteredEmployees)}</span>
                  {' of '}
                  <span className="font-bold text-slate-700">{filteredEmployees}</span>
                  {' employees'}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">Rows:</span>
                  <select
                    value={size}
                    onChange={(event) => setSize(Number(event.target.value))}
                    className="py-1 pl-2 pr-6 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-[#2463eb]/20 cursor-pointer"
                  >
                    {[10, 25, 50].map((pageSize) => (
                      <option key={pageSize} value={pageSize}>{pageSize}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(0, current - 1))}
                  disabled={page === 0}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Prev
                </button>
                {pageItems.map((item, index) =>
                  item === 'ellipsis' ? (
                    <span key={`ellipsis-${index}`} className="px-1.5 text-slate-400 text-xs select-none">...</span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setPage(item)}
                      className={`min-w-[32px] h-8 text-xs font-bold rounded-lg border transition-all ${
                        item === page
                          ? 'bg-[#2463eb] border-[#2463eb] text-white shadow-sm'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      {item + 1}
                    </button>
                  )
                )}
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <EmployeeViewModal
        isOpen={selectedViewEmployeeId !== null}
        onClose={() => setSelectedViewEmployeeId(null)}
        employeeId={selectedViewEmployeeId}
        data={viewData?.data ?? null}
        isLoading={isViewLoading}
        isError={isViewError}
        onRetry={handleRetryView}
      />
    </div>
  )
}
