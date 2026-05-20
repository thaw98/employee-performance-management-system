import { useEffect, useState, useMemo } from 'react'
import { skipToken } from '@reduxjs/toolkit/query'
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
import { useGetPipSummaryReportQuery, useGetPipProgressReportQuery, useGetPipIndividualReportQuery } from '../../features/pip/pipApi'
import { downloadIndividualPipReport, downloadPipSummaryReportExport, downloadPipProgressReportExport } from '../../features/pip/pipReportApi'
import { useGetDepartmentsQuery, useGetDepartmentPositionsQuery } from '../../features/hrCreateEmployee/hrEmployeeAccountApi'
import { useGetEmployeesQuery } from '../../features/hrEmployeeList/hrEmployeeApi'
import { Download, FileText, BarChart3, Filter, X, Calendar, User, Target, Clock, TrendingUp, ChevronLeft, ChevronRight, Search } from 'lucide-react'

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'AUTO_CLOSED', label: 'Auto Closed' },
  { value: 'REOPEN_REQUESTED', label: 'Reopen Requested' },
]

const COLORS = {
  ACTIVE: '#f59e0b',
  COMPLETED: '#10b981',
  CLOSED: '#6b7280',
  AUTO_CLOSED: '#9ca3af',
  REOPEN_REQUESTED: '#3b82f6',
}

const formatDateValue = (value?: string) => {
  if (!value) return '-'
  const date = new Date(value.includes('T') ? value : `${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

const formatKpiScore = (score?: number | null) => score == null ? '-' : `${score}%`

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'summary' | 'progress'>('summary')
  const [statusFilter, setStatusFilter] = useState('')
  const [departmentId, setDepartmentId] = useState<number | undefined>(undefined)
  const [positionId, setPositionId] = useState<number | undefined>(undefined)
  const [employeeNameFilter, setEmployeeNameFilter] = useState('')
  const [employeeId, setEmployeeId] = useState<number | undefined>(undefined)
  const [pipId, setPipId] = useState<number | undefined>(undefined)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reportDownload, setReportDownload] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)

  const reportFilters = useMemo(() => ({
    status: statusFilter || undefined,
    departmentId,
    positionId,
    employeeName: employeeNameFilter.trim() || undefined,
    employeeId,
    pipId,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  }), [statusFilter, departmentId, positionId, employeeNameFilter, employeeId, pipId, startDate, endDate])
  const pipOptionFilters = useMemo(() => ({
    status: statusFilter || undefined,
    departmentId,
    positionId,
    employeeName: employeeNameFilter.trim() || undefined,
    employeeId,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  }), [statusFilter, departmentId, positionId, employeeNameFilter, employeeId, startDate, endDate])

  const { data: summaryData = [], isLoading: isLoadingSummary } = useGetPipSummaryReportQuery(reportFilters)
  const { data: pipOptionData = [] } = useGetPipSummaryReportQuery(pipOptionFilters)

  const { data: progressData, isLoading: isLoadingProgress } = useGetPipProgressReportQuery(reportFilters)

  const [selectedPipId, setSelectedPipId] = useState<number | null>(null)
  const queryEnabled = selectedPipId != null && selectedPipId > 0
  const { data: individualPipData, isLoading: isLoadingIndividual } = useGetPipIndividualReportQuery(
    queryEnabled ? selectedPipId : 0,
    { skip: !queryEnabled }
  )

  const { data: departmentsResponse } = useGetDepartmentsQuery()
  const { data: positionsResponse } = useGetDepartmentPositionsQuery(
    typeof departmentId === 'number' ? departmentId : skipToken
  )
  const { data: employeesResponse } = useGetEmployeesQuery({
    page: 0,
    size: 500,
    search: employeeNameFilter,
    departmentId,
    positionId,
    sortBy: 'employeeName',
    sortDir: 'asc',
  })

  const departmentOptions = useMemo(() => {
    const depts = new Map<number, string>()
    departmentsResponse?.data?.forEach((dept) => {
      depts.set(dept.departmentId ?? dept.id, dept.departmentName ?? dept.name)
    })
    return Array.from(depts.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [departmentsResponse])

  const positionOptions = useMemo(() => positionsResponse?.data ?? [], [positionsResponse?.data])
  const employeeOptions = useMemo(() => employeesResponse?.data?.content ?? [], [employeesResponse?.data?.content])
  const pipOptions = useMemo(() => {
    const pips = new Map<number, string>()
    pipOptionData.forEach((item) => {
      pips.set(Number(item.pipId), `PIP #${item.pipId} - ${item.employeeName}`)
    })
    return Array.from(pips.entries())
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.id - b.id)
  }, [pipOptionData])

  const totalPages = Math.max(1, Math.ceil(summaryData.length / size))
  const paginatedSummaryData = useMemo(
    () => summaryData.slice(page * size, page * size + size),
    [summaryData, page, size]
  )
  const paginationItems: (number | 'ellipsis')[] = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index)
    }

    const pages: (number | 'ellipsis')[] = [0]
    const left = Math.max(1, page - 2)
    const right = Math.min(totalPages - 2, page + 2)

    if (left > 1) pages.push('ellipsis')
    for (let index = left; index <= right; index += 1) pages.push(index)
    if (right < totalPages - 2) pages.push('ellipsis')
    pages.push(totalPages - 1)

    return pages
  }, [page, totalPages])

  useEffect(() => {
    setPositionId(undefined)
  }, [departmentId])

  useEffect(() => {
    setEmployeeId(undefined)
  }, [departmentId, positionId])

  useEffect(() => {
    setPage(0)
  }, [reportFilters])

  useEffect(() => {
    if (page > totalPages - 1) {
      setPage(totalPages - 1)
    }
  }, [page, totalPages])

  const handleDownloadReport = (pipId: number, format: 'pdf' | 'excel') => {
    downloadIndividualPipReport(pipId, format).catch((error: any) => {
      console.error('Failed to download report:', error)
      alert(error?.response?.data?.message || 'Failed to download report')
    })
  }

  const handleDownloadSummaryReport = async (format: 'pdf' | 'excel') => {
    try {
      setReportDownload(`summary-${format}`)
      await downloadPipSummaryReportExport(
        reportFilters,
        format,
        `pip-summary-report-${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'pdf'}`
      )
    } catch (error: any) {
      console.error('Failed to download summary report:', error)
      alert(error?.response?.data?.message || 'Failed to download summary report')
    } finally {
      setReportDownload(null)
    }
  }

  const handleDownloadProgressReport = async (format: 'pdf' | 'excel') => {
    try {
      setReportDownload(`progress-${format}`)
      await downloadPipProgressReportExport(
        reportFilters,
        format,
        `pip-progress-report-${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'pdf'}`
      )
    } catch (error: any) {
      console.error('Failed to download progress report:', error)
      alert(error?.response?.data?.message || 'Failed to download progress report')
    } finally {
      setReportDownload(null)
    }
  }

  const stats = useMemo(() => {
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
      { name: 'Active', value: progressData.activePips, color: '#f59e0b' },
      { name: 'Completed', value: progressData.completedPips, color: '#10b981' },
      { name: 'Closed', value: progressData.closedPips, color: '#6b7280' },
      { name: 'Auto Closed', value: progressData.autoClosedPips, color: '#9ca3af' },
      { name: 'Reopen', value: progressData.reopenRequestedPips, color: '#3b82f6' },
    ].filter(item => item.value > 0)
  }, [progressData])

  const hoursProgress = useMemo(() => {
    if (!progressData || progressData.totalPlannedHours === 0) return 0
    return (progressData.totalCompletedHours / progressData.totalPlannedHours) * 100
  }, [progressData])

  const clearFilters = () => {
    setStatusFilter('')
    setDepartmentId(undefined)
    setPositionId(undefined)
    setEmployeeNameFilter('')
    setEmployeeId(undefined)
    setPipId(undefined)
    setStartDate('')
    setEndDate('')
    setPage(0)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">PIP Reports</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">View and export PIP performance reports</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-7 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={18} className="text-slate-500" />
          <span className="font-semibold text-slate-700 dark:text-slate-300">Filters</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Department</label>
            <select
              value={departmentId ?? ''}
              onChange={(e) => setDepartmentId(e.target.value ? Number(e.target.value) : undefined)}
              className="h-12 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 text-sm text-slate-900 dark:text-slate-100 shadow-sm"
            >
              <option value="">All Departments</option>
              {departmentOptions.map((dept) => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Position</label>
            <select
              value={positionId ?? ''}
              onChange={(e) => setPositionId(e.target.value ? Number(e.target.value) : undefined)}
              disabled={!departmentId}
              className="h-12 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 text-sm text-slate-900 dark:text-slate-100 shadow-sm disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            >
              <option value="">All Positions</option>
              {positionOptions.map((position) => (
                <option key={position.id} value={position.positionId}>{position.positionName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-12 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 text-sm text-slate-900 dark:text-slate-100 shadow-sm"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Employee Name</label>
            <div className="relative">
              <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={employeeNameFilter}
                onChange={(e) => setEmployeeNameFilter(e.target.value)}
                placeholder="Search..."
                className="h-12 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 pl-10 pr-3 text-sm text-slate-900 dark:text-slate-100 shadow-sm placeholder:text-slate-400"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Employee</label>
            <select
              value={employeeId ?? ''}
              onChange={(e) => setEmployeeId(e.target.value ? Number(e.target.value) : undefined)}
              className="h-12 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 text-sm text-slate-900 dark:text-slate-100 shadow-sm"
            >
              <option value="">All Employees</option>
              {employeeOptions.map((employee) => (
                <option key={employee.employeeId} value={employee.employeeId}>{employee.employeeName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Start Date From</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-12 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 text-sm text-slate-900 dark:text-slate-100 shadow-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">End Date To</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-12 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 text-sm text-slate-900 dark:text-slate-100 shadow-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">PIP</label>
            <select
              value={pipId ?? ''}
              onChange={(e) => setPipId(e.target.value ? Number(e.target.value) : undefined)}
              className="h-12 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 text-sm text-slate-900 dark:text-slate-100 shadow-sm"
            >
              <option value="">All PIPs</option>
              {pipOptions.map((pip) => (
                <option key={pip.id} value={pip.id}>{pip.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
          >
            Clear Filters
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="border-b border-slate-200 dark:border-slate-700">
          <div className="flex gap-1 p-1">
            <button
              onClick={() => setActiveTab('summary')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'summary'
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
            >
              <FileText size={18} />
              Summary Report
            </button>
            <button
              onClick={() => setActiveTab('progress')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'progress'
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
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
                    disabled={reportDownload !== null}
                    className="flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    <Download size={16} />
                    {reportDownload === 'summary-pdf' ? 'Downloading...' : 'PDF'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadSummaryReport('excel')}
                    disabled={reportDownload !== null}
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    <FileText size={16} />
                    {reportDownload === 'summary-excel' ? 'Downloading...' : 'Excel'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.totalEmployees}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">Total Employees</div>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
                  <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.active}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">Active</div>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4">
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.completed}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">Completed</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                  <div className="text-2xl font-bold text-slate-600 dark:text-slate-400">{stats.closed}</div>
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
                        <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]}>
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
                          <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              )}

              {isLoadingSummary ? (
                <div className="text-center py-8 text-slate-500">Loading...</div>
              ) : summaryData.length === 0 ? (
                <div className="text-center py-8 text-slate-500">No PIP data found</div>
              ) : (
                <div className="space-y-5">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700">
                          <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">PIP ID</th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">Employee</th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">Department</th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">Position</th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">Manager</th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">KPI Score</th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">Status</th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">Start Date</th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">End Date</th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">Progress</th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">Hours</th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedSummaryData.map((item) => (
                          <tr key={item.pipId} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="py-3 px-4 text-slate-900 dark:text-slate-100">#{item.pipId}</td>
                            <td className="py-3 px-4 text-slate-900 dark:text-slate-100">
                              <button
                                onClick={() => setSelectedPipId(Number(item.pipId))}
                                className="text-emerald-600 hover:text-emerald-700 font-medium hover:underline"
                              >
                                {item.employeeName}
                              </button>
                              <div className="text-xs text-slate-500">{item.employeeStaffNo}</div>
                            </td>
                            <td className="py-3 px-4 text-slate-900 dark:text-slate-100">{item.departmentName}</td>
                            <td className="py-3 px-4 text-slate-900 dark:text-slate-100">{item.positionName || '-'}</td>
                            <td className="py-3 px-4 text-slate-900 dark:text-slate-100">{item.managerName}</td>
                            <td className="py-3 px-4 text-slate-900 dark:text-slate-100">{formatKpiScore(item.kpiScore)}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.status === 'ACTIVE' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                  item.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                    item.status === 'CLOSED' || item.status === 'AUTO_CLOSED' ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' :
                                      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                }`}>
                                {item.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{formatDateValue(item.startDate)}</td>
                            <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{formatDateValue(item.endDate)}</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-emerald-500 rounded-full"
                                    style={{ width: `${item.overallProgress}%` }}
                                  />
                                </div>
                                <span className="text-xs text-slate-500">{item.overallProgress}%</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{item.completedHours}/{item.totalHours}</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleDownloadReport(Number(item.pipId), 'pdf')}
                                  className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded"
                                  title="Download PDF"
                                >
                                  <Download size={16} />
                                </button>
                                <button
                                  onClick={() => handleDownloadReport(Number(item.pipId), 'excel')}
                                  className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded"
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
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 px-5 py-3.5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-4 order-2 sm:order-1">
                      <p className="text-sm text-slate-500">
                        Showing{' '}
                        <span className="font-semibold text-slate-700 dark:text-slate-200">{page * size + 1}</span>
                        {' - '}
                        <span className="font-semibold text-slate-700 dark:text-slate-200">
                          {Math.min((page + 1) * size, summaryData.length)}
                        </span>{' '}
                        of{' '}
                        <span className="font-semibold text-slate-700 dark:text-slate-200">{summaryData.length}</span>{' '}
                        employees
                      </p>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm text-slate-400">Rows:</span>
                        <select
                          value={size}
                          onChange={(e) => {
                            setSize(Number(e.target.value))
                            setPage(0)
                          }}
                          className="text-sm font-medium text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 bg-white dark:bg-slate-800 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all cursor-pointer"
                        >
                          {[10, 25, 50].map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 order-1 sm:order-2">
                      <button
                        onClick={() => setPage((current) => Math.max(0, current - 1))}
                        disabled={page === 0}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      >
                        <ChevronLeft size={16} />
                        <span>Prev</span>
                      </button>
                      {paginationItems.map((item, index) =>
                        item === 'ellipsis' ? (
                          <span key={`ellipsis-${index}`} className="px-2 text-slate-400 text-sm select-none">
                            ...
                          </span>
                        ) : (
                          <button
                            key={item}
                            onClick={() => setPage(item)}
                            className={`min-w-[40px] h-10 rounded-xl text-sm font-semibold transition-all border ${
                              page === item
                                ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-100'
                                : 'text-slate-600 border-slate-200 bg-white hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700'
                            }`}
                          >
                            {item + 1}
                          </button>
                        )
                      )}
                      <button
                        onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))}
                        disabled={page === totalPages - 1}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      >
                        <span>Next</span>
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
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
                    disabled={reportDownload !== null}
                    className="flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    <Download size={16} />
                    {reportDownload === 'progress-pdf' ? 'Downloading...' : 'PDF'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadProgressReport('excel')}
                    disabled={reportDownload !== null}
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
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
                    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
                      <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{progressData.activePips}</div>
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                      <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{progressData.averageProgress?.toFixed(1)}%</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">Avg Progress</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                      <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{progressData.hoursCompletionPercentage?.toFixed(1)}%</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">Hours Completion</div>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{progressData.reopenRequestedPips}</div>
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
                                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-500"
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
                <div className="text-center py-8 text-slate-500">No progress data available</div>
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
                      <div className="text-xs text-slate-500">{individualPipData.employeeStaffNo}</div>
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
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${individualPipData.status === 'ACTIVE' ? 'bg-amber-100 text-amber-700' :
                          individualPipData.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                            'bg-slate-100 text-slate-600'
                        }`}>
                        {individualPipData.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                      <div className="text-xs text-slate-500 mb-1">Overall Progress</div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${individualPipData.overallProgress}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{individualPipData.overallProgress}%</span>
                      </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                      <div className="text-xs text-slate-500 mb-1">KPI Score</div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {formatKpiScore(individualPipData.kpiScore)}
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
                                className="h-full bg-emerald-500 rounded-full"
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
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium"
                    >
                      <Download size={18} />
                      Download PDF
                    </button>
                    <button
                      onClick={() => handleDownloadReport(selectedPipId, 'excel')}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium"
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
