import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { skipToken } from '@reduxjs/toolkit/query'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  Pencil,
  Save,
  ArrowLeftRight,
  RotateCcw,
  Building2,
  History,
  User,
  Shield,
  ChevronRight,
  BadgeCheck,
  Clock,
  Sparkles,
  Loader2,
} from 'lucide-react'

import {
  useGetEmployeeByIdQuery,
  useUpdateEmployeeMutation,
  useUpdateEmploymentStatusMutation,
  type EmployeeUpdateRequest,
  type UpdateEmploymentStatusRequest,
} from '../../features/hrEmployeeList/hrEmployeeApi'
import {
  useGetDepartmentsQuery,
  useGetDepartmentPositionsQuery,
} from '../../features/hrCreateEmployee/hrEmployeeAccountApi'
import {
  editEmployeeSchema,
  type EditEmployeeFormValues,
} from '../../features/hrCreateEmployee/schemas/createEmployeeAccountSchema'
import { EmployeeInformationStep } from './create-account/EmployeeInformationStep'
import { EmploymentInformationStep } from './create-account/EmploymentInformationStep'
import { FamilyEmergencyStep } from './create-account/FamilyEmergencyStep'
import { useUploadProfilePictureMutation } from '../../features/user/userApi'
import { useGetTransferHistoryQuery } from '../../features/hrEmployeeList/employeeTransferApi'
import { TransferHistoryTable } from '../../features/hrEmployeeList/components/TransferHistoryTable'
import { TemporaryTransferModal } from '../../features/hrEmployeeList/components/TemporaryTransferModal'
import { ReturnModal } from '../../features/hrEmployeeList/components/ReturnModal'
import { PermanentTransferModal } from '../../features/hrEmployeeList/components/PermanentTransferModal'

const STAFF_TYPE_PERMANENT_ID = 1

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

const tabs = [
  { id: 'personal' as const, label: 'Personal Details', icon: User, description: 'Basic information & identity' },
  { id: 'family' as const, label: 'Family & Emergency', icon: Shield, description: 'Contacts & next of kin' },
  { id: 'employment' as const, label: 'Employment Info', icon: Pencil, description: 'Role, department & status' },
  { id: 'transfer' as const, label: 'Transfer History', icon: History, description: 'Movement & assignment log' },
]

export default function EditEmployeePage() {
  const { employeeId } = useParams<{ employeeId: string }>()
  const navigate = useNavigate()
  const id = Number(employeeId)

  const { data: empRes, isLoading: isEmpLoading } = useGetEmployeeByIdQuery(id, {
    skip: !id,
  })
  const [updateEmployee, { isLoading: isUpdating }] = useUpdateEmployeeMutation()
  const [updateEmploymentStatus, { isLoading: isStatusUpdating }] = useUpdateEmploymentStatusMutation()
  const [uploadProfilePhoto] = useUploadProfilePictureMutation()

  const { data: deptRes, isLoading: deptLoading } = useGetDepartmentsQuery()
  const departments = deptRes?.data ?? []

  const [activeTab, setActiveTab] = useState<'personal' | 'family' | 'employment' | 'transfer'>('personal')
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null)
  const [photoError] = useState('')
  const [showTempTransfer, setShowTempTransfer] = useState(false)
  const [showReturn, setShowReturn] = useState(false)
  const [showPermTransfer, setShowPermTransfer] = useState(false)

  const { data: transferRes, isLoading: transferLoading } = useGetTransferHistoryQuery(id)
  const [transitionMode, setTransitionMode] = useState<'NOW' | 'CUSTOM' | ''>('')
  const [transitionDate, setTransitionDate] = useState('')

  const form = useForm<EditEmployeeFormValues>({
    resolver: zodResolver(editEmployeeSchema) as never,
    mode: 'onBlur',
  })

  const { reset, handleSubmit, watch, setValue, formState: { errors } } = form
  const deptId = watch('departmentId')

  const { data: posRes, isLoading: posLoading } = useGetDepartmentPositionsQuery(
    typeof deptId === 'number' ? deptId : skipToken,
  )
  const positions = posRes?.data ?? []

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
        staffNo: d.employeeId,
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
        departmentPositionId: d.departmentPositionId ?? null,
        positionId: d.positionId,
      })
    }
  }, [empRes, reset])

  const currentStatus = empRes?.data?.staffTypeName === 'Probation' ? 'PROBATION' : 'PERMANENT'
  const isPermanentStaff = empRes?.data?.staffTypeId === STAFF_TYPE_PERMANENT_ID
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
        employeeId: v.staffNo ?? '',
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
        departmentPositionId: v.departmentPositionId!,
        dateOfJoining: v.hireDate,
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
      navigate('/hr/employees')
    } catch (error: unknown) {
      const err = error as { data?: { message?: string } }
      toast.error(err?.data?.message || 'Update failed')
    }
  }

  /* ── Loading State ── */
  if (!id || isEmpLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 animate-pulse" />
            <div className="absolute inset-0 h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 animate-ping opacity-20" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <p className="text-sm font-semibold text-slate-700">Loading employee data</p>
            <p className="text-xs text-slate-400">Please wait a moment…</p>
          </div>
        </div>
      </div>
    )
  }

  const employee = empRes?.data
  const profileUrl = profilePhotoFile
    ? URL.createObjectURL(profilePhotoFile)
    : employee?.profilePictureUrl || null
  const initials = (employee?.employeeName ?? 'E')
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/20 flex flex-col relative pb-24">

      {/* ═══════════════════ HERO HEADER ═══════════════════ */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-violet-950">
        {/* Decorative elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-violet-500/10 blur-3xl" />
          <div className="absolute top-0 left-0 h-full w-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgMGg2MHY2MEgweiIgZmlsbD0ibm9uZSIvPjxjaXJjbGUgY3g9IjMwIiBjeT0iMzAiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNCkiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZykiLz48L3N2Zz4=')] opacity-60" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm mb-6">
            <button
              onClick={() => navigate('/hr/employees')}
              className="flex items-center gap-1.5 text-indigo-300/80 hover:text-white transition-colors group"
            >
              <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
              <span>Employees</span>
            </button>
            <ChevronRight size={14} className="text-indigo-400/40" />
            <span className="text-white/70 font-medium">Edit</span>
            <ChevronRight size={14} className="text-indigo-400/40" />
            <span className="text-white font-semibold">{employee?.employeeName}</span>
          </nav>

          {/* Employee identity card */}
          <div className="flex items-center gap-5">
            {/* Avatar */}
            <div className="relative shrink-0">
              {profileUrl ? (
                <div className="h-[72px] w-[72px] overflow-hidden rounded-2xl ring-2 ring-white/20 shadow-xl shadow-black/20">
                  <img src={profileUrl} alt={employee?.employeeName} className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="flex h-[72px] w-[72px] items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-400 to-violet-500 ring-2 ring-white/20 shadow-xl shadow-black/20">
                  <span className="text-xl font-bold text-white tracking-wider">{initials}</span>
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-md">
                <Pencil size={11} className="text-indigo-600" />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-white tracking-tight truncate">
                  {employee?.employeeName ?? 'Employee'}
                </h1>
                {isPermanentStaff ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-400/20 backdrop-blur-sm">
                    <BadgeCheck size={12} />
                    Permanent
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-300 ring-1 ring-amber-400/20 backdrop-blur-sm">
                    <Clock size={12} />
                    Probation
                  </span>
                )}
              </div>
              <div className="mt-1.5 flex items-center gap-4 text-sm text-indigo-200/60">
                {employee?.employeeId && (
                  <span className="font-mono text-xs bg-white/5 px-2 py-0.5 rounded-md">
                    ID #{employee.employeeId}
                  </span>
                )}
                {employee?.departmentName && (
                  <span className="flex items-center gap-1.5">
                    <Building2 size={12} />
                    {employee.departmentName}
                  </span>
                )}
                {employee?.positionName && (
                  <span className="hidden sm:inline-flex items-center gap-1.5">
                    <Sparkles size={12} />
                    {employee.positionName}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════ MAIN CONTENT ═══════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        <div className="flex gap-8 items-start">

          {/* ── Sidebar Nav ── */}
          <aside className="hidden lg:block w-64 shrink-0 sticky top-6">
            <nav className="flex flex-col gap-1.5">
              {tabs.map((tab, idx) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`group relative flex items-center gap-3.5 rounded-xl px-4 py-3.5 text-left transition-all duration-200 ${
                      isActive
                        ? 'bg-white text-slate-900 shadow-md shadow-slate-200/60 ring-1 ring-slate-200/60'
                        : 'text-slate-500 hover:bg-white/60 hover:text-slate-700 hover:shadow-sm'
                    }`}
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all ${
                        isActive
                          ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/25'
                          : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-500'
                      }`}
                    >
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-semibold truncate ${isActive ? 'text-slate-900' : ''}`}>
                        {tab.label}
                      </p>
                      <p className={`text-[11px] truncate ${isActive ? 'text-slate-500' : 'text-slate-400'}`}>
                        {tab.description}
                      </p>
                    </div>
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 rounded-r-full bg-gradient-to-b from-indigo-500 to-violet-600" />
                    )}
                  </button>
                )
              })}
            </nav>

            {/* Quick Stats Card */}
            <div className="mt-6 rounded-xl border border-slate-200/60 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">Quick Info</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Joined</span>
                  <span className="text-xs font-semibold text-slate-700">
                    {formatDateDisplay(employee?.dateOfJoining)}
                  </span>
                </div>
                <div className="h-px bg-slate-100" />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Status</span>
                  <span className={`text-xs font-semibold ${employee?.status === 'Active' ? 'text-emerald-600' : 'text-slate-500'}`}>
                    {employee?.status ?? '-'}
                  </span>
                </div>
                <div className="h-px bg-slate-100" />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Type</span>
                  <span className="text-xs font-semibold text-slate-700">
                    {employee?.staffTypeName ?? '-'}
                  </span>
                </div>
              </div>
            </div>
          </aside>

          {/* ── Mobile Tabs ── */}
          <div className="lg:hidden w-full mb-6 -mt-2">
            <div className="flex gap-1 overflow-x-auto rounded-xl bg-white/80 p-1.5 shadow-sm ring-1 ring-slate-200/60 backdrop-blur-sm">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2.5 text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/20'
                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                    }`}
                  >
                    <Icon size={14} />
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── Content Area ── */}
          <main className="flex-1 min-w-0">
            <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60 overflow-hidden">
              {/* Tab Header */}
              <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white px-8 py-5">
                <div className="flex items-center gap-3">
                  {(() => {
                    const current = tabs.find(t => t.id === activeTab)!
                    const Icon = current.icon
                    return (
                      <>
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/20">
                          <Icon size={18} />
                        </div>
                        <div>
                          <h2 className="text-lg font-bold text-slate-900">{current.label}</h2>
                          <p className="text-xs text-slate-500">{current.description}</p>
                        </div>
                      </>
                    )
                  })()}
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-8">
                <FormProvider {...form}>
                  <form id="edit-employee-form" onSubmit={handleSubmit(onSubmit)}>
                    {activeTab === 'personal' && (
                      <div className="animate-fade-in">
                        <EmployeeInformationStep
                          register={form.register as never}
                          control={form.control as never}
                          errors={errors as never}
                          setValue={setValue as never}
                          emailDup="idle"
                          staffDup="idle"
                          autoStaffDisplay={watch('staffNo') ?? ''}
                          nextStaffLoading={false}
                          hideStaffBanner={true}
                          readOnlyStaffNo={true}
                          profilePhotoPreviewUrl={
                            profilePhotoFile
                              ? URL.createObjectURL(profilePhotoFile)
                              : empRes?.data?.profilePictureUrl || null
                          }
                          onProfilePhotoFileChange={(file: File | null) => setProfilePhotoFile(file)}
                          photoError={photoError}
                        />
                      </div>
                    )}

                    {activeTab === 'family' && (
                      <div className="animate-fade-in">
                        <FamilyEmergencyStep
                          register={form.register as never}
                          control={form.control as never}
                          errors={errors as never}
                          setValue={setValue as never}
                        />
                      </div>
                    )}

                    {activeTab === 'employment' && (
                      <div className="animate-fade-in space-y-6">
                        <EmploymentInformationStep
                          register={form.register as never}
                          control={form.control as never}
                          errors={errors as never}
                          setValue={setValue as never}
                          departments={departments}
                          positions={positions}
                          departmentLoading={deptLoading}
                          positionLoading={posLoading}
                          disableProbationOption={isPermanentStaff}
                          beforeHireDate={
                            isProbationToPermanent ? (
                              <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-emerald-50/60 to-teal-50/40 p-6 shadow-sm">
                                <label className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
                                  <Shield size={16} className="text-emerald-600" />
                                  When to make permanent <span className="text-red-500">*</span>
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <label
                                    className={`relative flex items-center gap-4 rounded-xl border-2 p-4 transition-all cursor-pointer group ${
                                      transitionMode === 'NOW'
                                        ? 'border-emerald-500 bg-emerald-50 shadow-md shadow-emerald-500/10'
                                        : 'border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30'
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
                                      className="h-5 w-5 border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <div className="flex-1">
                                      <p className="text-base font-semibold text-emerald-700">Immediate</p>
                                      <p className="text-xs text-slate-500">Probation ends today, status changes immediately</p>
                                    </div>
                                  </label>
                                  <label
                                    className={`relative flex items-center gap-4 rounded-xl border-2 p-4 transition-all cursor-pointer group ${
                                      transitionMode === 'CUSTOM'
                                        ? 'border-emerald-500 bg-emerald-50 shadow-md shadow-emerald-500/10'
                                        : 'border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30'
                                    }`}
                                  >
                                    <input
                                      type="radio"
                                      name="transitionMode"
                                      value="CUSTOM"
                                      checked={transitionMode === 'CUSTOM'}
                                      onChange={() => setTransitionMode('CUSTOM')}
                                      className="h-5 w-5 border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <div className="flex-1">
                                      <p className="text-base font-semibold text-emerald-700">Custom Date</p>
                                      <p className="text-xs text-slate-500">Choose a specific probation end date</p>
                                    </div>
                                  </label>
                                </div>

                                {transitionMode === 'CUSTOM' && (
                                  <div className="mt-4 bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                      Probation End Date <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                      type="date"
                                      min={minTransitionDate}
                                      value={transitionDate}
                                      onChange={(e) => setTransitionDate(e.target.value)}
                                      className="block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-emerald-500 focus:outline-none transition-colors"
                                    />
                                    <p className="mt-2 text-xs text-slate-500">
                                      Must be after probation start date ({formatDateDisplay(probationStartDate)}).
                                    </p>
                                  </div>
                                )}
                              </div>
                            ) : null
                          }
                        />
                      </div>
                    )}

                    {activeTab === 'transfer' && (
                      <div className="animate-fade-in space-y-8">
                        {/* Action Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <button
                            type="button"
                            onClick={() => setShowTempTransfer(true)}
                            className="group relative flex flex-col items-center gap-3 rounded-2xl border-2 border-amber-200/60 bg-gradient-to-br from-amber-50 to-orange-50/50 p-6 text-center transition-all hover:border-amber-300 hover:shadow-lg hover:shadow-amber-500/10 hover:-translate-y-0.5 active:scale-[0.98]"
                          >
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/20 transition-transform group-hover:scale-110">
                              <ArrowLeftRight size={20} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-amber-900">Temporary Transfer</p>
                              <p className="mt-0.5 text-[11px] text-amber-600/70">Short-term assignment</p>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => setShowReturn(true)}
                            className="group relative flex flex-col items-center gap-3 rounded-2xl border-2 border-emerald-200/60 bg-gradient-to-br from-emerald-50 to-teal-50/50 p-6 text-center transition-all hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-500/10 hover:-translate-y-0.5 active:scale-[0.98]"
                          >
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-lg shadow-emerald-500/20 transition-transform group-hover:scale-110">
                              <RotateCcw size={20} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-emerald-900">Return</p>
                              <p className="mt-0.5 text-[11px] text-emerald-600/70">End temporary transfer</p>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => setShowPermTransfer(true)}
                            className="group relative flex flex-col items-center gap-3 rounded-2xl border-2 border-violet-200/60 bg-gradient-to-br from-violet-50 to-purple-50/50 p-6 text-center transition-all hover:border-violet-300 hover:shadow-lg hover:shadow-violet-500/10 hover:-translate-y-0.5 active:scale-[0.98]"
                          >
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 text-white shadow-lg shadow-violet-500/20 transition-transform group-hover:scale-110">
                              <Building2 size={20} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-violet-900">Permanent Transfer</p>
                              <p className="mt-0.5 text-[11px] text-violet-600/70">Reassign to new dept</p>
                            </div>
                          </button>
                        </div>

                        {/* Transfer history */}
                        <div>
                          <div className="flex items-center gap-3 mb-5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                              <History size={16} />
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-slate-900">Transfer History</h3>
                              <p className="text-[11px] text-slate-500">
                                All assignment changes for this employee
                              </p>
                            </div>
                          </div>
                          <TransferHistoryTable
                            history={transferRes?.data ?? []}
                            isLoading={transferLoading}
                          />
                        </div>
                      </div>
                    )}
                  </form>
                </FormProvider>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* ═══════════════════ STICKY FOOTER ═══════════════════ */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200/80 bg-white/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <p className="hidden sm:block text-xs text-slate-400">
            Editing <span className="font-semibold text-slate-600">{employee?.employeeName}</span> · {tabs.find(t => t.id === activeTab)?.label}
          </p>
          <div className="flex items-center gap-3 ml-auto">
            <button
              type="button"
              onClick={() => navigate('/hr/employees')}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold bg-white hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-[0.98]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit(onSubmit)}
              disabled={isUpdating || isStatusUpdating}
              className="flex items-center gap-2 px-7 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-bold shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 hover:from-indigo-500 hover:to-violet-500 active:scale-[0.97] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdating || isStatusUpdating ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              Save Changes
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════ MODALS ═══════════════════ */}
      <TemporaryTransferModal
        isOpen={showTempTransfer}
        employeeId={id}
        employeeName={empRes?.data?.employeeName ?? ''}
        onClose={() => setShowTempTransfer(false)}
        onSuccess={() => {}}
      />
      <ReturnModal
        isOpen={showReturn}
        employeeId={id}
        employeeName={empRes?.data?.employeeName ?? ''}
        onClose={() => setShowReturn(false)}
        onSuccess={() => {}}
      />
      <PermanentTransferModal
        isOpen={showPermTransfer}
        employeeId={id}
        employeeName={empRes?.data?.employeeName ?? ''}
        onClose={() => setShowPermTransfer(false)}
        onSuccess={() => {}}
      />
    </div>
  )
}
