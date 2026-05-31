import { useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { useGetPipsQuery } from '../../../features/pip/pipApi'
import { downloadIndividualPipReport } from '../../../features/pip/pipReportApi'
import type { RootState } from '../../../app/store'
import { Download, FileText, Filter, Zap, Activity, CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react'
import { pipStatusColors } from '../pipReportTheme'

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'AUTO_CLOSED', label: 'Auto Closed' },
  { value: 'REOPEN_REQUESTED', label: 'Reopen Requested' },
]

const formatDateValue = (value?: string) => {
  if (!value) return '-'
  const date = new Date(value.includes('T') ? value : `${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

const getPipStaffId = (pip: { employee?: { employeeId?: string } }) => pip.employee?.employeeId || '-'

const getStatusDisplayLabel = (status: string, finalOutcome?: string) => {
  if (status === 'CLOSED' && finalOutcome === 'SUCCESSFUL') return 'Close - Successful'
  if (status === 'CLOSED' && finalOutcome === 'FAILED') return 'Close - Fail'
  if (status === 'AUTO_CLOSED') return 'Auto Close'
  return status.replace(/_/g, ' ')
}

const getStatusColorClass = (status: string, finalOutcome?: string) => {
  if (status === 'CLOSED' && finalOutcome === 'SUCCESSFUL') return pipStatusColors.COMPLETED
  if (status === 'CLOSED' && finalOutcome === 'FAILED') return pipStatusColors.DENIED
  return pipStatusColors[status] || pipStatusColors.CLOSED
}

const getProgressColor = (progress: number) =>
  progress >= 70 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' :
  progress >= 30 ? 'bg-gradient-to-r from-blue-500 to-blue-400' :
  'bg-gradient-to-r from-amber-500 to-amber-400'

const overlapsDateRange = (start?: string, end?: string, startDate?: string, endDate?: string) => {
  const pipStart = start ? new Date(`${start}T00:00:00`).getTime() : Number.NEGATIVE_INFINITY
  const pipEnd = end ? new Date(`${end}T00:00:00`).getTime() : Number.POSITIVE_INFINITY
  const filterStart = startDate ? new Date(`${startDate}T00:00:00`).getTime() : Number.NEGATIVE_INFINITY
  const filterEnd = endDate ? new Date(`${endDate}T00:00:00`).getTime() : Number.POSITIVE_INFINITY
  return pipStart <= filterEnd && pipEnd >= filterStart
}

const isInvalidDateRange = (startDate: string, endDate: string) => Boolean(startDate && endDate && startDate > endDate)

const getReportErrorMessage = (error: unknown) => {
  if (typeof error !== 'object' || error === null) return 'Failed to download report'
  const candidate = error as { response?: { data?: { message?: unknown } } }
  return typeof candidate.response?.data?.message === 'string'
    ? candidate.response.data.message
    : 'Failed to download report'
}

function StatCard({ icon: Icon, label, value, color, bgColor }: {
  icon: React.ElementType; label: string; value: string | number; color: string; bgColor: string
}) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-slate-200/60 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md dark:border-slate-700/60 dark:bg-slate-900">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{value}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${bgColor}`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
      </div>
    </div>
  )
}

export default function PipReportPage() {
  const { user } = useSelector((state: RootState) => state.auth)
  const [statusFilter, setStatusFilter] = useState('')
  const [pipId, setPipId] = useState<number | undefined>(undefined)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const invalidDateRange = isInvalidDateRange(startDate, endDate)

  const { data: pips = [], isLoading } = useGetPipsQuery()

  const myPips = useMemo(() => {
    if (!user?.id) return []
    return pips.filter((pip) => (
      pip.employee?.id === user.id ||
      pip.employee?.employee?.id === user.id ||
      pip.employee?.employeeId === user.employeeId
    ))
  }, [pips, user])

  const pipOptions = useMemo(() => (
    myPips
      .map((pip) => ({
        id: pip.id,
        label: `PIP #${pip.id} - ${formatDateValue(pip.startDate)} to ${formatDateValue(pip.endDate)}`,
      }))
      .sort((a, b) => b.id - a.id)
  ), [myPips])

  const filteredPips = useMemo(() => (
    invalidDateRange
      ? []
      : myPips.filter((pip) => {
        const matchesStatus = !statusFilter || pip.status === statusFilter
        const matchesPip = pipId == null || pip.id === pipId
        const matchesDate = overlapsDateRange(pip.startDate, pip.endDate, startDate, endDate)
        return matchesStatus && matchesPip && matchesDate
      })
  ), [invalidDateRange, myPips, statusFilter, pipId, startDate, endDate])

  const handleDownloadReport = (pipId: number, format: 'pdf' | 'excel') => {
    if (invalidDateRange) return
    downloadIndividualPipReport(
      pipId, format,
      `pip-employee-pip-${pipId}-report-${new Date().toISOString().slice(0, 10)}.${format === 'excel' ? 'xlsx' : 'pdf'}`,
    ).catch((error) => {
      console.error('Failed to download report:', error)
      alert(getReportErrorMessage(error))
    })
  }

  const stats = useMemo(() => {
    const total = filteredPips.length
    const active = filteredPips.filter((p) => p.status === 'ACTIVE').length
    const completed = filteredPips.filter((p) => p.status === 'COMPLETED').length
    const closed = filteredPips.filter((p) => p.status === 'CLOSED' || p.status === 'AUTO_CLOSED').length
    return { total, active, completed, closed }
  }, [filteredPips])

  const clearFilters = () => {
    setStatusFilter('')
    setPipId(undefined)
    setStartDate('')
    setEndDate('')
  }

  const hasActiveFilters = statusFilter || pipId || startDate || endDate

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">My PIP Reports</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">View and download your Performance Improvement Plan reports</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
          <Activity className="h-4 w-4" />
          <span className="font-medium">{stats.total} PIPs</span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : myPips.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200/60 bg-white px-6 py-16 shadow-sm dark:border-slate-700/60 dark:bg-slate-900">
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
            <Zap className="h-10 w-10 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">No PIP Records Found</h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">You don't have any Performance Improvement Plans on record.</p>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-slate-200/60 bg-white shadow-sm dark:border-slate-700/60 dark:bg-slate-900">
            <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Filters</span>
                {hasActiveFilters && (
                  <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:bg-blue-500/20 dark:text-blue-400">
                    Active
                  </span>
                )}
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm transition-colors hover:border-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-slate-500 dark:focus:border-blue-400"
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">PIP</label>
                  <select
                    value={pipId ?? ''}
                    onChange={(e) => setPipId(e.target.value ? Number(e.target.value) : undefined)}
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm transition-colors hover:border-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-slate-500 dark:focus:border-blue-400"
                  >
                    <option value="">All PIPs</option>
                    {pipOptions.map((pip) => (
                      <option key={pip.id} value={pip.id}>{pip.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Start Date From</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm transition-colors hover:border-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-slate-500 dark:focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">End Date To</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm transition-colors hover:border-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-slate-500 dark:focus:border-blue-400"
                  />
                </div>
                <div className="flex items-end">
                  {hasActiveFilters && (
                    <button onClick={clearFilters} className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition-all hover:bg-slate-50 hover:border-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700">
                      <AlertCircle className="h-4 w-4" />
                      Clear Filters
                    </button>
                  )}
                </div>
              </div>
              {invalidDateRange && (
                <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
                  <AlertCircle className="h-4 w-4" />
                  Start date must be on or before end date.
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <StatCard icon={Activity} label="Total PIPs" value={stats.total} color="text-blue-600" bgColor="bg-blue-50 dark:bg-blue-500/10" />
            <StatCard icon={Activity} label="Active" value={stats.active} color="text-blue-600" bgColor="bg-blue-50 dark:bg-blue-500/10" />
            <StatCard icon={CheckCircle2} label="Completed" value={stats.completed} color="text-emerald-600" bgColor="bg-emerald-50 dark:bg-emerald-500/10" />
            <StatCard icon={XCircle} label="Closed" value={stats.closed} color="text-slate-600" bgColor="bg-slate-50 dark:bg-slate-500/10" />
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200/60 bg-white shadow-sm dark:border-slate-700/60 dark:bg-slate-900">
            <div className="p-6">
              <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">Your PIP History</h2>
              {filteredPips.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
                    <FileText className="h-7 w-7 text-slate-400" />
                  </div>
                  <p className="text-base font-medium text-slate-500">No PIP records match the selected filters.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/80 dark:border-slate-700 dark:bg-slate-800/50">
                        <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">PIP ID</th>
                        <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Staff ID</th>
                        <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Manager</th>
                        <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</th>
                        <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Start Date</th>
                        <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">End Date</th>
                        <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Progress</th>
                        <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Hours</th>
                        <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Download</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPips.map((pip) => (
                        <tr key={pip.id} className="border-b border-slate-100 transition-colors hover:bg-slate-50/80 dark:border-slate-800 dark:hover:bg-slate-800/40">
                          <td className="whitespace-nowrap px-4 py-3.5 font-mono text-sm font-medium text-slate-900 dark:text-slate-100">#{pip.id}</td>
                          <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-500 dark:text-slate-400">Staff ID: {getPipStaffId(pip)}</td>
                          <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-700 dark:text-slate-300">
                            {pip.manager?.employee?.employeeName || pip.manager?.email || 'N/A'}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${getStatusColorClass(pip.status, pip.finalOutcome)}`}>
                              {getStatusDisplayLabel(pip.status, pip.finalOutcome)}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-500 dark:text-slate-400">{formatDateValue(pip.startDate)}</td>
                          <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-500 dark:text-slate-400">{formatDateValue(pip.endDate)}</td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${getProgressColor(pip.overallProgressPercentage)}`}
                                  style={{ width: `${pip.overallProgressPercentage}%` }}
                                />
                              </div>
                              <span className="whitespace-nowrap text-[11px] font-bold text-slate-500 dark:text-slate-400">{pip.overallProgressPercentage}%</span>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-500 dark:text-slate-400">{pip.completedHours}/{pip.totalHours}</td>
                          <td className="whitespace-nowrap px-4 py-3.5">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDownloadReport(pip.id, 'pdf')}
                                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-500/10 dark:hover:text-blue-400"
                                title="Download PDF"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDownloadReport(pip.id, 'excel')}
                                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400"
                                title="Download Excel"
                              >
                                <FileText className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
