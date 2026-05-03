import { useEffect, type ReactNode } from 'react'
import { addDays, format, parseISO } from 'date-fns'
import { Controller, type Control, type FieldErrors, type UseFormRegister, type UseFormSetValue, useWatch } from 'react-hook-form'
import { AlertTriangle, Shield, Clock, CalendarDays, Building2, UserCog } from 'lucide-react'

import type { DepartmentOptionDto, PositionOptionDto } from '../../../features/hrCreateEmployee/hrEmployeeAccountApi'
import type { CreateEmployeeAccountFormValues } from '../../../features/hrCreateEmployee/schemas/createEmployeeAccountSchema'
import { DepartmentAutocomplete } from './DepartmentAutocomplete'
import { PositionAutocomplete } from './PositionAutocomplete'

interface EmploymentInformationStepProps {
  register: UseFormRegister<CreateEmployeeAccountFormValues>
  control: Control<CreateEmployeeAccountFormValues>
  errors: FieldErrors<CreateEmployeeAccountFormValues>
  setValue: UseFormSetValue<CreateEmployeeAccountFormValues>
  departments: DepartmentOptionDto[]
  positions: PositionOptionDto[]
  selectedDepartment?: DepartmentOptionDto | null
  departmentLoading: boolean
  positionLoading: boolean
  disableProbationOption?: boolean
  beforeHireDate?: ReactNode
  readOnlyHireDate?: boolean
  /** When true, Department and Position cannot be changed (e.g. edit existing employee). */
  readOnlyDepartmentAndPosition?: boolean
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

export function EmploymentInformationStep({
  register,
  control,
  errors,
  setValue,
  departments,
  positions,
  selectedDepartment,
  departmentLoading,
  positionLoading,
  disableProbationOption,
  beforeHireDate,
  readOnlyHireDate,
  readOnlyDepartmentAndPosition,
}: EmploymentInformationStepProps) {
  const staffType = useWatch({ control, name: 'staffType' })
  const probationStart = useWatch({ control, name: 'probationStartDate' })
  const departmentId = useWatch({ control, name: 'departmentId' })
  const departmentPositionId = useWatch({ control, name: 'departmentPositionId' })
  const selectedPosition = positions.find((position) => position.id === departmentPositionId) ?? null
  const selectedRoleIsDepartmentManager = selectedPosition?.roleId === 2
  const departmentHasManager = selectedDepartment?.managerId != null

  useEffect(() => {
    if (staffType !== 'PROBATION') {
      setValue('probationStartDate', '', { shouldValidate: false })
      setValue('probationEndDate', '', { shouldValidate: false })
      return
    }
    if (!probationStart) return
    try {
      const d = parseISO(probationStart)
      const end = addDays(d, 90)
      setValue('probationEndDate', format(end, 'yyyy-MM-dd'), { shouldValidate: true })
    } catch {
      /* ignore */
    }
  }, [staffType, probationStart, setValue])

  useEffect(() => {
    if (!selectedRoleIsDepartmentManager || departmentHasManager) {
      setValue('assignAsDepartmentManager', false, { shouldValidate: false })
    }
  }, [departmentHasManager, selectedRoleIsDepartmentManager, setValue])

  return (
    <div className="space-y-6">
      {/* ── Staff Type Cards ── */}
      <div className="grid gap-5 md:grid-cols-2">
        <SectionHeader icon={Shield} title="Employment Type" />

        <div className="md:col-span-2">
          <p className="mb-3 text-sm font-semibold text-slate-700">
            Staff Type <span className="text-red-400">*</span>
          </p>
          <div className="grid grid-cols-2 gap-4">
            <label
              className={`group relative flex cursor-pointer items-center gap-4 rounded-xl border-2 p-5 transition-all ${staffType === 'PERMANENT'
                  ? 'border-teal-500 bg-gradient-to-br from-teal-50 to-emerald-50 shadow-md shadow-teal-500/10'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                }`}
            >
              <input type="radio" value="PERMANENT" className="sr-only" {...register('staffType')} />
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl transition ${staffType === 'PERMANENT'
                    ? 'bg-teal-500 text-white shadow-md shadow-teal-500/25'
                    : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                  }`}
              >
                <Shield size={20} />
              </div>
              <div>
                <p
                  className={`text-sm font-bold ${staffType === 'PERMANENT' ? 'text-teal-900' : 'text-slate-700'
                    }`}
                >
                  Permanent
                </p>
                <p className="mt-0.5 text-xs text-slate-500">Full-time employee</p>
              </div>
              {staffType === 'PERMANENT' ? (
                <div className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-teal-500 text-white">
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              ) : null}
            </label>

            <label
              className={`group relative flex ${disableProbationOption ? 'cursor-not-allowed opacity-60 bg-slate-50 border-slate-200' : 'cursor-pointer'
                } items-center gap-4 rounded-xl border-2 p-5 transition-all ${disableProbationOption
                  ? ''
                  : staffType === 'PROBATION'
                    ? 'border-amber-500 bg-gradient-to-br from-amber-50 to-orange-50 shadow-md shadow-amber-500/10'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                }`}
            >
              <input
                type="radio"
                value="PROBATION"
                className="sr-only"
                disabled={disableProbationOption}
                {...register('staffType')}
              />
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl transition ${disableProbationOption
                    ? 'bg-slate-200 text-slate-400'
                    : staffType === 'PROBATION'
                      ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25'
                      : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                  }`}
              >
                <Clock size={20} />
              </div>
              <div>
                <p
                  className={`text-sm font-bold ${disableProbationOption
                      ? 'text-slate-500'
                      : staffType === 'PROBATION'
                        ? 'text-amber-900'
                        : 'text-slate-700'
                    }`}
                >
                  Probation
                </p>
                <p className="mt-0.5 text-xs text-slate-500">3-month trial period</p>
              </div>
              {staffType === 'PROBATION' ? (
                <div className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white">
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              ) : null}
            </label>
          </div>
          {errors.staffType?.message ? (
            <p className="mt-2 text-xs text-red-600">{String(errors.staffType.message)}</p>
          ) : null}
        </div>
      </div>

      {/* ── Probation Period ── */}
      {staffType === 'PROBATION' ? (
        <div className="grid gap-5 md:grid-cols-2">
          <SectionHeader icon={CalendarDays} title="Probation Period" />

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor="probationStartDate">
              Probation Start <span className="text-red-400">*</span>
            </label>
            <input
              id="probationStartDate"
              type="date"
              className={errors.probationStartDate ? inputError : inputNormal}
              {...register('probationStartDate')}
            />
            {errors.probationStartDate?.message ? (
              <p className="mt-1 text-xs text-red-600">{String(errors.probationStartDate.message)}</p>
            ) : null}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor="probationEndDate">
              Probation End <span className="text-xs font-normal text-slate-400">(auto-calculated)</span>
            </label>
            <input
              id="probationEndDate"
              type="date"
              readOnly
              disabled
              className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500"
              {...register('probationEndDate')}
            />
            <p className="mt-1.5 text-xs text-slate-400">Auto-set to 3 months from probation start date.</p>
            {errors.probationEndDate?.message ? (
              <p className="mt-1 text-xs text-red-600">{String(errors.probationEndDate.message)}</p>
            ) : null}
          </div>
        </div>
      ) : null}

      {beforeHireDate}

      {/* ── Hire Date ── */}
      <div className="grid gap-5 md:grid-cols-2">
        <SectionHeader icon={CalendarDays} title="Hire Date" />

        <div className="md:col-span-2">
          <label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor="hireDate">
            Hire Date{' '}
            {readOnlyHireDate ? (
              <span className="text-xs font-normal text-slate-400">(read-only)</span>
            ) : (
              <span className="text-red-400">*</span>
            )}
          </label>
          <input
            id="hireDate"
            type="date"
            className={
              readOnlyHireDate
                ? 'w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500'
                : errors.hireDate
                  ? inputError
                  : inputNormal
            }
            {...register('hireDate')}
            readOnly={readOnlyHireDate}
          />
          {errors.hireDate?.message ? (
            <p className="mt-1 text-xs text-red-600">{String(errors.hireDate.message)}</p>
          ) : null}
        </div>
      </div>

      {/* ── Organization ── */}
      <div className="grid gap-5 md:grid-cols-2">
        <SectionHeader icon={Building2} title="Organization" />

        <div className="md:col-span-2">
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">
            Department{' '}
            {readOnlyDepartmentAndPosition ? (
              <span className="text-xs font-normal text-slate-400">(read-only)</span>
            ) : (
              <span className="text-red-400">*</span>
            )}
          </label>
          <Controller
            control={control}
            name="departmentId"
            render={({ field }) => (
              <DepartmentAutocomplete
                departments={departments}
                value={field.value}
                onChange={(id) => {
                  field.onChange(id)
                  setValue('departmentPositionId', null, { shouldValidate: true })
                  setValue('assignAsDepartmentManager', false, { shouldValidate: false })
                }}
                disabled={departmentLoading || readOnlyDepartmentAndPosition}
                error={errors.departmentId?.message ? String(errors.departmentId.message) : undefined}
              />
            )}
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">
            Position{' '}
            {readOnlyDepartmentAndPosition ? (
              <span className="text-xs font-normal text-slate-400">(read-only)</span>
            ) : (
              <span className="text-red-400">*</span>
            )}
          </label>
          <Controller
            control={control}
            name="departmentPositionId"
            render={({ field }) => (
              <PositionAutocomplete
                positions={positions}
                value={field.value}
                onChange={(id) => {
                  setValue('departmentPositionId', id, {
                    shouldDirty: true,
                    shouldTouch: true,
                    shouldValidate: true,
                  })
                  setValue('assignAsDepartmentManager', false, { shouldValidate: false })
                }}
                disabled={!departmentId || positionLoading || readOnlyDepartmentAndPosition}
                error={errors.departmentPositionId?.message ? String(errors.departmentPositionId.message) : undefined}
                placeholder={!departmentId ? 'Select a department first' : 'Search position…'}
              />
            )}
          />
        </div>

        {selectedRoleIsDepartmentManager ? (
          <div className="md:col-span-2">
            <label
              className={`flex items-start gap-4 rounded-xl border p-4 transition ${
                departmentHasManager
                  ? 'cursor-not-allowed border-amber-200 bg-amber-50 text-amber-900'
                  : 'cursor-pointer border-teal-200 bg-teal-50/60 text-teal-900 hover:border-teal-300'
              }`}
            >
              <Controller
                control={control}
                name="assignAsDepartmentManager"
                render={({ field }) => (
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                    checked={departmentHasManager ? false : Boolean(field.value)}
                    disabled={departmentHasManager}
                    onChange={(event) => field.onChange(event.target.checked)}
                  />
                )}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <UserCog size={16} />
                  <span className="text-sm font-bold">Assign as department manager</span>
                </div>
                {departmentHasManager ? (
                  <div className="mt-2 flex items-start gap-2 text-xs font-medium text-amber-800">
                    <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                    <span>This department already has a manager. The account can still be created with manager access.</span>
                  </div>
                ) : (
                  <p className="mt-1 text-xs text-teal-800/80">
                    The employee will become the department's current manager.
                  </p>
                )}
              </div>
            </label>
          </div>
        ) : null}
      </div>
    </div>
  )
}
