import { useEffect } from 'react'
import { Heart, Phone, UserCircle2, Users } from 'lucide-react'
import type { Control, FieldErrors, UseFormRegister, UseFormSetValue } from 'react-hook-form'
import { useWatch } from 'react-hook-form'

import type { CreateEmployeeAccountFormValues } from '../../../features/hrCreateEmployee/schemas/createEmployeeAccountSchema'
import { toTitleCasePersonName } from '../../../utils/personName'
import { FatherNrcInputField } from './FatherNrcInputField'
import { SpouseNrcInputField } from './SpouseNrcInputField'

interface FamilyEmergencyStepProps {
  register: UseFormRegister<CreateEmployeeAccountFormValues>
  control: Control<CreateEmployeeAccountFormValues>
  errors: FieldErrors<CreateEmployeeAccountFormValues>
  setValue: UseFormSetValue<CreateEmployeeAccountFormValues>
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

const inputBase =
  'w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none ring-0 transition-all duration-200 placeholder:text-slate-300 focus:border-teal-400 focus:shadow-[0_0_0_3px_rgba(20,184,166,0.1)]'
const inputNormal = `${inputBase} border-slate-200`
const inputError = `${inputBase} border-red-300 bg-red-50/30`

/** Matches Step 1 Phone Number and phone validation (+ optional + 8–15 digits). */
const PHONE_INPUT_MAX_LENGTH = 20
const NAME_MAX_LENGTH = 50
const RELATION_MAX_LENGTH = 20

export function FamilyEmergencyStep({ register, control, errors, setValue }: FamilyEmergencyStepProps) {
  const maritalStatus = useWatch({ control, name: 'maritalStatus' })
  const spouseNameLen = String(useWatch({ control, name: 'spouseName' }) ?? '').length
  const fatherNameLen = String(useWatch({ control, name: 'fatherName' }) ?? '').length
  const fatherOccLen = String(useWatch({ control, name: 'fatherOccupation' }) ?? '').length
  const emergencyPhoneLen = String(useWatch({ control, name: 'emergencyPhone' }) ?? '').length
  const emergencyRelationLen = String(useWatch({ control, name: 'emergencyRelation' }) ?? '').length

  useEffect(() => {
    if (maritalStatus === 'Married') return
    setValue('spouseName', '', { shouldValidate: false })
    setValue('spouseNrcStateCode', '', { shouldValidate: false })
    setValue('spouseNrcTownshipCode', '', { shouldValidate: false })
    setValue('spouseNrcType', '', { shouldValidate: false })
    setValue('spouseNrcNumber', '', { shouldValidate: false })
  }, [maritalStatus, setValue])

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <SectionHeader icon={Heart} title="Marital status" />
      <div className="md:col-span-2">
        <p className="mb-3 text-sm font-semibold text-slate-700">
          Marital status <span className="text-red-400">*</span>
        </p>
        <div className="grid grid-cols-2 gap-4">
          <label
            className={`group relative flex cursor-pointer items-center gap-4 rounded-xl border-2 p-5 transition-all ${
              maritalStatus === 'Single'
                ? 'border-teal-500 bg-linear-to-br from-teal-50 to-emerald-50 shadow-md shadow-teal-500/10'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
            }`}
          >
            <input type="radio" value="Single" className="sr-only" {...register('maritalStatus')} />
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl transition ${
                maritalStatus === 'Single'
                  ? 'bg-teal-500 text-white shadow-md shadow-teal-500/25'
                  : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
              }`}
            >
              <Heart size={20} />
            </div>
            <div>
              <p className={`text-sm font-bold ${maritalStatus === 'Single' ? 'text-teal-900' : 'text-slate-700'}`}>Single</p>
              <p className="mt-0.5 text-xs text-slate-500">Not married</p>
            </div>
            {maritalStatus === 'Single' ? (
              <div className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-teal-500 text-white">
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            ) : null}
          </label>

          <label
            className={`group relative flex cursor-pointer items-center gap-4 rounded-xl border-2 p-5 transition-all ${
              maritalStatus === 'Married'
                ? 'border-violet-500 bg-linear-to-br from-violet-50 to-purple-50 shadow-md shadow-violet-500/10'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
            }`}
          >
            <input type="radio" value="Married" className="sr-only" {...register('maritalStatus')} />
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl transition ${
                maritalStatus === 'Married'
                  ? 'bg-violet-500 text-white shadow-md shadow-violet-500/25'
                  : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
              }`}
            >
              <Users size={20} />
            </div>
            <div>
              <p className={`text-sm font-bold ${maritalStatus === 'Married' ? 'text-violet-900' : 'text-slate-700'}`}>
                Married
              </p>
              <p className="mt-0.5 text-xs text-slate-500">Legally married</p>
            </div>
            {maritalStatus === 'Married' ? (
              <div className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-violet-500 text-white">
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            ) : null}
          </label>
        </div>
        {errors.maritalStatus?.message ? (
          <p className="mt-2 text-xs text-red-600">{String(errors.maritalStatus.message)}</p>
        ) : null}
      </div>

      {maritalStatus === 'Married' ? (
        <>
          <SectionHeader icon={Users} title="Spouse" />
          <div className="md:col-span-2 grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="spouse-name">
                Spouse&apos;s name <span className="text-red-500">*</span>
              </label>
              <input
                id="spouse-name"
                type="text"
                autoComplete="off"
                maxLength={NAME_MAX_LENGTH}
                className={errors.spouseName ? inputError : inputNormal}
                {...register('spouseName', {
                  onBlur: (e) => {
                    const n = toTitleCasePersonName(e.target.value)
                    if (n !== e.target.value) setValue('spouseName', n, { shouldValidate: true })
                  },
                })}
              />
              <div className="mt-1 flex w-full items-start justify-between gap-2 text-xs">
                <span className={errors.spouseName ? 'text-red-600' : ''}>
                  {errors.spouseName?.message ? String(errors.spouseName.message) : null}
                </span>
                <span className="shrink-0 text-slate-400">{spouseNameLen}/{NAME_MAX_LENGTH}</span>
              </div>
            </div>
          </div>
          <div className="md:col-span-2">
            <SpouseNrcInputField control={control} errors={errors} setValue={setValue} />
          </div>
        </>
      ) : null}

      <SectionHeader icon={UserCircle2} title="Father Information" />
      <div className="md:col-span-2 grid gap-5 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="father-name">
            Father&apos;s name <span className="text-red-500">*</span>
          </label>
          <input
            id="father-name"
            type="text"
            autoComplete="off"
            maxLength={NAME_MAX_LENGTH}
            className={errors.fatherName ? inputError : inputNormal}
            {...register('fatherName', {
              onBlur: (e) => {
                const n = toTitleCasePersonName(e.target.value)
                if (n !== e.target.value) setValue('fatherName', n, { shouldValidate: true })
              },
            })}
          />
          <div className="mt-1 flex w-full items-start justify-between gap-2 text-xs">
            <span className={errors.fatherName ? 'text-red-600' : ''}>
              {errors.fatherName?.message ? String(errors.fatherName.message) : null}
            </span>
            <span className="shrink-0 text-slate-400">{fatherNameLen}/{NAME_MAX_LENGTH}</span>
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="father-occupation">
            Father&apos;s occupation
          </label>
          <input
            id="father-occupation"
            type="text"
            autoComplete="off"
            maxLength={NAME_MAX_LENGTH}
            className={errors.fatherOccupation ? inputError : inputNormal}
            {...register('fatherOccupation')}
          />
          <div className="mt-1 flex w-full items-start justify-between gap-2 text-xs">
            <span className={errors.fatherOccupation ? 'text-red-600' : ''}>
              {errors.fatherOccupation?.message ? String(errors.fatherOccupation.message) : null}
            </span>
            <span className="shrink-0 text-slate-400">{fatherOccLen}/{NAME_MAX_LENGTH}</span>
          </div>
        </div>
      </div>
      <div className="md:col-span-2">
        <FatherNrcInputField control={control} errors={errors} setValue={setValue} />
      </div>

      <SectionHeader icon={Users} title="Emergency contact" />
      <div className="md:col-span-2 grid gap-5 md:grid-cols-2">
        <div>
          <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700" htmlFor="emergency-phone">
            <Phone size={14} className="text-slate-400" />
            Emergency phone <span className="text-red-400">*</span>
          </label>
          <input
            id="emergency-phone"
            type="tel"
            autoComplete="tel"
            maxLength={PHONE_INPUT_MAX_LENGTH}
            placeholder="+95xxxxxxxxx or 09xxxxxxxx"
            className={errors.emergencyPhone ? inputError : inputNormal}
            {...register('emergencyPhone')}
          />
          <div className="mt-1 flex w-full items-start justify-between gap-2 text-xs">
            <span className={errors.emergencyPhone ? 'text-red-600' : ''}>
              {errors.emergencyPhone?.message ? String(errors.emergencyPhone.message) : null}
            </span>
            <span className="shrink-0 text-slate-400">{emergencyPhoneLen}/{PHONE_INPUT_MAX_LENGTH}</span>
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="emergency-relation">
            Relationship to employee
          </label>
          <input
            id="emergency-relation"
            type="text"
            autoComplete="off"
            maxLength={RELATION_MAX_LENGTH}
            placeholder="e.g. Spouse, Parent, Sibling"
            className={errors.emergencyRelation ? inputError : inputNormal}
            {...register('emergencyRelation')}
          />
          <div className="mt-1 flex w-full items-start justify-between gap-2 text-xs">
            <span className={errors.emergencyRelation ? 'text-red-600' : ''}>
              {errors.emergencyRelation?.message ? String(errors.emergencyRelation.message) : null}
            </span>
            <span className="shrink-0 text-slate-400">{emergencyRelationLen}/{RELATION_MAX_LENGTH}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
