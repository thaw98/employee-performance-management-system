import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { Pencil, ArrowLeft, Save } from 'lucide-react'

import { 
  useGetEmployeeByIdQuery, 
  useUpdateEmployeeMutation,
  type EmployeeUpdateRequest 
} from '../../../features/hrEmployeeList/hrEmployeeApi'
import { 
  useGetDepartmentsQuery, 
  useGetPositionsQuery 
} from '../../../features/hrCreateEmployee/hrEmployeeAccountApi'
import { createEmployeeAccountSchema, type CreateEmployeeAccountFormValues } from '../../../features/hrCreateEmployee/schemas/createEmployeeAccountSchema'
import { EmployeeInformationStep } from '../create-account/EmployeeInformationStep'
import { EmploymentInformationStep } from '../create-account/EmploymentInformationStep'
import { FamilyEmergencyStep } from '../create-account/FamilyEmergencyStep'
import { useUploadProfilePictureMutation } from '../../../features/user/userApi'

export default function EditEmployeePage() {
  const { employeeId } = useParams<{ employeeId: string }>()
  const id = Number(employeeId)
  const navigate = useNavigate()

  const { data: empRes, isLoading: isEmpLoading } = useGetEmployeeByIdQuery(id)
  const [updateEmployee, { isLoading: isUpdating }] = useUpdateEmployeeMutation()
  const [uploadProfilePhoto] = useUploadProfilePictureMutation()

  const { data: deptRes, isLoading: deptLoading } = useGetDepartmentsQuery()
  const departments = deptRes?.data ?? []

  const [activeTab, setActiveTab] = useState<'personal' | 'family' | 'employment'>('personal')
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null)
  const [photoError, setPhotoError] = useState('')

  const form = useForm<CreateEmployeeAccountFormValues>({
    resolver: zodResolver(createEmployeeAccountSchema) as never,
    mode: 'onBlur',
  })

  const { reset, handleSubmit, watch, setValue, formState: { errors } } = form
  const deptId = watch('departmentId')
  const { data: posRes, isLoading: posLoading } = useGetPositionsQuery(deptId as number, {
    skip: deptId == null,
  })
  const positions = posRes?.data ?? []

  // Initialize form with employee data
  useEffect(() => {
    if (empRes?.data) {
      const d = empRes.data
      
      // Parse NRC
      let nrcParts = { state: '', township: '', type: '', number: '' }
      if (d.staffNrcNo) {
        const match = d.staffNrcNo.match(/^(\d+)\/([^(]+)\(([^)]+)\)(\d+)$/)
        if (match) {
          nrcParts = { state: match[1], township: match[2], type: match[3], number: match[4] }
        }
      }

      // Parse Father NRC
      let fNrcParts = { state: '', township: '', type: '', number: '' }
      if (d.fatherNrcNo) {
        const match = d.fatherNrcNo.match(/^(\d+)\/([^(]+)\(([^)]+)\)(\d+)$/)
        if (match) {
          fNrcParts = { state: match[1], township: match[2], type: match[3], number: match[4] }
        }
      }

      reset({
        employeeId: d.employeeId,
        employeeName: d.employeeName,
        email: d.email,
        gender: d.gender as any,
        dateOfBirth: d.dateOfBirth,
        phoneNo: '', // Not in response DTO yet
        address: '', // Not in response DTO yet
        religion: d.religion,
        nationality: '', // Not in response DTO yet
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

  const onSubmit = async (v: CreateEmployeeAccountFormValues) => {
    try {
      let profilePictureUrl = empRes?.data?.profilePictureUrl
      if (profilePhotoFile) {
        const up = await uploadProfilePhoto(profilePhotoFile).unwrap()
        if (up.success && up.data?.profilePictureUrl) {
          profilePictureUrl = up.data.profilePictureUrl
        }
      }

      const body: EmployeeUpdateRequest = {
        employeeId: v.staffNo, // Schema says staffNo
        employeeName: v.employeeName,
        email: v.email,
        staffNrcNo: `${v.nrcStateCode}/${v.nrcTownshipCode}(${v.nrcType})${v.nrcNumber}`,
        gender: v.gender,
        religion: v.religion,
        fatherName: v.fatherName,
        fatherNrcNo: v.fatherNrcStateCode ? `${v.fatherNrcStateCode}/${v.fatherNrcTownshipCode}(${v.fatherNrcType})${v.fatherNrcNumber}` : undefined,
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
      navigate('/hr/employees')
    } catch (error: any) {
      toast.error(error?.data?.message || 'Update failed')
    }
  }

  if (isEmpLoading) return <div className="p-8 text-center">Loading employee...</div>

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/hr/employees')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="text-gray-600" />
          </button>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg">
            <Pencil size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Employee</h1>
            <p className="text-gray-500">Update master data for {empRes?.data?.employeeName}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            className={`flex-1 py-4 text-sm font-semibold ${activeTab === 'personal' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('personal')}
          >
            Personal Details
          </button>
          <button
            className={`flex-1 py-4 text-sm font-semibold ${activeTab === 'family' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('family')}
          >
            Family & Emergency
          </button>
          <button
            className={`flex-1 py-4 text-sm font-semibold ${activeTab === 'employment' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('employment')}
          >
            Employment Info
          </button>
        </div>

        <div className="p-8">
          <FormProvider {...form}>
            <form onSubmit={handleSubmit(onSubmit)}>
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
                    profilePhotoPreviewUrl={profilePhotoFile ? URL.createObjectURL(profilePhotoFile) : empRes?.data?.profilePictureUrl || null}
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

              <div className="mt-10 flex justify-end gap-4 border-t border-gray-100 pt-6">
                <button
                  type="button"
                  onClick={() => navigate('/hr/employees')}
                  className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-indigo-600 text-white font-bold shadow-md hover:bg-indigo-700 transition-all disabled:opacity-50"
                >
                  {isUpdating ? (
                    <span className="spinner-border spinner-border-sm" />
                  ) : (
                    <Save size={18} />
                  )}
                  Save Changes
                </button>
              </div>
            </form>
          </FormProvider>
        </div>
      </div>
    </div>
  )
}
