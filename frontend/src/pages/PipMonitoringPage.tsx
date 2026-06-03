import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { useGetPipsQuery, useLazyGetTrainingHistoryQuery } from '../features/pip/pipApi'
import type { Pip, TrainingRecord } from '../features/pip/pipApi'
import { skipToken } from '@reduxjs/toolkit/query'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useEffect, useState, useMemo } from 'react'
import type { RootState } from '../app/store'
import { useGetDepartmentsQuery, useGetDepartmentPositionsQuery } from '../features/hrCreateEmployee/hrEmployeeAccountApi'
import PipUnifiedLog from '../features/pip/components/PipUnifiedLog'
import { PipCreateModal } from '../features/pip/components/PipCreateModal'
import { addPdfFooterBranding, addPdfHeaderBranding, addPdfHeaderLogo, loadPdfLogo } from '../utils/pdfBranding'

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-blue-100 text-blue-700',
  AUTO_CLOSED: 'bg-amber-100 text-amber-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  CLOSED: 'bg-slate-100 text-slate-700',
}

const getStatusDisplayLabel = (status: string, finalOutcome?: string) => {
  if (status === 'REOPEN_REQUESTED') return 'Active'
  if (status === 'DENIED') return 'Closed'
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
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return value
  const date = new Date(value.includes('T') ? value : `${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

const DISPLAY_DATE_PATTERN = /^\d{2}\/\d{2}\/\d{4}$/

const parseDisplayDate = (value: string) => {
  if (!DISPLAY_DATE_PATTERN.test(value)) return null
  const [day, month, year] = value.split('/').map(Number)
  const parsed = new Date(year, month - 1, day)
  if (parsed.getFullYear() !== year || parsed.getMonth() !== month - 1 || parsed.getDate() !== day) return null
  return parsed
}

const toIsoDate = (value: string) => {
  const parsed = parseDisplayDate(value)
  if (!parsed) return ''
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`
}

const toDisplayDateFromIso = (value: string) => {
  if (!value) return ''
  const [year, month, day] = value.split('-')
  if (!year || !month || !day) return ''
  return `${day}/${month}/${year}`
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

const isPipForCurrentEmployee = (pip: Pip, currentUser?: { id?: number; employeeId?: string | null } | null) => {
  if (!currentUser) return false

  const authUserId = currentUser.id == null ? null : String(currentUser.id)
  const authEmployeeId = currentUser.employeeId == null ? null : String(currentUser.employeeId)
  const pipUserId = pip.employee.id == null ? null : String(pip.employee.id)
  const pipEmployeeRecordId = pip.employee.employee?.id == null ? null : String(pip.employee.employee.id)
  const pipStaffNo = pip.employee.employeeId == null ? null : String(pip.employee.employeeId)

  return Boolean(
    (authUserId && pipUserId === authUserId)
    || (authEmployeeId && (pipEmployeeRecordId === authEmployeeId || pipStaffNo === authEmployeeId)),
  )
}

const getDateRangeLabel = (startDate: string, endDate: string) => {
  if (startDate && endDate) return `${formatDateValue(startDate)} to ${formatDateValue(endDate)}`
  if (startDate) return `From ${formatDateValue(startDate)}`
  if (endDate) return `Through ${formatDateValue(endDate)}`
  return 'All dates'
}

const isInvalidDateRange = (startDate: string, endDate: string) => {
  if (!startDate || !endDate) return false
  const start = parseDisplayDate(startDate)
  const end = parseDisplayDate(endDate)
  if (!start || !end) return false
  return end < start
}

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
  const isAudit = user?.roleId === 5 || userRole === 'AUDIT'
  const canViewAllPips = isHr || isAudit
  const isManager = userRole === 'DEPARTMENT_HEAD' || userRole === 'TEAM_HEAD' || userRole === 'MANAGER'
  const isEmployee = !isHr && !isManager

  const [searchParams] = useSearchParams()
  const [filterDept, setFilterDept] = useState<number | undefined>(undefined)
  const [filterPos, setFilterPos] = useState<number | undefined>(undefined)
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [searchName, setSearchName] = useState(searchParams.get('search') || '')
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | undefined>(undefined)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedPipId, setSelectedPipId] = useState<number | undefined>(undefined)
  const [exportError, setExportError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [logViewerPipId, setLogViewerPipId] = useState<number | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const departmentFilter = canViewAllPips ? filterDept : undefined
  const invalidDateRange = isInvalidDateRange(startDate, endDate)
  const startDateIso = toIsoDate(startDate)
  const endDateIso = toIsoDate(endDate)

  const { data: pips, isLoading, isError, error, refetch } = useGetPipsQuery(invalidDateRange ? skipToken : {
    departmentId: departmentFilter,
    positionId: filterPos,
    pipId: selectedPipId,
    employeeName: searchName,
    status: filterStatus || undefined,
    startDate: startDateIso || undefined,
    endDate: endDateIso || undefined,
  })
  const { data: departmentPips } = useGetPipsQuery(
    canViewAllPips && typeof departmentFilter === 'number'
      ? { departmentId: departmentFilter }
      : skipToken,
  )
  const [loadTrainingHistory] = useLazyGetTrainingHistoryQuery()

  const managerDepartmentId = useMemo(() => {
    if (canViewAllPips) return undefined
    const firstPip = pips?.[0]
    const emp = firstPip?.employee as any
    const employeeObj = emp?.employee || emp
    const dept = employeeObj?.department
    if (dept) {
      return dept.departmentId || dept.id
    }
    return undefined
  }, [pips, canViewAllPips])

  const { data: departmentsData } = useGetDepartmentsQuery()
  const targetDepartmentId = canViewAllPips && typeof filterDept === 'number' ? filterDept : (!canViewAllPips && managerDepartmentId ? managerDepartmentId : undefined)
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
    if (canViewAllPips) return null
    const firstPip = pips?.[0]
    const emp = firstPip?.employee as any
    const employeeObj = emp?.employee || emp
    const dept = employeeObj?.department
    if (dept) {
      return dept.departmentName || dept.name || 'My Department'
    }
    return 'My Department'
  }, [pips, canViewAllPips])

  const location = useLocation()
  const canCreate = isManager && !canViewAllPips

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
  const selectedDepartmentName = canViewAllPips && typeof filterDept === 'number'
    ? departments.find((department) => department.departmentId === filterDept)?.departmentName ?? `Department #${filterDept}`
    : canViewAllPips
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
  const scopedPips = useMemo(() => {
    const unique = getUniquePips(pips)
    return isEmployee ? unique.filter((pip) => isPipForCurrentEmployee(pip, user)) : unique
  }, [isEmployee, pips, user])

  const filteredPips = useMemo(() => {
    return scopedPips.filter((pip) => {
      if (selectedPipId != null && pip.id !== selectedPipId) return false
      if (selectedEmployeeId == null) return true
      return getPipEmployeeRecordId(pip) === selectedEmployeeId
    }).sort((a, b) => {
      const isAActive = ['ACTIVE', 'AUTO_CLOSED'].includes(a.status)
      const isBActive = ['ACTIVE', 'AUTO_CLOSED'].includes(b.status)
      if (isAActive && !isBActive) return -1
      if (!isAActive && isBActive) return 1

      const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime()
      const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime()
      return timeB - timeA
    })
  }, [scopedPips, selectedEmployeeId, selectedPipId])

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
  const monitoringExportName = `pip-monitoring-${isAudit ? 'audit' : isHr ? 'hr' : 'manager'}-${selectedPip ? `pip-${selectedPip.id}` : 'all'}-${new Date().toISOString().slice(0, 10)}`
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
    if (invalidDateRange) return
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
    if (invalidDateRange) return
    if (exportTargetPips.length === 0) return
    try {
      setExportError(null)
      const summaryRows = buildPipSummaryPdfRows(exportTargetPips)
      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })

      const logoDataUrl = await loadPdfLogo()
      if (logoDataUrl) {
        addPdfHeaderLogo(doc, logoDataUrl, { x: 36, y: 18, width: 68, height: 34 })
      }

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
      addPdfHeaderBranding(doc, { margin: 36, y: 36 })

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
        addPdfFooterBranding(doc, { align: 'left', margin: 36, y: doc.internal.pageSize.getHeight() - 18 })
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

  const activePipsCount = useMemo(() => scopedPips.filter((p) => p.status === 'ACTIVE').length, [scopedPips])
  const completedPipsCount = useMemo(() => scopedPips.filter((p) => p.status === 'COMPLETED' || (p.status === 'CLOSED' && p.finalOutcome === 'SUCCESSFUL')).length, [scopedPips])
  const closedPipsCount = useMemo(() => scopedPips.filter((p) => p.status === 'CLOSED' || p.status === 'AUTO_CLOSED').length, [scopedPips])
  const avgProgress = useMemo(() => {
    if (scopedPips.length === 0) return 0
    const total = scopedPips.reduce((sum, p) => sum + Number(p.overallProgressPercentage || 0), 0)
    return Math.round(total / scopedPips.length)
  }, [scopedPips])

  if (isLoading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-[3px] border-slate-200 border-t-blue-600" />
        <p className="text-sm font-bold text-slate-400">Loading PIP records...</p>
      </div>
    </div>
  )

  if (isError) {
    const apiError = error as ApiError | undefined
    const errorMessage = apiError?.data?.message || apiError?.error || 'Failed to load PIP records.'
    return (
      <div className="p-8">
        <div className="rounded-[2rem] border border-red-100 bg-red-50 p-8 text-red-700">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600">
            <i className="bi bi-exclamation-triangle text-2xl" />
          </div>
          <h2 className="text-xl font-black text-slate-900">Unable to load PIP Monitoring</h2>
          <p className="mt-2 text-sm font-medium">{errorMessage}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-6 py-8 md:px-10 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">Performance Improvement</span>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">PIP Monitoring</h1>
          <p className="mt-3 text-sm font-bold text-slate-400">Manage and track performance improvement plans across your scope.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {(canViewAllPips || isManager) && (
            <>
              <button
                type="button"
                onClick={handleExportPips}
                disabled={exportTargetPips.length === 0}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-black text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40"
              >
                <i className="bi bi-download" /> Excel
              </button>
              <button
                type="button"
                onClick={handlePrintPips}
                disabled={exportTargetPips.length === 0}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-black text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40"
              >
                <i className="bi bi-printer" /> PDF
              </button>
            </>
          )}
          {canCreate && (
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-7 py-3 text-sm font-black text-white shadow-[0_8px_20px_-4px_rgba(37,99,235,0.4)] transition-all hover:bg-blue-700 hover:shadow-blue-500/40 active:scale-95"
            >
              <i className="bi bi-plus-lg" /> Create PIP
            </button>
          )}
        </div>
      </div>

      {isCreateModalOpen ? (
        <PipCreateModal
          onClose={() => setIsCreateModalOpen(false)}
          onCreated={() => {
            if (!invalidDateRange) void refetch()
          }}
        />
      ) : null}

      {exportError && (
        <div className="mb-8 rounded-2xl border border-red-100 bg-red-50 p-5 text-sm font-bold text-red-700">
          <i className="bi bi-exclamation-circle mr-2" />{exportError}
        </div>
      )}

      {/* Summary Stats Cards */}
      {!isEmployee && scopedPips.length > 0 && (
        <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="group relative overflow-hidden rounded-[2rem] border border-white bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:-translate-y-0.5">
            <div className="relative z-10">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <i className="bi bi-activity text-xl" />
              </div>
              <p className="text-3xl font-black text-slate-900 leading-none mb-1">{activePipsCount}</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active</p>
            </div>
            <div className="absolute -right-6 -bottom-6 h-24 w-24 rounded-full bg-blue-50 opacity-50 transition-transform duration-700 group-hover:scale-150" />
          </div>
          <div className="group relative overflow-hidden rounded-[2rem] border border-white bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:-translate-y-0.5">
            <div className="relative z-10">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <i className="bi bi-check2-circle text-xl" />
              </div>
              <p className="text-3xl font-black text-slate-900 leading-none mb-1">{completedPipsCount}</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Completed</p>
            </div>
            <div className="absolute -right-6 -bottom-6 h-24 w-24 rounded-full bg-emerald-50 opacity-50 transition-transform duration-700 group-hover:scale-150" />
          </div>
          <div className="group relative overflow-hidden rounded-[2rem] border border-white bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:-translate-y-0.5">
            <div className="relative z-10">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-600">
                <i className="bi bi-archive text-xl" />
              </div>
              <p className="text-3xl font-black text-slate-900 leading-none mb-1">{closedPipsCount}</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Closed</p>
            </div>
            <div className="absolute -right-6 -bottom-6 h-24 w-24 rounded-full bg-slate-50 opacity-50 transition-transform duration-700 group-hover:scale-150" />
          </div>
          <div className="group relative overflow-hidden rounded-[2rem] border border-white bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:-translate-y-0.5">
            <div className="relative z-10">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <i className="bi bi-graph-up-arrow text-xl" />
              </div>
              <p className="text-3xl font-black text-slate-900 leading-none mb-1">{avgProgress}%</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg Progress</p>
            </div>
            <div className="absolute -right-6 -bottom-6 h-24 w-24 rounded-full bg-indigo-50 opacity-50 transition-transform duration-700 group-hover:scale-150" />
          </div>
        </div>
      )}

      {/* Advanced Filters */}
      <div className="mb-8 rounded-[2rem] border border-white bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <i className="bi bi-funnel text-blue-600 text-lg" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filters</span>
          {hasActiveFilters && (
            <span className="ml-auto text-xs font-bold text-blue-600">{exportTargetPips.length} result{exportTargetPips.length !== 1 ? 's' : ''}</span>
          )}
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {(canViewAllPips || isManager) && (
            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Department</label>
              <select
                value={filterDept || ''}
                onChange={(e) => {
                  setFilterDept(e.target.value ? Number(e.target.value) : undefined)
                  setFilterPos(undefined)
                }}
                disabled={!canViewAllPips}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
              >
                {canViewAllPips ? <option value="">All Departments</option> : <option value="">{managerDepartmentName}</option>}
                {canViewAllPips && departments.map((d) => (
                  <option key={d.departmentId} value={d.departmentId}>
                    {d.departmentName || 'Unnamed Department'}
                  </option>
                ))}
              </select>
            </div>
          )}

          {(canViewAllPips || isManager) && (
            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Position</label>
              <select
                value={filterPos || ''}
                onChange={(e) => setFilterPos(e.target.value ? Number(e.target.value) : undefined)}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
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

          <div>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="">All Statuses</option>
              {Object.keys(STATUS_COLORS).map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>

          {(canViewAllPips || isManager) && (
            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Employee Name</label>
              <div className="relative">
                <i className="bi bi-search pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 text-sm font-bold text-slate-700 shadow-sm placeholder:text-slate-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>
          )}

          {(canViewAllPips || isManager) && (
            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Employee</label>
              <select
                value={selectedEmployeeId || ''}
                onChange={(e) => setSelectedEmployeeId(e.target.value ? Number(e.target.value) : undefined)}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
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

          <div>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Start Date</label>
            <div className="relative">
              <input
                type="text"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="dd/mm/yyyy"
                inputMode="numeric"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-4 pr-12 text-sm font-bold text-slate-700 shadow-sm placeholder:text-slate-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <label className="absolute inset-y-0 right-0 flex w-12 cursor-pointer items-center justify-center text-slate-400 hover:text-blue-600">
                <i className="bi bi-calendar3" />
                <input
                  type="date"
                  value={toIsoDate(startDate)}
                  onChange={(e) => setStartDate(toDisplayDateFromIso(e.target.value))}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  aria-label="Choose filter start date"
                />
              </label>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">End Date</label>
            <div className="relative">
              <input
                type="text"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="dd/mm/yyyy"
                inputMode="numeric"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-4 pr-12 text-sm font-bold text-slate-700 shadow-sm placeholder:text-slate-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <label className="absolute inset-y-0 right-0 flex w-12 cursor-pointer items-center justify-center text-slate-400 hover:text-blue-600">
                <i className="bi bi-calendar3" />
                <input
                  type="date"
                  value={toIsoDate(endDate)}
                  onChange={(e) => setEndDate(toDisplayDateFromIso(e.target.value))}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  aria-label="Choose filter end date"
                />
              </label>
            </div>
          </div>

          {(canViewAllPips || isManager) && (
            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">PIP</label>
              <select
                value={selectedPipId || ''}
                onChange={(e) => {
                  const nextPipId = Number.parseInt(e.target.value, 10)
                  setSelectedPipId(Number.isFinite(nextPipId) ? nextPipId : undefined)
                }}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="">All PIPs</option>
                {scopedPips.map((pip) => (
                  <option key={pip.id} value={pip.id}>
                    PIP #{pip.id} - {getPipEmployeeName(pip)}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {invalidDateRange && (
          <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-5 py-3 text-sm font-bold text-red-700">
            Start date must be on or before end date.
          </div>
        )}

        <div className="mt-6 flex justify-between items-center">
          {hasActiveFilters && (
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
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-5 py-2.5 text-xs font-black text-slate-500 uppercase tracking-widest transition-all hover:bg-slate-50 hover:text-slate-800"
            >
              <i className="bi bi-x-circle" /> Clear All Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-hidden rounded-[2rem] border border-white bg-white shadow-sm transition-all hover:shadow-xl">
        <div className="overflow-x-auto">
        <table className="min-w-[980px] w-full text-left">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Employee</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Position</th>
              {canViewAllPips && <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Department</th>}
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">KPI Score</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Status</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Start Date</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">End Date</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Progress</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedPips.map((pip) => {
              const emp: EmployeeDisplay | undefined = pip.employee.employee
              return (
                <tr key={pip.id} className="group transition-all duration-200 hover:bg-slate-50/80">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xs font-black text-blue-600">
                        {emp?.employeeName ? emp.employeeName.charAt(0).toUpperCase() : '?'}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors">{emp?.employeeName || 'N/A'}</span>
                        <span className="text-[10px] font-bold text-slate-400">Staff ID: {getPipStaffNo(pip)}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-sm font-bold text-slate-600">{getPositionName(emp)}</span>
                  </td>
                  {canViewAllPips && (
                    <td className="px-8 py-5">
                      <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600">
                        <i className="bi bi-building text-slate-400" /> {getDepartmentName(emp)}
                      </span>
                    </td>
                  )}
                  <td className="px-8 py-5">
                    <span className="text-sm font-black text-slate-800">{formatKpiScore(pip.kpiScore)}</span>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className={`inline-flex items-center rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-wide ${
                      pip.status === 'ACTIVE' ? 'bg-blue-50 text-blue-700' :
                      pip.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' :
                      pip.status === 'CLOSED' && pip.finalOutcome === 'SUCCESSFUL' ? 'bg-green-50 text-green-700' :
                      pip.status === 'CLOSED' && pip.finalOutcome === 'FAILED' ? 'bg-red-50 text-red-700' :
                      pip.status === 'AUTO_CLOSED' ? 'bg-amber-50 text-amber-700' :
                      'bg-slate-50 text-slate-600'
                    }`}>
                      <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${
                        pip.status === 'ACTIVE' ? 'bg-blue-600' :
                        pip.status === 'COMPLETED' || (pip.status === 'CLOSED' && pip.finalOutcome === 'SUCCESSFUL') ? 'bg-emerald-600' :
                        pip.status === 'CLOSED' && pip.finalOutcome === 'FAILED' ? 'bg-red-600' :
                        pip.status === 'AUTO_CLOSED' ? 'bg-amber-600' :
                        'bg-slate-400'
                      }`} />
                      {getStatusDisplayLabel(pip.status, pip.finalOutcome)}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-sm font-bold text-slate-600">{formatDateValue(pip.startDate)}</span>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-sm font-bold text-slate-600">{formatDateValue(pip.endDate)}</span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col gap-1.5 min-w-[140px]">
                      <div className="flex items-center gap-3">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              pip.overallProgressPercentage >= 70 ? 'bg-emerald-500' :
                              pip.overallProgressPercentage >= 30 ? 'bg-blue-500' : 'bg-amber-500'
                            }`}
                            style={{ width: `${pip.overallProgressPercentage}%` }}
                          />
                        </div>
                        <span className="min-w-[44px] text-right text-xs font-black text-slate-600">{pip.overallProgressPercentage}%</span>
                      </div>
                      {pip.updatedAt && (
                        <span className="text-[10px] font-bold text-slate-400">
                          Updated {new Date(pip.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setLogViewerPipId(pip.id)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600 transition-all hover:border-blue-200 hover:bg-blue-100"
                        title="View Activity Log"
                      >
                        <i className="bi bi-clock-history" />
                      </button>
                      <Link
                        to={`${location.pathname}/${pip.id}`}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 px-4 py-2 text-xs font-black text-blue-700 transition-all hover:bg-blue-100"
                      >
                        Details <i className="bi bi-chevron-right text-[9px]" />
                      </Link>
                    </div>
                  </td>
                </tr>
              )
            })}
            {tablePips.length === 0 && (
              <tr>
                <td colSpan={canViewAllPips ? 9 : 8} className="px-8 py-24 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-slate-50">
                      <i className="bi bi-clipboard-x text-4xl text-slate-300" />
                    </div>
                    <p className="text-lg font-black text-slate-400">No PIP records found</p>
                    <p className="mt-1 text-sm font-bold text-slate-400">Try adjusting your filters or search terms.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {(canViewAllPips || isManager) && hasActiveFilters && exportTargetPips.length > 0 && (
        <section className="mt-8 rounded-[2rem] border border-white bg-white shadow-sm">
          <div className="border-b border-slate-100 px-8 py-5">
            <h2 className="text-base font-black text-slate-900">Related PIP Detail Overview</h2>
          </div>
          <div className="max-h-[520px] overflow-auto">
            <table className="min-w-[2600px] text-left text-xs">
              <thead className="sticky top-0 z-10 bg-slate-50">
                <tr>
                  {onePagePipDetailRows[0].map((heading) => (
                    <th key={String(heading)} className="whitespace-nowrap border-b border-slate-200 px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                      {String(heading)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {onePagePipDetailRows.slice(1).map((row, rowIndex) => (
                  <tr key={`${row[0]}-${rowIndex}`} className="align-top hover:bg-slate-50/80">
                    {row.map((cell, cellIndex) => (
                      <td key={`${row[0]}-${cellIndex}`} className="max-w-[260px] whitespace-pre-wrap px-5 py-4 text-xs font-bold text-slate-600">
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
        <div className="mt-6 flex flex-col gap-4 rounded-[2rem] border border-white bg-white px-8 py-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="font-bold text-slate-500">
              Showing <span className="text-slate-800">{startIndex} - {endIndex}</span> of{' '}
              <span className="text-slate-800">{tablePips.length}</span> employees
            </span>
            <label className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Rows:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => setRowsPerPage(Number(e.target.value))}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                {[5, 10, 20, 50].map((rows) => (
                  <option key={rows} value={rows}>{rows}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={safeCurrentPage === 1}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-black text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <i className="bi bi-chevron-left text-[10px]" /> Prev
            </button>
            <span className="flex h-11 min-w-11 items-center justify-center rounded-2xl bg-blue-600 px-4 text-sm font-black text-white shadow-[0_4px_10px_-2px_rgba(37,99,235,0.3)]">
              {safeCurrentPage}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={safeCurrentPage === totalPages}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-black text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next <i className="bi bi-chevron-right text-[10px]" />
            </button>
          </div>
        </div>
      )}

      {logViewerPipId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
          <div
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            onClick={() => setLogViewerPipId(null)}
          />
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] bg-white shadow-2xl animate-scale-in">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/90 px-10 py-6 backdrop-blur-md">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">PIP Activity History</h3>
                <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Viewing audit log for PIP #{logViewerPipId}</p>
              </div>
              <button
                onClick={() => setLogViewerPipId(null)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-all hover:bg-slate-200 hover:text-slate-900"
              >
                <i className="bi bi-x-lg" />
              </button>
            </div>
            <div className="p-10">
              <PipUnifiedLog pipId={logViewerPipId} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
