import { useEffect, useState } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { X, Pencil, Save } from 'lucide-react'

import {
  useGetEmployeeByIdQuery,
  useUpdateEmployeeMutation,
  type EmployeeUpdateRequest,
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
  const [uploadProfilePhoto] = useUploadProfilePictureMutation()

  const { data: deptRes, isLoading: deptLoading } = useGetDepartmentsQuery(undefined, {
    skip: !isOpen,
  })
  const departments = deptRes?.data ?? []

  const [activeTab, setActiveTab] = useState<'personal' | 'family' | 'employment'>('personal')
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null)
  const [photoError] = useState('')

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
        probationStartDate: '',
        probationEndDate: d.probationEndDate || '',
        hireDate: d.dateOfJoining,
        departmentId: d.departmentId,
        positionId: d.positionId,
      })
    }
  }, [empRes, reset])

  const onSubmit = async (v: EditEmployeeFormValues) => {
    try {
      let profilePictureUrl = empRes?.data?.profilePictureUrl
      if (profilePhotoFile) {
        const up = await uploadProfilePhoto(profilePhotoFile).unwrap()
        if (up.success && up.data?.profilePictureUrl) {
          profilePictureUrl = up.data.profilePictureUrl
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
        staffTypeId: v.staffType === 'PROBATION' ? 2 : 1,
        status: empRes?.data?.status || 'Active',
        profilePictureUrl,
      }

      await updateEmployee({ id, body }).unwrap()
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
          <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 flex-shrink-0">
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
          <div className="flex border-b border-gray-100 flex-shrink-0 bg-white">
            {(['personal', 'family', 'employment'] as const).map((tab) => {
              const labels: Record<typeof tab, string> = {
                personal: 'Personal Details',
                family: 'Family & Emergency',
                employment: 'Employment Info',
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
                      <div className="animate-fade-in">
                        <EmploymentInformationStep
                          register={form.register}
                          control={form.control}
                          errors={errors}
                          setValue={setValue}
                          departments={departments}
                          positions={positions}
                          departmentLoading={deptLoading}
                          positionLoading={posLoading}
                        />
                      </div>
                    )}
                  </div>
                </form>
              </FormProvider>
            )}
          </div>

          {/* ── Footer ── */}
          <div className="flex items-center justify-end gap-3 px-8 py-5 border-t border-gray-100 bg-gray-50/60 flex-shrink-0">
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
              disabled={isUpdating || isEmpLoading}
              className="flex items-center gap-2 px-7 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold shadow-md hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50"
            >
              {isUpdating ? (
                <div className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
              ) : (
                <Save size={16} />
              )}
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
