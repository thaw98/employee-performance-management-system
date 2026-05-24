import { useMemo } from 'react'
import { Controller, useWatch, type Control, type FieldErrors, type UseFormSetValue } from 'react-hook-form'

import { getNrcStates, getNrcTownships, getNrcTypes } from '../../../features/employeeOnboarding/utils/nrcData'
import type { CreateEmployeeAccountFormValues } from '../../../features/hrCreateEmployee/schemas/createEmployeeAccountSchema'

const allStates = getNrcStates()
const allTownships = getNrcTownships()
const allTypes = getNrcTypes()

const selectBase =
  'h-full cursor-pointer appearance-none bg-transparent px-2 py-2 text-sm text-slate-800 focus:outline-none disabled:cursor-not-allowed disabled:text-slate-400'

interface NrcInputFieldProps {
  control: Control<CreateEmployeeAccountFormValues>
  errors: FieldErrors<CreateEmployeeAccountFormValues>
  setValue: UseFormSetValue<CreateEmployeeAccountFormValues>
}

export function NrcInputField({ control, errors, setValue }: NrcInputFieldProps) {
  const nrcStateCode = useWatch({ control, name: 'nrcStateCode' })
  const nrcTownshipCode = useWatch({ control, name: 'nrcTownshipCode' })
  const nrcType = useWatch({ control, name: 'nrcType' })
  const nrcNumber = useWatch({ control, name: 'nrcNumber' })

  const filteredTownships = useMemo(
    () => (nrcStateCode ? allTownships.filter((t) => t.stateCode === nrcStateCode) : []),
    [nrcStateCode],
  )

  const nrcPreview =
    nrcStateCode && nrcTownshipCode && nrcType && nrcNumber
      ? `${nrcStateCode}/${nrcTownshipCode}(${nrcType})${nrcNumber}`
      : ''

  const hasError =
    Boolean(errors.nrcStateCode) ||
    Boolean(errors.nrcTownshipCode) ||
    Boolean(errors.nrcType) ||
    Boolean(errors.nrcNumber)

  return (
    <div className="space-y-1">
      <label
        className={`mb-1 block text-sm font-medium ${hasError ? 'text-red-600' : 'text-slate-700'}`}
        htmlFor="nrc-state"
      >
        NRC Number <span className="text-red-400">*</span>
      </label>
      <div
        className={`flex items-stretch overflow-hidden rounded-lg border bg-white transition-colors ${
          hasError ? 'border-red-500' : 'border-slate-300 focus-within:border-[#2463eb]'
        }`}
      >
        <Controller
          control={control}
          name="nrcStateCode"
          render={({ field }) => (
            <div className="flex min-w-[90px] flex-col justify-center px-2">
              <span className="mb-0.5 text-[10px] leading-none text-sky-600">State</span>
              <select
                id="nrc-state"
                className={selectBase}
                value={field.value ?? ''}
                onChange={(e) => {
                  field.onChange(e.target.value)
                  setValue('nrcTownshipCode', '', { shouldValidate: false })
                }}
                onBlur={field.onBlur}
              >
                <option value="">—</option>
                {allStates.map((state) => (
                  <option key={state.id} value={state.number.en}>
                    {state.number.en}
                  </option>
                ))}
              </select>
            </div>
          )}
        />
        <span className="flex items-center self-stretch px-0.5 text-lg font-light text-slate-300 select-none">/</span>
        <Controller
          control={control}
          name="nrcTownshipCode"
          render={({ field }) => (
            <div className="flex min-w-[110px] flex-1 flex-col justify-center px-2">
              <span className="mb-0.5 text-[10px] leading-none text-sky-600">Township</span>
              <select
                className={selectBase}
                value={field.value ?? ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
                disabled={!nrcStateCode}
              >
                <option value="">—</option>
                {filteredTownships.map((township) => (
                  <option key={township.id} value={township.short.en}>
                    {township.short.en} — {township.name.en}
                  </option>
                ))}
              </select>
            </div>
          )}
        />
        <span className="flex items-center self-stretch px-0.5 text-lg font-light text-slate-300 select-none">(</span>
        <Controller
          control={control}
          name="nrcType"
          render={({ field }) => (
            <div className="flex min-w-[80px] flex-col justify-center px-2">
              <span className="mb-0.5 text-[10px] leading-none text-sky-600">Type</span>
              <select className={selectBase} value={field.value ?? ''} onChange={field.onChange} onBlur={field.onBlur}>
                <option value="">—</option>
                {allTypes.map((type) => (
                  <option key={type.id} value={type.name.en}>
                    {type.name.mm ?? type.name.en} ({type.name.en})
                  </option>
                ))}
              </select>
            </div>
          )}
        />
        <span className="flex items-center self-stretch px-0.5 text-lg font-light text-slate-300 select-none">)</span>
        <Controller
          control={control}
          name="nrcNumber"
          render={({ field }) => (
            <div className="flex min-w-[90px] flex-1 flex-col justify-center px-2">
              <span className="mb-0.5 text-[10px] leading-none text-sky-600">Number</span>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                maxLength={6}
                placeholder="000000"
                className="w-full bg-transparent py-2 text-sm text-slate-800 focus:outline-none"
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value.replace(/[^0-9]/g, ''))}
                onBlur={field.onBlur}
              />
            </div>
          )}
        />
      </div>
      {errors.nrcStateCode?.message ? (
        <p className="text-xs text-red-600">{String(errors.nrcStateCode.message)}</p>
      ) : null}
      {errors.nrcTownshipCode?.message ? (
        <p className="text-xs text-red-600">{String(errors.nrcTownshipCode.message)}</p>
      ) : null}
      {errors.nrcType?.message ? <p className="text-xs text-red-600">{String(errors.nrcType.message)}</p> : null}
      {errors.nrcNumber?.message ? (
        <p className="text-xs text-red-600">{String(errors.nrcNumber.message)}</p>
      ) : null}
      {nrcPreview ? (
        <div className="mt-2 rounded-lg border border-[#dbeafe] bg-[#eff6ff] px-4 py-3">
          <span className="mb-0.5 block text-xs text-slate-400">NRC preview</span>
          <span className="font-mono text-sm font-semibold text-slate-800">{nrcPreview}</span>
        </div>
      ) : null}
    </div>
  )
}
