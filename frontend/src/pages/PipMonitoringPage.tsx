import * as XLSX from 'xlsx'
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

const formatDateValue = (value?: string) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
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
  })
}

const htmlEscape = (value: unknown) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;')

const getPipEmployeeName = (pip: Pip) => pip.employee.employee?.employeeName || pip.employee.email || 'N/A'
const getPipManagerName = (pip: Pip) => pip.manager.employee?.employeeName || pip.manager.email || 'N/A'
const getPipEmployeeId = (pip: Pip) => pip.employee.employee?.id ?? pip.employee.employeeId ?? ''
const getPipDepartmentName = (pip: Pip) => getDepartmentName(pip.employee.employee as EmployeeDisplay | undefined)
const getPipPositionName = (pip: Pip) => getPositionName(pip.employee.employee as EmployeeDisplay | undefined)
const getPipObjectiveSummary = (pip: Pip) => pip.objectives
  .map((objective) => `${objective.description} (${objective.progressPercentage}%)`)
  .join('; ')
const getPipMeetingSummary = (pip: Pip) => (pip.followUpMeetings ?? [])
  .map((meeting) => `${formatDateTimeValue(meeting.meetingTime)} - ${meeting.status}`)
  .join('; ')

const buildPipExportRows = (bundles: PipExportBundle[]) => ({
  details: [
    [
      'PIP Reference',
      'Employee',
      'Employee ID',
      'Department',
      'Position',
      'Manager',
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
      getPipEmployeeId(pip),
      getPipDepartmentName(pip),
      getPipPositionName(pip),
      getPipManagerName(pip),
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
    ...bundles.flatMap(({ pip, trainingHistory }) => trainingHistory.map((training) => [
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

export default function PipMonitoringPage() {
  const { user } = useSelector((state: RootState) => state.auth)
  const userRole = user?.role?.toUpperCase().replace(/\s+/g, '_') || ''
  const isHr = userRole === 'HR'
  const isManager = userRole === 'DEPARTMENT_HEAD' || userRole === 'TEAM_HEAD' || userRole === 'MANAGER'

  const [filterDept, setFilterDept] = useState<number | undefined>(undefined)
  const [filterPos, setFilterPos] = useState<number | undefined>(undefined)
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [searchName, setSearchName] = useState('')
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

  const filteredPips = useMemo(() => {
    if (!pips) return []
    return pips.slice().sort((a, b) => {
      const isAActive = ['ACTIVE', 'AUTO_CLOSED', 'REOPEN_REQUESTED'].includes(a.status)
      const isBActive = ['ACTIVE', 'AUTO_CLOSED', 'REOPEN_REQUESTED'].includes(b.status)
      if (isAActive && !isBActive) return -1
      if (!isAActive && isBActive) return 1

      const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime()
      const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime()
      return timeB - timeA
    })
  }, [pips])

  useEffect(() => {
    setCurrentPage(1)
  }, [filterDept, filterPos, filterStatus, searchName, startDate, endDate, rowsPerPage])

  const totalPages = Math.max(1, Math.ceil(filteredPips.length / rowsPerPage))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const startIndex = filteredPips.length === 0 ? 0 : (safeCurrentPage - 1) * rowsPerPage + 1
  const endIndex = Math.min(safeCurrentPage * rowsPerPage, filteredPips.length)
  const paginatedPips = filteredPips.slice((safeCurrentPage - 1) * rowsPerPage, safeCurrentPage * rowsPerPage)
  const selectedPip = selectedPipId == null ? undefined : filteredPips.find((pip) => pip.id === selectedPipId)
  const exportTargetPips = selectedPip ? [selectedPip] : filteredPips
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

  const handleExportPips = async () => {
    if (exportTargetPips.length === 0) return
    try {
      setExportError(null)
      const bundles = await getPipExportBundles()
      const rows = buildPipExportRows(bundles)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows.details), 'PIP Details')
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows.training), 'Training History')
      XLSX.writeFile(workbook, `pip-export-${selectedPip ? `pip-${selectedPip.id}` : 'all'}-${new Date().toISOString().slice(0, 10)}.xlsx`)
    } catch (error) {
      console.error('[PIP Monitoring] Export failed:', error)
      setExportError('Failed to export PIP data.')
    }
  }

  const renderPrintableTable = (rows: unknown[][]) => `
    <table>
      <tbody>
        ${rows.map((row, index) => `
          <tr>
            ${row.map((cell) => index === 0 ? `<th>${htmlEscape(cell)}</th>` : `<td>${htmlEscape(cell)}</td>`).join('')}
          </tr>
        `).join('')}
      </tbody>
    </table>
  `

  const handlePrintPips = async () => {
    if (exportTargetPips.length === 0) return
    try {
      setExportError(null)
      const bundles = exportTargetPips.map((pip) => ({ pip, trainingHistory: [] }))
      const rows = buildPipExportRows(bundles)
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        setExportError('Unable to open print window. Please allow popups and try again.')
        return
      }
      printWindow.document.write(`
        <html>
          <head>
            <title>PIP Details</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
              h1 { font-size: 22px; margin-bottom: 18px; }
              table { width: 100%; border-collapse: collapse; font-size: 10px; }
              th, td { border: 1px solid #cbd5e1; padding: 6px; text-align: left; vertical-align: top; }
              th { background: #f1f5f9; }
            </style>
          </head>
          <body>
            <h1>PIP Details</h1>
            ${renderPrintableTable(rows.details)}
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
    } catch (error) {
      console.error('[PIP Monitoring] Print failed:', error)
      setExportError('Failed to print PIP data.')
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
    <div className="p-8 max-w-[1600px] mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">PIP Monitoring</h1>
          <p className="text-slate-500 mt-1">Manage and track performance improvement plans across your scope.</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          {(isHr || isManager) && (
            <>
              <button
                type="button"
                onClick={handleExportPips}
                disabled={exportTargetPips.length === 0}
                className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <i className="bi bi-download" />
                Export
              </button>
              <button
                type="button"
                onClick={handlePrintPips}
                disabled={exportTargetPips.length === 0}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
              >
                <i className="bi bi-printer" />
                Print
              </button>
            </>
          )}
          {canCreate && (
            <Link
              to="create"
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 hover:scale-105 active:scale-95"
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
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {/* Department Filter - Only for HR or if Manager has multiple (unlikely based on current backend) */}
          {(isHr || isManager) && (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Department</label>
              <select
                value={filterDept || ''}
                onChange={(e) => {
                  setFilterDept(e.target.value ? Number(e.target.value) : undefined)
                  setFilterPos(undefined) // Reset position when department changes
                }}
                disabled={!isHr}
                className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-700"
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
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Position</label>
              <select
                value={filterPos || ''}
                onChange={(e) => setFilterPos(e.target.value ? Number(e.target.value) : undefined)}
                className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              {Object.keys(STATUS_COLORS).map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>

          {/* Employee Name Search */}
          {(isHr || isManager) && (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Employee Name</label>
              <div className="relative">
                <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 py-2 pl-9 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Start Date */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Start Date From</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* End Date */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">End Date To</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {(isHr || isManager) && (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">PIP</label>
              <select
                value={selectedPipId || ''}
                onChange={(e) => setSelectedPipId(e.target.value ? Number(e.target.value) : undefined)}
                className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All PIPs</option>
                {filteredPips.map((pip) => (
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
        <table className="w-full text-left">
          <thead className="border-b border-slate-200 bg-slate-50/50">
            <tr>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Employee</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Position</th>
              {isHr && <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Department</th>}
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-center">Status</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Start Date</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">End Date</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Progress</th>
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
                      <span className="text-xs text-slate-400">ID: {emp?.id || 'N/A'}</span>
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
                  <td className="px-6 py-5 text-center">
                    <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${pip.status === 'CLOSED' && pip.finalOutcome === 'SUCCESSFUL' ? 'bg-green-100 text-green-700' :
                      pip.status === 'CLOSED' && pip.finalOutcome === 'FAILED' ? 'bg-red-100 text-red-700' :
                        (STATUS_COLORS[pip.status] || 'bg-slate-100 text-slate-700')
                      }`}>
                      {getStatusDisplayLabel(pip.status, pip.finalOutcome)}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-sm text-slate-600 font-medium">
                    {new Date(pip.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/')}
                  </td>
                  <td className="px-6 py-5 text-sm text-slate-600 font-medium">
                    {new Date(pip.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/')}
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
            {filteredPips.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-20 text-center">
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

      {(isHr || isManager) && exportTargetPips.length > 0 && (
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
      {filteredPips.length > 0 && (
        <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-md shadow-slate-100 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
            <span>
              Showing <span className="font-bold text-slate-700">{startIndex} - {endIndex}</span> of{' '}
              <span className="font-bold text-slate-700">{filteredPips.length}</span> employees
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
