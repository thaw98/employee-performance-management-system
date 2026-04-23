import { useEffect, useState } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { X, Pencil, Save, ArrowLeftRight, RotateCcw, Building2, History } from 'lucide-react'

import {
  useGetEmployeeByIdQuery,
  useUpdateEmployeeMutation,
  useUpdateEmploymentStatusMutation,
  type EmployeeUpdateRequest,
  type UpdateEmploymentStatusRequest,
} from '../hrEmployeeApi'
import {
  useGetDepartmentsQuery,
  useGetPositionsQuery,
} from '../../hrCreateEmployee/hrEmployeeAccountApi'
import {
  editEmployeeSchema,
  type EditEmployeeFormValues,
} from '../../hrCreateEmployee/schemas/createEmployeeAccountSchema'
import { EmployeeInformationStep } from '../../../pages/hr/create-account/EmployeeInformationStep'
import { EmploymentInformationStep } from '../../../pages/hr/create-account/EmploymentInformationStep'
import { FamilyEmergencyStep } from '../../../pages/hr/create-account/FamilyEmergencyStep'
import { useUploadProfilePictureMutation } from '../../user/userApi'
import { useGetMovementHistoryQuery } from '../employeeMovementApi'
import { MovementHistoryTable } from './MovementHistoryTable'
import { TemporaryTransferModal } from './TemporaryTransferModal'
import { ReturnModal } from './ReturnModal'
import { PermanentTransferModal } from './PermanentTransferModal'

function formatDateDisplay(dateStr?: string | null): string {
  if (!dateStr) return '-'
  try {
    const date = new Date(`${dateStr}T00:00:00`)
    if (Number.isNaN(date.getTime())) return '-'
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
  } catch {
    return '-'
  }
}

interface EditEmployeeModalProps {
  isOpen: boolean
  employeeId: number | null
  onClose: () => void
  onSuccess?: () => void
}

export default function EditEmployeeModal({
  isOpen,
  employeeId,
  onClose,
  onSuccess,
}: EditEmployeeModalProps) {
  const id = employeeId ?? 0

  const { data: empRes, isLoading: isEmpLoading } = useGetEmployeeByIdQuery(id, {
    skip: !isOpen || !employeeId,
  })
  const [updateEmployee, { isLoading: isUpdating }] = useUpdateEmployeeMutation()
  const [updateEmploymentStatus, { isLoading: isStatusUpdating }] = useUpdateEmploymentStatusMutation()
  const [uploadProfilePhoto] = useUploadProfilePictureMutation()

  const { data: deptRes, isLoading: deptLoading } = useGetDepartmentsQuery(undefined, {
    skip: !isOpen,
  })
  const departments = deptRes?.data ?? []

  const [activeTab, setActiveTab] = useState<'personal' | 'family' | 'employment' | 'movement'>('personal')
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null)
  const [photoError] = useState('')
  const [showTempTransfer, setShowTempTransfer] = useState(false)
  const [showReturn, setShowReturn] = useState(false)
  const [showPermTransfer, setShowPermTransfer] = useState(false)

  const { data: movementRes, isLoading: movementLoading } = useGetMovementHistoryQuery(id, {
    skip: !isOpen || !employeeId,
  })
  const [transitionMode, setTransitionMode] = useState<'NOW' | 'CUSTOM' | ''>('')
  const [transitionDate, setTransitionDate] = useState('')

  const form = useForm<EditEmployeeFormValues>({
    resolver: zodResolver(editEmployeeSchema) as never,
    mode: 'onBlur',
  })

  const { reset, handleSubmit, watch, setValue, formState: { errors } } = form
  const deptId = watch('departmentId')

  const { data: posRes, isLoading: posLoading } = useGetPositionsQuery(deptId as number, {
    skip: deptId == null || !isOpen,
  })
  const positions = posRes?.data ?? []

  // Reset tab and photo when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setActiveTab('personal')
      setProfilePhotoFile(null)
      setTransitionMode('')
      setTransitionDate('')
      setShowTempTransfer(false)
      setShowReturn(false)
      setShowPermTransfer(false)
    }
  }, [isOpen])

  // Populate form when employee data loads
  useEffect(() => {
    if (empRes?.data) {
      const d = empRes.data

      let nrcParts = { state: '', township: '', type: '', number: '' }
      if (d.staffNrcNo) {
        const match = d.staffNrcNo.match(/^(\d+)\/([^(]+)\(([^)]+)\)(\d+)$/)
        if (match) {
          nrcParts = { state: match[1], township: match[2], type: match[3], number: match[4] }
        }
      }

      let fNrcParts = { state: '', township: '', type: '', number: '' }
      if (d.fatherNrcNo) {
        const match = d.fatherNrcNo.match(/^(\d+)\/([^(]+)\(([^)]+)\)(\d+)$/)
        if (match) {
          fNrcParts = { state: match[1], township: match[2], type: match[3], number: match[4] }
        }
      }

      reset({
        employeeId: d.employeeId,
        staffNo: d.employeeId,   // employeeId is the staff number string
        employeeName: d.employeeName,
        email: d.email,
        gender: d.gender as never,
        dateOfBirth: d.dateOfBirth,
        phoneNo: '',
        address: '',
        religion: d.religion,
        nationality: '',
        nrcStateCode: nrcParts.state,
        nrcTownshipCode: nrcParts.township,
        nrcType: nrcParts.type,
        nrcNumber: nrcParts.number,
        fatherName: d.fatherName || '',
        fatherNrcStateCode: fNrcParts.state,
        fatherNrcTownshipCode: fNrcParts.township,
        fatherNrcType: fNrcParts.type,
        fatherNrcNumber: fNrcParts.number,
        fatherOccupation: d.fatherOccupation || '',
        emergencyPhone: d.emergencyPhone || '',
        emergencyRelation: d.emergencyRelation || '',
        staffType: d.staffTypeName === 'Probation' ? 'PROBATION' : 'PERMANENT',
        probationStartDate: d.probationStartDate || '',
        probationEndDate: d.probationEndDate || '',
        hireDate: d.dateOfJoining,
        departmentId: d.departmentId,
        positionId: d.positionId,
      })
    }
  }, [empRes, reset])

  const currentStatus = empRes?.data?.staffTypeName === 'Probation' ? 'PROBATION' : 'PERMANENT'
  const selectedStaffType = watch('staffType')
  const isProbationToPermanent = currentStatus === 'PROBATION' && selectedStaffType === 'PERMANENT'
  const probationStartDate = empRes?.data?.probationStartDate || ''
  const minTransitionDate = (() => {
    if (!probationStartDate) return new Date().toISOString().split('T')[0]
    const d = new Date(`${probationStartDate}T00:00:00`)
    d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
  })()

  useEffect(() => {
    if (!isProbationToPermanent) {
      setTransitionMode('')
      setTransitionDate('')
    }
  }, [isProbationToPermanent])

  const onSubmit = async (v: EditEmployeeFormValues) => {
    try {
      let profilePictureUrl = empRes?.data?.profilePictureUrl
      if (profilePhotoFile) {
        const up = await uploadProfilePhoto(profilePhotoFile).unwrap()
        if (up.success && up.data?.profilePictureUrl) {
          profilePictureUrl = up.data.profilePictureUrl
        }
      }

      if (isProbationToPermanent) {
        if (!transitionMode) {
          toast.error('Please choose when to make permanent')
          return
        }
        if (transitionMode === 'CUSTOM') {
          if (!transitionDate) {
            toast.error('Please choose probation end date')
            return
          }
          if (probationStartDate && transitionDate <= probationStartDate) {
            toast.error(`Date must be after probation start date (${formatDateDisplay(probationStartDate)})`)
            return
          }
        }
      }

      const body: EmployeeUpdateRequest = {
        employeeId: v.staffNo,
        employeeName: v.employeeName,
        email: v.email,
        staffNrcNo: `${v.nrcStateCode}/${v.nrcTownshipCode}(${v.nrcType})${v.nrcNumber}`,
        gender: v.gender,
        religion: v.religion,
        fatherName: v.fatherName,
        fatherNrcNo: v.fatherNrcStateCode
          ? `${v.fatherNrcStateCode}/${v.fatherNrcTownshipCode}(${v.fatherNrcType})${v.fatherNrcNumber}`
          : undefined,
        fatherOccupation: v.fatherOccupation,
        emergencyPhone: v.emergencyPhone,
        emergencyRelation: v.emergencyRelation,
        departmentId: v.departmentId!,
        positionId: v.positionId!,
        dateOfJoining: v.hireDate,
        // Keep existing type here when converting Probation->Permanent; transition endpoint will update it.
        staffTypeId: isProbationToPermanent ? 2 : v.staffType === 'PROBATION' ? 2 : 1,
        status: empRes?.data?.status || 'Active',
        profilePictureUrl,
      }

      await updateEmployee({ id, body }).unwrap()

      if (isProbationToPermanent) {
        const statusBody: UpdateEmploymentStatusRequest = {
          targetStatus: 'PERMANENT',
          transitionMode,
          ...(transitionMode === 'CUSTOM' ? { effectiveDate: transitionDate } : {}),
        }
        await updateEmploymentStatus({ id, body: statusBody }).unwrap()
      }

      toast.success('Employee updated successfully')
      onSuccess?.()
      onClose()
    } catch (error: unknown) {
      const err = error as { data?: { message?: string } }
      toast.error(err?.data?.message || 'Update failed')
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Panel */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-label="Edit Employee"
      >
        <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden animate-scale-in">

          {/* ── Header ── */}
          <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 shrink-0">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md">
                <Pencil size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Edit Employee</h2>
                {isEmpLoading ? (
                  <p className="text-sm text-gray-400">Loading…</p>
                ) : (
                  <p className="text-sm text-gray-500">
                    Update master data for{' '}
                    <span className="font-medium text-gray-700">
                      {empRes?.data?.employeeName}
                    </span>
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          {/* ── Tabs ── */}
          <div className="flex border-b border-gray-100 shrink-0 bg-white">
            {(['personal', 'family', 'employment', 'movement'] as const).map((tab) => {
              const labels: Record<typeof tab, string> = {
                personal: 'Personal Details',
                family: 'Family & Emergency',
                employment: 'Employment Info',
                movement: 'Movement History',
              }
              const isActive = activeTab === tab
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${
                    isActive
                      ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/40'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {labels[tab]}
                </button>
              )
            })}
          </div>

          {/* ── Scrollable Body ── */}
          <div className="flex-1 overflow-y-auto">
            {isEmpLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
              </div>
            ) : (
              <FormProvider {...form}>
                <form id="edit-employee-form" onSubmit={handleSubmit(onSubmit)}>
                  <div className="p-8">
                    {activeTab === 'personal' && (
                      <div className="animate-fade-in">
                        <EmployeeInformationStep
                          register={form.register}
                          control={form.control}
                          errors={errors}
                          setValue={setValue}
                          emailDup="idle"
                          staffDup="idle"
                          autoStaffDisplay={watch('staffNo')}
                          nextStaffLoading={false}
                          hideStaffBanner={true}
                          readOnlyStaffNo={true}
                          profilePhotoPreviewUrl={
                            profilePhotoFile
                              ? URL.createObjectURL(profilePhotoFile)
                              : empRes?.data?.profilePictureUrl || null
                          }
                          onProfilePhotoFileChange={(file) => setProfilePhotoFile(file)}
                          photoError={photoError}
                        />
                      </div>
                    )}

                    {activeTab === 'family' && (
                      <div className="animate-fade-in">
                        <FamilyEmergencyStep
                          register={form.register}
                          control={form.control}
                          errors={errors}
                          setValue={setValue}
                        />
                      </div>
                    )}

                    {activeTab === 'employment' && (
                      <div className="animate-fade-in space-y-4">
                        <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-800">
                          <p className="font-semibold">Department &amp; Position are read-only here.</p>
                          <p className="mt-0.5 text-xs text-indigo-600">
                            To change department or position, use the Movement History tab or the transfer action buttons.
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setShowTempTransfer(true)}
                            className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-600 transition-colors"
                          >
                            <ArrowLeftRight size={13} />
                            Temporary Transfer
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowReturn(true)}
                            className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700 transition-colors"
                          >
                            <RotateCcw size={13} />
                            Return
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowPermTransfer(true)}
                            className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-2 text-xs font-semibold text-white hover:bg-purple-700 transition-colors"
                          >
                            <Building2 size={13} />
                            Permanent Transfer
                          </button>
                        </div>
                        <EmploymentInformationStep
                          register={form.register}
                          control={form.control}
                          errors={errors}
                          setValue={setValue}
                          departments={departments}
                          positions={positions}
                          departmentLoading={deptLoading}
                          positionLoading={posLoading}
                          beforeHireDate={
                            isProbationToPermanent ? (
                              <div className="rounded-xl border border-gray-200 bg-white p-5">
                                <label className="mb-3 block text-sm font-semibold text-gray-700">
                                  When to make permanent <span className="text-red-500">*</span>
                                </label>
                                <div className="space-y-3">
                                  <label
                                    className={`flex items-center gap-3 rounded-lg border p-3 transition-colors cursor-pointer ${
                                      transitionMode === 'NOW'
                                        ? 'border-green-300 bg-green-50'
                                        : 'border-gray-200 hover:bg-gray-50'
                                    }`}
                                  >
                                    <input
                                      type="radio"
                                      name="transitionMode"
                                      value="NOW"
                                      checked={transitionMode === 'NOW'}
                                      onChange={() => {
                                        setTransitionMode('NOW')
                                        setTransitionDate('')
                                      }}
                                      className="h-4 w-4 border-gray-300 text-green-600 focus:ring-green-500"
                                    />
                                    <i className="bi bi-lightning-charge text-green-600" />
                                    <div>
                                      <p className="text-sm font-semibold text-green-700">Now</p>
                                      <p className="text-xs text-gray-500">Probation ends today, status changes immediately</p>
                                    </div>
                                  </label>
                                  <label
                                    className={`flex items-center gap-3 rounded-lg border p-3 transition-colors cursor-pointer ${
                                      transitionMode === 'CUSTOM'
                                        ? 'border-green-300 bg-green-50'
                                        : 'border-gray-200 hover:bg-gray-50'
                                    }`}
                                  >
                                    <input
                                      type="radio"
                                      name="transitionMode"
                                      value="CUSTOM"
                                      checked={transitionMode === 'CUSTOM'}
                                      onChange={() => setTransitionMode('CUSTOM')}
                                      className="h-4 w-4 border-gray-300 text-green-600 focus:ring-green-500"
                                    />
                                    <i className="bi bi-calendar-check text-green-600" />
                                    <div>
                                      <p className="text-sm font-semibold text-green-700">Custom Date</p>
                                      <p className="text-xs text-gray-500">Choose a specific probation end date</p>
                                    </div>
                                  </label>
                                </div>

                                {transitionMode === 'CUSTOM' ? (
                                  <div className="mt-3">
                                    <label className="mb-1 block text-sm font-medium text-gray-700">
                                      Probation End Date <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                      type="date"
                                      min={minTransitionDate}
                                      value={transitionDate}
                                      onChange={(e) => setTransitionDate(e.target.value)}
                                      className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                      Must be after probation start date ({formatDateDisplay(probationStartDate)}).
                                    </p>
                                  </div>
                                ) : null}
                              </div>
                            ) : null
                          }
                        />
                      </div>
                    )}

                    {activeTab === 'movement' && (
                      <div className="animate-fade-in space-y-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setShowTempTransfer(true)}
                            className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-600 transition-colors"
                          >
                            <ArrowLeftRight size={13} />
                            Temporary Transfer
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowReturn(true)}
                            className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700 transition-colors"
                          >
                            <RotateCcw size={13} />
                            Return
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowPermTransfer(true)}
                            className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-2 text-xs font-semibold text-white hover:bg-purple-700 transition-colors"
                          >
                            <Building2 size={13} />
                            Permanent Transfer
                          </button>
                        </div>
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                          <History size={15} className="text-indigo-600" />
                          Movement History
                        </div>
                        <MovementHistoryTable
                          history={movementRes?.data ?? []}
                          isLoading={movementLoading}
                        />
                      </div>
                    )}
                  </div>
                </form>
              </FormProvider>
            )}
          </div>

          {/* ── Footer ── */}
          <div className="flex items-center justify-end gap-3 px-8 py-5 border-t border-gray-100 bg-gray-50/60 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="edit-employee-form"
              disabled={isUpdating || isStatusUpdating || isEmpLoading}
              className="flex items-center gap-2 px-7 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold shadow-md hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50"
            >
              {isUpdating || isStatusUpdating ? (
                <div className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
              ) : (
                <Save size={16} />
              )}
              Save Changes
            </button>
          </div>
        </div>
      </div>

      <TemporaryTransferModal
        isOpen={showTempTransfer}
        employeeId={employeeId}
        employeeName={empRes?.data?.employeeName ?? ''}
        onClose={() => setShowTempTransfer(false)}
        onSuccess={onSuccess}
      />
      <ReturnModal
        isOpen={showReturn}
        employeeId={employeeId}
        employeeName={empRes?.data?.employeeName ?? ''}
        onClose={() => setShowReturn(false)}
        onSuccess={onSuccess}
      />
      <PermanentTransferModal
        isOpen={showPermTransfer}
        employeeId={employeeId}
        employeeName={empRes?.data?.employeeName ?? ''}
        onClose={() => setShowPermTransfer(false)}
        onSuccess={onSuccess}
      />
    </>
  )
}
