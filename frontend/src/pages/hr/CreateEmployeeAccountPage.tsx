import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { skipToken } from '@reduxjs/toolkit/query'
import { FormProvider, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { UserPlus, User, Users, Briefcase, ClipboardCheck, Check } from 'lucide-react'

import {
  useCreateEmployeeAccountMutation,
  useGetDepartmentsQuery,
  useGetNextStaffNoQuery,
  useGetDepartmentPositionsQuery,
  useLazyCheckEmailQuery,
  useLazyCheckStaffNrcQuery,
  useLazyCheckStaffNoQuery,
  useResendTemporaryPasswordMutation,
} from '../../features/hrCreateEmployee/hrEmployeeAccountApi'
import {
  createEmployeeAccountSchema,
  type CreateEmployeeAccountFormValues,
} from '../../features/hrCreateEmployee/schemas/createEmployeeAccountSchema'
import { useAppSelector } from '../../app/hooks'
import { toTitleCasePersonName, withGenderTitle } from '../../utils/personName'
import { CreateEmployeeSuccessModal } from './create-account/CreateEmployeeSuccessModal'
import { EmployeeInformationStep } from './create-account/EmployeeInformationStep'
import { EmploymentInformationStep } from './create-account/EmploymentInformationStep'
import { FamilyEmergencyStep } from './create-account/FamilyEmergencyStep'
import { ReviewConfirmStep } from './create-account/ReviewConfirmStep'
import { useUploadProfilePictureMutation } from '../../features/user/userApi'
import EmployeeImportModal from '../../features/hrEmployeeList/components/EmployeeImportModal'
import { createAccountGradient, createAccountGradientBr } from './create-account/createAccountTheme'

const STEPS = [
  { label: 'Personal Details', icon: User },
  { label: 'Family & Emergency', icon: Users },
  { label: 'Employment Info', icon: Briefcase },
  { label: 'Review & Confirm', icon: ClipboardCheck },
] as const

const DEBOUNCE_MS = 550

type Dup = 'idle' | 'checking' | 'exists' | 'available'

function buildNrc(v: CreateEmployeeAccountFormValues): string | undefined {
  const a = v.nrcStateCode?.trim()
  const b = v.nrcTownshipCode?.trim()
  const c = v.nrcType?.trim()
  const d = v.nrcNumber?.trim()
  if (!a && !b && !c && !d) return undefined
  if (a && b && c && d) return `${a}/${b}(${c})${d}`
  return undefined
}

function buildFatherNrc(v: CreateEmployeeAccountFormValues): string | undefined {
  const a = v.fatherNrcStateCode?.trim()
  const b = v.fatherNrcTownshipCode?.trim()
  const c = v.fatherNrcType?.trim()
  const d = v.fatherNrcNumber?.trim()
  if (!a && !b && !c && !d) return undefined
  if (a && b && c && d) return `${a}/${b}(${c})${d}`
  return undefined
}

function buildSpouseNrc(v: CreateEmployeeAccountFormValues): string | undefined {
  const a = v.spouseNrcStateCode?.trim()
  const b = v.spouseNrcTownshipCode?.trim()
  const c = v.spouseNrcType?.trim()
  const d = v.spouseNrcNumber?.trim()
  if (!a && !b && !c && !d) return undefined
  if (a && b && c && d) return `${a}/${b}(${c})${d}`
  return undefined
}

const emailOk = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim())

function staffDupBlocks(staffDup: Dup): boolean {
  return staffDup !== 'available'
}

function nrcDupBlocks(nrcDup: Dup): boolean {
  return nrcDup !== 'available'
}

function emailDupBlocks(emailDup: Dup): boolean {
  return emailDup !== 'available'
}

export function CreateEmployeeAccountPage() {
  const navigate = useNavigate()
  const user = useAppSelector((s) => s.auth.user)
  const token = useAppSelector((s) => s.auth.token)
  const today = useMemo(() => format(new Date(), 'yyyy-MM-dd'), [])
  const [importModalOpen, setImportModalOpen] = useState(false)

  const form = useForm<CreateEmployeeAccountFormValues>({
    resolver: zodResolver(createEmployeeAccountSchema) as never,
    defaultValues: {
      email: '',
      staffNo: '',
      employeeName: '',
      gender: undefined,
      dateOfBirth: '',
      phoneNo: '',
      address: '',
      religion: '',
      race: '',
      nrcStateCode: '',
      nrcTownshipCode: '',
      nrcType: '',
      nrcNumber: '',
      fatherName: '',
      fatherNrcStateCode: '',
      fatherNrcTownshipCode: '',
      fatherNrcType: '',
      fatherNrcNumber: '',
      fatherOccupation: '',
      maritalStatus: 'Single',
      spouseName: '',
      spouseNrcStateCode: '',
      spouseNrcTownshipCode: '',
      spouseNrcType: '',
      spouseNrcNumber: '',
      emergencyPhone: '',
      emergencyRelation: '',
      staffType: 'PERMANENT',
      probationStartDate: '',
      probationEndDate: '',
      hireDate: today,
      departmentId: null,
      departmentPositionId: null,
      assignAsDepartmentManager: false,
    },
    mode: 'onBlur',
  })

  const { register, control, handleSubmit, formState, setValue, getValues, trigger, watch, reset, setError, clearErrors } = form
  const { errors, isSubmitting } = formState

  const [step, setStep] = useState(1)
  const [emailDup, setEmailDup] = useState<Dup>('idle')
  const [staffDup, setStaffDup] = useState<Dup>('idle')
  const [nrcDup, setNrcDup] = useState<Dup>('idle')
  const [successOpen, setSuccessOpen] = useState(false)
  const [created, setCreated] = useState<{ employeeId: number; staffNo: string; name: string; email: string } | null>(null)
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null)
  const profilePhotoPreviewUrl = useMemo(
    () => (profilePhotoFile ? URL.createObjectURL(profilePhotoFile) : null),
    [profilePhotoFile],
  )
  useEffect(() => {
    return () => {
      if (profilePhotoPreviewUrl) URL.revokeObjectURL(profilePhotoPreviewUrl)
    }
  }, [profilePhotoPreviewUrl])
  const [photoError, setPhotoError] = useState('')
  const initialAutoStaffApplied = useRef(false)
  const [animKey, setAnimKey] = useState(0)

  const [checkEmail] = useLazyCheckEmailQuery()
  const [checkStaff] = useLazyCheckStaffNoQuery()
  const [checkStaffNrc] = useLazyCheckStaffNrcQuery()
  const [createAccount, { isLoading: createLoading }] = useCreateEmployeeAccountMutation()
  const [uploadProfilePicture] = useUploadProfilePictureMutation()
  const [resendPw, { isLoading: resendLoading }] = useResendTemporaryPasswordMutation()

  const { data: deptRes, isLoading: deptLoading } = useGetDepartmentsQuery()
  const departments = deptRes?.data ?? []

  const { data: nextStaffPayload, isLoading: nextStaffLoading, refetch: refetchNextStaff } = useGetNextStaffNoQuery()
  const nextStaffNoFromApi = nextStaffPayload?.data?.nextStaffNo

  const departmentId = useWatch({ control, name: 'departmentId' })
  const { data: posRes, isLoading: posLoading } = useGetDepartmentPositionsQuery(
    typeof departmentId === 'number' ? departmentId : skipToken,
  )
  const positions = posRes?.data ?? []
  const departmentPositionId = useWatch({ control, name: 'departmentPositionId' })
  const selectedDepartment = useMemo(
    () => departments.find((department) => department.departmentId === departmentId) ?? null,
    [departmentId, departments],
  )
  const selectedPosition = useMemo(
    () => positions.find((position) => position.id === departmentPositionId) ?? null,
    [departmentPositionId, positions],
  )

  const emailVal = watch('email')
  const staffVal = watch('staffNo')
  const autoStaffDisplay = (staffVal?.trim() || nextStaffNoFromApi || '').trim()

  useEffect(() => {
    if (!nextStaffNoFromApi || initialAutoStaffApplied.current) return
    setValue('staffNo', nextStaffNoFromApi, { shouldValidate: true })
    initialAutoStaffApplied.current = true
  }, [nextStaffNoFromApi, setValue])

  useEffect(() => {
    const email = emailVal?.trim() ?? ''
    if (!emailOk(email)) {
      setEmailDup('idle')
      return
    }
    setEmailDup('checking')
    const t = window.setTimeout(() => {
      checkEmail(email)
        .unwrap()
        .then((res) => {
          if (res.success && res.data) {
            setEmailDup(res.data.exists ? 'exists' : 'available')
          } else setEmailDup('idle')
        })
        .catch(() => setEmailDup('idle'))
    }, DEBOUNCE_MS)
    return () => window.clearTimeout(t)
  }, [emailVal, checkEmail])

  useEffect(() => {
    const staff = staffVal?.trim() ?? ''
    if (!staff) {
      setStaffDup('idle')
      return
    }
    if (!/^[0-9]+$/.test(staff)) {
      setStaffDup('idle')
      return
    }
    setStaffDup('checking')
    const t = window.setTimeout(() => {
      checkStaff(staff)
        .unwrap()
        .then((res) => {
          if (res.success && res.data) {
            setStaffDup(res.data.exists ? 'exists' : 'available')
          } else setStaffDup('idle')
        })
        .catch(() => setStaffDup('idle'))
    }, DEBOUNCE_MS)
    return () => window.clearTimeout(t)
  }, [staffVal, checkStaff])

  const nrcStateCode = watch('nrcStateCode')
  const nrcTownshipCode = watch('nrcTownshipCode')
  const nrcType = watch('nrcType')
  const nrcNumber = watch('nrcNumber')
  const nrcPreview = useMemo(() => {
    if (nrcStateCode && nrcTownshipCode && nrcType && nrcNumber) {
      return `${nrcStateCode}/${nrcTownshipCode}(${nrcType})${nrcNumber}`
    }
    return ''
  }, [nrcStateCode, nrcTownshipCode, nrcType, nrcNumber])

  useEffect(() => {
    if (!nrcPreview || String(nrcNumber ?? '').trim().length !== 6) {
      setNrcDup('idle')
      clearErrors('nrcNumber')
      return
    }
    setNrcDup('checking')
    const t = window.setTimeout(() => {
      checkStaffNrc(nrcPreview)
        .unwrap()
        .then((res) => {
          if (!res.success || typeof res.data !== 'boolean') {
            setNrcDup('idle')
            return
          }
          if (res.data) {
            setNrcDup('exists')
            setError('nrcNumber', { type: 'manual', message: 'This NRC number already exists.' })
            return
          }
          setNrcDup('available')
          clearErrors('nrcNumber')
        })
        .catch(() => setNrcDup('idle'))
    }, DEBOUNCE_MS)
    return () => window.clearTimeout(t)
  }, [checkStaffNrc, clearErrors, nrcNumber, nrcPreview, setError])

  const fatherNrcStateCode = watch('fatherNrcStateCode')
  const fatherNrcTownshipCode = watch('fatherNrcTownshipCode')
  const fatherNrcType = watch('fatherNrcType')
  const fatherNrcNumber = watch('fatherNrcNumber')
  const fatherNrcPreview = useMemo(() => {
    if (fatherNrcStateCode && fatherNrcTownshipCode && fatherNrcType && fatherNrcNumber) {
      return `${fatherNrcStateCode}/${fatherNrcTownshipCode}(${fatherNrcType})${fatherNrcNumber}`
    }
    return ''
  }, [fatherNrcStateCode, fatherNrcTownshipCode, fatherNrcType, fatherNrcNumber])

  const spouseNrcStateCode = watch('spouseNrcStateCode')
  const spouseNrcTownshipCode = watch('spouseNrcTownshipCode')
  const spouseNrcType = watch('spouseNrcType')
  const spouseNrcNumber = watch('spouseNrcNumber')
  const spouseNrcPreview = useMemo(() => {
    if (spouseNrcStateCode && spouseNrcTownshipCode && spouseNrcType && spouseNrcNumber) {
      return `${spouseNrcStateCode}/${spouseNrcTownshipCode}(${spouseNrcType})${spouseNrcNumber}`
    }
    return ''
  }, [spouseNrcStateCode, spouseNrcTownshipCode, spouseNrcType, spouseNrcNumber])

  const allValues = watch()

  const goNext = async () => {
    if (step === 1) {
      const fields: (keyof CreateEmployeeAccountFormValues)[] = [
        'email',
        'staffNo',
        'employeeName',
        'gender',
        'dateOfBirth',
        'phoneNo',
        'address',
        'religion',
        'race',
        'nrcStateCode',
        'nrcTownshipCode',
        'nrcType',
        'nrcNumber',
      ]
      const ok = await trigger(fields)
      if (!ok) return
      if (emailDupBlocks(emailDup)) {
        if (emailDup === 'exists') toast.error('This email is already in use.')
        else if (emailDup === 'checking') toast.error('Wait for the email availability check to finish.')
        else toast.error('Enter a valid email and wait until it shows as available.')
        return
      }
      if (staffDupBlocks(staffDup)) {
        if (staffDup === 'exists') toast.error('This staff number is already in use. Enter a unique staff number.')
        else if (staffDup === 'checking') toast.error('Wait for the staff number check to finish.')
        else toast.error('Staff number must show as available before continuing.')
        return
      }
      if (nrcDupBlocks(nrcDup)) {
        if (nrcDup === 'exists') {
          setError('nrcNumber', { type: 'manual', message: 'This NRC number already exists.' })
          toast.error('This NRC number already exists.')
        } else if (nrcDup === 'checking') {
          toast.error('Wait for the NRC availability check to finish.')
        } else {
          toast.error('Complete NRC and wait until it shows as available.')
        }
        return
      }
      setStep(2)
      setAnimKey((k) => k + 1)
      return
    }
    if (step === 2) {
      const ok = await trigger([
        'maritalStatus',
        'spouseName',
        'spouseNrcStateCode',
        'spouseNrcTownshipCode',
        'spouseNrcType',
        'spouseNrcNumber',
        'fatherName',
        'fatherNrcStateCode',
        'fatherNrcTownshipCode',
        'fatherNrcType',
        'fatherNrcNumber',
        'fatherOccupation',
        'emergencyPhone',
        'emergencyRelation',
      ])
      if (!ok) {
        toast.error('Please fix the highlighted fields before continuing.')
        return
      }
      setValue('fatherName', toTitleCasePersonName(getValues('fatherName') ?? ''), { shouldValidate: false })
      setStep(3)
      setAnimKey((k) => k + 1)
      return
    }
    if (step === 3) {
      const ok = await trigger([
        'staffType',
        'probationStartDate',
        'probationEndDate',
        'hireDate',
        'departmentId',
        'departmentPositionId',
      ])
      if (!ok) return
      setStep(4)
      setAnimKey((k) => k + 1)
    }
  }

  const goBack = () => {
    if (step > 1) {
      setStep((s) => s - 1)
      setAnimKey((k) => k + 1)
    }
  }

  const onFinal = useCallback(
    async (v: CreateEmployeeAccountFormValues) => {
      if (emailDupBlocks(emailDup) || staffDupBlocks(staffDup) || nrcDupBlocks(nrcDup)) {
        toast.error('Email, staff number, and NRC must be verified as available before submitting.')
        return
      }
      const emailNorm = v.email.trim().toLowerCase()
      const staffNorm = v.staffNo.trim()
      const nrc = buildNrc(v)
      if (!nrc) {
        toast.error('NRC number is required')
        return
      }
      try {
        const emailRecheck = await checkEmail(emailNorm).unwrap()
        if (emailRecheck.success && emailRecheck.data?.exists) {
          toast.error('This email is already in use.')
          return
        }
        const staffRecheck = await checkStaff(staffNorm).unwrap()
        if (staffRecheck.success && staffRecheck.data?.exists) {
          toast.error('This staff number is already in use.')
          return
        }
        const nrcRecheck = await checkStaffNrc(nrc).unwrap()
        if (nrcRecheck.success && nrcRecheck.data) {
          setError('nrcNumber', { type: 'manual', message: 'This NRC number already exists.' })
          toast.error('This NRC number already exists.')
          return
        }
      } catch {
        toast.error('Could not verify email, staff number, or NRC. Try again.')
        return
      }
      try {
        let profilePictureUrl: string | undefined
        if (profilePhotoFile) {
          const up = await uploadProfilePicture(profilePhotoFile).unwrap()
          if (!up.success || !up.data?.profilePictureUrl) {
            toast.error(up.message || 'Could not upload profile photo')
            return
          }
          profilePictureUrl = up.data.profilePictureUrl
        }
        const fatherNrc = buildFatherNrc(v)
        const spouseNrcBuilt = buildSpouseNrc(v)
        const fatherOcc = v.fatherOccupation.trim()
        const res = await createAccount({
          staffNo: staffNorm,
          employeeName: withGenderTitle(v.employeeName, v.gender),
          gender: v.gender,
          email: emailNorm,
          dateOfBirth: v.dateOfBirth,
          phoneNo: v.phoneNo.trim(),
          address: v.address.trim(),
          religion: v.religion.trim(),
          race: v.race.trim(),
          nrc,
          fatherName: v.fatherName.trim(),
          fatherNrc,
          fatherOccupation: fatherOcc,
          maritalStatus: v.maritalStatus,
          spouseName: v.maritalStatus === 'Married' ? (v.spouseName ?? '').trim() : undefined,
          spouseNrc: v.maritalStatus === 'Married' ? spouseNrcBuilt : undefined,
          emergencyPhone: v.emergencyPhone.trim(),
          emergencyRelation: v.emergencyRelation.trim(),
          staffType: v.staffType,
          probationStartDate: v.staffType === 'PROBATION' ? v.probationStartDate : undefined,
          probationEndDate: v.staffType === 'PROBATION' ? v.probationEndDate : undefined,
          hireDate: v.hireDate,
          departmentId: v.departmentId!,
          departmentPositionId: v.departmentPositionId!,
          assignAsDepartmentManager: selectedPosition?.roleId === 2 && selectedDepartment?.managerId == null
            ? Boolean(v.assignAsDepartmentManager)
            : false,
          profilePictureUrl,
        }).unwrap()
        if (!res.success || !res.data) {
          toast.error(res.message || 'Could not create account')
          return
        }
        setCreated({
          employeeId: res.data.employeeId,
          staffNo: res.data.staffNo,
          name: res.data.employeeName,
          email: res.data.email,
        })
        setSuccessOpen(true)
        if (res.data.managerAssignmentWarning) {
          toast(res.data.managerAssignmentWarning)
        }
        toast.success(res.data.message || 'Employee account created')
      } catch (e: unknown) {
        const err = e as { data?: { message?: string } }
        toast.error(err.data?.message || 'Could not create account')
      }
    },
    [createAccount, emailDup, staffDup, nrcDup, checkEmail, checkStaff, checkStaffNrc, profilePhotoFile, setError, uploadProfilePicture, selectedDepartment, selectedPosition],
  )

  const resetFlow = async () => {
    initialAutoStaffApplied.current = false
    reset({
      email: '',
      staffNo: '',
      employeeName: '',
      gender: undefined,
      dateOfBirth: '',
      phoneNo: '',
      address: '',
      religion: '',
      race: '',
      nrcStateCode: '',
      nrcTownshipCode: '',
      nrcType: '',
      nrcNumber: '',
      fatherName: '',
      fatherNrcStateCode: '',
      fatherNrcTownshipCode: '',
      fatherNrcType: '',
      fatherNrcNumber: '',
      fatherOccupation: '',
      maritalStatus: 'Single',
      spouseName: '',
      spouseNrcStateCode: '',
      spouseNrcTownshipCode: '',
      spouseNrcType: '',
      spouseNrcNumber: '',
      emergencyPhone: '',
      emergencyRelation: '',
      staffType: 'PERMANENT',
      probationStartDate: '',
      probationEndDate: '',
      hireDate: today,
      departmentId: null,
      departmentPositionId: null,
      assignAsDepartmentManager: false,
    })
    setStep(1)
    setEmailDup('idle')
    setStaffDup('idle')
    setNrcDup('idle')
    setCreated(null)
    setSuccessOpen(false)
    setProfilePhotoFile(null)
    setPhotoError('')
    setAnimKey((k) => k + 1)
    try {
      const { data: refetched } = await refetchNextStaff()
      const n = refetched?.data?.nextStaffNo
      if (n) {
        setValue('staffNo', n, { shouldValidate: true })
        initialAutoStaffApplied.current = true
      }
    } catch {
      /* ignore */
    }
  }

  const handleResend = async () => {
    if (!created) return
    if (!window.confirm('Are you sure you want to resend a new temporary password to this employee?')) return
    try {
      const res = await resendPw(created.employeeId).unwrap()
      if (res.success) toast.success(res.data?.message || 'Temporary password resent.')
      else toast.error(res.message || 'Resend failed')
    } catch (e: unknown) {
      const err = e as { data?: { message?: string } }
      toast.error(err.data?.message || 'Resend failed')
    }
  }

  if (user && user.roleId !== 1) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
        You do not have permission to create employee accounts.
      </div>
    )
  }

  return (
    <FormProvider {...form}>
      <div className="mx-auto max-w-4xl">
        {/* ── Page Header ── */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${createAccountGradientBr} text-white shadow-lg shadow-[#2463eb]/25`}>
                <UserPlus size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Create Employee Account</h1>
                <p className="mt-0.5 text-sm text-slate-500">
                  Register employee details and create a login account. Review carefully before submitting.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setImportModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2463eb] text-white text-sm font-semibold hover:bg-[#1d4ed8] transition shadow-sm"
              >
                <i className="bi bi-file-earmark-arrow-up"></i>
                Import Employees
              </button>
            </div>
          </div>
        </div>

        {/* ── Stepper ── */}
        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center">
            {STEPS.map((s, i) => {
              const num = i + 1
              const isActive = step === num
              const isDone = step > num
              const Icon = s.icon
              return (
                <div key={s.label} className="flex flex-1 items-center">
                  <div className="flex items-center gap-3">
                    <div
                      className={`relative flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold transition-all duration-300 ${
                        isDone
                          ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                          : isActive
                            ? `${createAccountGradientBr} text-white shadow-md shadow-[#2463eb]/25`
                            : 'border border-slate-200 bg-slate-50 text-slate-400'
                      }`}
                    >
                      {isDone ? <Check size={18} strokeWidth={3} /> : <Icon size={18} />}
                    </div>
                    <div className="hidden sm:block">
                      <p
                        className={`text-xs font-bold uppercase tracking-wide ${
                          isActive ? 'text-[#1d4ed8]' : isDone ? 'text-emerald-600' : 'text-slate-400'
                        }`}
                      >
                        Step {num}
                      </p>
                      <p
                        className={`text-sm font-semibold ${
                          isActive ? 'text-slate-900' : isDone ? 'text-slate-700' : 'text-slate-400'
                        }`}
                      >
                        {s.label}
                      </p>
                    </div>
                  </div>
                  {num < STEPS.length ? (
                    <div className="mx-4 min-w-6 flex-1">
                      <div className="h-0.5 rounded-full bg-slate-300">
                        <div
                          className={`h-0.5 rounded-full ${createAccountGradient} transition-all duration-500`}
                          style={{ width: isDone ? '100%' : '0%' }}
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Form Card ── */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Step indicator bar */}
          <div className="h-1 overflow-hidden rounded-t-2xl bg-slate-100">
            <div
              className={`h-1 rounded-r-full ${createAccountGradient} transition-all duration-500 ease-out`}
              style={{ width: `${(step / STEPS.length) * 100}%` }}
            />
          </div>

          <div className="p-6 sm:p-8" key={animKey}>
            <div className="animate-fade-in-up">
              {step === 1 ? (
                <EmployeeInformationStep
                  register={register}
                  control={control}
                  errors={errors}
                  setValue={setValue}
                  emailDup={emailDup}
                  staffDup={staffDup}
                  autoStaffDisplay={autoStaffDisplay}
                  nextStaffLoading={nextStaffLoading}
                  profilePhotoPreviewUrl={profilePhotoPreviewUrl}
                  onProfilePhotoFileChange={(file) => {
                    setProfilePhotoFile(file)
                    setPhotoError('')
                  }}
                  photoError={photoError}
                />
              ) : null}
              {step === 2 ? (
                <FamilyEmergencyStep register={register} control={control} errors={errors} setValue={setValue} />
              ) : null}
              {step === 3 ? (
                <EmploymentInformationStep
                  register={register}
                  control={control}
                  errors={errors}
                  setValue={setValue}
                  departments={departments}
                  positions={positions}
                  departmentLoading={deptLoading}
                  positionLoading={posLoading}
                  selectedDepartment={selectedDepartment}
                />
              ) : null}
              {step === 4 ? (
                <ReviewConfirmStep
                  values={allValues}
                  nrcPreview={nrcPreview}
                  fatherNrcPreview={fatherNrcPreview}
                  spouseNrcPreview={spouseNrcPreview}
                  linkedRoleName={selectedPosition?.roleName}
                />
              ) : null}
            </div>
          </div>

          {/* ── Footer Buttons ── */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-5 sm:px-8">
            <button
              type="button"
              onClick={goBack}
              disabled={step === 1 || createLoading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:shadow-md disabled:opacity-40 disabled:shadow-none"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-slate-400">
                <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Back
            </button>
            <div className="flex gap-3">
              {step < 4 ? (
                <button
                  type="button"
                  onClick={() => void goNext()}
                  className={`inline-flex items-center gap-2 rounded-xl ${createAccountGradient} px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#2463eb]/25 transition hover:shadow-lg hover:shadow-[#2463eb]/30 active:scale-[0.98]`}
                >
                  Next
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={createLoading || isSubmitting}
                  onClick={() => void handleSubmit(onFinal)()}
                  className={`inline-flex items-center gap-2 rounded-xl ${createAccountGradient} px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-[#2463eb]/25 transition hover:shadow-lg hover:shadow-[#2463eb]/30 active:scale-[0.98] disabled:opacity-60 disabled:shadow-none`}
                >
                  {createLoading || isSubmitting ? (
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <UserPlus size={16} />
                  )}
                  Create Account
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {created ? (
        <CreateEmployeeSuccessModal
          open={successOpen}
          onClose={() => navigate('/hr/employees')}
          employeeName={created.name}
          email={created.email}
          staffNo={created.staffNo}
          resendLoading={resendLoading}
          onResend={() => void handleResend()}
          onCreateAnother={() => resetFlow()}
          onViewEmployeeList={() => navigate('/hr/employees')}
        />
      ) : null}

      {/* Employee Import Modal */}
      <EmployeeImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImportSuccess={() => { /* navigate to list or refresh */ }}
        token={token}
      />
    </FormProvider>
  )
}
