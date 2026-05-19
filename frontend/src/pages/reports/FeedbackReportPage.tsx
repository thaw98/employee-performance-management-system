import { useEffect, useMemo, useRef, useState } from 'react'
import { skipToken } from '@reduxjs/toolkit/query'
import { useNavigate } from 'react-router-dom'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AlertTriangle, ArrowLeft, Award, BarChart3, Filter, LineChart as LineChartIcon, Trophy } from 'lucide-react'
import {
  useGetAveragesByDepartmentQuery,
  useGetCriteriaAveragesQuery,
  useGetDepartmentTrendsQuery,
  useGetEmployeeFeedbackDetailQuery,
  useGetEmployeeRankingQuery,
  useGetFeedbackReportDepartmentsQuery,
  useLazyGetFeedbackReportExportDataQuery,
  useGetTopBottomEmployeesQuery,
  type DepartmentAverageDto,
  type DepartmentTrendDto,
  type EmployeeRankingDto,
  type ReportDepartmentDto,
} from '../../features/feedback/api/feedbackApi'
import { useGetReviewCyclesQuery, type ReviewCycleDto } from '../../features/reviewCycle/api/reviewCycleApi'

type FeedbackReportPageProps = {
  mode: 'hr' | 'manager'
}

const CHART_COLORS = ['#2563eb', '#059669', '#d97706', '#7c3aed', '#dc2626', '#0891b2', '#4f46e5', '#65a30d']

function formatScore(value?: number | null) {
  return typeof value === 'number' && Number.isFinite(value) ? value.toFixed(1) : '0.0'
}

function isAnnualCycle(cycle: ReviewCycleDto) {
  const type = cycle.cycleType?.toUpperCase() ?? ''
  return type === 'ANNUAL' || type.includes('ANNUAL')
}

function isQuarterCycle(cycle: ReviewCycleDto) {
  const searchable = `${cycle.cycleType ?? ''} ${cycle.name ?? ''} ${cycle.code ?? ''}`.toUpperCase()
  return searchable.includes('QUARTER') || searchable.includes('QTR') || /\bQ[1-4]\b/.test(searchable)
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

async function chartToImageData(container: HTMLDivElement | null) {
  const svg = container?.querySelector('svg')
  if (!svg) return undefined
  const cloned = svg.cloneNode(true) as SVGSVGElement
  const rect = svg.getBoundingClientRect()
  cloned.setAttribute('width', String(Math.max(1, Math.round(rect.width))))
  cloned.setAttribute('height', String(Math.max(1, Math.round(rect.height))))
  const svgText = new XMLSerializer().serializeToString(cloned)
  const image = new Image()
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgText)}`
  return new Promise<string>((resolve, reject) => {
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(rect.width * 2))
      canvas.height = Math.max(1, Math.round(rect.height * 2))
      const context = canvas.getContext('2d')
      if (!context) {
        reject(new Error('Unable to render chart'))
        return
      }
      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.scale(2, 2)
      context.drawImage(image, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }
    image.onerror = reject
    image.src = url
  })
}

function EmployeeSummaryCard({
  label,
  employee,
  onGoToMeeting,
  showMeetingButton = true,
  variant,
}: {
  label: string
  employee?: EmployeeRankingDto | null
  onGoToMeeting?: (employeeId: number, meetingDescription: string) => void
  showMeetingButton?: boolean
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
          {employee?.departmentName && (
            <div className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
              {employee.departmentName}
            </div>
          )}
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

      {showMeetingButton && (
        <button
          type="button"
          disabled={!employee}
          onClick={() => employee && onGoToMeeting?.(employee.employeeId, meetingDescription)}
          className={`mt-5 inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-black text-white transition-colors disabled:cursor-not-allowed disabled:bg-slate-300 ${
            isTop ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'
          }`}
        >
          Go to Meeting
        </button>
      )}
    </div>
  )
}

function DepartmentDetailReport({
  selectedDepartment,
  departments,
  canChangeDepartment,
  onClearDepartment,
  reportReviewCycle,
  roleMode,
}: {
  selectedDepartment?: ReportDepartmentDto
  departments: ReportDepartmentDto[]
  canChangeDepartment: boolean
  onClearDepartment?: () => void
  reportReviewCycle?: ReviewCycleDto
  roleMode: 'hr' | 'manager'
}) {
  const navigate = useNavigate()
  const [departmentId, setDepartmentId] = useState<number | undefined>(selectedDepartment?.departmentId)
  const [from, setFrom] = useState(getMonthStart())
  const [to, setTo] = useState(getToday())
  const [criteriaId, setCriteriaId] = useState<number | undefined>()
  const [order, setOrder] = useState<'desc' | 'asc'>('desc')
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | undefined>()
  const [selectedEmployeeDepartmentId, setSelectedEmployeeDepartmentId] = useState<number | undefined>()
  const [rankingPage, setRankingPage] = useState(0)

  useEffect(() => {
    setDepartmentId(selectedDepartment?.departmentId)
    setCriteriaId(undefined)
    setSelectedEmployeeId(undefined)
    setSelectedEmployeeDepartmentId(undefined)
    setRankingPage(0)
  }, [selectedDepartment?.departmentId])

  useEffect(() => {
    setRankingPage(0)
    setSelectedEmployeeId(undefined)
    setSelectedEmployeeDepartmentId(undefined)
  }, [departmentId, from, to, criteriaId, order])

  const selected = departments.find((department) => department.departmentId === departmentId) ?? selectedDepartment
  const isCompanyWideView = roleMode === 'hr' && !departmentId
  const dateFilters = roleMode === 'hr'
    ? { reviewCycleId: reportReviewCycle?.id }
    : { from: from || undefined, to: to || undefined, reviewCycleId: reportReviewCycle?.id }
  const criteriaQuery = roleMode === 'hr' || departmentId ? { departmentId, ...dateFilters } : skipToken
  const rankingQuery = roleMode === 'hr' || departmentId ? { departmentId, ...dateFilters, criteriaId, order } : skipToken
  const employeeDetailQuery = selectedEmployeeDepartmentId && selectedEmployeeId
    ? { departmentId: selectedEmployeeDepartmentId, employeeId: selectedEmployeeId, ...dateFilters }
    : skipToken

  const { data: criteriaResponse, isLoading: isCriteriaLoading } = useGetCriteriaAveragesQuery(criteriaQuery)
  const { data: rankingResponse, isLoading: isRankingLoading } = useGetEmployeeRankingQuery(rankingQuery)
  const { data: employeeDetailResponse, isFetching: isEmployeeDetailLoading } = useGetEmployeeFeedbackDetailQuery(employeeDetailQuery)
  const { data: summaryResponse, isLoading: isSummaryLoading } = useGetTopBottomEmployeesQuery(
    roleMode === 'hr' || departmentId ? { departmentId, ...dateFilters } : skipToken,
  )

  const criteriaAverages = criteriaResponse?.data ?? []
  const ranking = rankingResponse?.data ?? []
  const employeeDetail = employeeDetailResponse?.data
  const summary = summaryResponse?.data
  const criteriaTopScore = criteriaAverages.reduce((best, criteria) => Math.max(best, criteria.average), 0)
  const rankingTopScore = ranking.reduce((best, employee) => Math.max(best, employee.averageScore), 0)
  const rankingPageSize = 5
  const rankingTotalPages = Math.max(1, Math.ceil(ranking.length / rankingPageSize))
  const paginatedRanking = ranking.slice(rankingPage * rankingPageSize, rankingPage * rankingPageSize + rankingPageSize)
  const criteriaIsDense = criteriaAverages.length > 8
  const criteriaIsVeryDense = criteriaAverages.length > 12
  const criteriaGap = criteriaIsVeryDense ? 4 : criteriaIsDense ? 6 : 8

  const goToMeeting = (targetEmployeeId: number, meetingDescription: string) => {
    const employee = summary?.topEmployee?.employeeId === targetEmployeeId
      ? summary.topEmployee
      : summary?.bottomEmployee?.employeeId === targetEmployeeId
        ? summary.bottomEmployee
        : undefined
    const basePath = roleMode === 'hr' ? '/hr/meetings' : '/manager/meetings'
    const params = new URLSearchParams({
      section: 'schedule',
      employeeId: String(targetEmployeeId),
      employeeName: employee?.employeeName ?? '',
      meetingDescription,
    })
    navigate(`${basePath}?${params.toString()}`)
  }

  const clearDepartmentFilter = () => {
    setDepartmentId(undefined)
    setCriteriaId(undefined)
    setSelectedEmployeeId(undefined)
    setSelectedEmployeeDepartmentId(undefined)
    setRankingPage(0)
    onClearDepartment?.()
  }

  if (roleMode !== 'hr' && !departmentId) {
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
            <EmployeeSummaryCard label="Top Feedback Employee" employee={summary?.topEmployee} onGoToMeeting={goToMeeting} showMeetingButton={roleMode !== 'hr'} variant="top" />
            <EmployeeSummaryCard label="Lowest Feedback Employee" employee={summary?.bottomEmployee} onGoToMeeting={goToMeeting} showMeetingButton={roleMode !== 'hr'} variant="bottom" />
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
                value={departmentId ?? ''}
                onChange={(event) => {
                  const nextDepartmentId = event.target.value ? Number(event.target.value) : undefined
                  setDepartmentId(nextDepartmentId)
                  setCriteriaId(undefined)
                  if (!nextDepartmentId) onClearDepartment?.()
                }}
                className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                {roleMode === 'hr' && <option value="">All departments</option>}
                {departments.map((department) => (
                  <option key={department.departmentId} value={department.departmentId}>
                    {department.departmentName}
                  </option>
                ))}
              </select>
            </label>
          )}
          {roleMode !== 'hr' && (
            <>
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
            </>
          )}
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
          {roleMode === 'hr' && departmentId && (
            <div className="flex items-end">
              <button
                type="button"
                onClick={clearDepartmentFilter}
                className="h-11 rounded-lg border border-blue-200 px-4 text-sm font-black text-blue-700 transition-colors hover:bg-blue-50 dark:border-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-950/30"
              >
                View All Departments
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 items-stretch gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex h-[520px] flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">{selected?.departmentName ?? 'All Departments'} Feedback Criteria</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Average score by criteria from submitted feedback.</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-wide text-blue-600 dark:text-blue-300">
                {isCompanyWideView ? 'Company-wide view' : `Selected department: ${selected?.departmentName ?? 'Department'}`}
              </p>
            </div>
            <div className="rounded-lg bg-blue-50 px-2.5 py-2 text-right dark:bg-blue-950/30">
              <div className="text-[10px] font-bold uppercase text-blue-700 dark:text-blue-300">Top Criteria Score</div>
              <div className="text-lg font-black text-blue-900 dark:text-blue-100">{formatScore(criteriaTopScore)}</div>
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

        <div className="flex h-[520px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {selectedEmployeeId ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <button
                type="button"
                onClick={() => setSelectedEmployeeId(undefined)}
                className="mb-5 inline-flex w-fit shrink-0 items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
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
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Trophy size={18} className="text-amber-500" />
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Employee Ranking</h2>
                </div>
                <div className="shrink-0 rounded-lg bg-amber-50 px-2.5 py-1.5 text-right dark:bg-amber-950/30">
                  <div className="text-[10px] font-bold uppercase text-amber-700 dark:text-amber-300">Top Score</div>
                  <div className="text-sm font-black text-amber-900 dark:text-amber-100">{formatScore(rankingTopScore)}</div>
                </div>
              </div>
              {isRankingLoading ? (
                <div className="py-12 text-center text-sm text-slate-500">Loading ranking...</div>
              ) : ranking.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-500">No employee scores found.</div>
              ) : (
                <div className="flex min-h-0 flex-1 flex-col">
                  <div className="min-h-0 flex-1 space-y-2">
                  {paginatedRanking.map((employee, index) => (
                    <button
                      key={employee.employeeId}
                      type="button"
                      onClick={() => {
                        setSelectedEmployeeId(employee.employeeId)
                        setSelectedEmployeeDepartmentId(employee.departmentId ?? departmentId)
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-2 text-left transition-colors hover:border-blue-200 hover:bg-blue-50/60 dark:border-slate-800 dark:bg-slate-800/60 dark:hover:border-blue-900/50 dark:hover:bg-blue-950/20"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-black text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                        {rankingPage * rankingPageSize + index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-bold text-slate-900 dark:text-slate-100">{employee.employeeName}</div>
                        {employee.departmentName && (
                          <div className="truncate text-[11px] font-semibold text-slate-500 dark:text-slate-400">{employee.departmentName}</div>
                        )}
                        <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(100, Math.max(0, employee.averageScore))}%` }} />
                        </div>
                      </div>
                      <div className="text-xs font-black text-slate-900 dark:text-slate-100">{formatScore(employee.averageScore)}</div>
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
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | undefined>()
  const [trendStartCycleId, setTrendStartCycleId] = useState<number | undefined>()
  const [trendEndCycleId, setTrendEndCycleId] = useState<number | undefined>()
  const [barCycleId, setBarCycleId] = useState<number | undefined>()
  const lineChartRef = useRef<HTMLDivElement | null>(null)
  const barChartRef = useRef<HTMLDivElement | null>(null)

  const { data: departmentsResponse, isLoading: isDepartmentsLoading } = useGetFeedbackReportDepartmentsQuery()
  const { data: reviewCycles = [] } = useGetReviewCyclesQuery()
  const departments = departmentsResponse?.data ?? []
  const sortedReviewCycles = useMemo(
    () => [...reviewCycles].sort((a, b) => a.startDate.localeCompare(b.startDate)),
    [reviewCycles],
  )
  const annualCycles = sortedReviewCycles.filter(isAnnualCycle)
  const quarterCycles = sortedReviewCycles.filter(isQuarterCycle)
  const activeReviewCycle = sortedReviewCycles.find((cycle) => cycle.isActive || cycle.status === 'ACTIVE') ?? sortedReviewCycles[sortedReviewCycles.length - 1]
  const activeQuarterCycle = quarterCycles.find((cycle) => cycle.isActive || cycle.status === 'ACTIVE') ?? quarterCycles[quarterCycles.length - 1]
  const activeAnnualCycle = annualCycles.find((cycle) => cycle.isActive || cycle.status === 'ACTIVE')
    ?? annualCycles.find((cycle) => cycle.id === activeQuarterCycle?.parentCycleId)
    ?? annualCycles[annualCycles.length - 1]
  const trendEndCycle = annualCycles.find((cycle) => cycle.id === trendEndCycleId) ?? activeAnnualCycle
  const trendStartOptions = trendEndCycle
    ? annualCycles.filter((cycle) => cycle.startDate <= trendEndCycle.startDate)
    : annualCycles
  const trendEndOptions = annualCycles
  const trendStartCycle = trendStartOptions.find((cycle) => cycle.id === trendStartCycleId) ?? trendStartOptions[0] ?? activeAnnualCycle
  const selectedBarCycle = quarterCycles.find((cycle) => cycle.id === barCycleId) ?? activeQuarterCycle
  const reportFilters = { reviewCycleId: selectedBarCycle?.id }
  const trendFilters = {
    fromReviewCycleId: trendStartCycle?.id,
    toReviewCycleId: trendEndCycle?.id,
  }
  const selectedDepartment = selectedDepartmentId
    ? departments.find((department) => department.departmentId === selectedDepartmentId)
      ?? undefined
    : undefined
  const exportFilters = mode === 'hr' ? { departmentId: selectedDepartmentId, ...reportFilters } : skipToken

  const { data: averagesResponse, isLoading: isAveragesLoading } = useGetAveragesByDepartmentQuery(
    mode === 'hr' ? reportFilters : skipToken,
  )
  const { data: trendsResponse, isLoading: isTrendsLoading } = useGetDepartmentTrendsQuery(
    mode === 'hr' ? trendFilters : skipToken,
  )
  const { data: exportCriteriaResponse } = useGetCriteriaAveragesQuery(exportFilters)
  const { data: exportSummaryResponse } = useGetTopBottomEmployeesQuery(
    mode === 'hr' ? { departmentId: selectedDepartmentId, ...reportFilters } : skipToken,
  )
  const [fetchExportData, { isFetching: isExporting }] = useLazyGetFeedbackReportExportDataQuery()
  useEffect(() => {
    if (mode === 'manager' && departments.length > 0 && !selectedDepartmentId) {
      setSelectedDepartmentId(departments[0].departmentId)
    }
  }, [departments, mode, selectedDepartmentId])

  const departmentAverages = averagesResponse?.data ?? []
  const departmentTrends = trendsResponse?.data ?? []
  const displayedDepartment = selectedDepartmentId
    ? selectedDepartment ?? departmentAverages.find((department) => department.departmentId === selectedDepartmentId)
    : mode === 'manager'
      ? departments[0]
      : undefined
  const trendRows = useMemo(() => buildTrendRows(departmentTrends), [departmentTrends])

  const openDepartmentDetail = (department: Pick<DepartmentAverageDto, 'departmentId' | 'departmentName'>) => {
    setSelectedDepartmentId(department.departmentId)
  }

  const buildExportWorkbook = async () => {
    const exportResponse = await fetchExportData(mode === 'hr' ? { departmentId: selectedDepartmentId, ...reportFilters } : undefined).unwrap()
    const exportRows = exportResponse.data ?? []
    const criteriaAverages = exportCriteriaResponse?.data ?? []
    const summary = exportSummaryResponse?.data
    const criteriaNames = Array.from(new Set([
      ...criteriaAverages.map((criteria) => criteria.criteriaName),
      ...exportRows.flatMap((employee) => employee.criteriaAverages.map((criteria) => criteria.criteriaName)),
    ]))
    const departmentLabel = displayedDepartment?.departmentName ?? 'All Departments'
    const summaryRows = [
      ['Report title', 'Feedback Report'],
      ['Export date', new Date().toLocaleString()],
      ['Current active review cycle', activeReviewCycle?.name ?? '-'],
      ['Selected review cycle range', `${trendStartCycle?.name ?? '-'} to ${trendEndCycle?.name ?? '-'}`],
      ['Selected bar graph review cycle', selectedBarCycle?.name ?? '-'],
      ['Selected department', departmentLabel],
      [],
      ['Top scorer', summary?.topEmployee?.employeeName ?? '-', summary?.topEmployee?.departmentName ?? '-', formatScore(summary?.topEmployee?.averageScore)],
      ['Worst scorer', summary?.bottomEmployee?.employeeName ?? '-', summary?.bottomEmployee?.departmentName ?? '-', formatScore(summary?.bottomEmployee?.averageScore)],
    ]
    const employeeRows = exportRows.map((employee, index) => {
      const row: Record<string, string | number> = {
        Rank: index + 1,
        Employee: employee.employeeName,
        Department: employee.departmentName,
        'Total Average Feedback Score': formatScore(employee.totalAverageScore),
      }
      criteriaNames.forEach((criteriaName) => {
        const criteria = employee.criteriaAverages.find((item) => item.criteriaName === criteriaName)
        row[criteriaName] = criteria ? formatScore(criteria.average) : '-'
      })
      return row
    })
    return { criteriaAverages, departmentLabel, employeeRows, summary, summaryRows }
  }

  const handleExportExcel = async () => {
    const { criteriaAverages, departmentLabel, employeeRows, summaryRows } = await buildExportWorkbook()
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(summaryRows), 'Summary')
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(criteriaAverages.map((criteria) => ({
        Criteria: criteria.criteriaName,
        'Average Score': formatScore(criteria.average),
      }))),
      'Criteria Averages',
    )
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(employeeRows), 'Employee Ranking')
    XLSX.writeFile(workbook, `Feedback_Report_${departmentLabel.replace(/[^a-z0-9]+/gi, '_')}.xlsx`)
  }

  const handleExportPdf = async () => {
    const { criteriaAverages, departmentLabel, employeeRows, summary, summaryRows } = await buildExportWorkbook()
    const [lineImage, barImage] = await Promise.all([
      chartToImageData(lineChartRef.current),
      chartToImageData(barChartRef.current),
    ])
    const doc = new jsPDF('p', 'mm', 'a4')
    doc.setFontSize(16)
    doc.text('Feedback Report', 14, 16)
    autoTable(doc, { startY: 22, body: summaryRows.filter((row) => row.length > 0), theme: 'grid' })
    let y = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 8 : 60
    if (lineImage) {
      doc.setFontSize(12)
      doc.text('Line Graph', 14, y)
      doc.addImage(lineImage, 'PNG', 14, y + 4, 182, 70)
      y += 82
    }
    if (barImage) {
      if (y > 190) {
        doc.addPage()
        y = 16
      }
      doc.setFontSize(12)
      doc.text('Bar Graph', 14, y)
      doc.addImage(barImage, 'PNG', 14, y + 4, 182, 70)
      y += 82
    }
    if (y > 240) {
      doc.addPage()
      y = 16
    }
    autoTable(doc, {
      startY: y,
      head: [['Criteria', 'Average Score']],
      body: criteriaAverages.map((criteria) => [criteria.criteriaName, formatScore(criteria.average)]),
      theme: 'striped',
    })
    autoTable(doc, {
      startY: ((doc as any).lastAutoTable?.finalY ?? y) + 8,
      head: [Object.keys(employeeRows[0] ?? { Employee: '', Department: '', 'Total Average Feedback Score': '' })],
      body: employeeRows.map((row) => Object.values(row)),
      styles: { fontSize: 7 },
      theme: 'grid',
    })
    const finalY = (doc as any).lastAutoTable?.finalY ?? 250
    if (finalY > 255) doc.addPage()
    const scorerY = finalY > 255 ? 16 : finalY + 8
    doc.text(`Top scorer: ${summary?.topEmployee?.employeeName ?? '-'} (${summary?.topEmployee?.departmentName ?? '-'}) - ${formatScore(summary?.topEmployee?.averageScore)}`, 14, scorerY)
    doc.text(`Worst scorer: ${summary?.bottomEmployee?.employeeName ?? '-'} (${summary?.bottomEmployee?.departmentName ?? '-'}) - ${formatScore(summary?.bottomEmployee?.averageScore)}`, 14, scorerY + 7)
    doc.save(`Feedback_Report_${departmentLabel.replace(/[^a-z0-9]+/gi, '_')}.pdf`)
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
          selectedDepartment={displayedDepartment}
          departments={departments}
          canChangeDepartment={departments.length > 1}
          onClearDepartment={() => setSelectedDepartmentId(undefined)}
          reportReviewCycle={undefined}
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
        <div className="flex flex-wrap gap-2 lg:justify-end">
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={isExporting}
            className="h-10 rounded-lg bg-emerald-600 px-4 text-sm font-black text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Export Excel
          </button>
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={isExporting}
            className="h-10 rounded-lg bg-blue-600 px-4 text-sm font-black text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Export PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center gap-2">
            <LineChartIcon size={18} className="text-blue-600" />
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Department Scores by Review Cycle</h2>
          </div>
          <div className="mb-4 grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">From Annual Cycle</span>
              <select
                value={trendStartCycle?.id ?? ''}
                onChange={(event) => setTrendStartCycleId(event.target.value ? Number(event.target.value) : undefined)}
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                {trendStartOptions.map((cycle) => (
                  <option key={cycle.id} value={cycle.id}>
                    {cycle.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">To Annual Cycle</span>
              <select
                value={trendEndCycle?.id ?? ''}
                onChange={(event) => {
                  const nextId = event.target.value ? Number(event.target.value) : undefined
                  setTrendEndCycleId(nextId)
                  const nextEnd = annualCycles.find((cycle) => cycle.id === nextId)
                  if (nextEnd && trendStartCycle && trendStartCycle.startDate > nextEnd.startDate) {
                    setTrendStartCycleId(nextEnd.id)
                  }
                }}
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                {trendEndOptions.map((cycle) => (
                  <option key={cycle.id} value={cycle.id}>
                    {cycle.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {isTrendsLoading ? (
            <div className="py-24 text-center text-sm text-slate-500">Loading trend chart...</div>
          ) : trendRows.length === 0 ? (
            <div className="py-24 text-center text-sm text-slate-500">No trend data found for the selected date range.</div>
          ) : (
            <div ref={lineChartRef}>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={trendRows}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="period" tick={{ fontSize: 12 }} interval={0} angle={-15} textAnchor="end" height={70} />
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
                    onClick={() => openDepartmentDetail(department)}
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
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 space-y-3">
            <div className="flex items-center gap-2">
              <BarChart3 size={18} className="text-emerald-600" />
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Average Score by Department</h2>
            </div>
            <label className="block max-w-xs space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Bar Review Cycle</span>
              <select
                value={selectedBarCycle?.id ?? ''}
                onChange={(event) => setBarCycleId(event.target.value ? Number(event.target.value) : undefined)}
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                {quarterCycles.map((cycle) => (
                  <option key={cycle.id} value={cycle.id}>
                    {cycle.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {isAveragesLoading ? (
            <div className="py-24 text-center text-sm text-slate-500">Loading department averages...</div>
          ) : departmentAverages.length === 0 ? (
            <div className="py-24 text-center text-sm text-slate-500">No department average data found.</div>
          ) : (
            <div ref={barChartRef}>
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
                >
                  <LabelList
                    dataKey="averageScore"
                    position="top"
                    formatter={(value) => formatScore(Number(value))}
                    className="fill-slate-700 text-xs font-bold dark:fill-slate-200"
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <DepartmentDetailReport
        selectedDepartment={displayedDepartment}
        departments={(departmentAverages.length ? departmentAverages : departments).map((department) => ({
          departmentId: department.departmentId,
          departmentName: department.departmentName,
        }))}
        canChangeDepartment
        onClearDepartment={() => setSelectedDepartmentId(undefined)}
        reportReviewCycle={selectedBarCycle}
        roleMode={mode}
      />
    </div>
  )
}
