import { useState, useCallback, useMemo } from 'react'

import type { SortingState } from '@tanstack/react-table'
import toast from 'react-hot-toast'

import EmployeeTable from '../../../features/hrEmployeeList/components/EmployeeTable'
import EmployeeFilters from '../../../features/hrEmployeeList/components/EmployeeFilters'
import ConfirmActionModal from '../../../features/hrEmployeeList/components/ConfirmActionModal'
import EmployeeViewModal from '../../../features/hrEmployeeList/components/EmployeeViewModal'
import EditEmployeeModal from '../../../features/hrEmployeeList/components/EditEmployeeModal'
import EmployeeImportModal from '../../../features/hrEmployeeList/components/EmployeeImportModal'
import {
  useGetEmployeesQuery,
  useResendPasswordMutation,
  useSendNewPasswordMutation,
  useUpdateEmploymentStatusMutation,
  useLazyGetEmployeeViewByIdQuery,
} from '../../../features/hrEmployeeList/hrEmployeeApi'
import ChangeStatusModal from '../../../features/hrEmployeeList/components/ChangeStatusModal'
import { 
  useGetDepartmentsQuery, 
  useGetPositionsQuery 
} from '../../../features/hrCreateEmployee/hrEmployeeAccountApi'
import { useAppSelector } from '../../../app/hooks'

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string)?.replace(/\/$/, '') ||
  'http://localhost:8080'

export default function EmployeeListPage() {
  const user = useAppSelector((s) => s.auth.user)
  const token = useAppSelector((s) => s.auth.token)
  const isHR = user?.roleId === 1

  // State for filters and pagination
  const [page, setPage] = useState(0)
  const [size] = useState(10)
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
  }>({ isOpen: false, employeeId: null, currentStatus: null })

  // Edit modal state
  const [editEmployeeId, setEditEmployeeId] = useState<number | null>(null)

  // View modal state
  const [selectedViewEmployeeId, setSelectedViewEmployeeId] = useState<number | null>(null)

  // Import modal state
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [templateDownloading, setTemplateDownloading] = useState(false)

  // Queries
  const { data: deptData } = useGetDepartmentsQuery()
  const { data: posData } = useGetPositionsQuery(departmentId)

  const { data: empData, isLoading, isFetching } = useGetEmployeesQuery({
    page,
    size,
    search,
    departmentId,
    positionId,
    employmentStatus,
    sortBy: sorting[0]?.id || 'staffNo',
    sortDir: sorting[0]?.desc ? 'desc' : 'asc'
  })

  // Memoize filter options to prevent unnecessary recreations
  const departments = useMemo(() => deptData?.data || [], [deptData?.data])
  const positions = useMemo(() => posData?.data || [], [posData?.data])

  // Memoize employee data to stabilize prop passed to table
  const employeeRows = useMemo(() => empData?.data?.content || [], [empData?.data?.content])

  // Mutations
  const [resendPassword, { isLoading: isResending }] = useResendPasswordMutation()
  const [sendNewPassword, { isLoading: isSendingNew }] = useSendNewPasswordMutation()
  const [updateEmploymentStatus, { isLoading: isUpdatingStatus }] = useUpdateEmploymentStatusMutation()
  const [
    triggerGetEmployeeView,
    { data: viewData, isLoading: isViewLoading, isError: isViewError },
  ] = useLazyGetEmployeeViewByIdQuery()

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
    setEditEmployeeId(id)
  }, [])

  const handleCloseEditModal = useCallback(() => {
    setEditEmployeeId(null)
  }, [])

  const handleView = useCallback((id: number) => {
    setSelectedViewEmployeeId(id)
    triggerGetEmployeeView(id, true) // `true` forces refetch
  }, [triggerGetEmployeeView])

  const handleCloseViewModal = useCallback(() => {
    setSelectedViewEmployeeId(null)
  }, [])

  const handleRetryView = useCallback(() => {
    if (selectedViewEmployeeId !== null) {
      triggerGetEmployeeView(selectedViewEmployeeId, true)
    }
  }, [selectedViewEmployeeId, triggerGetEmployeeView])

  const handleChangeStatus = useCallback((id: number, currentStatus: 'Probation' | 'Permanent' | 'Resigned' | 'Terminated') => {
    setStatusModal({ isOpen: true, employeeId: id, currentStatus })
  }, [])

  const handleConfirmStatusChange = useCallback(async (targetStatus: string, probationEndDate?: string) => {
    if (!statusModal.employeeId) return
    try {
      await updateEmploymentStatus({
        id: statusModal.employeeId,
        status: targetStatus,
        probationEndDate,
      }).unwrap()
      toast.success(`Employment status changed to ${targetStatus}`)
      setStatusModal({ isOpen: false, employeeId: null, currentStatus: null })
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
    setStatusModal({ isOpen: false, employeeId: null, currentStatus: null })
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
      />

      {/* Pagination */}
      {empData?.data && empData.data.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex flex-1 justify-between sm:hidden">
                <button
                    onClick={handlePrevPage}
                    disabled={page === 0}
                    className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                    Previous
                </button>
                <button
                    onClick={handleNextPage}
                    disabled={page === empData.data!.totalPages - 1}
                    className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                    Next
                </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{page * size + 1}</span> to <span className="font-medium">{Math.min((page + 1) * size, empData?.data?.totalElements || 0)}</span> of{' '}
                        <span className="font-medium">{empData?.data?.totalElements || 0}</span> results
                    </p>
                </div>
                <div>
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                        <button
                            onClick={handlePrevPage}
                            disabled={page === 0}
                            className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                        >
                            <span className="sr-only">Previous</span>
                            <i className="bi bi-chevron-left"></i>
                        </button>
                        {[...Array(empData?.data?.totalPages || 0)].map((_, i) => (
                            <button
                                key={i}
                                onClick={() => handlePageSelect(i)}
                                className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold focus:z-20 ${
                                    page === i
                                        ? 'z-10 bg-indigo-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                                        : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0'
                                }`}
                            >
                                {i + 1}
                            </button>
                        ))}
                        <button
                            onClick={handleNextPage}
                            disabled={page === (empData?.data?.totalPages || 1) - 1}
                            className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                        >
                            <span className="sr-only">Next</span>
                            <i className="bi bi-chevron-right"></i>
                        </button>
                    </nav>
                </div>
            </div>
        </div>
      )}

      <ChangeStatusModal
        isOpen={statusModal.isOpen}
        currentStatus={statusModal.currentStatus ?? 'Permanent'}
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
        data={viewData?.data ?? null}
        isLoading={isViewLoading}
        isError={isViewError}
        onRetry={handleRetryView}
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
