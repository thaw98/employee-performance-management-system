import { useState, useCallback, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { skipToken } from '@reduxjs/toolkit/query'
import type { UpdateEmploymentStatusRequest, ProbationInfo } from '../../../features/hrEmployeeList/hrEmployeeApi'

import type { SortingState } from '@tanstack/react-table'
import toast from 'react-hot-toast'

import EmployeeTable from '../../../features/hrEmployeeList/components/EmployeeTable'
import EmployeeFilters from '../../../features/hrEmployeeList/components/EmployeeFilters'
import EmployeeStatsCards, {
  type EmployeeStatsCardKey,
  type EmployeeStatsCounts,
} from '../../../features/hrEmployeeList/components/EmployeeStatsCards'
import ConfirmActionModal from '../../../features/hrEmployeeList/components/ConfirmActionModal'
import EmployeeViewModal from '../../../features/hrEmployeeList/components/EmployeeViewModal'
import EditEmployeeModal from '../../../features/hrEmployeeList/components/EditEmployeeModal'
import EmployeeImportModal from '../../../features/hrEmployeeList/components/EmployeeImportModal'
import { TemporaryTransferModal } from '../../../features/hrEmployeeList/components/TemporaryTransferModal'
import { ReturnModal } from '../../../features/hrEmployeeList/components/ReturnModal'
import {
  useGetEmployeesQuery,
  useResendPasswordMutation,
  useUpdateEmploymentStatusMutation,
  useExportEmployeesMutation,
  useLazyGetEmployeesQuery,
  useLazyGetEmployeeViewByIdQuery,
} from '../../../features/hrEmployeeList/hrEmployeeApi'
import ChangeStatusModal from '../../../features/hrEmployeeList/components/ChangeStatusModal'
import { 
  useGetDepartmentsQuery, 
  useGetDepartmentPositionsQuery 
} from '../../../features/hrCreateEmployee/hrEmployeeAccountApi'
import { useAppSelector } from '../../../app/hooks'
import { downloadBlobFile } from '../../../utils/downloadBlobFile'
import { exportEmployeeListPdf } from '../../../utils/exportEmployeeListPdf'

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string)?.replace(/\/$/, '') ||
  'http://localhost:8080'

export default function EmployeeListPage() {
  const user = useAppSelector((s) => s.auth.user)
  const token = useAppSelector((s) => s.auth.token)
  const isHR = user?.roleId === 1
  const isAudit = user?.roleId === 5
  const isDepartmentManager = user?.roleId === 2
  const canFilterAllDepartments = isHR || isAudit
  const canExportEmployees = isHR || isAudit
  const canImportEmployees = isHR || isAudit

  // State for filters and pagination
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [search, setSearch] = useState('')
  const [departmentId, setDepartmentId] = useState<number | undefined>()
  const [positionId, setPositionId] = useState<number | undefined>()
  const [employmentStatus, setEmploymentStatus] = useState<string | undefined>()
  const [sorting, setSorting] = useState<SortingState>([{ id: 'staffNo', desc: false }])

  // Modals state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    type: 'RESEND' | null
    employeeId: number | null
  }>({
    isOpen: false,
    type: null,
    employeeId: null
  })

  const [statusModal, setStatusModal] = useState<{
    isOpen: boolean
    employeeId: number | null
    currentStatus: 'Probation' | 'Permanent' | 'Resigned' | 'Terminated' | null
    probationInfo: ProbationInfo | null
  }>({ isOpen: false, employeeId: null, currentStatus: null, probationInfo: null })

  const [transferModal, setTransferModal] = useState<{
    isOpen: boolean
    employeeId: number | null
    employeeName: string
  }>({ isOpen: false, employeeId: null, employeeName: '' })
  const [returnModal, setReturnModal] = useState<{
    isOpen: boolean
    employeeId: number | null
    employeeName: string
  }>({ isOpen: false, employeeId: null, employeeName: '' })

  // Edit modal state
  const [editEmployeeId, setEditEmployeeId] = useState<number | null>(null)

  // View modal state
  const [selectedViewEmployeeId, setSelectedViewEmployeeId] = useState<number | null>(null)

  // Import modal state
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [templateDownloading, setTemplateDownloading] = useState(false)

  // Queries
  const { data: deptData } = useGetDepartmentsQuery()
  const { data: posData } = useGetDepartmentPositionsQuery(
    typeof departmentId === 'number' ? departmentId : skipToken
  )

  const employeeQueryParams = useMemo(() => ({
    page,
    size,
    search,
    departmentId: canFilterAllDepartments ? departmentId : undefined,
    positionId: canFilterAllDepartments ? positionId : undefined,
    employmentStatus,
    sortBy: sorting[0]?.id || 'staffNo',
    sortDir: sorting[0]?.desc ? 'desc' : 'asc'
  }), [page, size, search, canFilterAllDepartments, departmentId, positionId, employmentStatus, sorting])

  const { data: empData, isLoading, isFetching, error: employeeListError, refetch } = useGetEmployeesQuery(employeeQueryParams)

  const statsQueryBase = useMemo(() => ({
    page: 0,
    size: 1,
    departmentId: canFilterAllDepartments ? departmentId : undefined,
    positionId: canFilterAllDepartments ? positionId : undefined,
    sortBy: 'staffNo',
    sortDir: 'asc' as const,
  }), [canFilterAllDepartments, departmentId, positionId])

  const { data: totalStatsData, isFetching: isTotalStatsFetching } = useGetEmployeesQuery(statsQueryBase)

  const { data: activeStatsData, isFetching: isActiveStatsFetching } = useGetEmployeesQuery({
    ...statsQueryBase,
    employmentStatus: 'Active',
  })
  const { data: inactiveStatsData, isFetching: isInactiveStatsFetching } = useGetEmployeesQuery({
    ...statsQueryBase,
    employmentStatus: 'Inactive',
  })
  const { data: probationStatsData, isFetching: isProbationStatsFetching } = useGetEmployeesQuery({
    ...statsQueryBase,
    employmentStatus: 'Probation',
  })
  const { data: permanentStatsData, isFetching: isPermanentStatsFetching } = useGetEmployeesQuery({
    ...statsQueryBase,
    employmentStatus: 'Permanent',
  })

  const employeeStatsCounts = useMemo<EmployeeStatsCounts>(() => ({
    total: totalStatsData?.data?.totalElements ?? 0,
    active: activeStatsData?.data?.totalElements ?? 0,
    inactive: inactiveStatsData?.data?.totalElements ?? 0,
    probation: probationStatsData?.data?.totalElements ?? 0,
    permanent: permanentStatsData?.data?.totalElements ?? 0,
  }), [
    totalStatsData?.data?.totalElements,
    activeStatsData?.data?.totalElements,
    inactiveStatsData?.data?.totalElements,
    probationStatsData?.data?.totalElements,
    permanentStatsData?.data?.totalElements,
  ])

  const isStatsLoading =
    isTotalStatsFetching ||
    isActiveStatsFetching ||
    isInactiveStatsFetching ||
    isProbationStatsFetching ||
    isPermanentStatsFetching

  const selectedStatsCard = useMemo((): EmployeeStatsCardKey | undefined => {
    if (
      employmentStatus === 'Active' ||
      employmentStatus === 'Inactive' ||
      employmentStatus === 'Probation' ||
      employmentStatus === 'Permanent'
    ) {
      return employmentStatus
    }
    if (!employmentStatus) {
      return 'Total'
    }
    return undefined
  }, [employmentStatus])

  // Memoize filter options to prevent unnecessary recreations
  const departments = useMemo(() => deptData?.data || [], [deptData?.data])
  const positions = useMemo(() => posData?.data || [], [posData?.data])

  // Memoize employee data to stabilize prop passed to table
  const employeeRows = useMemo(() => empData?.data?.content || [], [empData?.data?.content])

  // Mutations
  const [resendPassword, { isLoading: isResending }] = useResendPasswordMutation()
  const [updateEmploymentStatus, { isLoading: isUpdatingStatus }] = useUpdateEmploymentStatusMutation()
  const [exportEmployees, { isLoading: isExporting }] = useExportEmployeesMutation()
  const [triggerGetAllEmployees] = useLazyGetEmployeesQuery()
  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const [
    triggerGetEmployeeView,
    { data: viewData, isLoading: isViewLoading, isError: isViewError },
  ] = useLazyGetEmployeeViewByIdQuery()

  const [searchParams, setSearchParams] = useSearchParams()
  const queryParamEmployeeId = searchParams.get('employeeId')

  useEffect(() => {
    if (!queryParamEmployeeId) return
    const id = Number(queryParamEmployeeId)
    if (isNaN(id)) return
    setSelectedViewEmployeeId(id)
    triggerGetEmployeeView(id, true).unwrap().catch(() => {
      setSelectedViewEmployeeId(null)
    })
    searchParams.delete('employeeId')
    setSearchParams(searchParams, { replace: true })
  }, [queryParamEmployeeId, triggerGetEmployeeView, searchParams, setSearchParams])

  useEffect(() => {
    if (!employeeListError) return
    const message = employeeListError && typeof employeeListError === 'object' && 'data' in employeeListError
      ? (employeeListError as { data?: { message?: string } }).data?.message
      : undefined
    if (message === 'Your department information is not configured. Please contact HR.') {
      toast.error(message)
    }
  }, [employeeListError])

  // Handlers
  const handleSearchChange = useCallback((val: string) => {
    setSearch(val)
    setPage(0)
  }, [])

  const handleDepartmentChange = useCallback((val?: number) => {
    setDepartmentId(val)
    setPositionId(undefined)
    setPage(0)
  }, [])

  const handlePositionChange = useCallback((val?: number) => {
    setPositionId(val)
    setPage(0)
  }, [])

  const handleStatusChange = useCallback((val?: string) => {
    setEmploymentStatus(val)
    setPage(0)
  }, [])

  const handleStatsCardSelect = useCallback((status?: EmployeeStatsCardKey) => {
    setEmploymentStatus(!status || status === 'Total' ? undefined : status)
    setPage(0)
  }, [])

  const handleReset = useCallback(() => {
    setSearch('')
    setDepartmentId(undefined)
    setPositionId(undefined)
    setEmploymentStatus(undefined)
    setSorting([{ id: 'staffNo', desc: false }])
    setPage(0)
  }, [])

  const handleEdit = useCallback((id: number) => {
    setEditEmployeeId(id)
  }, [])

  const handleCloseEditModal = useCallback(() => {
    setEditEmployeeId(null)
  }, [])

  const handleView = useCallback(async (id: number) => {
    setSelectedViewEmployeeId(id)
    try {
      await triggerGetEmployeeView(id, true).unwrap()
    } catch (error: unknown) {
      const status = error && typeof error === 'object' && 'status' in error
        ? (error as { status?: number }).status
        : undefined
      if (status === 403) {
        toast.error('You are not allowed to view this employee.')
        setSelectedViewEmployeeId(null)
      }
    }
  }, [triggerGetEmployeeView])

  const handleCloseViewModal = useCallback(() => {
    setSelectedViewEmployeeId(null)
  }, [])

  const handleOpenTransfer = useCallback((id: number, name: string) => {
    setTransferModal({ isOpen: true, employeeId: id, employeeName: name })
  }, [])

  const handleCloseTransfer = useCallback(() => {
    setTransferModal({ isOpen: false, employeeId: null, employeeName: '' })
  }, [])

  const handleTransferSuccess = useCallback(() => {
    refetch()
    setTransferModal({ isOpen: false, employeeId: null, employeeName: '' })
  }, [refetch])

  const handleOpenReturn = useCallback((id: number, name: string) => {
    setReturnModal({ isOpen: true, employeeId: id, employeeName: name })
  }, [])

  const handleCloseReturn = useCallback(() => {
    setReturnModal({ isOpen: false, employeeId: null, employeeName: '' })
  }, [])

  const handleReturnSuccess = useCallback(() => {
    refetch()
    setReturnModal({ isOpen: false, employeeId: null, employeeName: '' })
  }, [refetch])

  const handleRetryView = useCallback(() => {
    if (selectedViewEmployeeId !== null) {
      triggerGetEmployeeView(selectedViewEmployeeId, true)
    }
  }, [selectedViewEmployeeId, triggerGetEmployeeView])

  const handleChangeStatus = useCallback(async (id: number, currentStatus: 'Probation' | 'Permanent' | 'Resigned' | 'Terminated') => {
    // Fetch probation info before opening modal
    let probInfo: ProbationInfo | null = null
    if (currentStatus === 'Probation') {
      try {
        const viewResult = await triggerGetEmployeeView(id, true).unwrap()
        probInfo = viewResult?.data?.probationInfo ?? null
      } catch {
        // If fetch fails, open modal without probation info
      }
    }
    setStatusModal({ isOpen: true, employeeId: id, currentStatus, probationInfo: probInfo })
  }, [triggerGetEmployeeView])

  const handleConfirmStatusChange = useCallback(async (request: UpdateEmploymentStatusRequest) => {
    if (!statusModal.employeeId) return
    try {
      await updateEmploymentStatus({
        id: statusModal.employeeId,
        body: request,
      }).unwrap()
      const labels: Record<string, string> = { PERMANENT: 'Permanent', RESIGNED: 'Resigned', TERMINATED: 'Terminated' }
      toast.success(`Employment status changed to ${labels[request.targetStatus] || request.targetStatus}`)
      setStatusModal({ isOpen: false, employeeId: null, currentStatus: null, probationInfo: null })
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'data' in error
        ? (error as { data?: { message?: string } }).data?.message || 'Failed to update employment status'
        : 'Failed to update employment status'
      toast.error(errorMessage)
    }
  }, [statusModal.employeeId, updateEmploymentStatus])

  const openConfirmModal = useCallback((id: number) => {
    setConfirmModal({
      isOpen: true,
      type: 'RESEND',
      employeeId: id
    })
  }, [])

  const handleConfirmAction = useCallback(async () => {
    if (!confirmModal.employeeId || confirmModal.type !== 'RESEND') return

    try {
      const res = await resendPassword(confirmModal.employeeId).unwrap()
      toast.success(res.data?.message || 'Temporary password resent successfully')
      setConfirmModal({ isOpen: false, type: null, employeeId: null })
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'data' in error
        ? (error as { data?: { message?: string } }).data?.message || 'Action failed'
        : 'Action failed'
      toast.error(errorMessage)
    }
  }, [confirmModal.employeeId, confirmModal.type, resendPassword])

  // Modal close handlers
  const handleCloseStatusModal = useCallback(() => {
    setStatusModal({ isOpen: false, employeeId: null, currentStatus: null, probationInfo: null })
  }, [])

  const handleCloseResendModal = useCallback(() => {
    setConfirmModal({ isOpen: false, type: null, employeeId: null })
  }, [])

  // Pagination handlers
  const handlePrevPage = useCallback(() => {
    setPage(p => Math.max(0, p - 1))
  }, [])

  const handleNextPage = useCallback(() => {
    setPage(p => Math.min((empData?.data?.totalPages || 1) - 1, p + 1))
  }, [empData?.data?.totalPages])

  const handlePageSelect = useCallback((pageIndex: number) => {
    setPage(pageIndex)
  }, [])

  const handleSizeChange = useCallback((newSize: number) => {
    setSize(newSize)
    setPage(0)
  }, [])

  const handleDownloadTemplate = useCallback(async () => {
    setTemplateDownloading(true)
    try {
      const res = await fetch(`${API_BASE}/api/employees/import/template`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error('Download failed')
      const blob = await res.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = 'employee_import_template.xlsx'
      document.body.appendChild(a)
      a.click()
      a.remove()
    } catch {
      toast.error('Failed to download template')
    } finally {
      setTemplateDownloading(false)
    }
  }, [token])

  const handleExportEmployees = useCallback(async () => {
    try {
      const data = await exportEmployees().unwrap()
      const blob = new Blob([data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const now = new Date()
      const today = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, '0'),
        String(now.getDate()).padStart(2, '0'),
      ].join('-')
      downloadBlobFile(blob, `employees_export_${today}.xlsx`)
      toast.success('Employees exported successfully.')
    } catch {
      toast.error('Failed to export employees.')
    }
  }, [exportEmployees])

  const handleExportPdf = useCallback(async () => {
    setIsExportingPdf(true)
    try {
      const result = await triggerGetAllEmployees({
        page: 0,
        size: 9999,
        search,
        departmentId: canFilterAllDepartments ? departmentId : undefined,
        positionId: canFilterAllDepartments ? positionId : undefined,
        employmentStatus,
        sortBy: sorting[0]?.id || 'staffNo',
        sortDir: sorting[0]?.desc ? 'desc' : 'asc',
      }).unwrap()

      const employees = result?.data?.content || []
      if (employees.length === 0) {
        toast.error('No employees found matching the current filters.')
        return
      }

      await exportEmployeeListPdf({
        employees,
        search,
        departmentId: canFilterAllDepartments ? departmentId : undefined,
        positionId: canFilterAllDepartments ? positionId : undefined,
        employmentStatus,
        departments: deptData?.data ?? undefined,
        positions: posData?.data ?? undefined,
      })

      toast.success('Employee list PDF exported successfully.')
    } catch {
      toast.error('Failed to export employee list PDF.')
    } finally {
      setIsExportingPdf(false)
    }
  }, [
    triggerGetAllEmployees,
    search,
    canFilterAllDepartments,
    departmentId,
    positionId,
    employmentStatus,
    sorting,
    deptData?.data,
    posData?.data,
  ])

  const handleImportSuccess = useCallback(() => {
    // RTK Query invalidation via commitEmployeeImport handles the refetch automatically
  }, [])

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employee List</h1>
          <p className="text-gray-500 mt-1">
            {isAudit
              ? 'View and manage employee records across all departments.'
              : 'Manage employee information and access.'}
          </p>
        </div>
        {(isHR || canExportEmployees) && (
          <div className="flex items-center gap-2">
            {(isHR || canImportEmployees) && (
              <>
                <button
                  onClick={handleDownloadTemplate}
                  disabled={templateDownloading}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#bfdbfe] bg-white text-[#1d4ed8] text-sm font-semibold hover:bg-[#eff6ff] disabled:opacity-60 transition shadow-sm"
                >
                  {templateDownloading ? (
                    <span className="inline-block w-3.5 h-3.5 border-2 border-[#60a5fa] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <i className="bi bi-download"></i>
                  )}
                  Download Template
                </button>
                <button
                  onClick={() => setImportModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#2463eb] to-[#1d4ed8] text-white text-sm font-semibold hover:from-[#1d4ed8] hover:to-[#1e40af] transition shadow-sm shadow-[#dbeafe]"
                >
                  <i className="bi bi-file-earmark-arrow-up"></i>
                  Import Employees
                </button>
              </>
            )}
            {canExportEmployees && (
              <button
                onClick={handleExportPdf}
                disabled={isExportingPdf}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 bg-white text-red-700 text-sm font-semibold hover:bg-red-50 disabled:opacity-60 transition shadow-sm"
              >
                {isExportingPdf ? (
                  <span className="inline-block w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <i className="bi bi-file-earmark-pdf"></i>
                )}
                {isExportingPdf ? 'Exporting PDF...' : 'Export PDF'}
              </button>
            )}
            {canExportEmployees && (
              <button
                onClick={handleExportEmployees}
                disabled={isExporting}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-emerald-200 bg-white text-emerald-700 text-sm font-semibold hover:bg-emerald-50 disabled:opacity-60 transition shadow-sm"
              >
                {isExporting ? (
                  <span className="inline-block w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <i className="bi bi-file-earmark-excel"></i>
                )}
                {isExporting ? 'Exporting...' : 'Export Employees'}
              </button>
            )}
          </div>
        )}
      </div>

      <EmployeeStatsCards
        counts={employeeStatsCounts}
        isLoading={isStatsLoading}
        selectedStatus={selectedStatsCard}
        onSelectStatus={handleStatsCardSelect}
      />

      <EmployeeFilters
        search={search}
        onSearchChange={handleSearchChange}
        departmentId={departmentId}
        onDepartmentChange={handleDepartmentChange}
        positionId={positionId}
        onPositionChange={handlePositionChange}
        employmentStatus={employmentStatus}
        onStatusChange={handleStatusChange}
        departments={departments}
        positions={positions}
        onReset={handleReset}
        showDepartmentPositionFilters={canFilterAllDepartments}
      />

      <EmployeeTable
        data={employeeRows}
        isLoading={isLoading || isFetching}
        onView={handleView}
        onEdit={handleEdit}
        onTransfer={handleOpenTransfer}
        onReturn={handleOpenReturn}
        onResendPassword={openConfirmModal}
        onChangeStatus={handleChangeStatus}
        sorting={sorting}
        setSorting={setSorting}
        isHR={isHR || isAudit}
        showEmailColumn={canFilterAllDepartments}
      />

      {/* Pagination */}
      {empData?.data && empData.data.totalPages >= 1 && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white px-5 py-3.5 rounded-xl border border-gray-100 shadow-sm">
          {/* Left: Results summary + Rows per page */}
          <div className="flex items-center gap-4 order-2 sm:order-1">
            <p className="text-sm text-gray-500">
              Showing{' '}
              <span className="font-semibold text-gray-700">{page * size + 1}</span>
              {' – '}
              <span className="font-semibold text-gray-700">
                {Math.min((page + 1) * size, empData.data.totalElements)}
              </span>{' '}
              of{' '}
              <span className="font-semibold text-gray-700">{empData.data.totalElements}</span>{' '}
              employees
            </p>
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-gray-400">Rows:</span>
              <select
                value={size}
                onChange={(e) => handleSizeChange(Number(e.target.value))}
                className="text-sm font-medium text-gray-700 border border-gray-200 rounded-lg px-2 py-1 bg-white hover:border-[#93c5fd] focus:outline-none focus:ring-2 focus:ring-[#dbeafe] transition-all cursor-pointer"
              >
                {[10, 25, 50].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Right: Page buttons */}
          <div className="flex items-center gap-1 order-1 sm:order-2">
            {/* Prev */}
            <button
              onClick={handlePrevPage}
              disabled={page === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <i className="bi bi-chevron-left text-xs"></i>
              <span>Prev</span>
            </button>

            {/* Page numbers with windowing */}
            {(() => {
              const total = empData.data.totalPages
              const delta = 2
              const pages: (number | 'ellipsis')[] = []

              if (total <= 7) {
                for (let i = 0; i < total; i++) pages.push(i)
              } else {
                pages.push(0)
                const left = Math.max(1, page - delta)
                const right = Math.min(total - 2, page + delta)
                if (left > 1) pages.push('ellipsis')
                for (let i = left; i <= right; i++) pages.push(i)
                if (right < total - 2) pages.push('ellipsis')
                pages.push(total - 1)
              }

              return pages.map((p, idx) =>
                p === 'ellipsis' ? (
                  <span key={`ellipsis-${idx}`} className="px-2 text-gray-400 text-sm select-none">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => handlePageSelect(p)}
                    className={`min-w-[36px] h-9 rounded-lg text-sm font-semibold transition-all border ${
                      page === p
                        ? 'bg-[#2463eb] text-white border-[#2463eb] shadow-sm shadow-[#dbeafe]'
                        : 'text-gray-600 border-gray-200 bg-white hover:bg-[#eff6ff] hover:border-[#bfdbfe] hover:text-[#1d4ed8]'
                    }`}
                  >
                    {p + 1}
                  </button>
                )
              )
            })()}

            {/* Next */}
            <button
              onClick={handleNextPage}
              disabled={page === empData.data.totalPages - 1}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <span>Next</span>
              <i className="bi bi-chevron-right text-xs"></i>
            </button>
          </div>
        </div>
      )}

      <ChangeStatusModal
        isOpen={statusModal.isOpen}
        currentStatus={statusModal.currentStatus ?? 'Permanent'}
        probationInfo={statusModal.probationInfo}
        onClose={handleCloseStatusModal}
        onConfirm={handleConfirmStatusChange}
        isLoading={isUpdatingStatus}
      />

      {/* Confirmation Modals */}
      <ConfirmActionModal
        isOpen={confirmModal.isOpen && confirmModal.type === 'RESEND'}
        onClose={handleCloseResendModal}
        onConfirm={handleConfirmAction}
        title="Confirm Resend Password"
        message="Are you sure you want to generate and send a fresh temporary password to this employee?"
        confirmText="Resend Password"
        isLoading={isResending}
      />

      {/* Edit Employee Modal */}
      <EditEmployeeModal
        isOpen={editEmployeeId !== null}
        employeeId={editEmployeeId}
        onClose={handleCloseEditModal}
      />

      {/* Employee View Modal */}
      <EmployeeViewModal
        isOpen={selectedViewEmployeeId !== null}
        onClose={handleCloseViewModal}
        employeeId={selectedViewEmployeeId}
        data={viewData?.data ?? null}
        isLoading={isViewLoading}
        isError={isViewError}
        onRetry={handleRetryView}
        hideSensitiveFields={isDepartmentManager}
      />

      <TemporaryTransferModal
        isOpen={transferModal.isOpen}
        employeeId={transferModal.employeeId}
        employeeName={transferModal.employeeName}
        onClose={handleCloseTransfer}
        onSuccess={handleTransferSuccess}
      />
      <ReturnModal
        isOpen={returnModal.isOpen}
        employeeId={returnModal.employeeId}
        employeeName={returnModal.employeeName}
        onClose={handleCloseReturn}
        onSuccess={handleReturnSuccess}
      />

      {/* Employee Import Modal */}
      <EmployeeImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImportSuccess={handleImportSuccess}
        token={token}
      />
    </div>
  )
}
