import { useState, useMemo } from 'react'
import { useSelector } from 'react-redux'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import {
  useGetPipsQuery,
  useGetPipSummaryReportQuery,
  useGetPipProgressReportQuery,
  useGetPipIndividualReportQuery,
} from '../../../features/pip/pipApi'
import {
  downloadIndividualPipReport,
  downloadPipProgressReportExport,
  downloadPipSummaryReportExport,
  type PipReportFormat,
} from '../../../features/pip/pipReportApi'
import { useGetDepartmentsQuery, useGetDepartmentPositionsQuery } from '../../../features/hrCreateEmployee/hrEmployeeAccountApi'
import type { RootState } from '../../../app/store'
import {
  Download, FileText, BarChart3, Filter, X, Calendar, User, Target,
  ChevronLeft, ChevronRight, TrendingUp, Activity, Users, CheckCircle2,
  Clock, AlertCircle, XCircle, Loader2, Search
} from 'lucide-react'
import { skipToken } from '@reduxjs/toolkit/query'
import { pipStatusColors } from '../pipReportTheme'

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'AUTO_CLOSED', label: 'Auto Closed' },
  { value: 'REOPEN_REQUESTED', label: 'Reopen Requested' },
]

const CHART_COLORS = {
  ACTIVE: '#2463eb',
  COMPLETED: '#059669',
  CLOSED: '#6366f1',
  AUTO_CLOSED: '#d97706',
  REOPEN_REQUESTED: '#ea580c',
  DENIED: '#dc2626',
}

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

const formatDateValue = (value?: string) => {
  if (!value) return '-'
  const date = new Date(value.includes('T') ? value : `${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

const isInvalidDateRange = (startDate: string, endDate: string) => Boolean(startDate && endDate && startDate > endDate)

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
        <FileText className="h-8 w-8 text-slate-400" />
      </div>
      <p className="text-base font-medium text-slate-600 dark:text-slate-400">{message}</p>
    </div>
  )
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

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-lg dark:border-slate-700 dark:bg-slate-900">
      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{label}</p>
      {payload.map((entry: any, index: number) => (
        <p key={index} className="text-sm font-semibold text-slate-600 dark:text-slate-400" style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  )
}

export default function PipReportPage() {
  const { user } = useSelector((state: RootState) => state.auth)
  const [activeTab, setActiveTab] = useState<'summary' | 'progress'>('summary')
  const [statusFilter, setStatusFilter] = useState('')
  const [positionId, setPositionId] = useState<number | undefined>(undefined)
  const [employeeName, setEmployeeName] = useState('')
  const [employeeId, setEmployeeId] = useState<number | undefined>(undefined)
  const [pipId, setPipId] = useState<number | undefined>(undefined)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reportDownload, setReportDownload] = useState<string | null>(null)
  const [selectedPipId, setSelectedPipId] = useState<number | null>(null)
  const invalidDateRange = isInvalidDateRange(startDate, endDate)

  const { data: departmentsResponse } = useGetDepartmentsQuery()

  const departmentId = useMemo(() => {
    if (!user) return undefined
    return (user as any).departmentId || (user as any).employee?.department?.id
  }, [user])

  const reportFilters = {
    status: statusFilter || undefined,
    departmentId,
    positionId,
    employeeName: employeeName.trim() || undefined,
    employeeId,
    pipId,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  }

  const { data: summaryData = [], isLoading: isLoadingSummary } = useGetPipSummaryReportQuery(invalidDateRange ? skipToken : reportFilters)
  const { data: progressData, isLoading: isLoadingProgress } = useGetPipProgressReportQuery(invalidDateRange ? skipToken : reportFilters)

  const queryEnabled = selectedPipId != null && selectedPipId > 0
  const { data: individualPipData, isLoading: isLoadingIndividual } = useGetPipIndividualReportQuery(
    queryEnabled ? selectedPipId : 0,
    { skip: !queryEnabled }
  )
  const { data: positionsResponse } = useGetDepartmentPositionsQuery(departmentId !== undefined ? departmentId : skipToken)
  const { data: pips = [] } = useGetPipsQuery(invalidDateRange ? skipToken : {
    departmentId, positionId,
    employeeName: employeeName.trim() || undefined,
    status: statusFilter || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  })

  const positionOptions = useMemo(() => {
    const departmentPositions = (positionsResponse?.data ?? [])
      .filter((position: any) => typeof position.positionId === 'number')
      .map((position: any) => ({
        id: position.positionId,
        name: position.positionName || 'Unnamed Position',
      }))

    if (departmentPositions.length > 0) {
      return departmentPositions.sort((a: any, b: any) => a.name.localeCompare(b.name))
    }

    return pips
      .map((pip: any) => ({
        id: pip.employee.employee?.positionId ?? undefined,
        name: pip.employee.employee?.positionName || pip.employee.employee?.position?.positionName || 'Unnamed Position',
      }))
      .filter((position: any): position is { id: number; name: string } => typeof position.id === 'number')
      .filter((position: any, index: number, all: any[]) => all.findIndex((item) => item.id === position.id) === index)
      .sort((a: any, b: any) => a.name.localeCompare(b.name))
  }, [pips, positionsResponse])

  const employeeOptions = useMemo(() => {
    return pips
      .map((pip: any) => ({
        id: pip.employee.employee?.id,
        name: pip.employee.employee?.employeeName || pip.employee.email || 'N/A',
        staffNo: pip.employee.employeeId || 'N/A',
      }))
      .filter((employee: any): employee is { id: number; name: string; staffNo: string } => (
        typeof employee.id === 'number' && Number.isFinite(employee.id)
      ))
      .filter((employee: any, index: number, all: any[]) => all.findIndex((item) => item.id === employee.id) === index)
      .sort((a: any, b: any) => a.name.localeCompare(b.name))
  }, [pips])

  const pipOptions = useMemo(() => {
    return pips
      .map((pip: any) => ({
        id: pip.id,
        employeeName: pip.employee.employee?.employeeName || pip.employee.email || 'N/A',
      }))
      .sort((a: any, b: any) => b.id - a.id)
  }, [pips])

  const handleDownloadReport = (pipId: number, format: 'pdf' | 'excel') => {
    downloadIndividualPipReport(pipId, format).catch((error: any) => {
      console.error('Failed to download report:', error)
      alert(error?.response?.data?.message || 'Failed to download report')
    })
  }

  const handleDownloadSummaryReport = async (format: PipReportFormat) => {
    if (invalidDateRange) return
    try {
      setReportDownload(`summary-${format}`)
      await downloadPipSummaryReportExport(
        reportFilters, format,
        `pip-summary-report-manager-${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'pdf'}`
      )
    } catch (error: any) {
      console.error('Failed to download summary report:', error)
      alert(error?.response?.data?.message || 'Failed to download summary report')
    } finally { setReportDownload(null) }
  }

  const handleDownloadProgressReport = async (format: PipReportFormat) => {
    if (invalidDateRange) return
    try {
      setReportDownload(`progress-${format}`)
      await downloadPipProgressReportExport(
        reportFilters, format,
        `pip-progress-report-manager-${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'pdf'}`
      )
    } catch (error: any) {
      console.error('Failed to download progress report:', error)
      alert(error?.response?.data?.message || 'Failed to download progress report')
    } finally { setReportDownload(null) }
  }

  const summaryStats = useMemo(() => {
    const total = summaryData.length
    const totalEmployees = new Set(summaryData.map((s: any) => s.employeeStaffNo || s.employeeName).filter(Boolean)).size
    const active = summaryData.filter((s: any) => s.status === 'ACTIVE').length
    const completed = summaryData.filter((s: any) => s.status === 'COMPLETED').length
    const closed = summaryData.filter((s: any) => s.status === 'CLOSED' || s.status === 'AUTO_CLOSED').length
    return { total, totalEmployees, active, completed, closed }
  }, [summaryData])

  const statusChartData = useMemo(() => {
    const counts: Record<string, number> = {}
    summaryData.forEach((item: any) => {
      counts[item.status] = (counts[item.status] || 0) + 1
    })
    return Object.entries(counts).map(([status, count]) => ({
      name: status.replace('_', ' '),
      value: count,
      color: CHART_COLORS[status as keyof typeof CHART_COLORS] || '#6b7280',
    }))
  }, [summaryData])

  const departmentChartData = useMemo(() => {
    const counts: Record<string, number> = {}
    summaryData.forEach((item: any) => {
      const dept = item.departmentName || 'Unknown'
      counts[dept] = (counts[dept] || 0) + 1
    })
    return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5)
  }, [summaryData])

  const pieChartData = useMemo(() => {
    if (!progressData) return []
    return [
      { name: 'Active', value: progressData.activePips, color: CHART_COLORS.ACTIVE },
      { name: 'Completed', value: progressData.completedPips, color: CHART_COLORS.COMPLETED },
      { name: 'Closed', value: progressData.closedPips, color: CHART_COLORS.CLOSED },
      { name: 'Auto Closed', value: progressData.autoClosedPips, color: CHART_COLORS.AUTO_CLOSED },
      { name: 'Reopen', value: progressData.reopenRequestedPips, color: CHART_COLORS.REOPEN_REQUESTED },
    ].filter((item: any) => item.value > 0)
  }, [progressData])

  const hoursProgress = useMemo(() => {
    if (!progressData || progressData.totalPlannedHours === 0) return 0
    return (progressData.totalCompletedHours / progressData.totalPlannedHours) * 100
  }, [progressData])

  const departmentName = useMemo(() => {
    if (!departmentId || !departmentsResponse?.data) return 'Team'
    const dept = departmentsResponse.data.find((d: any) => (d.departmentId ?? d.id) === departmentId)
    return dept?.departmentName ?? dept?.name ?? 'Team'
  }, [departmentId, departmentsResponse])

  const clearFilters = () => {
    setStatusFilter('')
    setPositionId(undefined)
    setEmployeeName('')
    setEmployeeId(undefined)
    setPipId(undefined)
    setStartDate('')
    setEndDate('')
  }

  const hasActiveFilters = statusFilter || positionId || employeeName || employeeId || pipId || startDate || endDate

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Team PIP Reports</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">View and export PIP performance reports for {departmentName}</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
          <Activity className="h-4 w-4" />
          <span className="font-medium">{summaryStats.totalEmployees} Employees • {summaryStats.total} PIPs</span>
        </div>
      </div>

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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm transition-colors hover:border-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-slate-500 dark:focus:border-blue-400"
              >
                {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Position</label>
              <select
                value={positionId ?? ''}
                onChange={(e) => { setPositionId(e.target.value ? Number(e.target.value) : undefined); setEmployeeId(undefined); setPipId(undefined) }}
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm transition-colors hover:border-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-slate-500 dark:focus:border-blue-400"
              >
                <option value="">All Positions</option>
                {positionOptions.map((position: any) => <option key={position.id} value={position.id}>{position.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Employee Name</label>
              <input
                type="text"
                value={employeeName}
                onChange={(e) => { setEmployeeName(e.target.value); setEmployeeId(undefined); setPipId(undefined) }}
                placeholder="Search..."
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:border-slate-500 dark:focus:border-blue-400"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Employee</label>
              <select
                value={employeeId ?? ''}
                onChange={(e) => { setEmployeeId(e.target.value ? Number(e.target.value) : undefined); setPipId(undefined) }}
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm transition-colors hover:border-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-slate-500 dark:focus:border-blue-400"
              >
                <option value="">All Employees</option>
                {employeeOptions.map((employee: any) => <option key={employee.id} value={employee.id}>{employee.name} - {employee.staffNo}</option>)}
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
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">PIP</label>
              <select
                value={pipId ?? ''}
                onChange={(e) => setPipId(e.target.value ? Number(e.target.value) : undefined)}
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm transition-colors hover:border-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-slate-500 dark:focus:border-blue-400"
              >
                <option value="">All PIPs</option>
                {pipOptions.map((pip: any) => <option key={pip.id} value={pip.id}>PIP #{pip.id} - {pip.employeeName}</option>)}
              </select>
            </div>
          </div>
          {invalidDateRange && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
              <AlertCircle className="h-4 w-4" />
              Start date must be on or before end date.
            </div>
          )}
          <div className="mt-4 flex justify-end gap-2">
            {hasActiveFilters && (
              <button onClick={clearFilters} className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-all hover:bg-slate-50 hover:border-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700">
                <X className="h-4 w-4" />
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200/60 bg-white shadow-sm dark:border-slate-700/60 dark:bg-slate-900">
        <div className="border-b border-slate-100 px-1 pt-1 dark:border-slate-800">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('summary')}
              className={`flex items-center gap-2 rounded-t-lg px-5 py-3 text-sm font-medium transition-all ${
                activeTab === 'summary'
                  ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-400'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <FileText className="h-4 w-4" />
              Summary Report
            </button>
            <button
              onClick={() => setActiveTab('progress')}
              className={`flex items-center gap-2 rounded-t-lg px-5 py-3 text-sm font-medium transition-all ${
                activeTab === 'progress'
                  ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-400'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              Progress Report
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'summary' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Summary Report</h2>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleDownloadSummaryReport('pdf')}
                    disabled={reportDownload !== null || invalidDateRange}
                    className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:from-blue-700 hover:to-blue-800 disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300 disabled:shadow-none"
                  >
                    {reportDownload === 'summary-pdf' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    {reportDownload === 'summary-pdf' ? 'Downloading...' : 'PDF'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadSummaryReport('excel')}
                    disabled={reportDownload !== null || invalidDateRange}
                    className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:from-emerald-700 hover:to-emerald-800 disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300 disabled:shadow-none"
                  >
                    {reportDownload === 'summary-excel' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                    {reportDownload === 'summary-excel' ? 'Downloading...' : 'Excel'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <StatCard icon={Activity} label="Total PIPs" value={summaryStats.total} color="text-blue-600" bgColor="bg-blue-50 dark:bg-blue-500/10" />
                <StatCard icon={Users} label="Total Employees" value={summaryStats.totalEmployees} color="text-blue-600" bgColor="bg-blue-50 dark:bg-blue-500/10" />
                <StatCard icon={Activity} label="Active" value={summaryStats.active} color="text-blue-600" bgColor="bg-blue-50 dark:bg-blue-500/10" />
                <StatCard icon={CheckCircle2} label="Completed" value={summaryStats.completed} color="text-emerald-600" bgColor="bg-emerald-50 dark:bg-emerald-500/10" />
                <StatCard icon={XCircle} label="Closed" value={summaryStats.closed} color="text-slate-600" bgColor="bg-slate-50 dark:bg-slate-500/10" />
              </div>

              {statusChartData.length > 0 && (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-800/30">
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      <BarChart3 className="h-4 w-4" />
                      PIPs by Status
                    </h3>
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={statusChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
                        <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={48}>
                          {statusChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {departmentChartData.length > 0 && (
                    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-800/30">
                      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                        <TrendingUp className="h-4 w-4" />
                        Top Departments
                      </h3>
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={departmentChartData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
                          <XAxis type="number" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                          <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: '#94a3b8' }} width={100} axisLine={false} tickLine={false} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={32}>
                            {departmentChartData.map((_, index) => (
                              <Cell key={`dept-cell-${index}`} fill={['#2463eb', '#059669', '#d97706', '#6366f1', '#0891b2'][index % 5]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              )}

              {isLoadingSummary ? (
                <LoadingSpinner />
              ) : summaryData.length === 0 ? (
                <EmptyState message="No PIP data found for your team" />
              ) : (
                <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/80 dark:border-slate-700 dark:bg-slate-800/50">
                          <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">PIP ID</th>
                          <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Employee</th>
                          <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</th>
                          <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Start Date</th>
                          <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">End Date</th>
                          <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Overall Progress</th>
                          <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Hours</th>
                          <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {summaryData.map((item: any) => (
                          <tr key={item.pipId} className="border-b border-slate-100 transition-colors hover:bg-slate-50/80 dark:border-slate-800 dark:hover:bg-slate-800/40">
                            <td className="whitespace-nowrap px-4 py-3.5 font-mono text-sm font-medium text-slate-900 dark:text-slate-100">#{item.pipId}</td>
                            <td className="px-4 py-3.5">
                              <button
                                onClick={() => setSelectedPipId(Number(item.pipId))}
                                className="font-medium text-blue-600 transition-colors hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                              >
                                {item.employeeName}
                              </button>
                              <div className="text-xs text-slate-400">Staff ID: {item.employeeStaffNo || '-'}</div>
                            </td>
                            <td className="whitespace-nowrap px-4 py-3.5">
                              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${getStatusColorClass(item.status, item.finalOutcome)}`}>
                                {getStatusDisplayLabel(item.status, item.finalOutcome)}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-500 dark:text-slate-400">{formatDateValue(item.startDate)}</td>
                            <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-500 dark:text-slate-400">{formatDateValue(item.endDate)}</td>
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-2.5">
                                <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${getProgressColor(item.overallProgress)}`}
                                    style={{ width: `${item.overallProgress}%` }}
                                  />
                                </div>
                                <span className="whitespace-nowrap text-[11px] font-bold text-slate-500 dark:text-slate-400">{item.overallProgress}%</span>
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-500 dark:text-slate-400">{item.completedHours}/{item.totalHours}</td>
                            <td className="whitespace-nowrap px-4 py-3.5">
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleDownloadReport(item.pipId, 'pdf')}
                                  className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-500/10 dark:hover:text-blue-400"
                                  title="Download PDF"
                                >
                                  <Download className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDownloadReport(item.pipId, 'excel')}
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
                </div>
              )}
            </div>
          )}

          {activeTab === 'progress' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Progress Report</h2>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleDownloadProgressReport('pdf')}
                    disabled={reportDownload !== null || invalidDateRange}
                    className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:from-blue-700 hover:to-blue-800 disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300 disabled:shadow-none"
                  >
                    {reportDownload === 'progress-pdf' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    {reportDownload === 'progress-pdf' ? 'Downloading...' : 'PDF'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadProgressReport('excel')}
                    disabled={reportDownload !== null || invalidDateRange}
                    className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:from-emerald-700 hover:to-emerald-800 disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300 disabled:shadow-none"
                  >
                    {reportDownload === 'progress-excel' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                    {reportDownload === 'progress-excel' ? 'Downloading...' : 'Excel'}
                  </button>
                </div>
              </div>

              {isLoadingProgress ? (
                <LoadingSpinner />
              ) : progressData ? (
                <>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                    <StatCard icon={Activity} label="Total PIPs" value={progressData.totalPips} color="text-blue-600" bgColor="bg-blue-50 dark:bg-blue-500/10" />
                    <StatCard icon={Users} label="Total Employees" value={progressData.totalEmployees} color="text-blue-600" bgColor="bg-blue-50 dark:bg-blue-500/10" />
                    <StatCard icon={Activity} label="Active" value={progressData.activePips} color="text-blue-600" bgColor="bg-blue-50 dark:bg-blue-500/10" />
                    <StatCard icon={CheckCircle2} label="Completed" value={progressData.completedPips} color="text-emerald-600" bgColor="bg-emerald-50 dark:bg-emerald-500/10" />
                    <StatCard icon={XCircle} label="Closed" value={progressData.closedPips + progressData.autoClosedPips} color="text-slate-600" bgColor="bg-slate-50 dark:bg-slate-500/10" />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard icon={TrendingUp} label="Avg Progress" value={`${progressData.averageProgress?.toFixed(1)}%`} color="text-blue-600" bgColor="bg-blue-50 dark:bg-blue-500/10" />
                    <StatCard icon={Clock} label="Hours Completion" value={`${progressData.hoursCompletionPercentage?.toFixed(1)}%`} color="text-emerald-600" bgColor="bg-emerald-50 dark:bg-emerald-500/10" />
                    <StatCard icon={AlertCircle} label="Reopen Requested" value={progressData.reopenRequestedPips} color="text-orange-600" bgColor="bg-orange-50 dark:bg-orange-500/10" />
                    <StatCard icon={XCircle} label="Auto Closed" value={progressData.autoClosedPips} color="text-amber-600" bgColor="bg-amber-50 dark:bg-amber-500/10" />
                  </div>

                  {pieChartData.length > 0 && (
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                      <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-800/30">
                        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                          <BarChart3 className="h-4 w-4" />
                          Status Distribution
                        </h3>
                        <ResponsiveContainer width="100%" height={280}>
                          <PieChart>
                            <Pie
                              data={pieChartData}
                              cx="50%" cy="50%"
                              innerRadius={60} outerRadius={100}
                              paddingAngle={3}
                              dataKey="value"
                              label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                              labelLine={false}
                            >
                              {pieChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend formatter={(value) => <span className="text-sm text-slate-700 dark:text-slate-300">{value}</span>} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-800/30">
                        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                          <Clock className="h-4 w-4" />
                          Hours Completion
                        </h3>
                        <div className="space-y-6">
                          <div>
                            <div className="mb-2 flex items-center justify-between">
                              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Progress</span>
                              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                {progressData.totalCompletedHours} / {progressData.totalPlannedHours} hours
                              </span>
                            </div>
                            <div className="h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500"
                                style={{ width: `${hoursProgress}%` }}
                              />
                            </div>
                            <div className="mt-1.5 text-right text-xs font-medium text-slate-500">{hoursProgress.toFixed(1)}%</div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{progressData.totalCompletedHours}</p>
                              <p className="mt-1 text-xs font-medium text-slate-500">Completed Hours</p>
                            </div>
                            <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                              <p className="text-2xl font-bold text-slate-600 dark:text-slate-400">{progressData.totalPlannedHours - progressData.totalCompletedHours}</p>
                              <p className="mt-1 text-xs font-medium text-slate-500">Remaining Hours</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {progressData.periodStart && progressData.periodEnd && (
                    <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-5 py-4 dark:border-slate-800 dark:bg-slate-800/30">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/10">
                        <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Report Period</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {formatDateValue(progressData.periodStart)} to {formatDateValue(progressData.periodEnd)}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <EmptyState message="No progress data available for your team" />
              )}
            </div>
          )}
        </div>
      </div>

      {selectedPipId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">PIP Details #{selectedPipId}</h2>
              <button onClick={() => setSelectedPipId(null)} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[75vh] overflow-y-auto p-6">
              {isLoadingIndividual ? (
                <LoadingSpinner />
              ) : individualPipData ? (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30">
                      <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-slate-500">
                        <User className="h-3.5 w-3.5" />
                        Employee
                      </div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{individualPipData.employeeName}</p>
                      <p className="text-xs text-slate-500">Staff ID: {individualPipData.employeeStaffNo || '-'}</p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30">
                      <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-slate-500">
                        <User className="h-3.5 w-3.5" />
                        Manager
                      </div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{individualPipData.managerName}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30">
                      <p className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-500">Department</p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{individualPipData.employeeDepartment}</p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30">
                      <p className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-500">Position</p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{individualPipData.employeePosition}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30">
                      <p className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-500">Start Date</p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{formatDateValue(individualPipData.startDate)}</p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30">
                      <p className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-500">End Date</p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{formatDateValue(individualPipData.endDate)}</p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30">
                      <p className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-500">Status</p>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${getStatusColorClass(individualPipData.status, individualPipData.finalOutcome)}`}>
                        {getStatusDisplayLabel(individualPipData.status, individualPipData.finalOutcome)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30">
                      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">Overall Progress</p>
                      <div className="flex items-center gap-3">
                        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${getProgressColor(individualPipData.overallProgress)}`}
                            style={{ width: `${individualPipData.overallProgress}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-slate-600 dark:text-slate-400">{individualPipData.overallProgress}%</span>
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30">
                      <p className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-500">Hours</p>
                      <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{individualPipData.completedHours} / {individualPipData.totalHours}</p>
                    </div>
                  </div>

                  {individualPipData.objectives && individualPipData.objectives.length > 0 && (
                    <div>
                      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                        <Target className="h-4 w-4" />
                        Objectives ({individualPipData.objectives.length})
                      </h3>
                      <div className="space-y-2">
                        {individualPipData.objectives.map((obj: any, idx: number) => (
                          <div key={idx} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30">
                            <div className="mb-2 flex items-start justify-between">
                              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{obj.description}</span>
                              <span className="ml-2 whitespace-nowrap text-xs font-bold text-slate-500">{obj.progressPercentage}%</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${getProgressColor(obj.progressPercentage)}`}
                                style={{ width: `${obj.progressPercentage}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {individualPipData.reasonForPlan && (
                    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30">
                      <p className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-500">Reason for Plan</p>
                      <p className="text-sm text-slate-900 dark:text-slate-100">{individualPipData.reasonForPlan}</p>
                    </div>
                  )}

                  {individualPipData.expectedImprovements && (
                    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30">
                      <p className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-500">Expected Improvements</p>
                      <p className="text-sm text-slate-900 dark:text-slate-100">{individualPipData.expectedImprovements}</p>
                    </div>
                  )}

                  <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                    <button
                      onClick={() => handleDownloadReport(selectedPipId, 'pdf')}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:from-blue-700 hover:to-blue-800"
                    >
                      <Download className="h-4 w-4" />
                      Download PDF
                    </button>
                    <button
                      onClick={() => handleDownloadReport(selectedPipId, 'excel')}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:from-emerald-700 hover:to-emerald-800"
                    >
                      <FileText className="h-4 w-4" />
                      Download Excel
                    </button>
                  </div>
                </div>
              ) : (
                <EmptyState message="No data available for this PIP" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
