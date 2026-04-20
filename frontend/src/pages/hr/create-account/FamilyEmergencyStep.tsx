import { Phone, UserCircle2, Users } from 'lucide-react'
import type { Control, FieldErrors, UseFormRegister, UseFormSetValue } from 'react-hook-form'

import type { CreateEmployeeAccountFormValues } from '../../../features/hrCreateEmployee/schemas/createEmployeeAccountSchema'
import { toTitleCasePersonName } from '../../../utils/personName'
import { FatherNrcInputField } from './FatherNrcInputField'

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
const PHONE_INPUT_MAX_LENGTH = 16

export function FamilyEmergencyStep({ register, control, errors, setValue }: FamilyEmergencyStepProps) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
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
            maxLength={100}
            className={errors.fatherName ? inputError : inputNormal}
            {...register('fatherName', {
              onBlur: (e) => {
                const n = toTitleCasePersonName(e.target.value)
                if (n !== e.target.value) setValue('fatherName', n, { shouldValidate: true })
              },
            })}
          />
          {errors.fatherName?.message ? <p className="mt-1 text-xs text-red-600">{String(errors.fatherName.message)}</p> : null}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="father-occupation">
            Father&apos;s occupation <span className="text-red-500">*</span>
          </label>
          <input
            id="father-occupation"
            type="text"
            autoComplete="off"
            maxLength={100}
            className={errors.fatherOccupation ? inputError : inputNormal}
            {...register('fatherOccupation')}
          />
          {errors.fatherOccupation?.message ? (
            <p className="mt-1 text-xs text-red-600">{String(errors.fatherOccupation.message)}</p>
          ) : null}
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
          {errors.emergencyPhone?.message ? (
            <p className="mt-1 text-xs text-red-600">{String(errors.emergencyPhone.message)}</p>
          ) : null}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="emergency-relation">
            Relationship to employee
          </label>
          <input
            id="emergency-relation"
            type="text"
            autoComplete="off"
            maxLength={50}
            placeholder="e.g. Spouse, Parent, Sibling"
            className={errors.emergencyRelation ? inputError : inputNormal}
            {...register('emergencyRelation')}
          />
          {errors.emergencyRelation?.message ? (
            <p className="mt-1 text-xs text-red-600">{String(errors.emergencyRelation.message)}</p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
