import { getNrcStates, getNrcTownships, getNrcTypes } from '../utils/nrcData'
import { useMemo } from 'react'
import { Controller, useWatch, type Control, type FieldErrors, type UseFormSetValue } from 'react-hook-form'

import type { EmployeeInfoFormValues } from '../schemas/employeeInfoSchema'

const allStates = getNrcStates()
const allTownships = getNrcTownships()
const allTypes = getNrcTypes()

interface NrcFieldsProps {
  control: Control<EmployeeInfoFormValues>
  errors: FieldErrors<EmployeeInfoFormValues>
  setValue: UseFormSetValue<EmployeeInfoFormValues>
  prefix?: 'father'
  label?: string
  required?: boolean
}

const selectBase =
  'h-full bg-transparent text-sm text-slate-800 focus:outline-none appearance-none cursor-pointer disabled:cursor-not-allowed disabled:text-slate-400 py-2 px-2'

export function NrcFields({ control, errors, setValue, prefix, label = 'NRC Number', required = true }: NrcFieldsProps) {
  const stateFieldName = (prefix ? `${prefix}NrcStateCode` : 'nrcStateCode') as any
  const townshipFieldName = (prefix ? `${prefix}NrcTownshipCode` : 'nrcTownshipCode') as any
  const typeFieldName = (prefix ? `${prefix}NrcType` : 'nrcType') as any
  const numberFieldName = (prefix ? `${prefix}NrcNumber` : 'nrcNumber') as any

  const nrcStateCode = useWatch({ control, name: stateFieldName })
  const nrcTownshipCode = useWatch({ control, name: townshipFieldName })
  const nrcType = useWatch({ control, name: typeFieldName })
  const nrcNumber = useWatch({ control, name: numberFieldName })

  const filteredTownships = useMemo(
    () => (nrcStateCode ? allTownships.filter((t) => t.stateCode === nrcStateCode) : []),
    [nrcStateCode],
  )

  const nrcPreview =
    nrcStateCode && nrcTownshipCode && nrcType && nrcNumber
      ? `${nrcStateCode}/${nrcTownshipCode}(${nrcType})${nrcNumber}`
      : ''

  const hasError =
    Boolean(errors[stateFieldName as keyof EmployeeInfoFormValues]) ||
    Boolean(errors[townshipFieldName as keyof EmployeeInfoFormValues]) ||
    Boolean(errors[typeFieldName as keyof EmployeeInfoFormValues]) ||
    Boolean(errors[numberFieldName as keyof EmployeeInfoFormValues])

  return (
    <div className="space-y-1">
      {/* Label */}
      <label className={`block text-xs font-medium mb-1 ${hasError ? 'text-red-600' : 'text-slate-500'}`}>
        {label} {required ? '*' : ''}
      </label>

      {/* Inline compound field: StateCode / Township ( Type ) Number */}
      <div
        className={`flex items-stretch rounded-lg border bg-white overflow-hidden transition-colors ${
          hasError ? 'border-red-500' : 'border-slate-300 focus-within:border-blue-500'
        }`}
      >
        {/* State/Region */}
        <Controller
          control={control}
          name={stateFieldName}
          render={({ field }) => (
            <div className="flex flex-col justify-center px-2 min-w-[90px]">
              <span className="text-[10px] text-sky-600 leading-none mb-0.5">State</span>
              <select
                className={selectBase}
                value={field.value ?? ''}
                onChange={(e) => {
                  field.onChange(e.target.value)
                  setValue(townshipFieldName, '', { shouldValidate: false })
                }}
                onBlur={field.onBlur}
              >
                <option value="">_</option>
                {allStates.map((state) => (
                  <option key={state.id} value={state.number.en}>
                    {state.number.en}
                  </option>
                ))}
              </select>
            </div>
          )}
        />

        {/* Separator: / */}
        <span className="flex items-center self-stretch px-0.5 text-slate-300 font-light text-lg select-none">/</span>

        {/* Township */}
        <Controller
          control={control}
          name={townshipFieldName}
          render={({ field }) => (
            <div className="flex flex-col justify-center px-2 flex-1 min-w-[110px]">
              <span className="text-[10px] text-sky-600 leading-none mb-0.5">Township</span>
              <select
                className={selectBase}
                value={field.value ?? ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
                disabled={!nrcStateCode}
              >
                <option value="">_</option>
                {filteredTownships.map((township) => (
                  <option key={township.id} value={township.short.en}>
                    {township.short.en} — {township.name.en}
                  </option>
                ))}
              </select>
            </div>
          )}
        />

        {/* Separator: ( */}
        <span className="flex items-center self-stretch px-0.5 text-slate-300 font-light text-lg select-none">(</span>

        {/* NRC Type */}
        <Controller
          control={control}
          name={typeFieldName}
          render={({ field }) => (
            <div className="flex flex-col justify-center px-2 min-w-[80px]">
              <span className="text-[10px] text-sky-600 leading-none mb-0.5">Type</span>
              <select
                className={selectBase}
                value={field.value ?? ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
              >
                <option value="">_</option>
                {allTypes.map((type) => (
                  <option key={type.id} value={type.name.en}>
                    {type.name.en}
                  </option>
                ))}
              </select>
            </div>
          )}
        />

        {/* Separator: ) */}
        <span className="flex items-center self-stretch px-0.5 text-slate-300 font-light text-lg select-none">)</span>

        {/* NRC Number */}
        <Controller
          control={control}
          name={numberFieldName}
          render={({ field }) => (
            <div className="flex flex-col justify-center px-2 flex-1 min-w-[90px]">
              <span className="text-[10px] text-sky-600 leading-none mb-0.5">Number</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                className="bg-transparent text-sm text-slate-800 focus:outline-none py-2 w-full"
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value.replace(/[^0-9]/g, ''))}
                onBlur={field.onBlur}
                placeholder="000000"
              />
            </div>
          )}
        />
      </div>

      {/* Field-level error messages */}
      {errors[stateFieldName as keyof EmployeeInfoFormValues] && (
        <p className="text-xs text-red-600 mt-0.5">{(errors[stateFieldName as keyof EmployeeInfoFormValues] as any).message}</p>
      )}
      {errors[townshipFieldName as keyof EmployeeInfoFormValues] && (
        <p className="text-xs text-red-600 mt-0.5">{(errors[townshipFieldName as keyof EmployeeInfoFormValues] as any).message}</p>
      )}
      {errors[typeFieldName as keyof EmployeeInfoFormValues] && (
        <p className="text-xs text-red-600 mt-0.5">{(errors[typeFieldName as keyof EmployeeInfoFormValues] as any).message}</p>
      )}
      {errors[numberFieldName as keyof EmployeeInfoFormValues] && (
        <p className="text-xs text-red-600 mt-0.5">{(errors[numberFieldName as keyof EmployeeInfoFormValues] as any).message}</p>
      )}

      {/* NRC Preview */}
      {nrcPreview ? (
        <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 mt-2">
          <span className="block text-xs text-slate-400 mb-0.5">{label} Preview</span>
          <span className="font-mono font-semibold text-sm text-slate-800">{nrcPreview}</span>
        </div>
      ) : null}
    </div>
  )
}

