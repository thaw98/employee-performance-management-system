import { useState, useCallback, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { skipToken } from '@reduxjs/toolkit/query'
import type { UpdateEmploymentStatusRequest, ProbationInfo } from '../../../features/hrEmployeeList/hrEmployeeApi'

import type { SortingState } from '@tanstack/react-table'
import toast from 'react-hot-toast'

import EmployeeTable from '../../../features/hrEmployeeList/components/EmployeeTable'
import EmployeeFilters from '../../../features/hrEmployeeList/components/EmployeeFilters'
import ConfirmActionModal from '../../../features/hrEmployeeList/components/ConfirmActionModal'
import EmployeeViewModal from '../../../features/hrEmployeeList/components/EmployeeViewModal'
import EmployeeImportModal from '../../../features/hrEmployeeList/components/EmployeeImportModal'
import {
  useGetEmployeesQuery,
  useResendPasswordMutation,
  useSendNewPasswordMutation,
  useUpdateEmploymentStatusMutation,
  useExportEmployeesMutation,
  useLazyGetEmployeeViewByIdQuery,
} from '../../../features/hrEmployeeList/hrEmployeeApi'
import ChangeStatusModal from '../../../features/hrEmployeeList/components/ChangeStatusModal'
import { 
  useGetDepartmentsQuery, 
  useGetDepartmentPositionsQuery 
} from '../../../features/hrCreateEmployee/hrEmployeeAccountApi'
import { useAppSelector } from '../../../app/hooks'
import { downloadBlobFile } from '../../../utils/downloadBlobFile'

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string)?.replace(/\/$/, '') ||
  'http://localhost:8080'

export default function EmployeeListPage() {
  const navigate = useNavigate()
  const user = useAppSelector((s) => s.auth.user)
  const token = useAppSelector((s) => s.auth.token)
  const isHR = user?.roleId === 1
  const isDepartmentManager = user?.roleId === 2

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
    type: 'RESEND' | 'NEW_PASSWORD' | null
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
    departmentId: isHR ? departmentId : undefined,
    positionId: isHR ? positionId : undefined,
    employmentStatus,
    sortBy: sorting[0]?.id || 'staffNo',
    sortDir: sorting[0]?.desc ? 'desc' : 'asc'
  }), [page, size, search, isHR, departmentId, positionId, employmentStatus, sorting])

  const { data: empData, isLoading, isFetching, error: employeeListError } = useGetEmployeesQuery(employeeQueryParams)

  // Memoize filter options to prevent unnecessary recreations
  const departments = useMemo(() => deptData?.data || [], [deptData?.data])
  const positions = useMemo(() => posData?.data || [], [posData?.data])

  // Memoize employee data to stabilize prop passed to table
  const employeeRows = useMemo(() => empData?.data?.content || [], [empData?.data?.content])

  // Mutations
  const [resendPassword, { isLoading: isResending }] = useResendPasswordMutation()
  const [sendNewPassword, { isLoading: isSendingNew }] = useSendNewPasswordMutation()
  const [updateEmploymentStatus, { isLoading: isUpdatingStatus }] = useUpdateEmploymentStatusMutation()
  const [exportEmployees, { isLoading: isExporting }] = useExportEmployeesMutation()
  const [
    triggerGetEmployeeView,
    { data: viewData, isLoading: isViewLoading, isError: isViewError },
  ] = useLazyGetEmployeeViewByIdQuery()

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

  const handleReset = useCallback(() => {
    setSearch('')
    setDepartmentId(undefined)
    setPositionId(undefined)
    setEmploymentStatus(undefined)
    setSorting([{ id: 'staffNo', desc: false }])
    setPage(0)
  }, [])

  const handleEdit = useCallback((id: number) => {
    navigate(`/hr/employees/${id}/edit`)
  }, [navigate])

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

  const openConfirmModal = useCallback((id: number, type: 'RESEND' | 'NEW_PASSWORD') => {
    setConfirmModal({
      isOpen: true,
      type,
      employeeId: id
    })
  }, [])

  const handleConfirmAction = useCallback(async () => {
    if (!confirmModal.employeeId || !confirmModal.type) return

    try {
      if (confirmModal.type === 'RESEND') {
        const res = await resendPassword(confirmModal.employeeId).unwrap()
        toast.success(res.data?.message || 'Temporary password resent successfully')
      } else {
        const res = await sendNewPassword(confirmModal.employeeId).unwrap()
        toast.success(res.data?.message || 'New temporary password sent successfully')
      }
      setConfirmModal({ isOpen: false, type: null, employeeId: null })
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'data' in error
        ? (error as { data?: { message?: string } }).data?.message || 'Action failed'
        : 'Action failed'
      toast.error(errorMessage)
    }
  }, [confirmModal.employeeId, confirmModal.type, resendPassword, sendNewPassword])

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

  const handleImportSuccess = useCallback(() => {
    // RTK Query invalidation via commitEmployeeImport handles the refetch automatically
  }, [])

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employee List</h1>
          <p className="text-gray-500 mt-1">Manage employee information and access.</p>
        </div>
        {isHR && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadTemplate}
              disabled={templateDownloading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-indigo-200 bg-white text-indigo-700 text-sm font-semibold hover:bg-indigo-50 disabled:opacity-60 transition shadow-sm"
            >
              {templateDownloading ? (
                <span className="inline-block w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <i className="bi bi-download"></i>
              )}
              Download Template
            </button>
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
            <button
              onClick={() => setImportModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition shadow-sm"
            >
              <i className="bi bi-file-earmark-arrow-up"></i>
              Import Employees
            </button>
          </div>
        )}
      </div>

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
        showDepartmentPositionFilters={isHR}
      />

      <EmployeeTable
        data={employeeRows}
        isLoading={isLoading || isFetching}
        onView={handleView}
        onEdit={handleEdit}
        onResendPassword={(id) => openConfirmModal(id, 'RESEND')}
        onSendNewPassword={(id) => openConfirmModal(id, 'NEW_PASSWORD')}
        onChangeStatus={handleChangeStatus}
        sorting={sorting}
        setSorting={setSorting}
        isHR={isHR}
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
                className="text-sm font-medium text-gray-700 border border-gray-200 rounded-lg px-2 py-1 bg-white hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all cursor-pointer"
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
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-100'
                        : 'text-gray-600 border-gray-200 bg-white hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700'
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

      <ConfirmActionModal
        isOpen={confirmModal.isOpen && confirmModal.type === 'NEW_PASSWORD'}
        onClose={handleCloseResendModal}
        onConfirm={handleConfirmAction}
        title="Confirm Send New Password"
        message="This will generate a new temporary password, replace the current password, and require the employee to change it after login. Continue?"
        confirmText="Send New Password"
        variant="danger"
        isLoading={isSendingNew}
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
