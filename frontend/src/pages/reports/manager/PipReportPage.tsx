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
import { Download, FileText, BarChart3, Filter, X, Calendar, User, Target, Clock, TrendingUp } from 'lucide-react'
import { skipToken } from '@reduxjs/toolkit/query'
import {
  MANAGER_REPORT_PRIMARY,
  managerReportBtnPrimary,
  managerReportIconHover,
  managerReportLink,
  managerReportProgressBar,
  managerReportStatPrimary,
  managerReportStatPrimaryValue,
  managerReportTabActive,
} from '../managerReportsTheme'

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'AUTO_CLOSED', label: 'Auto Closed' },
  { value: 'REOPEN_REQUESTED', label: 'Reopen Requested' },
]

const COLORS = {
  ACTIVE: MANAGER_REPORT_PRIMARY,
  COMPLETED: '#10b981',
  CLOSED: '#6366f1',
  AUTO_CLOSED: '#f59e0b',
  REOPEN_REQUESTED: '#f97316',
  DENIED: '#ef4444',
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-[#eff6ff] text-[#1d4ed8] dark:bg-[#1e3a8a]/30 dark:text-[#93c5fd]',
  AUTO_CLOSED: 'bg-amber-100 text-amber-700',
  REOPEN_REQUESTED: 'bg-orange-100 text-orange-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  CLOSED: 'bg-slate-100 text-slate-700',
  DENIED: 'bg-red-100 text-red-700',
}

const getStatusDisplayLabel = (status: string, finalOutcome?: string) => {
  if (status === 'CLOSED' && finalOutcome === 'SUCCESSFUL') return 'Close - Successful'
  if (status === 'CLOSED' && finalOutcome === 'FAILED') return 'Close - Fail'
  if (status === 'AUTO_CLOSED') return 'auto-close'
  return status.replace(/_/g, ' ')
}

const getStatusColorClass = (status: string, finalOutcome?: string) => {
  if (status === 'CLOSED' && finalOutcome === 'SUCCESSFUL') return 'bg-green-100 text-green-700'
  if (status === 'CLOSED' && finalOutcome === 'FAILED') return 'bg-red-100 text-red-700'
  return STATUS_COLORS[status] || 'bg-slate-100 text-slate-700'
}

const getProgressColorClass = (progress: number) => (
  progress >= 30 ? managerReportProgressBar : 'bg-orange-500'
)

const formatDateValue = (value?: string) => {
  if (!value) return '-'
  const date = new Date(value.includes('T') ? value : `${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

const isInvalidDateRange = (startDate: string, endDate: string) => Boolean(startDate && endDate && startDate > endDate)

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

  const { data: summaryData = [], isLoading: isLoadingSummary } = useGetPipSummaryReportQuery(invalidDateRange ? skipToken : {
    ...reportFilters,
  })

  const { data: progressData, isLoading: isLoadingProgress } = useGetPipProgressReportQuery(invalidDateRange ? skipToken : {
    ...reportFilters,
  })

  const [selectedPipId, setSelectedPipId] = useState<number | null>(null)
  const queryEnabled = selectedPipId != null && selectedPipId > 0
  const { data: individualPipData, isLoading: isLoadingIndividual } = useGetPipIndividualReportQuery(
    queryEnabled ? selectedPipId : 0,
    { skip: !queryEnabled }
  )
  const { data: positionsResponse } = useGetDepartmentPositionsQuery(departmentId !== undefined ? departmentId : skipToken)
  const { data: pips = [] } = useGetPipsQuery(invalidDateRange ? skipToken : {
    departmentId,
    positionId,
    employeeName: employeeName.trim() || undefined,
    status: statusFilter || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  })

  const positionOptions = useMemo(() => {
    const departmentPositions = (positionsResponse?.data ?? [])
      .filter((position) => typeof position.positionId === 'number')
      .map((position) => ({
        id: position.positionId,
        name: position.positionName || 'Unnamed Position',
      }))

    if (departmentPositions.length > 0) {
      return departmentPositions.sort((a, b) => a.name.localeCompare(b.name))
    }

    return pips
      .map((pip) => ({
        id: pip.employee.employee?.positionId ?? undefined,
        name: pip.employee.employee?.positionName || pip.employee.employee?.position?.positionName || 'Unnamed Position',
      }))
      .filter((position): position is { id: number; name: string } => typeof position.id === 'number')
      .filter((position, index, all) => all.findIndex((item) => item.id === position.id) === index)
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [pips, positionsResponse])

  const employeeOptions = useMemo(() => {
    return pips
      .map((pip) => ({
        id: pip.employee.employee?.id,
        name: pip.employee.employee?.employeeName || pip.employee.email || 'N/A',
        staffNo: pip.employee.employeeId || 'N/A',
      }))
      .filter((employee): employee is { id: number; name: string; staffNo: string } => (
        typeof employee.id === 'number' && Number.isFinite(employee.id)
      ))
      .filter((employee, index, all) => all.findIndex((item) => item.id === employee.id) === index)
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [pips])

  const pipOptions = useMemo(() => {
    return pips
      .map((pip) => ({
        id: pip.id,
        employeeName: pip.employee.employee?.employeeName || pip.employee.email || 'N/A',
      }))
      .sort((a, b) => b.id - a.id)
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
        {
          ...reportFilters,
        },
        format,
        `pip-summary-report-manager-${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'pdf'}`
      )
    } catch (error: any) {
      console.error('Failed to download summary report:', error)
      alert(error?.response?.data?.message || 'Failed to download summary report')
    } finally {
      setReportDownload(null)
    }
  }

  const handleDownloadProgressReport = async (format: PipReportFormat) => {
    if (invalidDateRange) return
    try {
      setReportDownload(`progress-${format}`)
      await downloadPipProgressReportExport(
        reportFilters,
        format,
        `pip-progress-report-manager-${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'pdf'}`
      )
    } catch (error: any) {
      console.error('Failed to download progress report:', error)
      alert(error?.response?.data?.message || 'Failed to download progress report')
    } finally {
      setReportDownload(null)
    }
  }

  const summaryStats = useMemo(() => {
    const total = summaryData.length
    const totalEmployees = new Set(summaryData.map((s) => s.employeeStaffNo || s.employeeName).filter(Boolean)).size
    const active = summaryData.filter((s) => s.status === 'ACTIVE').length
    const completed = summaryData.filter((s) => s.status === 'COMPLETED').length
    const closed = summaryData.filter((s) => s.status === 'CLOSED' || s.status === 'AUTO_CLOSED').length
    return { total, totalEmployees, active, completed, closed }
  }, [summaryData])

  const statusChartData = useMemo(() => {
    const counts: Record<string, number> = {}
    summaryData.forEach((item) => {
      counts[item.status] = (counts[item.status] || 0) + 1
    })
    return Object.entries(counts).map(([status, count]) => ({
      name: status.replace('_', ' '),
      value: count,
      color: COLORS[status as keyof typeof COLORS] || '#6b7280',
    }))
  }, [summaryData])

  const departmentChartData = useMemo(() => {
    const counts: Record<string, number> = {}
    summaryData.forEach((item) => {
      const dept = item.departmentName || 'Unknown'
      counts[dept] = (counts[dept] || 0) + 1
    })
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [summaryData])

  const pieChartData = useMemo(() => {
    if (!progressData) return []
    return [
      { name: 'Active', value: progressData.activePips, color: COLORS.ACTIVE },
      { name: 'Completed', value: progressData.completedPips, color: COLORS.COMPLETED },
      { name: 'Closed', value: progressData.closedPips, color: COLORS.CLOSED },
      { name: 'Auto Closed', value: progressData.autoClosedPips, color: COLORS.AUTO_CLOSED },
      { name: 'Reopen', value: progressData.reopenRequestedPips, color: COLORS.REOPEN_REQUESTED },
    ].filter(item => item.value > 0)
  }, [progressData])

  const clearFilters = () => {
    setStatusFilter('')
    setPositionId(undefined)
    setEmployeeName('')
    setEmployeeId(undefined)
    setPipId(undefined)
    setStartDate('')
    setEndDate('')
  }

  const departmentName = useMemo(() => {
    if (!departmentId || !departmentsResponse?.data) return 'Team'
    const dept = departmentsResponse.data.find((d: any) => (d.departmentId ?? d.id) === departmentId)
    return dept?.departmentName ?? dept?.name ?? 'Team'
  }, [departmentId, departmentsResponse])

  const hoursProgress = useMemo(() => {
    if (!progressData || progressData.totalPlannedHours === 0) return 0
    return (progressData.totalCompletedHours / progressData.totalPlannedHours) * 100
  }, [progressData])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Team PIP Reports</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">View and export PIP performance reports for {departmentName}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={18} className="text-slate-500" />
          <span className="font-semibold text-slate-700 dark:text-slate-300">Filters</span>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Position</label>
            <select
              value={positionId ?? ''}
              onChange={(e) => {
                setPositionId(e.target.value ? Number(e.target.value) : undefined)
                setEmployeeId(undefined)
                setPipId(undefined)
              }}
              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="">All Positions</option>
              {positionOptions.map((position) => (
                <option key={position.id} value={position.id}>{position.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Employee Name</label>
            <input
              type="text"
              value={employeeName}
              onChange={(e) => {
                setEmployeeName(e.target.value)
                setEmployeeId(undefined)
                setPipId(undefined)
              }}
              placeholder="Search..."
              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Employee</label>
            <select
              value={employeeId ?? ''}
              onChange={(e) => {
                setEmployeeId(e.target.value ? Number(e.target.value) : undefined)
                setPipId(undefined)
              }}
              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="">All Employees</option>
              {employeeOptions.map((employee) => (
                <option key={employee.id} value={employee.id}>{employee.name} - {employee.staffNo}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Start Date From</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">End Date To</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">PIP</label>
            <select
              value={pipId ?? ''}
              onChange={(e) => setPipId(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="">All PIPs</option>
              {pipOptions.map((pip) => (
                <option key={pip.id} value={pip.id}>PIP #{pip.id} - {pip.employeeName}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            >
              Clear Filters
            </button>
          </div>
        </div>
        {invalidDateRange && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            Start date must be on or before end date.
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="border-b border-slate-200 dark:border-slate-700">
          <div className="flex gap-1 p-1">
            <button
              onClick={() => setActiveTab('summary')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'summary'
                  ? managerReportTabActive
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <FileText size={18} />
              Summary Report
            </button>
            <button
              onClick={() => setActiveTab('progress')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'progress'
                  ? managerReportTabActive
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <BarChart3 size={18} />
              Progress Report
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'summary' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Summary Report</h2>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleDownloadSummaryReport('pdf')}
                    disabled={reportDownload !== null || invalidDateRange}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${managerReportBtnPrimary}`}
                  >
                    <Download size={16} />
                    {reportDownload === 'summary-pdf' ? 'Downloading...' : 'PDF'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadSummaryReport('excel')}
                    disabled={reportDownload !== null || invalidDateRange}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${managerReportBtnPrimary}`}
                  >
                    <FileText size={16} />
                    {reportDownload === 'summary-excel' ? 'Downloading...' : 'Excel'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{summaryStats.total}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">Total PIPs</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{summaryStats.totalEmployees}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">Total Employees</div>
                </div>
                <div className={managerReportStatPrimary}>
                  <div className={managerReportStatPrimaryValue}>{summaryStats.active}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">Active</div>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4">
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{summaryStats.completed}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">Completed</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                  <div className="text-2xl font-bold text-slate-600 dark:text-slate-400">{summaryStats.closed}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">Closed</div>
                </div>
              </div>

              {statusChartData.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                      <BarChart3 size={18} />
                      PIPs by Status
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={statusChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                        />
                        <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]}>
                          {statusChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {departmentChartData.length > 0 && (
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                        <TrendingUp size={18} />
                        Top Departments
                      </h3>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={departmentChartData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis type="number" tick={{ fontSize: 12 }} />
                          <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={100} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                          />
                          <Bar dataKey="count" fill={MANAGER_REPORT_PRIMARY} radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              )}

              {isLoadingSummary ? (
                <div className="text-center py-8 text-slate-500">Loading...</div>
              ) : summaryData.length === 0 ? (
                <div className="text-center py-8 text-slate-500">No PIP data found for your team</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">PIP ID</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">Employee</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">Status</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">Start Date</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">End Date</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">Overall Progress</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">Hours</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summaryData.map((item) => (
                        <tr key={item.pipId} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="py-3 px-4 text-slate-900 dark:text-slate-100">#{item.pipId}</td>
                          <td className="py-3 px-4 text-slate-900 dark:text-slate-100">
                            <button
                              onClick={() => setSelectedPipId(Number(item.pipId))}
                              className={managerReportLink}
                            >
                              {item.employeeName}
                            </button>
                            <div className="text-xs text-slate-500">Staff ID: {item.employeeStaffNo || '-'}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${getStatusColorClass(item.status, item.finalOutcome)}`}>
                              {getStatusDisplayLabel(item.status, item.finalOutcome)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{formatDateValue(item.startDate)}</td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{formatDateValue(item.endDate)}</td>
                          <td className="py-3 px-4">
                            <div className="flex flex-col gap-1.5">
                              <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100 shadow-inner dark:bg-slate-700">
                                <div
                                  className={`h-full transition-all duration-500 ${getProgressColorClass(item.overallProgress)}`}
                                  style={{ width: `${item.overallProgress}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-extrabold uppercase tracking-tight text-slate-400">
                                {item.overallProgress}% COMPLETED
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{item.completedHours}/{item.totalHours}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDownloadReport(item.pipId, 'pdf')}
                                className={managerReportIconHover}
                                title="Download PDF"
                              >
                                <Download size={16} />
                              </button>
                              <button
                                onClick={() => handleDownloadReport(item.pipId, 'excel')}
                                className={managerReportIconHover}
                                title="Download Excel"
                              >
                                <FileText size={16} />
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
          )}

          {activeTab === 'progress' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Progress Report</h2>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleDownloadProgressReport('pdf')}
                    disabled={reportDownload !== null || invalidDateRange}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${managerReportBtnPrimary}`}
                  >
                    <Download size={16} />
                    {reportDownload === 'progress-pdf' ? 'Downloading...' : 'PDF'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadProgressReport('excel')}
                    disabled={reportDownload !== null || invalidDateRange}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${managerReportBtnPrimary}`}
                  >
                    <FileText size={16} />
                    {reportDownload === 'progress-excel' ? 'Downloading...' : 'Excel'}
                  </button>
                </div>
              </div>

              {isLoadingProgress ? (
                <div className="text-center py-8 text-slate-500">Loading...</div>
              ) : progressData ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                      <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{progressData.totalPips}</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">Total PIPs</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                      <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{progressData.totalEmployees}</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">Total Employees</div>
                    </div>
                    <div className={managerReportStatPrimary}>
                      <div className={managerReportStatPrimaryValue}>{progressData.activePips}</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">Active</div>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4">
                      <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{progressData.completedPips}</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">Completed</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                      <div className="text-2xl font-bold text-slate-600 dark:text-slate-400">{progressData.closedPips + progressData.autoClosedPips}</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">Closed</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                      <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{progressData.averageProgress?.toFixed(1)}%</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">Avg Progress</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                      <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{progressData.hoursCompletionPercentage?.toFixed(1)}%</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">Hours Completion</div>
                    </div>
                    <div className={managerReportStatPrimary}>
                      <div className={managerReportStatPrimaryValue}>{progressData.reopenRequestedPips}</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">Reopen Requested</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                      <div className="text-2xl font-bold text-slate-600 dark:text-slate-400">{progressData.autoClosedPips}</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">Auto Closed</div>
                    </div>
                  </div>

                  {pieChartData.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                          <BarChart3 size={18} />
                          Status Distribution
                        </h3>
                        <ResponsiveContainer width="100%" height={250}>
                          <PieChart>
                            <Pie
                              data={pieChartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={100}
                              paddingAngle={2}
                              dataKey="value"
                              label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                            >
                              {pieChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                            />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                          <Clock size={18} />
                          Hours Completion
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-slate-600 dark:text-slate-400">Completed</span>
                              <span className="font-medium text-slate-900 dark:text-slate-100">
                                {progressData.totalCompletedHours} / {progressData.totalPlannedHours} hours
                              </span>
                            </div>
                            <div className="w-full h-4 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-500 ${managerReportProgressBar}`}
                                style={{ width: `${hoursProgress}%` }}
                              />
                            </div>
                            <div className="text-right text-xs text-slate-500 mt-1">{hoursProgress.toFixed(1)}%</div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 mt-4">
                            <div className="bg-white dark:bg-slate-700 rounded-lg p-3">
                              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{progressData.totalCompletedHours}</div>
                              <div className="text-xs text-slate-500">Completed Hours</div>
                            </div>
                            <div className="bg-white dark:bg-slate-700 rounded-lg p-3">
                              <div className="text-lg font-bold text-slate-600 dark:text-slate-400">{progressData.totalPlannedHours - progressData.totalCompletedHours}</div>
                              <div className="text-xs text-slate-500">Remaining Hours</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {progressData.periodStart && progressData.periodEnd && (
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                      <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                        <Calendar size={18} />
                        Report Period
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {formatDateValue(progressData.periodStart)} to {formatDateValue(progressData.periodEnd)}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-slate-500">No progress data available for your team</div>
              )}
            </div>
          )}
        </div>
      </div>

      {selectedPipId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">PIP Details #{selectedPipId}</h2>
              <button
                onClick={() => setSelectedPipId(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              {isLoadingIndividual ? (
                <div className="text-center py-8 text-slate-500">Loading...</div>
              ) : individualPipData ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                        <User size={16} />
                        Employee
                      </div>
                      <div className="font-medium text-slate-900 dark:text-slate-100">{individualPipData.employeeName}</div>
                      <div className="text-xs text-slate-500">Staff ID: {individualPipData.employeeStaffNo || '-'}</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                        <User size={16} />
                        Manager
                      </div>
                      <div className="font-medium text-slate-900 dark:text-slate-100">{individualPipData.managerName}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                      <div className="text-xs text-slate-500 mb-1">Department</div>
                      <div className="text-sm text-slate-900 dark:text-slate-100">{individualPipData.employeeDepartment}</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                      <div className="text-xs text-slate-500 mb-1">Position</div>
                      <div className="text-sm text-slate-900 dark:text-slate-100">{individualPipData.employeePosition}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                      <div className="text-xs text-slate-500 mb-1">Start Date</div>
                      <div className="text-sm text-slate-900 dark:text-slate-100">{formatDateValue(individualPipData.startDate)}</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                      <div className="text-xs text-slate-500 mb-1">End Date</div>
                      <div className="text-sm text-slate-900 dark:text-slate-100">{formatDateValue(individualPipData.endDate)}</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                      <div className="text-xs text-slate-500 mb-1">Status</div>
                      <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${getStatusColorClass(individualPipData.status, individualPipData.finalOutcome)}`}>
                        {getStatusDisplayLabel(individualPipData.status, individualPipData.finalOutcome)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                      <div className="text-xs text-slate-500 mb-1">Overall Progress</div>
                      <div className="flex flex-col gap-1.5">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100 shadow-inner dark:bg-slate-700">
                          <div
                            className={`h-full transition-all duration-500 ${getProgressColorClass(individualPipData.overallProgress)}`}
                            style={{ width: `${individualPipData.overallProgress}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-extrabold uppercase tracking-tight text-slate-400">{individualPipData.overallProgress}% COMPLETED</span>
                      </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                      <div className="text-xs text-slate-500 mb-1">Hours</div>
                      <div className="text-sm text-slate-900 dark:text-slate-100">
                        {individualPipData.completedHours} / {individualPipData.totalHours}
                      </div>
                    </div>
                  </div>

                  {individualPipData.objectives && individualPipData.objectives.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                        <Target size={16} />
                        Objectives ({individualPipData.objectives.length})
                      </h3>
                      <div className="space-y-2">
                        {individualPipData.objectives.map((obj, idx) => (
                          <div key={idx} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-sm text-slate-900 dark:text-slate-100">{obj.description}</span>
                              <span className="text-xs text-slate-500">{obj.progressPercentage}%</span>
                            </div>
                            <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className={managerReportProgressBar}
                                style={{ width: `${obj.progressPercentage}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {individualPipData.reasonForPlan && (
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                      <div className="text-xs text-slate-500 mb-1">Reason for Plan</div>
                      <div className="text-sm text-slate-900 dark:text-slate-100">{individualPipData.reasonForPlan}</div>
                    </div>
                  )}

                  {individualPipData.expectedImprovements && (
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                      <div className="text-xs text-slate-500 mb-1">Expected Improvements</div>
                      <div className="text-sm text-slate-900 dark:text-slate-100">{individualPipData.expectedImprovements}</div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
                    <button
                      onClick={() => handleDownloadReport(selectedPipId, 'pdf')}
                      className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2 font-medium ${managerReportBtnPrimary}`}
                    >
                      <Download size={18} />
                      Download PDF
                    </button>
                    <button
                      onClick={() => handleDownloadReport(selectedPipId, 'excel')}
                      className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2 font-medium ${managerReportBtnPrimary}`}
                    >
                      <FileText size={18} />
                      Download Excel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">No data available</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
