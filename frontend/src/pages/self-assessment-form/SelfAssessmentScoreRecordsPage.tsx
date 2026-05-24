import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
import { Eye, Search, Trophy, BarChart3, FileText, CheckCircle2, FileDown, History } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useGetScoreRecordsQuery, type ScoreRecordDto } from '../../features/selfAssessmentForm/api/selfAssessmentFormApi'
import { downloadSelfAssessmentSummaryPdf } from '../../features/selfAssessmentForm/selfAssessmentSummaryReportApi'
import { PaginationBar } from '../../components/common/PaginationBar'

function ScoreBar({ score }: { score: number | null }) {
  if (score == null) return <span className="text-slate-400">-</span>
  const clamped = Math.min(100, Math.max(0, score))
  let barColor = 'bg-red-500'
  if (clamped >= 86) barColor = 'bg-emerald-500'
  else if (clamped >= 71) barColor = 'bg-[#2463eb]'
  else if (clamped >= 60) barColor = 'bg-yellow-500'
  else if (clamped >= 40) barColor = 'bg-orange-500'
  return (
    <div className="flex items-center gap-2">
      <div className="w-24 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${clamped}%` }} />
      </div>
      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{clamped.toFixed(1)}%</span>
    </div>
  )
}

const SCORE_RECORD_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  NOT_STARTED: 'Not Started',
  NOT_SUBMITTED: 'Not Submitted',
  SUBMITTED: 'Submitted',
  REOPENED: 'Reopened',
  PENDING_MANAGER_REVIEW: 'Pending Manager Review',
  PENDING_EMPLOYEE_REVIEW: 'Pending Employee Review',
  PENDING_FINAL_APPROVAL: 'Pending Final Approval',
  PENDING_HR_CALIBRATION_REVIEW: 'Pending HR Calibration',
  MANAGER_REVIEWED: 'Manager Reviewed',
  APPROVED: 'Approved',
  FINALIZED_LOCKED: 'Finalized Locked',
}

/** HR / manager history shows only finalized and missed-submission records. */
const HR_MANAGER_HISTORY_STATUSES = new Set(['FINALIZED_LOCKED', 'NOT_SUBMITTED'])

/** Status filter options (employee history includes draft / not started; HR/manager history is narrower). */
const SCORE_RECORD_STATUS_FILTER_OPTIONS: { value: string; label: string }[] = Object.entries(SCORE_RECORD_STATUS_LABELS)
  .map(([value, label]) => ({ value, label }))

function formatPerformanceLabel(performance: string): string {
  return performance.replace(/_/g, ' ')
}

/** Matches backend `SelfAssessmentFormService#getRatingCategory` labels. */
function PerformanceBadge({ performance }: { performance: string | null }) {
  if (!performance) return <span className="text-slate-400">-</span>
  const label = formatPerformanceLabel(performance)
  const colorMap: Record<string, string> = {
    outstanding: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    good: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    'meet requirement': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    'meets expectations': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    'need improvement': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    unsatisfactory: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  }
  const cls = colorMap[label.toLowerCase()] || 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${cls}`}>{label}</span>
}

function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    FINALIZED_LOCKED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    PENDING_FINAL_APPROVAL: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    PENDING_MANAGER_REVIEW: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    PENDING_EMPLOYEE_REVIEW: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300',
    PENDING_HR_CALIBRATION_REVIEW: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
    MANAGER_REVIEWED: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
    REOPENED: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    SUBMITTED: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    APPROVED: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
    DRAFT: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
    NOT_STARTED: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    NOT_SUBMITTED: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
  }
  const cls = colorMap[status] || 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
  const label =
    SCORE_RECORD_STATUS_LABELS[status]
    || status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
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

/** NOT_SUBMITTED penalty rows always display as zero even when the API omits the score. */
function resolveDisplayScore(record: ScoreRecordDto): number | null {
  if (record.status === 'NOT_SUBMITTED') return 0
  return record.finalApprovedScore
}

export function SelfAssessmentScoreRecordsPage() {
  const navigate = useNavigate()
  const roleId = useSelector((state: RootState) => state.auth.user?.roleId)
  const isHr = roleId === 1
  const isEmployee = roleId === 3 || roleId === 4
  const basePath = isHr
    ? '/hr/self-assessment'
    : isEmployee
      ? '/employee/self-assessment-forms'
      : '/manager/self-assessment-forms'

  const { data: records = [], isLoading, isError } = useGetScoreRecordsQuery()

  const historyRecords = useMemo(() => {
    if (isEmployee) return records
    return records.filter(r => HR_MANAGER_HISTORY_STATUSES.has(r.status))
  }, [records, isEmployee])

  const statusFilterOptions = useMemo(
    () =>
      isEmployee
        ? SCORE_RECORD_STATUS_FILTER_OPTIONS
        : SCORE_RECORD_STATUS_FILTER_OPTIONS.filter(o => HR_MANAGER_HISTORY_STATUSES.has(o.value)),
    [isEmployee],
  )

  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [cycleFilter, setCycleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [isExportingPdf, setIsExportingPdf] = useState(false)

  const cycleOptions = useMemo(() => {
    const seen = new Map<string, string>()
    for (const r of historyRecords) {
      const key = r.cycleName || ''
      if (key && !seen.has(key)) seen.set(key, r.cycleId?.toString() || key)
    }
    return Array.from(seen.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [historyRecords])
  const selectedCycle = useMemo(
    () => cycleOptions.find(([name]) => name === cycleFilter) ?? null,
    [cycleOptions, cycleFilter],
  )
  const selectedCycleId = selectedCycle ? Number(selectedCycle[1]) : null

  const columns = useMemo<ColumnDef<ScoreRecordDto>[]>(() => {
    const cols: ColumnDef<ScoreRecordDto>[] = []

    if (!isEmployee) {
      cols.push({
        accessorKey: 'employee.employeeName',
        header: 'Employee Name',
        cell: ({ getValue }) => <span className="font-medium text-slate-900 dark:text-slate-100">{getValue() as string || '-'}</span>,
      })
    }

    if (isHr) {
      cols.push({
        accessorKey: 'employee.departmentName',
        header: 'Department',
        cell: ({ getValue }) => <span>{getValue() as string || '-'}</span>,
      })
    }

    cols.push({
      accessorKey: 'employee.positionName',
      header: 'Position',
      cell: ({ getValue }) => <span>{getValue() as string || '-'}</span>,
    })

    cols.push(
      {
        id: 'period',
        header: 'Period',
        accessorFn: row => formatPeriod(row),
        cell: ({ row }) => <span>{formatPeriod(row.original)}</span>,
      },
      {
        accessorKey: 'finalApprovedScore',
        header: 'Score',
        cell: ({ row }) => <ScoreBar score={resolveDisplayScore(row.original)} />,
      },
      {
        accessorKey: 'performance',
        header: 'Performance',
        cell: ({ getValue }) => <PerformanceBadge performance={getValue() as string | null} />,
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
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-[#2463eb]/10 text-[#2463eb] hover:bg-[#2463eb]/15 dark:bg-[#2463eb]/20 dark:text-[#60a5fa] dark:hover:bg-[#2463eb]/30 transition-colors"
          >
            <Eye size={14} />
            View
          </button>
        ),
      },
    )

    return cols
  }, [isHr, isEmployee, navigate, basePath])

  const filteredData = useMemo(() => {
    let data = historyRecords
    if (cycleFilter) {
      data = data.filter(r => (r.cycleName || '') === cycleFilter)
    }
    if (statusFilter) {
      data = data.filter(r => r.status === statusFilter)
    }
    return data
  }, [historyRecords, cycleFilter, statusFilter])

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
    autoResetPageIndex: false,
    initialState: { pagination: { pageSize: 10 } },
  })

  useEffect(() => {
    table.setPageIndex(0)
  }, [cycleFilter, statusFilter, globalFilter])

  const handleExportPdf = async () => {
    if (!selectedCycleId || Number.isNaN(selectedCycleId)) return
    setIsExportingPdf(true)
    try {
      await downloadSelfAssessmentSummaryPdf(selectedCycleId, cycleFilter)
      toast.success('PDF exported')
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to export PDF')
    } finally {
      setIsExportingPdf(false)
    }
  }

  const visibleRecords = table.getFilteredRowModel().rows.map(row => row.original)
  const scoredVisibleRecords = visibleRecords.filter((r): r is ScoreRecordDto & { finalApprovedScore: number } => resolveDisplayScore(r) != null)
  const avgScore =
    scoredVisibleRecords.length > 0
      ? scoredVisibleRecords.reduce((sum, r) => sum + (resolveDisplayScore(r) ?? 0), 0) / scoredVisibleRecords.length
      : null
  const topScore =
    scoredVisibleRecords.length > 0
      ? Math.max(...scoredVisibleRecords.map(r => resolveDisplayScore(r) ?? 0))
      : null
  const finalizedOrNotSubmittedCount = visibleRecords.filter(
    r => r.status === 'FINALIZED_LOCKED' || r.status === 'NOT_SUBMITTED',
  ).length

  const metricCards = [
    {
      label: 'Total Records',
      value: visibleRecords.length.toString(),
      icon: FileText,
      iconClassName: 'text-slate-600 dark:text-slate-400',
      iconBgClassName: 'bg-slate-50 dark:bg-slate-900/40',
    },
    {
      label: 'Average Score',
      value: avgScore != null ? `${avgScore.toFixed(1)}%` : '-',
      icon: BarChart3,
      iconClassName: 'text-[#2463eb] dark:text-[#60a5fa]',
      iconBgClassName: 'bg-[#2463eb]/10 dark:bg-[#2463eb]/20',
    },
    {
      label: 'Top Score',
      value: topScore != null ? `${topScore.toFixed(1)}%` : '-',
      icon: Trophy,
      iconClassName: 'text-amber-600 dark:text-amber-400',
      iconBgClassName: 'bg-amber-50 dark:bg-amber-900/20',
    },
    {
      label: isEmployee ? 'Finalized / Approved' : 'Finalized / Not Submitted',
      value: (isEmployee
        ? visibleRecords.filter(r => r.status === 'FINALIZED_LOCKED' || r.status === 'APPROVED').length
        : finalizedOrNotSubmittedCount
      ).toString(),
      icon: CheckCircle2,
      iconClassName: 'text-emerald-600 dark:text-emerald-400',
      iconBgClassName: 'bg-emerald-50 dark:bg-emerald-900/20',
    },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2463eb]" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 font-bold">Failed to load history.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2463eb] to-[#1d4ed8] shadow-lg shadow-[#2463eb]/25">
          <History size={24} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">History</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isEmployee
              ? 'Past self-assessment forms for every workflow status, with scores when available.'
              : 'Finalized locked and not-submitted self-assessment records. In-progress forms appear on Review Submissions.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map(({ label, value, icon: Icon, iconClassName, iconBgClassName }) => (
          <div key={label} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBgClassName}`}>
              <Icon size={24} className={iconClassName} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">{label}</p>
              <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={isEmployee ? 'Search periods, positions...' : 'Search employees, departments...'}
              value={globalFilter}
              onChange={e => setGlobalFilter(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:border-[#2463eb] focus:outline-none focus:ring-2 focus:ring-[#2463eb]/20"
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
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={!selectedCycleId || isExportingPdf}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-bold rounded-lg bg-gradient-to-r from-[#2463eb] to-[#1d4ed8] text-white shadow-sm shadow-[#2463eb]/20 transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100"
          >
            <FileDown size={16} />
            {isExportingPdf ? 'Exporting...' : 'Export PDF'}
          </button>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
          >
            <option value="">All Statuses</option>
            {statusFilterOptions.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
            {filteredData.length} record{filteredData.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id} className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-[#2463eb]/[0.04] to-transparent dark:from-[#2463eb]/[0.08] dark:to-transparent">
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
                    No history found.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-[#2463eb]/[0.02] dark:hover:bg-[#2463eb]/[0.04] transition-colors">
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

        {table.getFilteredRowModel().rows.length > 0 && (
          <div className="border-t border-slate-200 dark:border-slate-700 p-4">
            <PaginationBar
              className="mt-0"
              pageIndex={table.getState().pagination.pageIndex}
              pageSize={table.getState().pagination.pageSize}
              pageCount={table.getPageCount() || 1}
              totalItems={table.getFilteredRowModel().rows.length}
              itemLabel="forms"
              rowsPerPageOptions={[5, 10, 20, 50]}
              onPageIndexChange={next => table.setPageIndex(next)}
              onPageSizeChange={nextSize => {
                table.setPageSize(nextSize)
                table.setPageIndex(0)
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
