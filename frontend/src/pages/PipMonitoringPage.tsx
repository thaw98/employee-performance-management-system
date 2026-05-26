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

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-blue-100 text-blue-700',
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
  .map((meeting) => [
    `${formatDateTimeValue(meeting.startMeetingTime || meeting.meetingTime)} to ${formatDateTimeValue(meeting.endMeetingTime)}`,
    `Total Hours: ${meeting.totalHours ?? '-'}`,
    meeting.status || '-',
    (meeting as { notes?: string }).notes || '',
  ].join(' | '))
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

const FILTER_LABEL_CLASS =
  'mb-2 block min-h-[2rem] text-xs font-bold uppercase leading-tight tracking-wider text-slate-500'
const FILTER_CONTROL_CLASS =
  'h-11 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
const FILTER_SELECT_CLASS = `${FILTER_CONTROL_CLASS} disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-700`

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
      'Follow-Up Meetings',
      'Expected Improvements',
      'Reason for Plan',
      'Objectives',
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
      getPipMeetingSummary(pip),
      pip.expectedImprovements || '',
      pip.reasonForPlan || '',
      getPipObjectiveSummary(pip),
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
  meetings: [
    ['PIP Reference', 'Employee', 'Department', 'Position', 'Manager', 'Follow-Up Meetings'],
    ...bundles.map(({ pip }) => [
      `PIP #${pip.id}`,
      getPipEmployeeName(pip),
      getPipDepartmentName(pip),
      getPipPositionName(pip),
      getPipManagerName(pip),
      getPipMeetingSummary(pip) || 'No follow-up meetings',
    ]),
  ],
})

const buildPipSummaryPdfRows = (pips: Pip[]) => [
  [
    'PIP',
    'Employee',
    'Department',
    'Position',
    'Manager',
    'Duration',
    'Hours',
    'Progress',
    'Follow-Up',
    'Outcome',
  ],
  ...pips.map((pip) => [
    `#${pip.id}`,
    getPipEmployeeName(pip),
    getPipDepartmentName(pip),
    getPipPositionName(pip),
    getPipManagerName(pip),
    `${formatDateValue(pip.startDate)} - ${formatDateValue(pip.endDate)}`,
    `${pip.completedHours ?? 0}/${pip.totalHours ?? 0}`,
    `${pip.overallProgressPercentage ?? 0}%`,
    getPipMeetingSummary(pip) || 'No follow-up meetings',
    pip.finalOutcome || '-',
  ]),
]

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
  const monitoringExportName = `pip-monitoring-${isHr ? 'hr' : 'manager'}-${selectedPip ? `pip-${selectedPip.id}` : 'all'}-${new Date().toISOString().slice(0, 10)}`
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
      XLSX.writeFile(workbook, `${monitoringExportName}.xlsx`)
    } catch (error) {
      console.error('[PIP Monitoring] Export failed:', error)
      setExportError('Failed to export PIP data.')
    }
  }

  const handlePrintPips = async () => {
    if (exportTargetPips.length === 0) return
    try {
      setExportError(null)
      const summaryRows = buildPipSummaryPdfRows(exportTargetPips)
      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
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
        head: [summaryRows[0].map((heading) => String(heading))],
        body: summaryRows.slice(1).map((row) => row.map((cell) => String(cell || '-'))),
        startY: 104,
        theme: 'grid',
        styles: {
          fontSize: 7,
          cellPadding: 4,
          overflow: 'linebreak',
          valign: 'top',
        },
        columnStyles: {
          8: { cellWidth: 180 },
        },
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: 255,
          fontStyle: 'bold',
        },
        margin: { top: 36, right: 24, bottom: 36, left: 24 },
      })
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.text(`Total PIPs: ${exportTargetPips.length}`, 36, doc.internal.pageSize.getHeight() - 32)
      const pageCount = doc.getNumberOfPages()
      for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
        doc.setPage(pageNumber)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.text(`Page ${pageNumber} of ${pageCount}`, doc.internal.pageSize.getWidth() - 36, doc.internal.pageSize.getHeight() - 18, {
          align: 'right',
        })
      }
      doc.save(`${monitoringExportName}.pdf`)
    } catch (error) {
      console.error('[PIP Monitoring] Print failed:', error)
      setExportError('Failed to create PIP PDF.')
    }
  }

  if (isLoading) return <div className="p-8 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div><span className="ml-3">Loading PIPs...</span></div>

  if (isError) {
    const apiError = error as ApiError | undefined
    const errorMessage = apiError?.data?.message || apiError?.error || 'Failed to load PIP records.'
    return (
      <div className="p-8">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
          <h2 className="text-lg font-bold">Unable to load PIP Monitoring</h2>
          <p className="mt-2 text-sm">{errorMessage}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-8 max-w-[1600px] mx-auto">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">PIP Monitoring</h1>
          <p className="text-slate-500 mt-1">Manage and track performance improvement plans across your scope.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 lg:justify-end">
          {(isHr || isManager) && (
            <>
              <button
                type="button"
                onClick={handleExportPips}
                disabled={exportTargetPips.length === 0}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300 sm:flex-none"
              >
                <i className="bi bi-download" />
                Export Excel
              </button>
              <button
                type="button"
                onClick={handlePrintPips}
                disabled={exportTargetPips.length === 0}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300 sm:flex-none"
              >
                <i className="bi bi-printer" />
                Export PDF
              </button>
            </>
          )}
          {canCreate && (
            <Link
              to="create"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 hover:scale-105 active:scale-95 sm:flex-none"
            >
              <i className="bi bi-plus-lg" />
              Create PIP
            </Link>
          )}
        </div>
      </div>

      {exportError && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {exportError}
        </div>
      )}

      {/* Advanced Filters */}
      <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {/* Department Filter - Only for HR or if Manager has multiple (unlikely based on current backend) */}
          {(isHr || isManager) && (
            <div className="min-w-0">
              <label className={FILTER_LABEL_CLASS}>Department</label>
              <select
                value={filterDept || ''}
                onChange={(e) => {
                  setFilterDept(e.target.value ? Number(e.target.value) : undefined)
                  setFilterPos(undefined) // Reset position when department changes
                }}
                disabled={!isHr}
                className={FILTER_SELECT_CLASS}
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

          {/* Position Filter */}
          {(isHr || isManager) && (
            <div className="min-w-0">
              <label className={FILTER_LABEL_CLASS}>Position</label>
              <select
                value={filterPos || ''}
                onChange={(e) => setFilterPos(e.target.value ? Number(e.target.value) : undefined)}
                className={FILTER_SELECT_CLASS}
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

          {/* Status Filter */}
          <div className="min-w-0">
            <label className={FILTER_LABEL_CLASS}>Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={FILTER_SELECT_CLASS}
            >
              <option value="">All Statuses</option>
              {Object.keys(STATUS_COLORS).map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>

          {/* Employee Name Search */}
          {(isHr || isManager) && (
            <div className="min-w-0">
              <label className={FILTER_LABEL_CLASS}>Employee Name</label>
              <div className="relative">
                <i className="bi bi-search pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className={`${FILTER_CONTROL_CLASS} pl-9 pr-4`}
                />
              </div>
            </div>
          )}

          {(isHr || isManager) && (
            <div className="min-w-0">
              <label className={FILTER_LABEL_CLASS}>Employee</label>
              <select
                value={selectedEmployeeId || ''}
                onChange={(e) => setSelectedEmployeeId(e.target.value ? Number(e.target.value) : undefined)}
                className={FILTER_SELECT_CLASS}
              >
                <option value="">All Employees</option>
                {employeeFilterOptions.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name} - {employee.staffNo} - {employee.department || 'No Department'}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Start Date */}
          <div className="min-w-0">
            <label className={FILTER_LABEL_CLASS}>Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={FILTER_CONTROL_CLASS}
            />
          </div>

          {/* End Date */}
          <div className="min-w-0">
            <label className={FILTER_LABEL_CLASS}>End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={FILTER_CONTROL_CLASS}
            />
          </div>

          {(isHr || isManager) && (
            <div className="min-w-0">
              <label className={FILTER_LABEL_CLASS}>PIP</label>
              <select
                value={selectedPipId || ''}
                onChange={(e) => {
                  const nextPipId = Number.parseInt(e.target.value, 10)
                  setSelectedPipId(Number.isFinite(nextPipId) ? nextPipId : undefined)
                }}
                className={FILTER_SELECT_CLASS}
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

        <div className="mt-4 flex justify-end">
          <button
            onClick={() => {
              setFilterDept(undefined)
              setFilterPos(undefined)
              setFilterStatus('')
              setSearchName('')
              setSelectedEmployeeId(undefined)
              setStartDate('')
              setEndDate('')
              setSelectedPipId(undefined)
            }}
            className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-100">
        <div className="overflow-x-auto">
        <table className="min-w-[980px] w-full text-left">
          <thead className="border-b border-slate-200 bg-slate-50/50">
            <tr>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Employee</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Position</th>
              {isHr && <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Department</th>}
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">KPI Score</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-center">Status</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Start Date</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">End Date</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Overall Progress</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedPips.map((pip) => {
              const emp: EmployeeDisplay | undefined = pip.employee.employee
              return (
                <tr key={pip.id} className="group hover:bg-slate-50 transition-all duration-200">
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{emp?.employeeName || 'N/A'}</span>
                      <span className="text-xs text-slate-400">Staff ID: {getPipStaffNo(pip)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-sm text-slate-600 font-medium">{getPositionName(emp)}</span>
                  </td>
                  {isHr && (
                    <td className="px-6 py-5 text-sm text-slate-600">
                      {getDepartmentName(emp)}
                    </td>
                  )}
                  <td className="px-6 py-5 text-sm font-bold text-slate-700">
                    {formatKpiScore(pip.kpiScore)}
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${pip.status === 'CLOSED' && pip.finalOutcome === 'SUCCESSFUL' ? 'bg-green-100 text-green-700' :
                      pip.status === 'CLOSED' && pip.finalOutcome === 'FAILED' ? 'bg-red-100 text-red-700' :
                        (STATUS_COLORS[pip.status] || 'bg-slate-100 text-slate-700')
                      }`}>
                      {getStatusDisplayLabel(pip.status, pip.finalOutcome)}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-sm text-slate-600 font-medium">
                    {formatDateValue(pip.startDate)}
                  </td>
                  <td className="px-6 py-5 text-sm text-slate-600 font-medium">
                    {formatDateValue(pip.endDate)}
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-1.5">
                      <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100 shadow-inner">
                        <div
                          className={`h-full transition-all duration-500 ${pip.overallProgressPercentage >= 70 ? 'bg-green-500' : pip.overallProgressPercentage >= 30 ? 'bg-blue-500' : 'bg-orange-500'}`}
                          style={{ width: `${pip.overallProgressPercentage}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-tight">
                        {pip.overallProgressPercentage}% COMPLETED
                        {pip.updatedAt && (
                          <span className="ml-2 border-l border-slate-200 pl-2">
                            Updated {new Date(pip.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                          </span>
                        )}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => setLogViewerPipId(pip.id)}
                        className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition-all"
                        title="View Activity Log"
                      >
                        <i className="bi bi-clock-history text-lg" />
                      </button>
                      <Link
                        to={`${location.pathname}/${pip.id}`}
                        className="inline-flex items-center gap-1 text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        View Details
                        <i className="bi bi-chevron-right text-[10px]" />
                      </Link>
                    </div>
                  </td>
                </tr>
              )
            })}
            {tablePips.length === 0 && (
              <tr>
                <td colSpan={isHr ? 9 : 8} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <i className="bi bi-clipboard-x text-5xl mb-4 opacity-20" />
                    <p className="text-lg font-medium">No PIP records found matching your criteria.</p>
                    <p className="text-sm">Try adjusting your filters or search terms.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {(isHr || isManager) && hasActiveFilters && exportTargetPips.length > 0 && (
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-100">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="text-lg font-black text-slate-900">Related PIP Detail Overview</h2>
          </div>
          <div className="max-h-[520px] overflow-auto">
            <table className="min-w-[2600px] text-left text-xs">
              <thead className="sticky top-0 z-10 bg-slate-50">
                <tr>
                  {onePagePipDetailRows[0].map((heading) => (
                    <th key={String(heading)} className="whitespace-nowrap border-b border-slate-200 px-4 py-3 font-black uppercase tracking-wider text-slate-500">
                      {String(heading)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {onePagePipDetailRows.slice(1).map((row, rowIndex) => (
                  <tr key={`${row[0]}-${rowIndex}`} className="align-top hover:bg-slate-50">
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
      {tablePips.length > 0 && (
        <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-md shadow-slate-100 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
            <span>
              Showing <span className="font-bold text-slate-700">{startIndex} - {endIndex}</span> of{' '}
              <span className="font-bold text-slate-700">{tablePips.length}</span> employees
            </span>
            <label className="flex items-center gap-2">
              <span className="text-slate-400">Rows:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => setRowsPerPage(Number(e.target.value))}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {[5, 10, 20, 50].map((rows) => (
                  <option key={rows} value={rows}>{rows}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={safeCurrentPage === 1}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-400 transition-colors hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:text-slate-400"
            >
              <i className="bi bi-chevron-left text-xs" />
              Prev
            </button>
            <span className="flex h-11 min-w-11 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-bold text-white shadow-sm shadow-blue-200">
              {safeCurrentPage}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={safeCurrentPage === totalPages}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-400 transition-colors hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:text-slate-400"
            >
              Next
              <i className="bi bi-chevron-right text-xs" />
            </button>
          </div>
        </div>
      )}

      {logViewerPipId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setLogViewerPipId(null)}
          />
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[2rem] bg-slate-50 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/80 px-8 py-5 backdrop-blur-md">
              <div>
                <h3 className="text-xl font-black text-slate-900">PIP Activity History</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Viewing Audit Log for PIP #{logViewerPipId}</p>
              </div>
              <button
                onClick={() => setLogViewerPipId(null)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-all hover:bg-slate-200 hover:text-slate-900"
              >
                <i className="bi bi-x-lg" />
              </button>
            </div>
            <div className="p-8">
              <PipUnifiedLog pipId={logViewerPipId} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
