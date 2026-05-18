import { useEffect, useMemo, useState } from 'react'
import { skipToken } from '@reduxjs/toolkit/query'
import { useNavigate } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AlertTriangle, ArrowLeft, Award, BarChart3, Filter, LineChart as LineChartIcon, Trophy, Users } from 'lucide-react'
import {
  useGetAveragesByDepartmentQuery,
  useGetCriteriaAveragesQuery,
  useGetDepartmentTrendsQuery,
  useGetEmployeeFeedbackDetailQuery,
  useGetEmployeeRankingQuery,
  useGetFeedbackReportDepartmentsQuery,
  useGetTopBottomEmployeesQuery,
  type DepartmentAverageDto,
  type DepartmentTrendDto,
  type EmployeeRankingDto,
  type ReportDepartmentDto,
} from '../../features/feedback/api/feedbackApi'

type FeedbackReportPageProps = {
  mode: 'hr' | 'manager'
}

const CHART_COLORS = ['#2563eb', '#059669', '#d97706', '#7c3aed', '#dc2626', '#0891b2', '#4f46e5', '#65a30d']

function formatScore(value?: number | null) {
  return typeof value === 'number' && Number.isFinite(value) ? value.toFixed(1) : '0.0'
}

function getToday() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function getMonthStart() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
}

function buildTrendRows(trends: DepartmentTrendDto[]) {
  const rows = new Map<string, Record<string, string | number>>()

  trends.forEach((department) => {
    department.points?.forEach((point) => {
      const row = rows.get(point.period) ?? { period: point.period }
      row[department.departmentName] = Number(point.average.toFixed(2))
      rows.set(point.period, row)
    })
  })

  return Array.from(rows.values()).sort((a, b) => String(a.period).localeCompare(String(b.period)))
}

function EmployeeSummaryCard({
  label,
  employee,
  onGoToMeeting,
  variant,
}: {
  label: string
  employee?: EmployeeRankingDto | null
  onGoToMeeting: (employeeId: number, meetingDescription: string) => void
  variant: 'top' | 'bottom'
}) {
  const isTop = variant === 'top'
  const Icon = isTop ? Award : AlertTriangle
  const meetingDescription = isTop ? 'Best Feedback Person Meeting' : 'Worst Feedback Person Meeting'

  return (
    <div
      className={`relative overflow-hidden rounded-xl border p-5 shadow-sm ${
        isTop
          ? 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/50 dark:bg-emerald-950/25'
          : 'border-amber-200 bg-amber-50/75 dark:border-amber-900/50 dark:bg-amber-950/25'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className={`text-xs font-black uppercase tracking-wide ${isTop ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'}`}>
            {label}
          </div>
          <div className="mt-2 min-h-[28px] text-xl font-black text-slate-900 dark:text-slate-100">
            {employee?.employeeName ?? 'No employee data'}
          </div>
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${isTop ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'}`}>
          <Icon size={22} />
        </div>
      </div>

      <div className="mt-4 flex items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-black uppercase tracking-wide text-slate-500">Total Average Score</div>
          <div className={`mt-1 text-3xl font-black ${isTop ? 'text-emerald-800 dark:text-emerald-100' : 'text-amber-800 dark:text-amber-100'}`}>
            {employee ? `${formatScore(employee.averageScore)} / 100` : '-'}
          </div>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${isTop ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200'}`}>
          {isTop ? 'Highlight' : 'Improvement'}
        </span>
      </div>

      <button
        type="button"
        disabled={!employee}
        onClick={() => employee && onGoToMeeting(employee.employeeId, meetingDescription)}
        className={`mt-5 inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-black text-white transition-colors disabled:cursor-not-allowed disabled:bg-slate-300 ${
          isTop ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'
        }`}
      >
        Go to Meeting
      </button>
    </div>
  )
}

function DepartmentDetailReport({
  selectedDepartment,
  departments,
  canChangeDepartment,
  roleMode,
}: {
  selectedDepartment?: ReportDepartmentDto
  departments: ReportDepartmentDto[]
  canChangeDepartment: boolean
  roleMode: 'hr' | 'manager'
}) {
  const navigate = useNavigate()
  const [departmentId, setDepartmentId] = useState<number | undefined>(selectedDepartment?.departmentId)
  const [from, setFrom] = useState(getMonthStart())
  const [to, setTo] = useState(getToday())
  const [criteriaId, setCriteriaId] = useState<number | undefined>()
  const [order, setOrder] = useState<'desc' | 'asc'>('desc')
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | undefined>()
  const [rankingPage, setRankingPage] = useState(0)

  useEffect(() => {
    setDepartmentId(selectedDepartment?.departmentId)
    setCriteriaId(undefined)
    setSelectedEmployeeId(undefined)
    setRankingPage(0)
  }, [selectedDepartment?.departmentId])

  useEffect(() => {
    setRankingPage(0)
    setSelectedEmployeeId(undefined)
  }, [departmentId, from, to, criteriaId, order])

  const selected = departments.find((department) => department.departmentId === departmentId) ?? selectedDepartment
  const dateFilters = { from: from || undefined, to: to || undefined }
  const criteriaQuery = departmentId ? { departmentId, ...dateFilters } : skipToken
  const rankingQuery = departmentId ? { departmentId, ...dateFilters, criteriaId, order } : skipToken
  const employeeDetailQuery = departmentId && selectedEmployeeId
    ? { departmentId, employeeId: selectedEmployeeId, ...dateFilters }
    : skipToken

  const { data: criteriaResponse, isLoading: isCriteriaLoading } = useGetCriteriaAveragesQuery(criteriaQuery)
  const { data: rankingResponse, isLoading: isRankingLoading } = useGetEmployeeRankingQuery(rankingQuery)
  const { data: employeeDetailResponse, isFetching: isEmployeeDetailLoading } = useGetEmployeeFeedbackDetailQuery(employeeDetailQuery)
  const { data: summaryResponse, isLoading: isSummaryLoading } = useGetTopBottomEmployeesQuery(
    departmentId ? { departmentId, ...dateFilters } : skipToken,
  )

  const criteriaAverages = criteriaResponse?.data ?? []
  const ranking = rankingResponse?.data ?? []
  const employeeDetail = employeeDetailResponse?.data
  const summary = summaryResponse?.data
  const topScore = ranking[0]?.averageScore ?? 0
  const rankingPageSize = 5
  const rankingTotalPages = Math.max(1, Math.ceil(ranking.length / rankingPageSize))
  const paginatedRanking = ranking.slice(rankingPage * rankingPageSize, rankingPage * rankingPageSize + rankingPageSize)
  const criteriaIsDense = criteriaAverages.length > 8
  const criteriaIsVeryDense = criteriaAverages.length > 12
  const criteriaGap = criteriaIsVeryDense ? 4 : criteriaIsDense ? 6 : 8

  const goToMeeting = (targetEmployeeId: number, meetingDescription: string) => {
    const basePath = roleMode === 'hr' ? '/hr/meetings' : '/manager/meetings'
    const params = new URLSearchParams({
      section: 'schedule',
      employeeId: String(targetEmployeeId),
      meetingDescription,
    })
    navigate(`${basePath}?${params.toString()}`)
  }

  if (!departmentId) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
        No assigned department is available for feedback reporting.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {isSummaryLoading ? (
          <>
            <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900">Loading top employee...</div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900">Loading bottom employee...</div>
          </>
        ) : (
          <>
            <EmployeeSummaryCard label="Top Feedback Employee" employee={summary?.topEmployee} onGoToMeeting={goToMeeting} variant="top" />
            <EmployeeSummaryCard label="Lowest Feedback Employee" employee={summary?.bottomEmployee} onGoToMeeting={goToMeeting} variant="bottom" />
          </>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-center gap-2">
          <Filter size={18} className="text-slate-500" />
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">Ranking Filters</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          {canChangeDepartment && (
            <label className="space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Department</span>
              <select
                value={departmentId}
                onChange={(event) => {
                  setDepartmentId(Number(event.target.value))
                  setCriteriaId(undefined)
                }}
                className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                {departments.map((department) => (
                  <option key={department.departmentId} value={department.departmentId}>
                    {department.departmentName}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">From</span>
            <input
              type="date"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">To</span>
            <input
              type="date"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Criteria</span>
            <select
              value={criteriaId ?? ''}
              onChange={(event) => setCriteriaId(event.target.value ? Number(event.target.value) : undefined)}
              className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="">Overall score</option>
              {criteriaAverages.map((criteria) => (
                <option key={criteria.criteriaId} value={criteria.criteriaId}>
                  {criteria.criteriaName}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Sort</span>
            <select
              value={order}
              onChange={(event) => setOrder(event.target.value as 'desc' | 'asc')}
              className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="desc">Highest to lowest</option>
              <option value="asc">Lowest to highest</option>
            </select>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 items-stretch gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex h-[520px] flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">{selected?.departmentName ?? 'Department'} Feedback Criteria</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Average score by criteria from submitted feedback.</p>
            </div>
            <div className="rounded-lg bg-blue-50 px-2.5 py-2 text-right dark:bg-blue-950/30">
              <div className="text-[10px] font-bold uppercase text-blue-700 dark:text-blue-300">Top Score</div>
              <div className="text-lg font-black text-blue-900 dark:text-blue-100">{formatScore(topScore)}</div>
            </div>
          </div>

          {isCriteriaLoading ? (
            <div className="py-16 text-center text-sm text-slate-500">Loading criteria averages...</div>
          ) : criteriaAverages.length === 0 ? (
            <div className="py-16 text-center text-sm text-slate-500">No feedback criteria data found for the selected filters.</div>
          ) : (
            <div
              className="grid min-h-0 flex-1 grid-cols-1"
              style={{
                gap: `${criteriaGap}px`,
                gridTemplateRows: `repeat(${criteriaAverages.length}, minmax(0, 1fr))`,
              }}
            >
              {criteriaAverages.map((criteria) => {
                const percentage = Math.min(100, Math.max(0, (criteria.average / 5) * 100))
                return (
                  <div
                    key={criteria.criteriaId}
                    className={`flex min-h-0 flex-col justify-center rounded-lg border border-slate-100 bg-slate-50 px-3 dark:border-slate-800 dark:bg-slate-800/50 ${criteriaIsVeryDense ? 'py-0.5' : criteriaIsDense ? 'py-1' : 'py-1.5'}`}
                  >
                    <div className={`${criteriaIsVeryDense ? 'mb-0.5' : 'mb-1'} flex min-h-0 items-center justify-between gap-2`}>
                      <span className={`${criteriaIsVeryDense ? 'text-[10px]' : criteriaIsDense ? 'text-[11px]' : 'text-xs'} truncate font-bold leading-snug text-slate-700 dark:text-slate-200`}>{criteria.criteriaName}</span>
                      <span className={`${criteriaIsVeryDense ? 'text-[10px]' : 'text-xs'} shrink-0 font-black text-slate-900 dark:text-slate-100`}>{formatScore(criteria.average)}</span>
                    </div>
                    <div className={`${criteriaIsVeryDense ? 'h-1' : 'h-1.5'} shrink-0 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700`}>
                      <div className="h-full rounded-full bg-blue-600" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex h-[520px] flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {selectedEmployeeId ? (
            <div className="space-y-5">
              <button
                type="button"
                onClick={() => setSelectedEmployeeId(undefined)}
                className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              >
                <ArrowLeft size={16} />
                Back
              </button>

              {isEmployeeDetailLoading ? (
                <div className="py-16 text-center text-sm text-slate-500">Loading employee details...</div>
              ) : employeeDetail ? (
                <div className="min-h-0 flex-1 space-y-5 overflow-y-auto pr-1">
                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60">
                    <div className="text-xs font-black uppercase tracking-wide text-slate-500">Employee Detail</div>
                    <h2 className="mt-1 truncate text-lg font-black text-slate-900 dark:text-slate-100">{employeeDetail.employeeName}</h2>
                    <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">{employeeDetail.departmentName}</p>
                  </div>

                  <div className="rounded-lg bg-emerald-50 p-4 dark:bg-emerald-950/30">
                    <div className="text-xs font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Total Average Feedback Score</div>
                    <div className="mt-1 text-3xl font-black text-emerald-900 dark:text-emerald-100">{formatScore(employeeDetail.totalAverageScore)} / 5</div>
                  </div>

                  <div>
                    <h3 className="mb-3 text-sm font-black text-slate-900 dark:text-slate-100">Criteria Averages</h3>
                    {employeeDetail.criteriaAverages.length === 0 ? (
                      <div className="py-8 text-center text-sm text-slate-500">No criteria details found for this employee.</div>
                    ) : (
                      <div className="space-y-3">
                        {employeeDetail.criteriaAverages.map((criteria) => {
                          const percentage = Math.min(100, Math.max(0, (criteria.average / 5) * 100))
                          return (
                            <div key={criteria.criteriaId}>
                              <div className="mb-1 flex items-center justify-between gap-2">
                                <span className="truncate text-xs font-bold text-slate-700 dark:text-slate-200">{criteria.criteriaName}</span>
                                <span className="text-xs font-black text-slate-900 dark:text-slate-100">{formatScore(criteria.average)} / 5</span>
                              </div>
                              <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                <div className="h-full rounded-full bg-blue-600" style={{ width: `${percentage}%` }} />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-16 text-center text-sm text-slate-500">Employee details could not be loaded.</div>
              )}
            </div>
          ) : (
            <>
              <div className="mb-4 flex items-center gap-2">
                <Trophy size={18} className="text-amber-500" />
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Employee Ranking</h2>
              </div>
              {isRankingLoading ? (
                <div className="py-12 text-center text-sm text-slate-500">Loading ranking...</div>
              ) : ranking.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-500">No employee scores found.</div>
              ) : (
                <div className="flex min-h-0 flex-1 flex-col">
                  <div className="min-h-0 flex-1 space-y-3">
                  {paginatedRanking.map((employee, index) => (
                    <button
                      key={employee.employeeId}
                      type="button"
                      onClick={() => setSelectedEmployeeId(employee.employeeId)}
                      className="flex w-full items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3 text-left transition-colors hover:border-blue-200 hover:bg-blue-50/60 dark:border-slate-800 dark:bg-slate-800/60 dark:hover:border-blue-900/50 dark:hover:bg-blue-950/20"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sm font-black text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                        {rankingPage * rankingPageSize + index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">{employee.employeeName}</div>
                        <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(100, Math.max(0, employee.averageScore))}%` }} />
                        </div>
                      </div>
                      <div className="text-sm font-black text-slate-900 dark:text-slate-100">{formatScore(employee.averageScore)}</div>
                    </button>
                  ))}
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-bold text-slate-500 dark:border-slate-800">
                    <span>Page {rankingPage + 1} of {rankingTotalPages}</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={rankingPage === 0}
                        onClick={() => setRankingPage((page) => Math.max(0, page - 1))}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700"
                      >
                        Prev
                      </button>
                      <button
                        type="button"
                        disabled={rankingPage >= rankingTotalPages - 1}
                        onClick={() => setRankingPage((page) => Math.min(rankingTotalPages - 1, page + 1))}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function FeedbackReportPage({ mode }: FeedbackReportPageProps) {
  const navigate = useNavigate()
  const [from, setFrom] = useState(getMonthStart())
  const [to, setTo] = useState(getToday())
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | undefined>()

  const { data: departmentsResponse, isLoading: isDepartmentsLoading } = useGetFeedbackReportDepartmentsQuery()
  const departments = departmentsResponse?.data ?? []
  const reportFilters = { from: from || undefined, to: to || undefined }

  const { data: averagesResponse, isLoading: isAveragesLoading } = useGetAveragesByDepartmentQuery(
    mode === 'hr' ? reportFilters : skipToken,
  )
  const { data: trendsResponse, isLoading: isTrendsLoading } = useGetDepartmentTrendsQuery(
    mode === 'hr' ? reportFilters : skipToken,
  )
  const { data: companySummaryResponse, isLoading: isCompanySummaryLoading } = useGetTopBottomEmployeesQuery(
    mode === 'hr' && !selectedDepartmentId ? reportFilters : skipToken,
  )

  useEffect(() => {
    if (mode === 'manager' && departments.length > 0 && !selectedDepartmentId) {
      setSelectedDepartmentId(departments[0].departmentId)
    }
  }, [departments, mode, selectedDepartmentId])

  const departmentAverages = averagesResponse?.data ?? []
  const departmentTrends = trendsResponse?.data ?? []
  const selectedDepartment = selectedDepartmentId
    ? departments.find((department) => department.departmentId === selectedDepartmentId)
      ?? departmentAverages.find((department) => department.departmentId === selectedDepartmentId)
    : mode === 'manager'
      ? departments[0]
      : undefined
  const trendRows = useMemo(() => buildTrendRows(departmentTrends), [departmentTrends])

  const openDepartmentDetail = (department: Pick<DepartmentAverageDto, 'departmentId' | 'departmentName'>) => {
    setSelectedDepartmentId(department.departmentId)
  }

  const goToMeeting = (targetEmployeeId: number, meetingDescription: string) => {
    const basePath = mode === 'hr' ? '/hr/meetings' : '/manager/meetings'
    const params = new URLSearchParams({
      section: 'schedule',
      employeeId: String(targetEmployeeId),
      meetingDescription,
    })
    navigate(`${basePath}?${params.toString()}`)
  }

  if (isDepartmentsLoading) {
    return <div className="py-16 text-center text-sm text-slate-500">Loading feedback report...</div>
  }

  if (mode === 'manager') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Feedback Report</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manager view limited to your assigned department data.</p>
        </div>
        <DepartmentDetailReport
          selectedDepartment={selectedDepartment}
          departments={departments}
          canChangeDepartment={departments.length > 1}
          roleMode={mode}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Feedback Report</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Company-wide feedback analytics by department.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:w-[360px]">
          <label className="space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">From</span>
            <input
              type="date"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">To</span>
            <input
              type="date"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center gap-2">
            <LineChartIcon size={18} className="text-blue-600" />
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Department Score Trends</h2>
          </div>
          {isTrendsLoading ? (
            <div className="py-24 text-center text-sm text-slate-500">Loading trend chart...</div>
          ) : trendRows.length === 0 ? (
            <div className="py-24 text-center text-sm text-slate-500">No trend data found for the selected date range.</div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={trendRows}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                {departmentTrends.map((department, index) => (
                  <Line
                    key={department.departmentId}
                    type="monotone"
                    dataKey={department.departmentName}
                    stroke={CHART_COLORS[index % CHART_COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 3, cursor: 'pointer' }}
                    activeDot={{
                      r: 6,
                      onClick: () => openDepartmentDetail(department),
                    }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 size={18} className="text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Average Score by Department</h2>
          </div>
          {isAveragesLoading ? (
            <div className="py-24 text-center text-sm text-slate-500">Loading department averages...</div>
          ) : departmentAverages.length === 0 ? (
            <div className="py-24 text-center text-sm text-slate-500">No department average data found.</div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={departmentAverages}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="departmentName" tick={{ fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={70} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar
                  dataKey="averageScore"
                  fill="#059669"
                  radius={[6, 6, 0, 0]}
                  cursor="pointer"
                  onClick={(data) => {
                    const payload = (data as unknown as { payload?: DepartmentAverageDto }).payload
                    if (payload) openDepartmentDetail(payload)
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {selectedDepartment ? (
        <DepartmentDetailReport
          selectedDepartment={selectedDepartment}
          departments={departmentAverages.map((department) => ({
            departmentId: department.departmentId,
            departmentName: department.departmentName,
          }))}
          canChangeDepartment={false}
          roleMode={mode}
        />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {isCompanySummaryLoading ? (
              <>
                <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900">Loading top employee...</div>
                <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900">Loading bottom employee...</div>
              </>
            ) : (
              <>
                <EmployeeSummaryCard label="Top Feedback Employee" employee={companySummaryResponse?.data?.topEmployee} onGoToMeeting={goToMeeting} variant="top" />
                <EmployeeSummaryCard label="Lowest Feedback Employee" employee={companySummaryResponse?.data?.bottomEmployee} onGoToMeeting={goToMeeting} variant="bottom" />
              </>
            )}
          </div>
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
            <Users className="mx-auto mb-3 text-slate-400" size={28} />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Select a department from the graph or bar chart to view detailed feedback analytics.</p>
          </div>
        </div>
      )}
    </div>
  )
}
