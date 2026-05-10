import { useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import type { RootState } from '../../app/store'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { Eye, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Trophy, BarChart3 } from 'lucide-react'
import { useGetScoreRecordsQuery, type ScoreRecordDto } from '../../features/selfAssessmentForm/api/selfAssessmentFormApi'

function ScoreBar({ score }: { score: number | null }) {
  if (score == null) return <span className="text-slate-400">-</span>
  const clamped = Math.min(100, Math.max(0, score))
  let barColor = 'bg-red-500'
  if (clamped >= 86) barColor = 'bg-emerald-500'
  else if (clamped >= 71) barColor = 'bg-blue-500'
  else if (clamped >= 60) barColor = 'bg-yellow-500'
  else if (clamped >= 40) barColor = 'bg-orange-500'
  return (
    <div className="flex items-center gap-2">
      <div className="w-24 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${clamped}%` }} />
      </div>
      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{clamped.toFixed(1)}</span>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    FINALIZED_LOCKED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    PENDING_FINAL_APPROVAL: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    PENDING_MANAGER_REVIEW: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    DRAFT: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  }
  const cls = colorMap[status] || 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
  const label = status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${cls}`}>{label}</span>
}

function formatDate(value: string | null): string {
  if (!value) return '-'
  try {
    return new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return '-'
  }
}

function formatPeriod(row: ScoreRecordDto): string {
  if (row.cycleName) return row.cycleName
  return formatDate(row.createdDate)
}

export function SelfAssessmentScoreRecordsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const roleId = useSelector((state: RootState) => state.auth.user?.roleId)
  const isHr = roleId === 1
  const isManager = roleId === 2
  const basePath = isHr ? '/hr/self-assessment' : '/manager/self-assessment-forms'

  const { data: records = [], isLoading, isError } = useGetScoreRecordsQuery()

  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [cycleFilter, setCycleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const cycleOptions = useMemo(() => {
    const seen = new Map<string, string>()
    for (const r of records) {
      const key = r.cycleName || ''
      if (key && !seen.has(key)) seen.set(key, r.cycleId?.toString() || key)
    }
    return Array.from(seen.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [records])

  const columns = useMemo<ColumnDef<ScoreRecordDto>[]>(() => {
    const cols: ColumnDef<ScoreRecordDto>[] = [
      {
        accessorKey: 'employee.employeeName',
        header: 'Employee Name',
        cell: ({ getValue }) => <span className="font-medium text-slate-900 dark:text-slate-100">{getValue() as string || '-'}</span>,
      },
    ]

    if (isHr) {
      cols.push({
        accessorKey: 'employee.departmentName',
        header: 'Department',
        cell: ({ getValue }) => <span>{getValue() as string || '-'}</span>,
      })
    }

    cols.push(
      {
        accessorKey: 'employee.positionName',
        header: 'Position',
        cell: ({ getValue }) => <span>{getValue() as string || '-'}</span>,
      },
      {
        id: 'period',
        header: 'Period',
        accessorFn: row => formatPeriod(row),
        cell: ({ row }) => <span>{formatPeriod(row.original)}</span>,
      },
      {
        accessorKey: 'finalApprovedScore',
        header: 'Score',
        cell: ({ getValue }) => <ScoreBar score={getValue() as number | null} />,
      },
      {
        accessorKey: 'performance',
        header: 'Performance',
        cell: ({ getValue }) => {
          const val = getValue() as string | null
          return <span>{val || '-'}</span>
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => <StatusBadge status={getValue() as string} />,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => navigate(`${basePath}/reviews/${row.original.id}`)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/40 transition-colors"
          >
            <Eye size={14} />
            View
          </button>
        ),
      },
    )

    return cols
  }, [isHr, navigate, basePath])

  const filteredData = useMemo(() => {
    let data = records
    if (cycleFilter) {
      data = data.filter(r => (r.cycleName || '') === cycleFilter)
    }
    if (statusFilter) {
      data = data.filter(r => r.status === statusFilter)
    }
    return data
  }, [records, cycleFilter, statusFilter])

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  })

  const avgScore = useMemo(() => {
    if (!isManager || filteredData.length === 0) return null
    const scores = filteredData.map(r => r.finalApprovedScore).filter((s): s is number => s != null)
    if (scores.length === 0) return null
    return scores.reduce((a, b) => a + b, 0) / scores.length
  }, [isManager, filteredData])

  const topScore = useMemo(() => {
    if (!isManager || filteredData.length === 0) return null
    const scores = filteredData.map(r => r.finalApprovedScore).filter((s): s is number => s != null)
    if (scores.length === 0) return null
    return Math.max(...scores)
  }, [isManager, filteredData])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 font-bold">Failed to load score records.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">Score Records</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Finalized self-assessment score records</p>
      </div>

      {isManager && (avgScore != null || topScore != null) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {avgScore != null && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                <BarChart3 size={24} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Average Score</p>
                <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{avgScore.toFixed(1)}</p>
              </div>
            </div>
          )}
          {topScore != null && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                <Trophy size={24} className="text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Top Score</p>
                <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{topScore.toFixed(1)}</p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search employees, departments..."
              value={globalFilter}
              onChange={e => setGlobalFilter(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          <select
            value={cycleFilter}
            onChange={e => setCycleFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
          >
            <option value="">All Cycles</option>
            {cycleOptions.map(([name]) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
          >
            <option value="">All Statuses</option>
            <option value="FINALIZED_LOCKED">Finalized Locked</option>
          </select>
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
            {filteredData.length} record{filteredData.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id} className="border-b border-slate-200 dark:border-slate-700">
                  {headerGroup.headers.map(header => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-900 dark:hover:text-slate-200 select-none"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-1">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{ asc: ' \u25B2', desc: ' \u25BC' }[header.column.getIsSorted() as string] ?? ''}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12 text-center text-sm text-slate-400 dark:text-slate-500">
                    No finalized score records found.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <ChevronsLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
            </span>
            <button
              type="button"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
            <button
              type="button"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
          <select
            value={table.getState().pagination.pageSize}
            onChange={e => table.setPageSize(Number(e.target.value))}
            className="px-2 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
          >
            {[5, 10, 20, 50].map(size => (
              <option key={size} value={size}>{size} / page</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
