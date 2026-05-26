import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { useGetPipsQuery, useLazyGetTrainingHistoryQuery } from '../features/pip/pipApi'
import type { Pip, TrainingRecord } from '../features/pip/pipApi'
import { skipToken } from '@reduxjs/toolkit/query'
import { Link, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useEffect, useState, useMemo } from 'react'
import type { RootState } from '../app/store'
import { useGetDepartmentsQuery, useGetDepartmentPositionsQuery } from '../features/hrCreateEmployee/hrEmployeeAccountApi'
import PipUnifiedLog from '../features/pip/components/PipUnifiedLog'
import {
  Search,
  Download,
  FileText,
  Plus,
  X,
  Filter,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  BarChart3,
  Users,
  ArrowRight,
  History,
  RotateCcw,
  FileSpreadsheet,
} from 'lucide-react'

const STATUS_CFG: Record<string, { bg: string; text: string; dot: string; icon?: typeof CheckCircle2 }> = {
  ACTIVE: { bg: 'bg-blue-50 ring-1 ring-blue-200/60', text: 'text-blue-700', dot: 'bg-blue-500' },
  AUTO_CLOSED: { bg: 'bg-amber-50 ring-1 ring-amber-200/60', text: 'text-amber-700', dot: 'bg-amber-500', icon: AlertTriangle },
  REOPEN_REQUESTED: { bg: 'bg-orange-50 ring-1 ring-orange-200/60', text: 'text-orange-700', dot: 'bg-orange-500', icon: RotateCcw },
  COMPLETED: { bg: 'bg-emerald-50 ring-1 ring-emerald-200/60', text: 'text-emerald-700', dot: 'bg-emerald-500', icon: CheckCircle2 },
  CLOSED: { bg: 'bg-slate-50 ring-1 ring-slate-200/60', text: 'text-slate-600', dot: 'bg-slate-400' },
  DENIED: { bg: 'bg-red-50 ring-1 ring-red-200/60', text: 'text-red-700', dot: 'bg-red-500', icon: XCircle },
}

const getStatusDisplayLabel = (status: string, finalOutcome?: string) => {
  if (status === 'CLOSED' && finalOutcome === 'SUCCESSFUL') return 'Successful'
  if (status === 'CLOSED' && finalOutcome === 'FAILED') return 'Failed'
  if (status === 'AUTO_CLOSED') return 'Auto Closed'
  return status.replace(/_/g, ' ')
}

type ApiError = {
  data?: {
    message?: string
  }
  error?: string
}

type EmployeeDisplay = {
  id?: number
  employeeName?: string
  positionName?: string | null
  positionId?: number | null
  department?: {
    departmentName?: string
    name?: string
  }
  position?: {
    positionName?: string
    name?: string
  }
}

const getPositionName = (employee?: EmployeeDisplay) => {
  return employee?.position?.positionName || employee?.position?.name || employee?.positionName || 'N/A'
}

const getDepartmentName = (employee?: EmployeeDisplay) => {
  return employee?.department?.departmentName || employee?.department?.name || 'N/A'
}

type PositionFilterOption = {
  positionId: number
  positionName: string
}

type PipExportBundle = {
  pip: Pip
  trainingHistory: TrainingRecord[]
}

const groupTrainingRecordsByPip = (records: TrainingRecord[]) => Object.values(
  records.reduce<Record<string, TrainingRecord>>((groups, record) => {
    const key = record.pipId == null
      ? [
        record.trainingProvider || '',
        record.startDate || '',
        record.endDate || record.completionDate || '',
        record.completionStatus || record.status || '',
        record.totalCompletedHours ?? '',
      ].join('|')
      : `pip-${record.pipId}`
    const existing = groups[key]
    if (!existing) {
      groups[key] = { ...record }
      return groups
    }

    const names = new Set(
      [existing.trainingName, record.trainingName]
        .flatMap((name) => (name || '').split('\n'))
        .map((name) => name.trim())
        .filter(Boolean),
    )
    groups[key] = {
      ...existing,
      trainingName: Array.from(names).join('\n'),
      percentageCompletion: Math.max(existing.percentageCompletion ?? 0, record.percentageCompletion ?? 0),
      feedbackNotes: [existing.feedbackNotes, record.feedbackNotes]
        .map((note) => note?.trim())
        .filter(Boolean)
        .filter((note, index, notes) => notes.indexOf(note) === index)
        .join('\n'),
    }
    return groups
  }, {}),
)

const formatDateValue = (value?: string) => {
  if (!value) return ''
  const date = new Date(value.includes('T') ? value : `${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

const formatDateTimeValue = (value?: string) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

const getPipEmployeeName = (pip: Pip) => pip.employee.employee?.employeeName || pip.employee.email || 'N/A'
const getPipManagerName = (pip: Pip) => pip.manager.employee?.employeeName || pip.manager.email || 'N/A'
const getPipEmployeeRecordId = (pip: Pip) => pip.employee.employee?.id
const getPipStaffNo = (pip: Pip) => pip.employee.employeeId || 'N/A'
const getPipDepartmentName = (pip: Pip) => getDepartmentName(pip.employee.employee as EmployeeDisplay | undefined)
const getPipPositionName = (pip: Pip) => getPositionName(pip.employee.employee as EmployeeDisplay | undefined)
const formatKpiScore = (score?: number | null) => score == null ? 'N/A' : `${score}%`
const getPipObjectiveSummary = (pip: Pip) => pip.objectives
  .map((objective) => `${objective.description} (${objective.progressPercentage}%)`)
  .join('; ')
const getPipMeetingSummary = (pip: Pip) => (pip.followUpMeetings ?? [])
  .map((meeting) => `${formatDateTimeValue(meeting.meetingTime)} - ${meeting.status}`)
  .join('; ')

const getUniquePips = (pips?: Pip[]) => {
  if (!pips) return []
  return Array.from(
    pips.reduce<Map<number, Pip>>((byId, pip) => {
      if (!byId.has(pip.id)) {
        byId.set(pip.id, pip)
      }
      return byId
    }, new Map()).values(),
  )
}

const getDateRangeLabel = (startDate: string, endDate: string) => {
  if (startDate && endDate) return `${formatDateValue(startDate)} to ${formatDateValue(endDate)}`
  if (startDate) return `From ${formatDateValue(startDate)}`
  if (endDate) return `Through ${formatDateValue(endDate)}`
  return 'All dates'
}

const INPUT_CLASS =
  'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 placeholder-slate-400 transition-all hover:border-slate-300 focus:border-[#2463eb] focus:outline-none focus:ring-2 focus:ring-[#2463eb]/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500'
const SELECT_CLASS =
  `${INPUT_CLASS} appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_10px_center] bg-no-repeat pr-8`
const LABEL_CLASS =
  'mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500'

const buildPipExportRows = (bundles: PipExportBundle[]) => ({
  details: [
    [
      'PIP Reference',
      'Employee',
      'Staff ID',
      'Department',
      'Position',
      'Manager',
      'KPI Score',
      'Status',
      'Start Date',
      'End Date',
      'Original End Date',
      'Auto-Close Date',
      'Extended End Date',
      'Final Close Date',
      'Final Outcome',
      'Total Hours',
      'Completed Hours',
      'Progress %',
      'Expected Improvements',
      'Reason for Plan',
      'Objectives',
      'Follow-Up Meetings',
      'Employee Signed At',
      'Manager Signed At',
      'Reopen Reason',
      'Review Reason',
      'Reopen Decision',
      'Reopen Decision Date',
      'Closing Remarks',
      'Created At',
      'Updated At',
    ],
    ...bundles.map(({ pip }) => [
      `PIP #${pip.id}`,
      getPipEmployeeName(pip),
      getPipStaffNo(pip),
      getPipDepartmentName(pip),
      getPipPositionName(pip),
      getPipManagerName(pip),
      formatKpiScore(pip.kpiScore),
      getStatusDisplayLabel(pip.status, pip.finalOutcome),
      formatDateValue(pip.startDate),
      formatDateValue(pip.endDate),
      formatDateValue(pip.originalEndDate),
      formatDateValue(pip.autoCloseDate),
      formatDateValue(pip.extendedEndDate),
      formatDateValue(pip.finalCloseDate),
      pip.finalOutcome || '',
      pip.totalHours,
      pip.completedHours,
      pip.overallProgressPercentage,
      pip.expectedImprovements || '',
      pip.reasonForPlan || '',
      getPipObjectiveSummary(pip),
      getPipMeetingSummary(pip),
      formatDateTimeValue(pip.employeeSignatureDate ?? pip.employeeSignedAt),
      formatDateTimeValue(pip.managerSignatureDate ?? pip.managerSignedAt),
      pip.reopenReason || '',
      pip.reviewReason || '',
      pip.reopenDecision || '',
      formatDateTimeValue(pip.reopenDecisionDate),
      pip.closingRemarks || '',
      formatDateTimeValue(pip.createdAt),
      formatDateTimeValue(pip.updatedAt),
    ]),
  ],
  training: [
    ['PIP Reference', 'Employee', 'Department', 'Position', 'Training', 'Provider', 'Start Date', 'End Date', 'Status', 'Completed Hours', 'Completion %', 'Feedback / Notes'],
    ...bundles.flatMap(({ pip, trainingHistory }) => groupTrainingRecordsByPip(trainingHistory).map((training) => [
      `PIP #${pip.id}`,
      getPipEmployeeName(pip),
      getPipDepartmentName(pip),
      getPipPositionName(pip),
      training.trainingName || '',
      training.trainingProvider || '',
      formatDateValue(training.startDate),
      formatDateValue(training.endDate ?? training.completionDate),
      (training.completionStatus || training.status || '').replace(/_/g, ' '),
      training.totalCompletedHours ?? pip.completedHours ?? 0,
      training.percentageCompletion ?? '',
      training.feedbackNotes || '',
    ])),
  ],
})

function StatCard({ label, value, icon: Icon, color, bgColor, subtitle }: {
  label: string
  value: number | string
  icon: typeof Users
  color: string
  bgColor: string
  subtitle?: string
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200/60 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-slate-300/60">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
          <p className={`mt-2 text-2xl font-bold ${color}`}>{value}</p>
          {subtitle && <p className="mt-0.5 text-xs text-slate-400 truncate">{subtitle}</p>}
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${bgColor}`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
      </div>
    </div>
  )
}

function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  const initials = name.split(' ').map(w => w.charAt(0)).join('').toUpperCase().slice(0, 2)
  const sizeClasses = size === 'sm' ? 'h-8 w-8 text-[11px]' : 'h-9 w-9 text-xs'
  return (
    <div className={`${sizeClasses} flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#2463eb] to-[#1d4ed8] font-bold text-white shadow-sm`}>
      {initials || '?'}
    </div>
  )
}

function ProgressBadge({ percentage, size = 'md' }: { percentage: number; size?: 'sm' | 'md' }) {
  const color = percentage >= 70 ? 'from-emerald-500 to-emerald-600' : percentage >= 30 ? 'from-blue-500 to-blue-600' : 'from-orange-400 to-orange-500'
  const barHeight = size === 'sm' ? 'h-1.5' : 'h-2'

  return (
    <div className="flex flex-col gap-1">
      <div className={`w-full max-w-[120px] overflow-hidden rounded-full bg-slate-100 ${barHeight}`}>
        <div
          className={`${barHeight} rounded-full bg-gradient-to-r ${color} transition-all duration-700 ease-out`}
          style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
        />
      </div>
      <span className={`font-semibold ${size === 'sm' ? 'text-[10px]' : 'text-xs'} text-slate-500`}>
        {percentage}%
      </span>
    </div>
  )
}

export default function PipMonitoringPage() {
  const { user } = useSelector((state: RootState) => state.auth)
  const userRole = user?.role?.toUpperCase().replace(/\s+/g, '_') || ''
  const isHr = userRole === 'HR'
  const isManager = userRole === 'DEPARTMENT_HEAD' || userRole === 'TEAM_HEAD' || userRole === 'MANAGER'

  const [filterDept, setFilterDept] = useState<number | undefined>(undefined)
  const [filterPos, setFilterPos] = useState<number | undefined>(undefined)
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [searchName, setSearchName] = useState('')
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | undefined>(undefined)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedPipId, setSelectedPipId] = useState<number | undefined>(undefined)
  const [exportError, setExportError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [logViewerPipId, setLogViewerPipId] = useState<number | null>(null)
  const [filtersExpanded, setFiltersExpanded] = useState(true)
  const departmentFilter = isHr ? filterDept : undefined

  const { data: pips, isLoading, isError, error } = useGetPipsQuery({
    departmentId: departmentFilter,
    positionId: filterPos,
    pipId: selectedPipId,
    employeeName: searchName,
    status: filterStatus || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  })
  const { data: departmentPips } = useGetPipsQuery(
    isHr && typeof departmentFilter === 'number'
      ? { departmentId: departmentFilter }
      : skipToken,
  )
  const [loadTrainingHistory] = useLazyGetTrainingHistoryQuery()

  const managerDepartmentId = useMemo(() => {
    if (isHr) return undefined
    const firstPip = pips?.[0]
    const emp = firstPip?.employee as any
    const employeeObj = emp?.employee || emp
    const dept = employeeObj?.department
    if (dept) {
      return dept.departmentId || dept.id
    }
    return undefined
  }, [pips, isHr])

  const { data: departmentsData } = useGetDepartmentsQuery()
  const targetDepartmentId = isHr && typeof filterDept === 'number' ? filterDept : (!isHr && managerDepartmentId ? managerDepartmentId : undefined)
  const { data: positionsData } = useGetDepartmentPositionsQuery(
    targetDepartmentId !== undefined ? targetDepartmentId : skipToken,
  )

  const departments = departmentsData?.data || []
  const positions = useMemo<PositionFilterOption[]>(() => {
    const apiPositions = (positionsData?.data ?? [])
      .filter((position) => typeof position.positionId === 'number' && position.positionId > 0)
      .map((position) => ({
        positionId: position.positionId,
        positionName: position.positionName || 'Unnamed Position',
      }))

    const fallbackPips = departmentPips ?? pips ?? []
    const fallbackPositions = fallbackPips.reduce<PositionFilterOption[]>((acc, pip) => {
      const employee = pip.employee.employee as EmployeeDisplay | undefined
      const positionId = employee?.positionId
      const positionName = getPositionName(employee)

      if (!positionId || !positionName || positionName === 'N/A') {
        return acc
      }

      if (acc.some((position) => position.positionId === positionId)) {
        return acc
      }

      acc.push({ positionId, positionName })
      return acc
    }, [])

    return [...apiPositions, ...fallbackPositions]
      .filter((position, index, all) => all.findIndex((item) => item.positionId === position.positionId) === index)
      .sort((a, b) => a.positionName.localeCompare(b.positionName))
  }, [departmentPips, pips, positionsData?.data])

  const managerDepartmentName = useMemo(() => {
    if (isHr) return null
    const firstPip = pips?.[0]
    const emp = firstPip?.employee as any
    const employeeObj = emp?.employee || emp
    const dept = employeeObj?.department
    if (dept) {
      return dept.departmentName || dept.name || 'My Department'
    }
    return 'My Department'
  }, [pips, isHr])

  const location = useLocation()
  const canCreate = isManager && !isHr

  const employeeFilterOptions = useMemo(() => {
    if (!pips) return []
    return pips
      .map((pip) => ({
        id: getPipEmployeeRecordId(pip),
        name: getPipEmployeeName(pip),
        department: getPipDepartmentName(pip),
        staffNo: getPipStaffNo(pip),
      }))
      .filter((employee): employee is { id: number; name: string; department: string; staffNo: string } => (
        typeof employee.id === 'number' && Number.isFinite(employee.id)
      ))
      .filter((employee, index, all) => all.findIndex((item) => item.id === employee.id) === index)
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [pips])

  const selectedEmployeeName = selectedEmployeeId == null
    ? 'All employees'
    : employeeFilterOptions.find((employee) => employee.id === selectedEmployeeId)?.name ?? `Employee #${selectedEmployeeId}`
  const selectedDepartmentName = isHr && typeof filterDept === 'number'
    ? departments.find((department) => department.departmentId === filterDept)?.departmentName ?? `Department #${filterDept}`
    : isHr
      ? 'All departments'
      : managerDepartmentName ?? 'My Department'
  const selectedPositionName = typeof filterPos === 'number'
    ? positions.find((position) => position.positionId === filterPos)?.positionName ?? `Position #${filterPos}`
    : 'All positions'
  const hasActiveFilters = Boolean(
    filterDept
    || filterPos
    || filterStatus
    || searchName.trim()
    || selectedEmployeeId
    || startDate
    || endDate
    || selectedPipId,
  )
  const uniquePips = useMemo(() => getUniquePips(pips), [pips])

  const filteredPips = useMemo(() => {
    return uniquePips.filter((pip) => {
      if (selectedPipId != null && pip.id !== selectedPipId) return false
      if (selectedEmployeeId == null) return true
      return getPipEmployeeRecordId(pip) === selectedEmployeeId
    }).sort((a, b) => {
      const isAActive = ['ACTIVE', 'AUTO_CLOSED', 'REOPEN_REQUESTED'].includes(a.status)
      const isBActive = ['ACTIVE', 'AUTO_CLOSED', 'REOPEN_REQUESTED'].includes(b.status)
      if (isAActive && !isBActive) return -1
      if (!isAActive && isBActive) return 1

      const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime()
      const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime()
      return timeB - timeA
    })
  }, [uniquePips, selectedEmployeeId, selectedPipId])

  const stats = useMemo(() => {
    const all = filteredPips
    const active = all.filter(p => p.status === 'ACTIVE').length
    const completed = all.filter(p => p.status === 'COMPLETED' || (p.status === 'CLOSED' && p.finalOutcome === 'SUCCESSFUL')).length
    const inProgress = all.filter(p => ['ACTIVE', 'AUTO_CLOSED', 'REOPEN_REQUESTED'].includes(p.status)).length
    const total = all.length
    const uniqueEmployees = new Set(all.map(p => getPipEmployeeRecordId(p)).filter(Boolean)).size
    return { active, completed, inProgress, total, uniqueEmployees }
  }, [filteredPips])

  useEffect(() => {
    setCurrentPage(1)
  }, [filterDept, filterPos, filterStatus, searchName, selectedEmployeeId, selectedPipId, startDate, endDate, rowsPerPage])

  const tablePips = selectedPipId == null
    ? filteredPips
    : filteredPips.filter((pip) => pip.id === selectedPipId)
  const totalPages = Math.max(1, Math.ceil(tablePips.length / rowsPerPage))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const startIndex = tablePips.length === 0 ? 0 : (safeCurrentPage - 1) * rowsPerPage + 1
  const endIndex = Math.min(safeCurrentPage * rowsPerPage, tablePips.length)
  const paginatedPips = tablePips.slice((safeCurrentPage - 1) * rowsPerPage, safeCurrentPage * rowsPerPage)
  const selectedPip = selectedPipId == null ? undefined : filteredPips.find((pip) => pip.id === selectedPipId)
  const exportTargetPips = useMemo(() => selectedPip ? [selectedPip] : filteredPips, [filteredPips, selectedPip])
  const exportEmployeeCount = useMemo(() => new Set(
    exportTargetPips
      .map((pip) => getPipEmployeeRecordId(pip) ?? getPipStaffNo(pip))
      .filter(Boolean),
  ).size, [exportTargetPips])
  const onePagePipDetailRows = buildPipExportRows(exportTargetPips.map((pip) => ({ pip, trainingHistory: [] }))).details

  const getPipExportBundles = async (): Promise<PipExportBundle[]> => {
    return Promise.all(exportTargetPips.map(async (pip) => {
      const employeeId = pip.employee.employee?.id
      const trainingHistory = employeeId == null
        ? []
        : await loadTrainingHistory(String(employeeId)).unwrap()
      return { pip, trainingHistory }
    }))
  }

  const exportSummaryRows = () => [
    ['Title', 'PIP Monitoring Report'],
    ['Date Range', getDateRangeLabel(startDate, endDate)],
    ['Department', selectedDepartmentName],
    ['Position', selectedPositionName],
    ['Employee', selectedEmployeeName],
    ['Total Employees', exportEmployeeCount],
    ['Status', filterStatus ? filterStatus.replace(/_/g, ' ') : 'All statuses'],
    ['Search Keyword', searchName.trim() || 'None'],
    ['PIP Scope', selectedPip ? `PIP #${selectedPip.id}` : 'All matching PIPs'],
    ['Generated At', formatDateTimeValue(new Date().toISOString())],
  ]

  const handleExportPips = async () => {
    if (exportTargetPips.length === 0) return
    try {
      setExportError(null)
      const bundles = await getPipExportBundles()
      const rows = buildPipExportRows(bundles)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(exportSummaryRows()), 'Report Criteria')
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows.details), 'PIP Details')
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows.training), 'Training History')
      XLSX.writeFile(workbook, `pip-export-${selectedPip ? `pip-${selectedPip.id}` : 'all'}-${new Date().toISOString().slice(0, 10)}.xlsx`)
    } catch (error) {
      console.error('[PIP Monitoring] Export failed:', error)
      setExportError('Failed to export PIP data.')
    }
  }

  const handlePrintPips = async () => {
    if (exportTargetPips.length === 0) return
    try {
      setExportError(null)
      const bundles = exportTargetPips.map((pip) => ({ pip, trainingHistory: [] }))
      const rows = buildPipExportRows(bundles)
      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a3' })
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(18)
      doc.text('PIP Monitoring Report', 36, 36)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.text(`Range: ${getDateRangeLabel(startDate, endDate)}`, 36, 56)
      doc.text(`Employee: ${selectedEmployeeName}`, 36, 70)
      doc.text(`Total Employees: ${exportEmployeeCount}`, 36, 84)
      doc.text(`Department: ${selectedDepartmentName}`, 260, 56)
      doc.text(`Position: ${selectedPositionName}`, 260, 70)
      doc.text(`Status: ${filterStatus ? filterStatus.replace(/_/g, ' ') : 'All statuses'}`, 520, 56)
      doc.text(`Generated: ${formatDateTimeValue(new Date().toISOString())}`, 520, 70)

      autoTable(doc, {
        head: [rows.details[0].map((heading) => String(heading))],
        body: rows.details.slice(1).map((row) => row.map((cell) => String(cell || '-'))),
        startY: 104,
        theme: 'grid',
        styles: {
          fontSize: 6,
          cellPadding: 3,
          overflow: 'linebreak',
          valign: 'top',
        },
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: 255,
          fontStyle: 'bold',
        },
        horizontalPageBreak: true,
        horizontalPageBreakRepeat: 0,
        margin: { top: 36, right: 24, bottom: 36, left: 24 },
      })
      doc.save(`pip-monitoring-${selectedPip ? `pip-${selectedPip.id}` : 'report'}-${new Date().toISOString().slice(0, 10)}.pdf`)
    } catch (error) {
      console.error('[PIP Monitoring] Print failed:', error)
      setExportError('Failed to create PIP PDF.')
    }
  }

  const clearAllFilters = () => {
    setFilterDept(undefined)
    setFilterPos(undefined)
    setFilterStatus('')
    setSearchName('')
    setSelectedEmployeeId(undefined)
    setStartDate('')
    setEndDate('')
    setSelectedPipId(undefined)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-12 w-12">
            <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-[#2463eb]" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-700">Loading PIP Records</p>
            <p className="mt-1 text-xs text-slate-400">Fetching performance improvement plans...</p>
          </div>
        </div>
      </div>
    )
  }

  if (isError) {
    const apiError = error as ApiError | undefined
    const errorMessage = apiError?.data?.message || apiError?.error || 'Failed to load PIP records.'
    return (
      <div className="p-8">
        <div className="mx-auto max-w-lg rounded-2xl border border-red-200 bg-gradient-to-br from-red-50 to-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-7 w-7 text-red-500" />
          </div>
          <h2 className="mt-4 text-lg font-bold text-red-800">Unable to Load PIP Monitoring</h2>
          <p className="mt-2 text-sm text-red-600">{errorMessage}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            PIP Monitoring
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Track and manage performance improvement plans across your organization
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(isHr || isManager) && (
            <>
              <button
                type="button"
                onClick={handleExportPips}
                disabled={exportTargetPips.length === 0}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                <span className="hidden sm:inline">Export</span>
              </button>
              <button
                type="button"
                onClick={handlePrintPips}
                disabled={exportTargetPips.length === 0}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FileText className="h-4 w-4 text-red-500" />
                <span className="hidden sm:inline">PDF</span>
              </button>
            </>
          )}
          {canCreate && (
            <Link
              to="create"
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#2463eb] to-[#1d4ed8] px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-200/50 transition-all hover:shadow-md hover:shadow-blue-200/50 active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              Create PIP
            </Link>
          )}
        </div>
      </div>

      {exportError && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-3.5 text-sm font-medium text-red-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {exportError}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        <StatCard
          label="Total PIPs"
          value={stats.total}
          icon={BarChart3}
          color="text-[#2463eb]"
          bgColor="bg-[#eff6ff]"
        />
        <StatCard
          label="Active"
          value={stats.active}
          icon={Clock}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
        <StatCard
          label="In Progress"
          value={stats.inProgress}
          icon={Users}
          color="text-amber-600"
          bgColor="bg-amber-50"
        />
        <StatCard
          label="Completed"
          value={stats.completed}
          icon={CheckCircle2}
          color="text-emerald-600"
          bgColor="bg-emerald-50"
        />
        <StatCard
          label="Employees"
          value={stats.uniqueEmployees}
          icon={Users}
          color="text-violet-600"
          bgColor="bg-violet-50"
          subtitle="Unique employees"
        />
      </div>

      {/* Filters Panel */}
      <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm">
        <button
          type="button"
          onClick={() => setFiltersExpanded(!filtersExpanded)}
          className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-slate-50/50"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
              <Filter className="h-4 w-4 text-slate-500" />
            </div>
            <div>
              <span className="text-sm font-semibold text-slate-700">Filters</span>
              {hasActiveFilters && (
                <span className="ml-2 inline-flex items-center rounded-full bg-[#2463eb]/10 px-2 py-0.5 text-[10px] font-bold text-[#2463eb]">
                  Active
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => { e.stopPropagation(); clearAllFilters() }}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); clearAllFilters() } }}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-[#2463eb] transition-colors hover:bg-[#2463eb]/5"
              >
                <X className="h-3 w-3" />
                Clear all
              </span>
            )}
            {filtersExpanded
              ? <ChevronUp className="h-4 w-4 text-slate-400" />
              : <ChevronDown className="h-4 w-4 text-slate-400" />
            }
          </div>
        </button>

        {filtersExpanded && (
          <div className="animate-fade-in border-t border-slate-100 px-5 pb-5 pt-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {(isHr || isManager) && (
                <div className="min-w-0">
                  <label className={LABEL_CLASS}>Department</label>
                  <select
                    value={filterDept || ''}
                    onChange={(e) => {
                      setFilterDept(e.target.value ? Number(e.target.value) : undefined)
                      setFilterPos(undefined)
                    }}
                    disabled={!isHr}
                    className={SELECT_CLASS}
                  >
                    {isHr ? <option value="">All Departments</option> : <option value="">{managerDepartmentName}</option>}
                    {isHr && departments.map((d) => (
                      <option key={d.departmentId} value={d.departmentId}>
                        {d.departmentName || 'Unnamed Department'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {(isHr || isManager) && (
                <div className="min-w-0">
                  <label className={LABEL_CLASS}>Position</label>
                  <select
                    value={filterPos || ''}
                    onChange={(e) => setFilterPos(e.target.value ? Number(e.target.value) : undefined)}
                    className={SELECT_CLASS}
                  >
                    <option value="">All Positions</option>
                    {positions.map((p) => (
                      <option key={p.positionId} value={p.positionId}>
                        {p.positionName || 'Unnamed Position'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="min-w-0">
                <label className={LABEL_CLASS}>Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className={SELECT_CLASS}
                >
                  <option value="">All Statuses</option>
                  {Object.keys(STATUS_CFG).map((s) => (
                    <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>

              {(isHr || isManager) && (
                <div className="min-w-0">
                  <label className={LABEL_CLASS}>Search Employee</label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Type to search..."
                      value={searchName}
                      onChange={(e) => setSearchName(e.target.value)}
                      className={`${INPUT_CLASS} pl-9`}
                    />
                  </div>
                </div>
              )}

              {(isHr || isManager) && (
                <div className="min-w-0">
                  <label className={LABEL_CLASS}>Employee</label>
                  <select
                    value={selectedEmployeeId || ''}
                    onChange={(e) => setSelectedEmployeeId(e.target.value ? Number(e.target.value) : undefined)}
                    className={SELECT_CLASS}
                  >
                    <option value="">All Employees</option>
                    {employeeFilterOptions.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name} - {employee.staffNo}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="min-w-0">
                <label className={LABEL_CLASS}>Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>

              <div className="min-w-0">
                <label className={LABEL_CLASS}>End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>

              {(isHr || isManager) && (
                <div className="min-w-0">
                  <label className={LABEL_CLASS}>PIP Reference</label>
                  <select
                    value={selectedPipId || ''}
                    onChange={(e) => {
                      const nextPipId = Number.parseInt(e.target.value, 10)
                      setSelectedPipId(Number.isFinite(nextPipId) ? nextPipId : undefined)
                    }}
                    className={SELECT_CLASS}
                  >
                    <option value="">All PIPs</option>
                    {uniquePips.map((pip) => (
                      <option key={pip.id} value={pip.id}>
                        PIP #{pip.id} - {getPipEmployeeName(pip)}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Data Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-slate-50/40">
                <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Employee</th>
                <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Position</th>
                {isHr && <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Department</th>}
                <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">KPI Score</th>
                <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 text-center">Status</th>
                <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Period</th>
                <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Progress</th>
                <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {paginatedPips.map((pip) => {
                const emp: EmployeeDisplay | undefined = pip.employee.employee
                const empName = emp?.employeeName || 'N/A'
                const cfg = STATUS_CFG[pip.status] || STATUS_CFG.CLOSED
                const closedSuccessful = pip.status === 'CLOSED' && pip.finalOutcome === 'SUCCESSFUL'
                const closedFailed = pip.status === 'CLOSED' && pip.finalOutcome === 'FAILED'
                const displayCfg = closedSuccessful
                  ? { bg: 'bg-emerald-50 ring-1 ring-emerald-200/60', text: 'text-emerald-700', dot: 'bg-emerald-500' }
                  : closedFailed
                    ? { bg: 'bg-red-50 ring-1 ring-red-200/60', text: 'text-red-700', dot: 'bg-red-500' }
                    : cfg

                return (
                  <tr key={pip.id} className="group transition-colors hover:bg-slate-50/60">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={empName} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-800 group-hover:text-[#2463eb] transition-colors">
                            {empName}
                          </p>
                          <p className="text-[11px] text-slate-400 font-medium">
                            ID: {getPipStaffNo(pip)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-slate-600">{getPositionName(emp)}</span>
                    </td>
                    {isHr && (
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                          {getDepartmentName(emp)}
                        </span>
                      </td>
                    )}
                    <td className="px-5 py-4">
                      <span className={`text-sm font-bold ${
                        pip.kpiScore == null ? 'text-slate-400' :
                        pip.kpiScore >= 70 ? 'text-emerald-600' :
                        pip.kpiScore >= 40 ? 'text-amber-600' :
                        'text-red-600'
                      }`}>
                        {formatKpiScore(pip.kpiScore)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${displayCfg.bg} ${displayCfg.text}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${displayCfg.dot}`} />
                        {getStatusDisplayLabel(pip.status, pip.finalOutcome)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-medium text-slate-600">
                          {formatDateValue(pip.startDate)}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          to {formatDateValue(pip.endDate)}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <ProgressBadge percentage={pip.overallProgressPercentage} />
                        {pip.updatedAt && (
                          <span className="text-[10px] text-slate-400 whitespace-nowrap hidden xl:block">
                            {new Date(pip.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setLogViewerPipId(pip.id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-slate-100 hover:text-[#2463eb]"
                          title="View Activity Log"
                        >
                          <History className="h-4 w-4" />
                        </button>
                        <Link
                          to={`${location.pathname}/${pip.id}`}
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-[#2463eb] transition-all hover:bg-[#2463eb]/5"
                        >
                          View
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {tablePips.length === 0 && (
                <tr>
                  <td colSpan={isHr ? 8 : 7} className="px-5 py-20">
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                        <BarChart3 className="h-8 w-8 text-slate-300" />
                      </div>
                      <p className="mt-4 text-sm font-semibold text-slate-500">No PIP records found</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {hasActiveFilters
                          ? 'Try adjusting your filters or search terms'
                          : 'No performance improvement plans have been created yet'
                        }
                      </p>
                      {hasActiveFilters && (
                        <button
                          onClick={clearAllFilters}
                          className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition-all hover:bg-slate-50"
                        >
                          <RotateCcw className="h-3 w-3" />
                          Clear Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Related PIP Detail Overview */}
      {(isHr || isManager) && hasActiveFilters && exportTargetPips.length > 0 && (
        <section className="rounded-xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-400" />
              <h2 className="text-sm font-bold text-slate-800">Related PIP Detail Overview</h2>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                {exportTargetPips.length} records
              </span>
            </div>
          </div>
          <div className="max-h-[480px] overflow-auto">
            <table className="min-w-[2600px] text-left text-xs">
              <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-sm">
                <tr>
                  {onePagePipDetailRows[0].map((heading) => (
                    <th key={String(heading)} className="whitespace-nowrap border-b border-slate-200 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      {String(heading)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {onePagePipDetailRows.slice(1).map((row, rowIndex) => (
                  <tr key={`${row[0]}-${rowIndex}`} className="align-top transition-colors hover:bg-slate-50/50">
                    {row.map((cell, cellIndex) => (
                      <td key={`${row[0]}-${cellIndex}`} className="max-w-[260px] whitespace-pre-wrap px-4 py-3 text-slate-600">
                        {String(cell || '-')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Pagination */}
      {tablePips.length > 0 && (
        <div className="flex flex-col gap-4 rounded-xl border border-slate-200/80 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
            <span>
              Showing <span className="font-semibold text-slate-700">{startIndex} - {endIndex}</span> of{' '}
              <span className="font-semibold text-slate-700">{tablePips.length}</span> records
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400">Rows:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => setRowsPerPage(Number(e.target.value))}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition-all hover:border-slate-300 focus:border-[#2463eb] focus:outline-none focus:ring-2 focus:ring-[#2463eb]/10"
              >
                {[5, 10, 20, 50].map((rows) => (
                  <option key={rows} value={rows}>{rows}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={safeCurrentPage === 1}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronUp className="h-3 w-3 rotate-[-90deg]" />
              Prev
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (safeCurrentPage <= 3) {
                  pageNum = i + 1
                } else if (safeCurrentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = safeCurrentPage - 2 + i
                }
                const isActive = pageNum === safeCurrentPage
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`h-9 min-w-[36px] rounded-lg border text-xs font-semibold transition-all ${
                      isActive
                        ? 'border-[#2463eb] bg-gradient-to-r from-[#2463eb] to-[#1d4ed8] text-white shadow-sm shadow-blue-200/50'
                        : 'border-slate-200 bg-white text-slate-500 hover:border-[#2463eb]/30 hover:bg-[#2463eb]/5 hover:text-[#2463eb]'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={safeCurrentPage === totalPages}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ChevronUp className="h-3 w-3 rotate-90" />
            </button>
          </div>
        </div>
      )}

      {/* Activity Log Modal */}
      {logViewerPipId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm animate-fade-in"
            onClick={() => setLogViewerPipId(null)}
          />
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl animate-scale-in">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-6 py-4 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#eff6ff]">
                  <History className="h-4 w-4 text-[#2463eb]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">PIP Activity History</h3>
                  <p className="text-[11px] font-medium text-slate-400">
                    Viewing audit log for PIP #{logViewerPipId}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setLogViewerPipId(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[calc(90vh-64px)] overflow-y-auto p-6">
              <PipUnifiedLog pipId={logViewerPipId} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
