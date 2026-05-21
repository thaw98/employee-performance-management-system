import { useEffect, useMemo, useState } from 'react'
import { skipToken } from '@reduxjs/toolkit/query'
import { useNavigate } from 'react-router-dom'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { useAppSelector } from '../../app/hooks'
import { AlertTriangle, ArrowLeft, Award, Download, FileText, Filter, Trophy } from 'lucide-react'
import {
  useGetCriteriaAveragesQuery,
  useGetEmployeeFeedbackDetailQuery,
  useGetEmployeeRankingQuery,
  useGetFeedbackReportDepartmentsQuery,
  useGetMyFeedbackReportQuery,
  useLazyGetFeedbackReportExportDataQuery,
  useGetTopBottomEmployeesQuery,
  type CriteriaAverageDto,
  type EmployeeFeedbackDetailReportDto,
  type EmployeeRankingDto,
  type ReportDepartmentDto,
} from '../../features/feedback/api/feedbackApi'
import { useGetReviewCyclesQuery, type ReviewCycleDto } from '../../features/reviewCycle/api/reviewCycleApi'

type FeedbackReportPageProps = {
  mode: 'hr' | 'manager' | 'employee'
}

type ExportSection = 'summary' | 'individual'

type FeedbackExportFilters = {
  departmentId?: number
  departmentLabel?: string
  from?: string
  to?: string
  reviewCycleId?: number
  reviewCycleName?: string
  criteriaId?: number
  criteriaName?: string
  order?: 'asc' | 'desc'
  employeeId?: number
  employeeName?: string
}

function formatScore(value?: number | null) {
  return typeof value === 'number' && Number.isFinite(value) ? value.toFixed(1) : '0.0'
}

function buildCriteriaAveragesFromExportRows(rows: EmployeeFeedbackDetailReportDto[]): CriteriaAverageDto[] {
  const totals = new Map<number, { criteriaName: string; total: number; count: number }>()

  rows.forEach((employee) => {
    employee.criteriaAverages.forEach((criteria) => {
      const current = totals.get(criteria.criteriaId) ?? { criteriaName: criteria.criteriaName, total: 0, count: 0 }
      current.total += criteria.average
      current.count += 1
      totals.set(criteria.criteriaId, current)
    })
  })

  return Array.from(totals.entries())
    .map(([criteriaId, criteria]) => ({
      criteriaId,
      criteriaName: criteria.criteriaName,
      average: criteria.count > 0 ? criteria.total / criteria.count : 0,
    }))
    .sort((a, b) => a.criteriaName.localeCompare(b.criteriaName))
}

function getLastAutoTableFinalY(doc: jsPDF) {
  return (doc as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY
}

function formatExportDate(date = new Date()) {
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function getExportReportTitle(section: ExportSection) {
  return section === 'summary' ? 'Feedback Summary Report' : 'Feedback Individual Report'
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

function EmployeeSummaryCard({
  label,
  employee,
  onGoToMeeting,
  showMeetingButton = true,
  variant,
}: {
  label: string
  employee?: EmployeeRankingDto | null
  onGoToMeeting?: (employee: EmployeeRankingDto, meetingDescription: string) => void
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
          onClick={() => employee && onGoToMeeting?.(employee, meetingDescription)}
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
  onExportExcel,
  onExportPdf,
  exportDownload,
  exportDisabled = false,
}: {
  selectedDepartment?: ReportDepartmentDto
  departments: ReportDepartmentDto[]
  canChangeDepartment: boolean
  onClearDepartment?: () => void
  reportReviewCycle?: ReviewCycleDto
  roleMode: 'hr' | 'manager'
  onExportExcel: (section: ExportSection, filters: FeedbackExportFilters) => void
  onExportPdf: (section: ExportSection, filters: FeedbackExportFilters) => void
  exportDownload: string | null
  exportDisabled?: boolean
}) {
  const navigate = useNavigate()
  const authUser = useAppSelector((state) => state.auth.user)
  const [departmentId, setDepartmentId] = useState<number | undefined>(selectedDepartment?.departmentId)
  const [from, setFrom] = useState(getMonthStart())
  const [to, setTo] = useState(getToday())
  const [criteriaId, setCriteriaId] = useState<number | undefined>()
  const [order, setOrder] = useState<'desc' | 'asc'>('desc')
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | undefined>()
  const [selectedEmployeeDepartmentId, setSelectedEmployeeDepartmentId] = useState<number | undefined>()
  const [rankingPage, setRankingPage] = useState(0)
  const [selfMeetingAlert, setSelfMeetingAlert] = useState('')
  const [reportSection, setReportSection] = useState<'summary' | 'individual'>('summary')

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
  const isSummarySection = reportSection === 'summary'
  const summaryExportDisabled = exportDownload !== null
  const individualExportDisabled = exportDisabled || !selectedEmployeeId
  const currentExportFilters: FeedbackExportFilters = {
    departmentId,
    departmentLabel: selected?.departmentName ?? 'All Departments',
    ...dateFilters,
    reviewCycleName: reportReviewCycle?.name,
    criteriaId,
    criteriaName: criteriaAverages.find((criteria) => criteria.criteriaId === criteriaId)?.criteriaName,
    order,
    employeeId: selectedEmployeeId,
    employeeName: employeeDetail?.employeeName ?? ranking.find((employee) => employee.employeeId === selectedEmployeeId)?.employeeName,
  }

  const goToMeeting = (employee: EmployeeRankingDto, meetingDescription: string) => {
    const isTopFeedbackMeeting = meetingDescription === 'Best Feedback Person Meeting'
    const isWorstFeedbackMeeting = meetingDescription === 'Worst Feedback Person Meeting'
    const currentEmployeeId = authUser?.employeeId ? String(authUser.employeeId) : ''
    const currentName = authUser?.name?.trim().toLowerCase() ?? ''
    const targetEmployeeId = String(employee.employeeId)
    const targetName = employee.employeeName?.trim().toLowerCase() ?? ''
    const isCurrentManager = Boolean(
      (currentEmployeeId && currentEmployeeId === targetEmployeeId)
      || (currentName && currentName === targetName),
    )

    if (roleMode === 'manager' && isCurrentManager) {
      if (isTopFeedbackMeeting) {
        setSelfMeetingAlert('The top feedback person is you. Meetting cannot be called.')
        return
      }
      if (isWorstFeedbackMeeting) {
        setSelfMeetingAlert('The worst feedback person is you. Meetting cannot be called.')
        return
      }
    }

    const basePath = roleMode === 'hr' ? '/hr/meetings' : '/manager/meetings'
    const params = new URLSearchParams({
      section: 'schedule',
      employeeId: String(employee.employeeId),
      employeeName: employee.employeeName,
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
      {selfMeetingAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
              <AlertTriangle size={28} />
            </div>
            <p className="mt-5 text-lg font-black text-slate-900 dark:text-slate-100">
              {selfMeetingAlert}
            </p>
            <button
              type="button"
              onClick={() => setSelfMeetingAlert('')}
              className="mt-6 h-11 min-w-28 rounded-lg bg-blue-600 px-6 text-sm font-black text-white transition-colors hover:bg-blue-700"
            >
              OK
            </button>
          </div>
        </div>
      )}

      <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <button
          type="button"
          onClick={() => setReportSection('summary')}
          className={`h-10 rounded-lg px-5 text-sm font-black transition-colors ${
            isSummarySection
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
          }`}
        >
          Summary
        </button>
        <button
          type="button"
          onClick={() => setReportSection('individual')}
          className={`h-10 rounded-lg px-5 text-sm font-black transition-colors ${
            !isSummarySection
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
          }`}
        >
          Individual
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-center gap-2">
          <Filter size={18} className="text-slate-500" />
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">
            {isSummarySection ? 'Summary Filters' : 'Individual Filters'}
          </h2>
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
          {!isSummarySection && (
            <>
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
            </>
          )}
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

      {isSummarySection ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Summary Report</h2>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onExportPdf('summary', currentExportFilters)}
                disabled={summaryExportDisabled}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300 ${
                  roleMode === 'manager' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                <Download size={16} />
                {exportDownload === 'summary-pdf' ? 'Downloading...' : 'PDF'}
              </button>
              <button
                type="button"
                onClick={() => onExportExcel('summary', currentExportFilters)}
                disabled={summaryExportDisabled}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <FileText size={16} />
                {exportDownload === 'summary-excel' ? 'Downloading...' : 'Excel'}
              </button>
            </div>
          </div>

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

          <div className="flex min-h-[520px] flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
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
        </>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Individual Report</h2>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onExportPdf('individual', currentExportFilters)}
                disabled={individualExportDisabled}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300 ${
                  roleMode === 'manager' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                <Download size={16} />
                {exportDownload === 'individual-pdf' ? 'Downloading...' : 'PDF'}
              </button>
              <button
                type="button"
                onClick={() => onExportExcel('individual', currentExportFilters)}
                disabled={individualExportDisabled}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <FileText size={16} />
                {exportDownload === 'individual-excel' ? 'Downloading...' : 'Excel'}
              </button>
            </div>
          </div>

          <div className="flex min-h-[520px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
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
      )}
    </div>
  )
}

function EmployeeOwnFeedbackReport() {
  const [reportDownload, setReportDownload] = useState<string | null>(null)
  const { data: reviewCycles = [] } = useGetReviewCyclesQuery()
  const sortedReviewCycles = useMemo(
    () => [...reviewCycles].sort((a, b) => a.startDate.localeCompare(b.startDate)),
    [reviewCycles],
  )
  const quarterCycles = sortedReviewCycles.filter(isQuarterCycle)
  const activeReviewCycle = sortedReviewCycles.find((cycle) => cycle.isActive || cycle.status === 'ACTIVE') ?? sortedReviewCycles[sortedReviewCycles.length - 1]
  const activeQuarterCycle = quarterCycles.find((cycle) => cycle.isActive || cycle.status === 'ACTIVE') ?? quarterCycles[quarterCycles.length - 1]
  const [reportCycleId, setReportCycleId] = useState<number | undefined>()
  const reportCycleOptions = quarterCycles.length > 0 ? quarterCycles : sortedReviewCycles
  const selectedReportCycle = reportCycleOptions.find((cycle) => cycle.id === reportCycleId) ?? activeQuarterCycle ?? activeReviewCycle
  const { data: reportResponse, isLoading } = useGetMyFeedbackReportQuery({ reviewCycleId: selectedReportCycle?.id })
  const report = reportResponse?.data
  const exportDisabled = reportDownload !== null || !report

  const reportInfoRows = (title: string) => [
    ['Report title', title],
    ['Export date', formatExportDate()],
    ['Current active review cycle', activeReviewCycle?.name ?? '-'],
    ['Selected review cycle', selectedReportCycle?.name ?? '-'],
    ['Selected employee', report?.employeeName ?? '-'],
    ['Selected department', report?.departmentName ?? '-'],
  ]

  const handleExportExcel = async () => {
    if (!report) return
    setReportDownload('excel')
    try {
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([[getExportReportTitle('individual')], [], ...reportInfoRows(getExportReportTitle('individual'))]), 'Report Info')
      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.aoa_to_sheet([
          ['Employee', report.employeeName],
          ['Department', report.departmentName],
          ['Total Average Feedback Score', formatScore(report.totalAverageScore)],
        ]),
        'Employee Detail',
      )
      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.aoa_to_sheet([
          ['Criteria', 'Average Score'],
          ...report.criteriaAverages.map((criteria) => [criteria.criteriaName, formatScore(criteria.average)]),
        ]),
        'Criteria Averages',
      )
      XLSX.writeFile(workbook, `Feedback_Report_Individual_${report.employeeName.replace(/[^a-z0-9]+/gi, '_')}.xlsx`)
    } finally {
      setReportDownload(null)
    }
  }

  const handleExportPdf = async () => {
    if (!report) return
    setReportDownload('pdf')
    try {
      const doc = new jsPDF('l', 'mm', 'a4')
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 10
      const usableWidth = pageWidth - margin * 2
      doc.setFontSize(16)
      doc.text(getExportReportTitle('individual'), margin, 14)
      doc.setFontSize(12)
      doc.text('Individual', margin, 22)
      autoTable(doc, {
        startY: 27,
        body: reportInfoRows(getExportReportTitle('individual')),
        theme: 'grid',
        margin: { left: margin, right: margin },
        tableWidth: usableWidth,
        styles: { fontSize: 9, cellPadding: 2, overflow: 'linebreak' },
        columnStyles: {
          0: { cellWidth: 72, fontStyle: 'bold' },
          1: { cellWidth: usableWidth - 72 },
        },
      })
      let y = (getLastAutoTableFinalY(doc) ?? 60) + 8
      autoTable(doc, {
        startY: y,
        body: [
          ['Employee', report.employeeName],
          ['Department', report.departmentName],
          ['Total Average Feedback Score', formatScore(report.totalAverageScore)],
        ],
        theme: 'grid',
        margin: { left: margin, right: margin },
        tableWidth: usableWidth,
        styles: { fontSize: 9, cellPadding: 2, overflow: 'linebreak' },
        columnStyles: {
          0: { cellWidth: 72, fontStyle: 'bold' },
          1: { cellWidth: usableWidth - 72 },
        },
      })
      y = (getLastAutoTableFinalY(doc) ?? y) + 8
      if (y > pageHeight - 35) {
        doc.addPage()
        y = 14
      }
      autoTable(doc, {
        startY: y,
        head: [['Criteria', 'Average Score']],
        body: report.criteriaAverages.map((criteria) => [criteria.criteriaName, formatScore(criteria.average)]),
        theme: 'striped',
        margin: { left: margin, right: margin },
        tableWidth: usableWidth,
        styles: { fontSize: 9, cellPadding: 2, overflow: 'linebreak' },
        headStyles: { fillColor: [20, 184, 166], textColor: 255 },
      })
      doc.save(`Feedback_Report_Individual_${report.employeeName.replace(/[^a-z0-9]+/gi, '_')}.pdf`)
    } finally {
      setReportDownload(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Feedback Report</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">View your own received feedback report.</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <label className="block max-w-sm space-y-1.5">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Review Cycle</span>
          <select
            value={selectedReportCycle?.id ?? ''}
            onChange={(event) => setReportCycleId(event.target.value ? Number(event.target.value) : undefined)}
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            {reportCycleOptions.map((cycle) => (
              <option key={cycle.id} value={cycle.id}>{cycle.name}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Individual Report</h2>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={handleExportPdf} disabled={exportDisabled} className="flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300">
            <Download size={16} />
            {reportDownload === 'pdf' ? 'Downloading...' : 'PDF'}
          </button>
          <button type="button" onClick={handleExportExcel} disabled={exportDisabled} className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300">
            <FileText size={16} />
            {reportDownload === 'excel' ? 'Downloading...' : 'Excel'}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {isLoading ? (
          <div className="py-16 text-center text-sm text-slate-500">Loading your feedback report...</div>
        ) : report ? (
          <div className="space-y-5">
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60">
              <div className="text-xs font-black uppercase tracking-wide text-slate-500">Employee Detail</div>
              <h2 className="mt-1 text-lg font-black text-slate-900 dark:text-slate-100">{report.employeeName}</h2>
              <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">{report.departmentName}</p>
            </div>
            <div className="rounded-lg bg-emerald-50 p-4 dark:bg-emerald-950/30">
              <div className="text-xs font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Total Average Feedback Score</div>
              <div className="mt-1 text-3xl font-black text-emerald-900 dark:text-emerald-100">{formatScore(report.totalAverageScore)} / 5</div>
            </div>
            <div>
              <h3 className="mb-3 text-sm font-black text-slate-900 dark:text-slate-100">Criteria Averages</h3>
              <div className="space-y-3">
                {report.criteriaAverages.map((criteria) => {
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
            </div>
          </div>
        ) : (
          <div className="py-16 text-center text-sm text-slate-500">No feedback report found for you.</div>
        )}
      </div>
    </div>
  )
}

function HrManagerFeedbackReport({ mode }: { mode: 'hr' | 'manager' }) {
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | undefined>()
  const [reportCycleId, setReportCycleId] = useState<number | undefined>()
  const [reportDownload, setReportDownload] = useState<string | null>(null)

  const { data: departmentsResponse, isLoading: isDepartmentsLoading } = useGetFeedbackReportDepartmentsQuery()
  const { data: reviewCycles = [] } = useGetReviewCyclesQuery()
  const departments = useMemo(() => departmentsResponse?.data ?? [], [departmentsResponse?.data])
  const sortedReviewCycles = useMemo(
    () => [...reviewCycles].sort((a, b) => a.startDate.localeCompare(b.startDate)),
    [reviewCycles],
  )
  const quarterCycles = sortedReviewCycles.filter(isQuarterCycle)
  const activeReviewCycle = sortedReviewCycles.find((cycle) => cycle.isActive || cycle.status === 'ACTIVE') ?? sortedReviewCycles[sortedReviewCycles.length - 1]
  const activeQuarterCycle = quarterCycles.find((cycle) => cycle.isActive || cycle.status === 'ACTIVE') ?? quarterCycles[quarterCycles.length - 1]
  const reportCycleOptions = quarterCycles.length > 0 ? quarterCycles : sortedReviewCycles
  const selectedReportCycle = reportCycleOptions.find((cycle) => cycle.id === reportCycleId) ?? activeQuarterCycle ?? activeReviewCycle
  const reportFilters = { reviewCycleId: selectedReportCycle?.id }
  const selectedDepartment = selectedDepartmentId
    ? departments.find((department) => department.departmentId === selectedDepartmentId)
      ?? undefined
    : undefined
  const [fetchExportData, { isFetching: isExporting }] = useLazyGetFeedbackReportExportDataQuery()
  useEffect(() => {
    if (mode === 'manager' && departments.length > 0 && !selectedDepartmentId) {
      setSelectedDepartmentId(departments[0].departmentId)
    }
  }, [departments, mode, selectedDepartmentId])

  const displayedDepartment = selectedDepartmentId
    ? selectedDepartment
    : mode === 'manager'
      ? departments[0]
      : undefined

  const buildExportWorkbook = async (filters: FeedbackExportFilters = {}) => {
    const exportResponse = await fetchExportData({
      departmentId: filters.departmentId,
      from: filters.from,
      to: filters.to,
      reviewCycleId: filters.reviewCycleId,
    }).unwrap()
    const exportRows = [...(exportResponse.data ?? [])]
      .filter((employee) => !filters.employeeId || employee.employeeId === filters.employeeId)
      .sort((a, b) => {
      const getSortScore = (employee: EmployeeFeedbackDetailReportDto) => {
        if (!filters.criteriaId) return employee.totalAverageScore
        return employee.criteriaAverages.find((criteria) => criteria.criteriaId === filters.criteriaId)?.average ?? -1
      }
      const left = getSortScore(a)
      const right = getSortScore(b)
      return filters.order === 'asc' ? left - right : right - left
    })
    const criteriaAverages = buildCriteriaAveragesFromExportRows(exportRows)
    const rankedByTotal = [...exportRows].sort((a, b) => b.totalAverageScore - a.totalAverageScore)
    const topEmployee = rankedByTotal[0]
    const bottomEmployee = rankedByTotal[rankedByTotal.length - 1]
    const selectedCriteriaName = filters.criteriaId
      ? filters.criteriaName
        ?? exportRows
          .flatMap((employee) => employee.criteriaAverages)
          .find((criteria) => criteria.criteriaId === filters.criteriaId)?.criteriaName
      : undefined
    const criteriaNames = selectedCriteriaName
      ? [selectedCriteriaName]
      : Array.from(new Set([
        ...criteriaAverages.map((criteria) => criteria.criteriaName),
        ...exportRows.flatMap((employee) => employee.criteriaAverages.map((criteria) => criteria.criteriaName)),
      ]))
    const departmentLabel = filters.departmentLabel ?? displayedDepartment?.departmentName ?? 'All Departments'
    const baseInfoRows = [
      ['Export date', formatExportDate()],
      ['Current active review cycle', activeReviewCycle?.name ?? '-'],
      ['Selected review cycle', filters.reviewCycleName ?? selectedReportCycle?.name ?? '-'],
      ['Selected department', departmentLabel],
      ...(filters.from ? [['From date', formatExportDate(new Date(`${filters.from}T00:00:00`))]] : []),
      ...(filters.to ? [['To date', formatExportDate(new Date(`${filters.to}T00:00:00`))]] : []),
      ...(filters.employeeId ? [['Selected employee', filters.employeeName ?? String(filters.employeeId)]] : []),
      ...(filters.criteriaId ? [['Selected criteria', filters.criteriaName ?? String(filters.criteriaId)]] : []),
      ...(filters.criteriaId ? [['Sort order', filters.order === 'asc' ? 'Lowest to highest' : 'Highest to lowest']] : []),
    ]
    const summaryRows = [
      ['Report title', getExportReportTitle('summary')],
      ...baseInfoRows,
      [],
      ['Top scorer', topEmployee?.employeeName ?? '-', topEmployee?.departmentName ?? '-', formatScore(topEmployee?.totalAverageScore)],
      ['Worst scorer', bottomEmployee?.employeeName ?? '-', bottomEmployee?.departmentName ?? '-', formatScore(bottomEmployee?.totalAverageScore)],
    ]
    const employeeRows = exportRows.map((employee, index) => {
      const row: Record<string, string | number> = {
        Rank: index + 1,
        Employee: employee.employeeName,
        Department: employee.departmentName,
        'Total Average Feedback Score': formatScore(employee.totalAverageScore),
      }
      criteriaNames.forEach((criteriaName) => {
        const criteria = filters.criteriaId
          ? employee.criteriaAverages.find((item) => item.criteriaId === filters.criteriaId)
          : employee.criteriaAverages.find((item) => item.criteriaName === criteriaName)
        row[criteriaName] = criteria ? formatScore(criteria.average) : '-'
      })
      return row
    })
    const individualRows = [
      ['Report title', getExportReportTitle('individual')],
      ...baseInfoRows,
    ]
    const selectedEmployee = exportRows[0]
    const individualCriteriaRows = selectedEmployee?.criteriaAverages ?? []
    const individualDetailRows = [
      [getExportReportTitle('individual')],
      [],
      ...individualRows,
      [],
      ['Employee Detail'],
      ['Employee', selectedEmployee?.employeeName ?? '-'],
      ['Department', selectedEmployee?.departmentName ?? '-'],
      ['Total Average Feedback Score', formatScore(selectedEmployee?.totalAverageScore)],
      [],
      ['Criteria Averages'],
      ['Criteria', 'Average Score'],
      ...individualCriteriaRows.map((criteria) => [criteria.criteriaName, formatScore(criteria.average)]),
    ]
    const individualEmployeeRows = [
      ['Employee', selectedEmployee?.employeeName ?? '-'],
      ['Department', selectedEmployee?.departmentName ?? '-'],
      ['Total Average Feedback Score', formatScore(selectedEmployee?.totalAverageScore)],
    ]
    const individualCriteriaSheetRows = [
      ['Criteria', 'Average Score'],
      ...individualCriteriaRows.map((criteria) => [criteria.criteriaName, formatScore(criteria.average)]),
    ]
    return {
      criteriaAverages,
      departmentLabel,
      employeeRows,
      individualCriteriaSheetRows,
      individualDetailRows,
      individualEmployeeRows,
      individualRows,
      summaryRows,
    }
  }

  const handleExportExcel = async (section: ExportSection, filters: FeedbackExportFilters = {}) => {
    setReportDownload(`${section}-excel`)
    try {
      const exportFilters = section === 'summary' ? { ...filters, criteriaId: undefined, criteriaName: undefined, order: undefined } : filters
      const {
        criteriaAverages,
        departmentLabel,
        employeeRows,
        individualCriteriaSheetRows,
        individualEmployeeRows,
        individualRows,
        summaryRows,
      } = await buildExportWorkbook(exportFilters)
      const workbook = XLSX.utils.book_new()
      const sectionLabel = section === 'summary' ? 'Summary' : 'Individual'
      if (section === 'summary') {
        XLSX.utils.book_append_sheet(
          workbook,
          XLSX.utils.aoa_to_sheet([[getExportReportTitle('summary')], [], ...summaryRows]),
          'Report Info',
        )
        XLSX.utils.book_append_sheet(
          workbook,
          XLSX.utils.aoa_to_sheet([
            ['Criteria', 'Average Score'],
            ...criteriaAverages.map((criteria) => [criteria.criteriaName, formatScore(criteria.average)]),
          ]),
          'Criteria Averages',
        )
        XLSX.utils.book_append_sheet(
          workbook,
          XLSX.utils.aoa_to_sheet([
            employeeRows.length
              ? Object.keys(employeeRows[0])
              : ['Rank', 'Employee', 'Department', 'Total Average Feedback Score'],
            ...employeeRows.map((row) => Object.values(row)),
          ]),
          'Employee Feedback',
        )
      } else {
        XLSX.utils.book_append_sheet(
          workbook,
          XLSX.utils.aoa_to_sheet([[getExportReportTitle('individual')], [], ...individualRows]),
          'Report Info',
        )
        XLSX.utils.book_append_sheet(
          workbook,
          XLSX.utils.aoa_to_sheet(individualEmployeeRows),
          'Employee Detail',
        )
        XLSX.utils.book_append_sheet(
          workbook,
          XLSX.utils.aoa_to_sheet(individualCriteriaSheetRows),
          'Criteria Averages',
        )
      }
      XLSX.writeFile(workbook, `Feedback_Report_${sectionLabel}_${departmentLabel.replace(/[^a-z0-9]+/gi, '_')}.xlsx`)
    } finally {
      setReportDownload(null)
    }
  }

  const handleExportPdf = async (section: ExportSection, filters: FeedbackExportFilters = {}) => {
    setReportDownload(`${section}-pdf`)
    try {
      const exportFilters = section === 'summary' ? { ...filters, criteriaId: undefined, criteriaName: undefined, order: undefined } : filters
      const { criteriaAverages, departmentLabel, employeeRows, individualRows, summaryRows } = await buildExportWorkbook(exportFilters)
      const sectionLabel = section === 'summary' ? 'Summary' : 'Individual'
      const reportTitle = getExportReportTitle(section)
      const doc = new jsPDF('l', 'mm', 'a4')
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 10
      const usableWidth = pageWidth - margin * 2
      doc.setFontSize(16)
      doc.text(reportTitle, margin, 14)
      doc.setFontSize(12)
      doc.text(sectionLabel, margin, 22)

      if (section === 'summary') {
        autoTable(doc, {
          startY: 27,
          body: summaryRows.filter((row) => row.length > 0),
          theme: 'grid',
          margin: { left: margin, right: margin },
          tableWidth: usableWidth,
          styles: { fontSize: 9, cellPadding: 2, overflow: 'linebreak' },
          columnStyles: {
            0: { cellWidth: 72, fontStyle: 'bold' },
            1: { cellWidth: usableWidth - 72 },
          },
        })
        const summaryFinalY = getLastAutoTableFinalY(doc)
        let y = summaryFinalY ? summaryFinalY + 8 : 60
        if (y > pageHeight - 45) {
          doc.addPage()
          y = 14
        }
        autoTable(doc, {
          startY: y,
          head: [['Criteria', 'Average Score']],
          body: criteriaAverages.map((criteria) => [criteria.criteriaName, formatScore(criteria.average)]),
          theme: 'striped',
          margin: { left: margin, right: margin },
          tableWidth: usableWidth,
          styles: { fontSize: 9, cellPadding: 2, overflow: 'linebreak' },
          headStyles: { fillColor: [37, 99, 235], textColor: 255 },
        })
        y = (getLastAutoTableFinalY(doc) ?? y) + 8
        if (y > pageHeight - 35) {
          doc.addPage()
          y = 14
        }
        const summaryEmployeeHeaders = Object.keys(employeeRows[0] ?? { Employee: '', Department: '', 'Total Average Feedback Score': '' })
        const summaryEmployeeFontSize = Math.max(5, Math.min(7, Math.floor(usableWidth / Math.max(1, summaryEmployeeHeaders.length) / 2.4)))
        autoTable(doc, {
          startY: y,
          head: [summaryEmployeeHeaders],
          body: employeeRows.map((row) => Object.values(row)),
          theme: 'grid',
          margin: { left: margin, right: margin },
          tableWidth: usableWidth,
          styles: {
            fontSize: summaryEmployeeFontSize,
            cellPadding: 1.4,
            overflow: 'linebreak',
            halign: 'center',
            valign: 'middle',
          },
          headStyles: {
            fillColor: [20, 184, 166],
            textColor: 255,
            fontSize: summaryEmployeeFontSize,
            halign: 'center',
            valign: 'middle',
          },
          bodyStyles: { textColor: [71, 85, 105] },
          columnStyles: {
            0: { cellWidth: 10 },
            1: { cellWidth: 31, halign: 'left' },
            2: { cellWidth: 28, halign: 'left' },
            3: { cellWidth: 21 },
          },
        })
      } else {
        const selectedEmployee = employeeRows[0]
        autoTable(doc, {
          startY: 27,
          body: individualRows,
          theme: 'grid',
          margin: { left: margin, right: margin },
          tableWidth: usableWidth,
          styles: { fontSize: 9, cellPadding: 2, overflow: 'linebreak' },
          columnStyles: {
            0: { cellWidth: 72, fontStyle: 'bold' },
            1: { cellWidth: usableWidth - 72 },
          },
        })
        const individualFinalY = getLastAutoTableFinalY(doc)
        let y = individualFinalY ? individualFinalY + 8 : 60
        if (y > pageHeight - 35) {
          doc.addPage()
          y = 14
        }
        autoTable(doc, {
          startY: y,
          body: [
            ['Employee', selectedEmployee?.Employee ?? '-'],
            ['Department', selectedEmployee?.Department ?? '-'],
            ['Total Average Feedback Score', selectedEmployee?.['Total Average Feedback Score'] ?? '-'],
          ],
          theme: 'grid',
          margin: { left: margin, right: margin },
          tableWidth: usableWidth,
          styles: { fontSize: 9, cellPadding: 2, overflow: 'linebreak' },
          columnStyles: {
            0: { cellWidth: 72, fontStyle: 'bold' },
            1: { cellWidth: usableWidth - 72 },
          },
        })
        y = (getLastAutoTableFinalY(doc) ?? y) + 8
        if (y > pageHeight - 35) {
          doc.addPage()
          y = 14
        }
        const selectedCriteriaRows = employeeRows.length
          ? Object.entries(employeeRows[0]).filter(([key]) => !['Rank', 'Employee', 'Department', 'Total Average Feedback Score'].includes(key))
          : []
        autoTable(doc, {
          startY: y,
          head: [['Criteria', 'Average Score']],
          body: selectedCriteriaRows.map(([criteria, average]) => [criteria, average]),
          theme: 'striped',
          margin: { left: margin, right: margin },
          tableWidth: usableWidth,
          styles: { fontSize: 9, cellPadding: 2, overflow: 'linebreak' },
          headStyles: {
            fillColor: [20, 184, 166],
            textColor: 255,
          },
        })
      }
      doc.save(`Feedback_Report_${sectionLabel}_${departmentLabel.replace(/[^a-z0-9]+/gi, '_')}.pdf`)
    } finally {
      setReportDownload(null)
    }
  }

  if (isDepartmentsLoading) {
    return <div className="py-16 text-center text-sm text-slate-500">Loading feedback report...</div>
  }

  if (mode === 'manager') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Feedback Report</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Manager view limited to your assigned department data.</p>
          </div>
        </div>
        <DepartmentDetailReport
          selectedDepartment={displayedDepartment}
          departments={departments}
          canChangeDepartment={departments.length > 1}
          onClearDepartment={() => setSelectedDepartmentId(undefined)}
          reportReviewCycle={undefined}
          roleMode={mode}
          onExportExcel={handleExportExcel}
          onExportPdf={handleExportPdf}
          exportDownload={reportDownload}
          exportDisabled={isExporting || reportDownload !== null || !displayedDepartment}
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
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <label className="block max-w-sm space-y-1.5">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Review Cycle</span>
          <select
            value={selectedReportCycle?.id ?? ''}
            onChange={(event) => setReportCycleId(event.target.value ? Number(event.target.value) : undefined)}
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            {reportCycleOptions.map((cycle) => (
              <option key={cycle.id} value={cycle.id}>
                {cycle.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <DepartmentDetailReport
        selectedDepartment={displayedDepartment}
        departments={departments.map((department) => ({
          departmentId: department.departmentId,
          departmentName: department.departmentName,
        }))}
        canChangeDepartment
        onClearDepartment={() => setSelectedDepartmentId(undefined)}
        reportReviewCycle={selectedReportCycle}
        roleMode={mode}
        onExportExcel={handleExportExcel}
        onExportPdf={handleExportPdf}
        exportDownload={reportDownload}
        exportDisabled={isExporting || reportDownload !== null}
      />
    </div>
  )
}

export default function FeedbackReportPage({ mode }: FeedbackReportPageProps) {
  return mode === 'employee' ? <EmployeeOwnFeedbackReport /> : <HrManagerFeedbackReport mode={mode} />
}
