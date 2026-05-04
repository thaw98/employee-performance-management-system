import { useEffect, useState, useMemo, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  type SortingState,
  type ColumnDef,
  type PaginationState,
  type Updater,
} from '@tanstack/react-table'
import toast from 'react-hot-toast'
import {
  Plus, Search, Edit2, Trash2,
  ArrowUpDown, ArrowUp, ArrowDown,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Building2, CheckCircle2, XCircle, LayoutGrid, AlertTriangle, BriefcaseBusiness,
  Loader2, User,
} from 'lucide-react'

import {
  useDeleteDepartmentMutation,
} from '../../../features/department/api/departmentApi'
import type { DepartmentDto } from '../../../features/department/types'
import AddDepartmentModal from '../../../features/department/components/AddDepartmentModal'
import EditDepartmentModal from '../../../features/department/components/EditDepartmentModal'
import ConfirmActionModal from '../../../features/hrEmployeeList/components/ConfirmActionModal'

const isDepartmentActive = (status: unknown): boolean => {
  return String(status ?? '').trim().toLowerCase() === 'active'
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const getAliasValue = (raw: Record<string, unknown>, aliases: string[]): unknown => {
  for (const alias of aliases) {
    const value = raw[alias]
    if (value !== undefined && value !== null && value !== '') {
      return value
    }
  }

  const normalizedAliases = new Set(aliases.map((alias) => alias.toLowerCase().replace(/[^a-z0-9]/g, '')))
  for (const [key, value] of Object.entries(raw)) {
    const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (normalizedAliases.has(normalizedKey) && value !== undefined && value !== null && value !== '') {
      return value
    }
  }

  for (const value of Object.values(raw)) {
    if (!isRecord(value)) continue
    const nestedValue = getAliasValue(value, aliases)
    if (nestedValue !== undefined) {
      return nestedValue
    }
  }

  return undefined
}

const normalizeDepartmentRow = (row: unknown): DepartmentDto | null => {
  if (!isRecord(row)) {
    return null
  }

  const departmentId = Number(getAliasValue(row, ['departmentId', 'department_id', 'departmentid', 'id']) ?? 0)
  const departmentCode = String(getAliasValue(row, ['departmentCode', 'department_code', 'departmentcode', 'deptCode', 'code']) ?? '').trim()
  const departmentName = String(getAliasValue(row, ['departmentName', 'department_name', 'departmentname', 'deptName', 'name']) ?? '').trim()
  const rawStatus = getAliasValue(row, ['status', 'departmentStatus', 'isActive', 'active', 'enabled'])

  const normalizedStatus =
    String(rawStatus ?? '').trim().toLowerCase() === 'inactive' ||
    String(rawStatus ?? '').trim().toLowerCase() === 'false' ||
    String(rawStatus ?? '').trim() === '0'
      ? 'Inactive'
      : 'Active'

  return {
    departmentId: Number.isFinite(departmentId) ? departmentId : 0,
    departmentCode,
    departmentName,
    status: normalizedStatus,
    managerId: Number(getAliasValue(row, ['managerId', 'manager_id', 'managerid']) ?? 0) || 0,
    managerName: String(getAliasValue(row, ['managerName', 'manager_name', 'managername']) ?? ''),
    createdDate: String(getAliasValue(row, ['createdDate', 'created_date']) ?? ''),
    updatedDate: String(getAliasValue(row, ['updatedDate', 'updated_date']) ?? ''),
  }
}

const getDepartmentCodeForDisplay = (row: DepartmentDto): string => {
  const raw = row as unknown as Record<string, unknown>
  const code = getAliasValue(raw, ['departmentCode', 'department_code', 'departmentcode', 'deptCode', 'code'])
  return String(code ?? '').trim()
}

export default function DepartmentListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [deleteDepartment, { isLoading: isDeleting }] = useDeleteDepartmentMutation()
  const [departments, setDepartments] = useState<DepartmentDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)

  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [pagination, setPagination] = useState<PaginationState>(() => {
    const parsedPage = Number(searchParams.get('page'))
    const parsedPageSize = Number(searchParams.get('pageSize'))

    return {
      pageIndex: Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage - 1 : 0,
      pageSize: Number.isInteger(parsedPageSize) && parsedPageSize > 0 ? parsedPageSize : 10,
    }
  })

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedDept, setSelectedDept] = useState<DepartmentDto | null>(null)

  const activeCount = useMemo(() => departments.filter((d) => isDepartmentActive(d.status)).length, [departments])
  const inactiveCount = useMemo(() => departments.length - activeCount, [departments, activeCount])

  const loadDepartments = useCallback(async () => {
    setIsLoading(true)
    setIsError(false)

    try {
      const token = localStorage.getItem('epms_token') || sessionStorage.getItem('epms_token')
      const response = await fetch('/api/departments', {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch departments: ${response.status}`)
      }

      const payload = await response.json()
      const rows = Array.isArray(payload?.data) ? payload.data : []
      setDepartments(
        rows
          .map((row: unknown) => normalizeDepartmentRow(row))
          .filter((row: DepartmentDto | null): row is DepartmentDto => row !== null)
      )
    } catch (error) {
      console.error('Failed to load departments', error)
      setIsError(true)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadDepartments()
  }, [loadDepartments])

  useEffect(() => {
    const parsedPage = Number(searchParams.get('page'))
    const parsedPageSize = Number(searchParams.get('pageSize'))
    const nextPageIndex = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage - 1 : 0
    const nextPageSize = Number.isInteger(parsedPageSize) && parsedPageSize > 0 ? parsedPageSize : 10

    setPagination((prev) => {
      if (prev.pageIndex === nextPageIndex && prev.pageSize === nextPageSize) {
        return prev
      }
      return { pageIndex: nextPageIndex, pageSize: nextPageSize }
    })
  }, [searchParams])

  const syncPaginationToUrl = useCallback((nextPagination: PaginationState) => {
    setSearchParams((prevParams) => {
      const nextParams = new URLSearchParams(prevParams)

      if (nextPagination.pageIndex > 0) {
        nextParams.set('page', String(nextPagination.pageIndex + 1))
      } else {
        nextParams.delete('page')
      }

      if (nextPagination.pageSize !== 10) {
        nextParams.set('pageSize', String(nextPagination.pageSize))
      } else {
        nextParams.delete('pageSize')
      }

      return nextParams
    }, { replace: true })
  }, [setSearchParams])

  const handlePaginationChange = useCallback((updater: Updater<PaginationState>) => {
    setPagination((prev) => {
      const nextPagination = typeof updater === 'function' ? updater(prev) : updater
      syncPaginationToUrl(nextPagination)
      return nextPagination
    })
  }, [syncPaginationToUrl])

  const columns = useMemo<ColumnDef<DepartmentDto>[]>(
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
        accessorKey: 'departmentCode',
        header: 'Code',
        cell: (info) => {
          const code = String((info.getValue() as string) ?? '').trim() || getDepartmentCodeForDisplay(info.row.original)
          return (
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-100 font-mono font-semibold text-blue-700 text-xs tracking-wide">
              {code || '-'}
            </span>
          )
        },
      },
      {
        accessorKey: 'departmentName',
        header: 'Department Name',
        cell: (info) => (
          <div className="flex items-center gap-2.5">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-sm">
              <Building2 size={14} className="text-white" />
            </div>
            <Link
              to={`/hr/departments/${info.row.original.departmentId}`}
              className="font-semibold text-slate-800 text-sm hover:underline hover:text-blue-700 transition-colors"
            >
              {info.getValue() as string}
            </Link>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: (info) => {
          const status = info.getValue() as string
          if (isDepartmentActive(status)) {
            return (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 size={13} />
                Active
              </span>
            )
          }
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
              <XCircle size={13} />
              Inactive
            </span>
          )
        },
      },
      {
        accessorKey: 'managerName',
        header: 'Manager',
        cell: (info) => {
          const managerName = String(info.getValue() ?? '').trim()
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100 text-slate-700 text-xs font-semibold">
              <User size={13} className="text-slate-400" />
              {managerName || '-'}
            </span>
          )
        },
      },
      {
        id: 'actions',
        enableSorting: false,
        header: 'Actions',
        cell: (info) => {
          const row = info.row.original
          return (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  setSelectedDept(row)
                  setIsEditOpen(true)
                }}
                className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white border border-blue-100 hover:border-blue-600 transition-all duration-200"
                title="Edit Department"
              >
                <Edit2 size={13} />
                Edit
              </button>
              <button
                onClick={() => {
                  setSelectedDept(row)
                  setIsDeleteOpen(true)
                }}
                className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-600 hover:text-white border border-rose-100 hover:border-rose-600 transition-all duration-200"
                title="Delete Department"
              >
                <Trash2 size={13} />
                Delete
              </button>
              <Link
                to={`/hr/departments/${row.departmentId}`}
                className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-violet-600 bg-violet-50 hover:bg-violet-600 hover:text-white border border-violet-100 hover:border-violet-600 transition-all duration-200"
                title="View Positions"
              >
                <BriefcaseBusiness size={13} />
                Positions
              </Link>
            </div>
          )
        },
      },
    ],
    []
  )

  const table = useReactTable({
    data: departments,
    columns,
    state: { sorting, globalFilter, pagination },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: handlePaginationChange,
    autoResetPageIndex: false,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  const getSortIcon = (isSorted: false | 'asc' | 'desc') => {
    if (isSorted === 'asc') return <ArrowUp size={13} className="text-blue-500" />
    if (isSorted === 'desc') return <ArrowDown size={13} className="text-blue-500" />
    return <ArrowUpDown size={13} className="text-slate-300 group-hover:text-slate-400 transition-colors" />
  }

  const handleDelete = async () => {
    if (!selectedDept) return
    try {
      await deleteDepartment(selectedDept.departmentId).unwrap()
      await loadDepartments()
      toast.success('Department deleted successfully.')
      setIsDeleteOpen(false)
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to delete department.')
    }
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center">
          <AlertTriangle className="text-rose-500" size={32} />
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-slate-800">Failed to load departments</p>
          <p className="text-sm text-slate-500 mt-1">Something went wrong. Please try again.</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
        >
          Try Again
        </button>
      </div>
    )
  }

  const filteredCount = table.getFilteredRowModel().rows.length

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* ── Hero Header Banner ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 px-6 pt-8 pb-16 mx-0">
        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 w-64 h-64 bg-white/5 rounded-full pointer-events-none" />
        <div className="absolute top-8 right-20 w-32 h-32 bg-white/5 rounded-full pointer-events-none" />
        <div className="absolute -bottom-16 -left-8 w-48 h-48 bg-white/5 rounded-full pointer-events-none" />

        <div className="relative max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20 shadow-lg">
              <Building2 size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">Department Management</h1>
              <p className="text-blue-100 text-sm mt-0.5">Manage and organize your company departments</p>
            </div>
          </div>
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-blue-700 rounded-xl font-bold text-sm shadow-xl hover:bg-blue-50 active:scale-95 transition-all w-full sm:w-auto"
          >
            <Plus size={18} />
            Add New Department
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="max-w-7xl mx-auto px-6 -mt-8 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
              <LayoutGrid size={20} className="text-indigo-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</p>
              {isLoading
                ? <div className="h-7 w-12 bg-slate-100 rounded animate-pulse mt-0.5" />
                : <p className="text-2xl font-extrabold text-slate-800 leading-tight">{departments.length}</p>
              }
            </div>
          </div>
          {/* Active */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 size={20} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active</p>
              {isLoading
                ? <div className="h-7 w-12 bg-slate-100 rounded animate-pulse mt-0.5" />
                : <p className="text-2xl font-extrabold text-emerald-700 leading-tight">{activeCount}</p>
              }
            </div>
          </div>
          {/* Inactive */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
              <XCircle size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Inactive</p>
              {isLoading
                ? <div className="h-7 w-12 bg-slate-100 rounded animate-pulse mt-0.5" />
                : <p className="text-2xl font-extrabold text-amber-700 leading-tight">{inactiveCount}</p>
              }
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Table Card ── */}
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-4">

        {/* Search & filter bar */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3 flex flex-col sm:flex-row items-center gap-3 justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Search departments..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/15 focus:border-blue-400 outline-none transition-all placeholder:text-slate-400"
            />
          </div>
          <p className="text-xs font-medium text-slate-500 flex-shrink-0">
            {globalFilter
              ? <><span className="font-bold text-slate-700">{filteredCount}</span> result{filteredCount !== 1 ? 's' : ''} found</>
              : <><span className="font-bold text-slate-700">{departments.length}</span> departments total</>
            }
          </p>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="bg-slate-50 border-b border-slate-100">
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className={`px-5 py-3.5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-widest transition-colors group ${
                          header.column.getCanSort() ? 'cursor-pointer select-none hover:bg-slate-100/70' : ''
                        }`}
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
              <tbody className="divide-y divide-slate-50">
                {isLoading ? (
                  <tr>
                    <td colSpan={columns.length}>
                      <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
                        <Loader2 size={36} className="animate-spin text-blue-500" />
                        <p className="text-sm font-semibold text-slate-500">Loading departments…</p>
                      </div>
                    </td>
                  </tr>
                ) : table.getRowModel().rows.length > 0 ? (
                  table.getRowModel().rows.map((row, idx) => (
                    <tr
                      key={row.id}
                      className={`transition-colors hover:bg-blue-50/30 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-5 py-3.5 whitespace-nowrap">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={columns.length} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3 text-slate-400">
                        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                          <Building2 size={32} className="text-slate-300" />
                        </div>
                        <div>
                          <p className="text-base font-bold text-slate-600">No departments found</p>
                          <p className="text-sm text-slate-400 mt-0.5">
                            {globalFilter ? 'Try a different search term.' : 'Add your first department to get started.'}
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {table.getPageCount() > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 border-t border-slate-100 bg-slate-50/50">
              {/* Left: info + rows */}
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span>
                  Showing{' '}
                  <span className="font-bold text-slate-700">
                    {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
                  </span>
                  {' – '}
                  <span className="font-bold text-slate-700">
                    {Math.min(
                      (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                      filteredCount
                    )}
                  </span>
                  {' of '}
                  <span className="font-bold text-slate-700">{filteredCount}</span>
                  {' entries'}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">Rows:</span>
                  <select
                    value={table.getState().pagination.pageSize}
                    onChange={(e) => table.setPageSize(Number(e.target.value))}
                    className="py-1 pl-2 pr-6 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer appearance-none"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 6px center',
                    }}
                  >
                    {[5, 10, 20, 50].map((size) => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Right: page buttons */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  title="First page"
                >
                  <ChevronsLeft size={15} />
                </button>
                <button
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  title="Previous page"
                >
                  <ChevronLeft size={15} />
                </button>

                {(() => {
                  const current = table.getState().pagination.pageIndex
                  const total = table.getPageCount()
                  const delta = 1
                  const pages: (number | '...')[] = []
                  for (let i = 0; i < total; i++) {
                    if (i === 0 || i === total - 1 || (i >= current - delta && i <= current + delta)) {
                      pages.push(i)
                    } else if (pages[pages.length - 1] !== '...') {
                      pages.push('...')
                    }
                  }
                  return pages.map((page, idx) =>
                    page === '...' ? (
                      <span key={`el-${idx}`} className="px-1.5 text-slate-400 text-xs select-none">…</span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => table.setPageIndex(page as number)}
                        className={`min-w-[32px] h-8 text-xs font-bold rounded-lg border transition-all ${
                          page === current
                            ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        {(page as number) + 1}
                      </button>
                    )
                  )
                })()}

                <button
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  title="Next page"
                >
                  <ChevronRight size={15} />
                </button>
                <button
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  title="Last page"
                >
                  <ChevronsRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AddDepartmentModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={loadDepartments}
      />
      <EditDepartmentModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        department={selectedDept}
        onSuccess={loadDepartments}
      />
      <ConfirmActionModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Department"
        message={`Are you sure you want to delete "${selectedDept?.departmentName}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  )
}
