import {
  Controller,
  useWatch,
  type Control,
  type FieldErrors,
  type UseFormRegister,
  type UseFormSetValue,
} from 'react-hook-form'
import { useRef } from 'react'
import toast from 'react-hot-toast'
import { Camera, Upload, Trash2, RefreshCw, Hash, User, Globe } from 'lucide-react'

import type { CreateEmployeeAccountFormValues } from '../../../features/hrCreateEmployee/schemas/createEmployeeAccountSchema'
import { NrcInputField } from './NrcInputField'

const RELIGIONS = ['Buddhist', 'Christian', 'Muslim', 'Hindu'] as const

const EMPLOYEE_NAME_MAX_LENGTH = 50

/** Optional + plus up to 15 digits; matches createEmployeeAccountSchema phone regex. */
const PHONE_INPUT_MAX_LENGTH = 16

type Dup = 'idle' | 'checking' | 'exists' | 'available'

interface EmployeeInformationStepProps {
  register: UseFormRegister<CreateEmployeeAccountFormValues>
  control: Control<CreateEmployeeAccountFormValues>
  errors: FieldErrors<CreateEmployeeAccountFormValues>
  setValue: UseFormSetValue<CreateEmployeeAccountFormValues>
  emailDup: Dup
  staffDup: Dup
  autoStaffDisplay: string
  nextStaffLoading: boolean
  profilePhotoPreviewUrl: string | null
  onProfilePhotoFileChange: (file: File | null) => void
  photoError: string
}

function SectionHeader({ icon: Icon, title }: { icon: React.ComponentType<{ size?: number; className?: string }>; title: string }) {
  return (
    <div className="md:col-span-2 flex items-center gap-3 pb-1 pt-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
        <Icon size={16} />
      </div>
      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">{title}</h3>
      <div className="flex-1 border-b border-slate-100" />
    </div>
  )
}

function DupBadge({ status, entityName }: { status: Dup; entityName: string }) {
  if (status === 'idle') return null
  return (
    <div className="mt-1.5 flex items-center gap-2">
      {status === 'checking' ? (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-teal-600" />
          Checking {entityName}…
        </span>
      ) : null}
      {status === 'exists' ? (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500" />
          Already exists
        </span>
      ) : null}
      {status === 'available' ? (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Available
        </span>
      ) : null}
    </div>
  )
}

const inputBase =
  'w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none ring-0 transition-all duration-200 placeholder:text-slate-300 focus:border-teal-400 focus:shadow-[0_0_0_3px_rgba(20,184,166,0.1)]'
const inputNormal = `${inputBase} border-slate-200`
const inputError = `${inputBase} border-red-300 bg-red-50/30`

export function EmployeeInformationStep({
  register,
  control,
  errors,
  setValue,
  emailDup,
  staffDup,
  autoStaffDisplay,
  nextStaffLoading,
  profilePhotoPreviewUrl,
  onProfilePhotoFileChange,
  photoError,
}: EmployeeInformationStepProps) {
  const photoInputRef = useRef<HTMLInputElement>(null)
  const employeeNameLen = String(useWatch({ control, name: 'employeeName' }) ?? '').length

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file (JPG, PNG, GIF, etc.).')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Photo must be less than 5 MB.')
      return
    }
    onProfilePhotoFileChange(file)
  }

  const handlePhotoDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file (JPG, PNG, GIF, etc.).')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Photo must be less than 5 MB.')
      return
    }
    onProfilePhotoFileChange(file)
  }

  return (
    <div className="space-y-6">
      {/* ── Profile Photo ── */}
      <div className="flex flex-col items-center py-2">
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhotoChange}
        />
        {profilePhotoPreviewUrl ? (
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="h-28 w-28 overflow-hidden rounded-2xl border-2 border-teal-200 shadow-lg shadow-teal-500/10">
                <img src={profilePhotoPreviewUrl} alt="Profile preview" className="h-full w-full object-cover" />
              </div>
              <div className="absolute -right-1 -bottom-1 flex h-7 w-7 items-center justify-center rounded-full bg-teal-500 text-white shadow-md">
                <Camera size={14} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition hover:bg-slate-50"
                onClick={() => photoInputRef.current?.click()}
              >
                <RefreshCw size={12} />
                Change
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 shadow-sm transition hover:bg-red-50"
                onClick={() => {
                  onProfilePhotoFileChange(null)
                  if (photoInputRef.current) photoInputRef.current.value = ''
                }}
              >
                <Trash2 size={12} />
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div
            role="button"
            tabIndex={0}
            className="group flex w-full max-w-sm cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-gradient-to-b from-slate-50 to-white px-6 py-8 text-center transition-all hover:border-teal-300 hover:from-teal-50/30 hover:to-white hover:shadow-md"
            onClick={() => photoInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') photoInputRef.current?.click()
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handlePhotoDrop}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-100 text-teal-600 shadow-inner transition-transform group-hover:scale-110">
              <Upload size={22} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">Upload Profile Photo</p>
              <p className="mt-0.5 text-xs text-slate-400">Click or drag & drop · JPG, PNG — max 5 MB</p>
            </div>
          </div>
        )}
        {photoError ? <p className="mt-2 text-center text-xs text-red-600">{photoError}</p> : null}
      </div>

      {/* ── Staff Number Banner ── */}
      <div className="rounded-xl border border-teal-200/50 bg-gradient-to-r from-teal-50 to-emerald-50 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-teal-600 shadow-sm">
            <Hash size={18} />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold uppercase tracking-wider text-teal-700">Next Auto Staff Number</p>
            {nextStaffLoading ? (
              <div className="mt-1.5 flex items-center gap-2 text-sm text-slate-600">
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-teal-200 border-t-teal-600" />
                Loading…
              </div>
            ) : (
              <p className="mt-1 font-mono text-3xl font-black tracking-tight text-teal-900 tabular-nums">
                {autoStaffDisplay || '—'}
              </p>
            )}
          </div>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-teal-700/70">
          Auto-assigned from the next available number. You can override it below if your policy allows.
        </p>
      </div>

      {/* ── Account Details Section ── */}
      <div className="grid gap-5 md:grid-cols-2">
        <SectionHeader icon={Hash} title="Account Details" />

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor="staffNo">
            Staff Number <span className="text-red-400">*</span>
          </label>
          <input
            id="staffNo"
            inputMode="numeric"
            autoComplete="off"
            className={errors.staffNo ? inputError : inputNormal}
            placeholder="e.g. 1001"
            {...register('staffNo')}
          />
          {errors.staffNo?.message ? (
            <p className="mt-1 text-xs text-red-600">{String(errors.staffNo.message)}</p>
          ) : null}
          <DupBadge status={staffDup} entityName="staff number" />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor="email">
            Email Address <span className="text-red-400">*</span>
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className={errors.email ? inputError : inputNormal}
            placeholder="employee@company.com"
            {...register('email')}
          />
          {errors.email?.message ? (
            <p className="mt-1 text-xs text-red-600">{String(errors.email.message)}</p>
          ) : null}
          <DupBadge status={emailDup} entityName="email" />
        </div>
      </div>

      {/* ── Personal Information Section ── */}
      <div className="grid gap-5 md:grid-cols-2">
        <SectionHeader icon={User} title="Personal Information" />

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor="employeeName">
            Full Name <span className="text-red-400">*</span>
          </label>
          <input
            id="employeeName"
            className={errors.employeeName ? inputError : inputNormal}
            placeholder="Enter full name"
            maxLength={EMPLOYEE_NAME_MAX_LENGTH}
            {...register('employeeName')}
          />
          <div className="mt-1 flex w-full items-start justify-between gap-2 text-xs">
            <span className={errors.employeeName ? 'text-red-600' : ''}>
              {errors.employeeName?.message ? String(errors.employeeName.message) : null}
            </span>
            <span className="shrink-0 text-slate-400">
              {employeeNameLen}/{EMPLOYEE_NAME_MAX_LENGTH}
            </span>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor="dateOfBirth">
            Date of Birth <span className="text-red-400">*</span>
          </label>
          <input
            id="dateOfBirth"
            type="date"
            className={errors.dateOfBirth ? inputError : inputNormal}
            {...register('dateOfBirth')}
          />
          {errors.dateOfBirth?.message ? (
            <p className="mt-1 text-xs text-red-600">{String(errors.dateOfBirth.message)}</p>
          ) : null}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor="gender">
            Gender <span className="text-red-400">*</span>
          </label>
          <Controller
            control={control}
            name="gender"
            render={({ field }) => (
              <select
                id="gender"
                className={errors.gender ? inputError : inputNormal}
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value || undefined)}
                onBlur={field.onBlur}
              >
                <option value="">— Select —</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            )}
          />
          {errors.gender?.message ? (
            <p className="mt-1 text-xs text-red-600">{String(errors.gender.message)}</p>
          ) : null}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor="phoneNo">
            Phone Number <span className="text-red-400">*</span>
          </label>
          <input
            id="phoneNo"
            type="tel"
            autoComplete="tel"
            maxLength={PHONE_INPUT_MAX_LENGTH}
            className={errors.phoneNo ? inputError : inputNormal}
            placeholder="+95xxxxxxxxx or 09xxxxxxxx"
            {...register('phoneNo')}
          />
          {errors.phoneNo?.message ? (
            <p className="mt-1 text-xs text-red-600">{String(errors.phoneNo.message)}</p>
          ) : null}
        </div>

        <div className="md:col-span-2">
          <label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor="nationality">
            Nationality <span className="text-red-400">*</span>
          </label>
          <input
            id="nationality"
            className={errors.nationality ? inputError : inputNormal}
            placeholder="e.g. Myanmar"
            {...register('nationality')}
          />
          {errors.nationality?.message ? (
            <p className="mt-1 text-xs text-red-600">{String(errors.nationality.message)}</p>
          ) : null}
        </div>

        <div className="md:col-span-2">
          <label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor="address">
            Address <span className="text-red-400">*</span>
          </label>
          <textarea
            id="address"
            rows={3}
            className={`${errors.address ? inputError : inputNormal} resize-none`}
            placeholder="Street address, city, region"
            {...register('address')}
          />
          {errors.address?.message ? (
            <p className="mt-1 text-xs text-red-600">{String(errors.address.message)}</p>
          ) : null}
        </div>

        <div className="md:col-span-2">
          <label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor="religion">
            Religion <span className="text-red-400">*</span>
          </label>
          <Controller
            control={control}
            name="religion"
            render={({ field }) => (
              <select
                id="religion"
                className={errors.religion ? inputError : inputNormal}
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value || undefined)}
                onBlur={field.onBlur}
              >
                <option value="">— Select —</option>
                {RELIGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            )}
          />
          {errors.religion?.message ? (
            <p className="mt-1 text-xs text-red-600">{String(errors.religion.message)}</p>
          ) : null}
        </div>
      </div>

      {/* ── NRC Section ── */}
      <div className="grid gap-5 md:grid-cols-2">
        <SectionHeader icon={Globe} title="Identification" />
        <div className="md:col-span-2">
          <NrcInputField control={control} errors={errors} setValue={setValue} />
        </div>
      </div>
    </div>
  )
}
