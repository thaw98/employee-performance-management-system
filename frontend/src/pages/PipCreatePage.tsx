import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Autocomplete, Box, Button, IconButton, InputAdornment, Stack, TextField, Typography } from '@mui/material'
import type { ClipboardEvent, FormEvent, HTMLAttributes, Key, KeyboardEvent } from 'react'
import { Controller, useFieldArray, useForm, useWatch, type Resolver } from 'react-hook-form'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { z } from 'zod'
import { useCreatePipMutation, useGetEligibleEmployeesQuery, useGetPipsQuery } from '../features/pip/pipApi'
import type { RootState } from '../app/store'

const BLOCKING_PIP_STATUSES = ['ACTIVE', 'AUTO_CLOSED', 'REOPEN_REQUESTED'] as const
const DATE_DISPLAY_PATTERN = /^\d{2}\/\d{2}\/\d{4}$/
const HOURS_PER_DAY = 5

function parseDisplayDate(value: string) {
  if (!DATE_DISPLAY_PATTERN.test(value)) return null
  const [day, month, year] = value.split('/').map(Number)
  const parsed = new Date(year, month - 1, day)
  if (parsed.getFullYear() !== year || parsed.getMonth() !== month - 1 || parsed.getDate() !== day) {
    return null
  }
  return parsed
}

function toIsoDate(value: string) {
  const parsed = parseDisplayDate(value)
  if (!parsed) return value
  const year = parsed.getFullYear()
  const month = String(parsed.getMonth() + 1).padStart(2, '0')
  const day = String(parsed.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function toDisplayDateFromIso(value: string) {
  if (!value) return ''
  const [year, month, day] = value.split('-')
  if (!year || !month || !day) return ''
  return `${day}/${month}/${year}`
}

function toDatePickerValue(value: string) {
  const parsed = parseDisplayDate(value)
  return parsed ? toIsoDate(value) : ''
}

function startOfToday() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

function getMaxHoursForDateRange(startDate: Date, endDate: Date) {
  const startUtc = Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
  const endUtc = Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
  const days = Math.round((endUtc - startUtc) / (1000 * 60 * 60 * 24))
  return Math.max(HOURS_PER_DAY, days * HOURS_PER_DAY)
}

function getSelectedMaxHours(startDateValue: string, endDateValue: string) {
  const startDate = parseDisplayDate(startDateValue)
  const endDate = parseDisplayDate(endDateValue)
  if (!startDate || !endDate || endDate < startDate) return null
  return getMaxHoursForDateRange(startDate, endDate)
}

const pipCreateSchema = z
  .object({
    employeeId: z.coerce.number().int().min(1, 'Employee record ID is required'),
    totalHours: z.coerce.number().int().min(1, 'Total hours must be at least 1'),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    objectives: z
      .array(
        z.object({
          value: z.string().trim().min(1, 'Objective is required'),
        }),
      )
      .min(1, 'At least one objective is required'),
    expectedImprovements: z
      .array(
        z.object({
          value: z.string().trim().min(1, 'Expected improvement is required for this objective'),
        }),
      )
      .min(1, 'At least one expected improvement is required'),
    reasonForPlan: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    const startDate = parseDisplayDate(values.startDate)
    const endDate = parseDisplayDate(values.endDate)

    if (values.startDate && !startDate) {
      ctx.addIssue({
        code: 'custom',
        path: ['startDate'],
        message: 'Start date must be in dd/mm/yyyy format',
      })
    }
    if (values.endDate && !endDate) {
      ctx.addIssue({
        code: 'custom',
        path: ['endDate'],
        message: 'End date must be in dd/mm/yyyy format',
      })
    }
    if (startDate && startDate < startOfToday()) {
      ctx.addIssue({
        code: 'custom',
        path: ['startDate'],
        message: 'Start date cannot be in the past',
      })
    }
    if (startDate && endDate && endDate < startDate) {
      ctx.addIssue({
        code: 'custom',
        path: ['endDate'],
        message: 'End date must be on or after start date',
      })
    }
    if (startDate && endDate && endDate >= startDate) {
      const maxHours = getMaxHoursForDateRange(startDate, endDate)
      if (values.totalHours > maxHours) {
        ctx.addIssue({
          code: 'custom',
          path: ['totalHours'],
          message: `Total hours cannot exceed ${maxHours} hours for the selected PIP date range`,
        })
      }
    }

    values.objectives.forEach((objective, index) => {
      if (objective.value.trim() && !values.expectedImprovements[index]?.value?.trim()) {
        ctx.addIssue({
          code: 'custom',
          path: ['expectedImprovements', index, 'value'],
          message: 'Expected improvement is required for this objective',
        })
      }
    })
  })

type PipCreateFormValues = z.infer<typeof pipCreateSchema>
type PipCreateFormProps = {
  embedded?: boolean
  onCreated?: () => void
  onCancel?: () => void
}

const EMBEDDED_STEPS = [
  { id: 1, label: 'People & Timeline', shortLabel: 'Timeline' },
  { id: 2, label: 'Objectives', shortLabel: 'Objectives' },
  { id: 3, label: 'Expected Improvements', shortLabel: 'Improvements' },
  { id: 4, label: 'Reason for Plan', shortLabel: 'Reason' },
] as const

const EMBEDDED_STEP_FIELDS: Record<number, (keyof PipCreateFormValues | `objectives.${number}.value` | `expectedImprovements.${number}.value`)[]> = {
  1: ['employeeId', 'totalHours', 'startDate', 'endDate'],
  2: ['objectives'],
  3: ['expectedImprovements'],
  4: ['reasonForPlan'],
}

const getCreatePipErrorMessage = (error: unknown) => {
  const fallback = 'Failed to create PIP. Please check the employee record ID and try again.'
  if (typeof error !== 'object' || error === null) return fallback

  const apiError = error as { data?: unknown; error?: unknown }
  const data = apiError.data

  if (typeof data === 'string') return data
  if (typeof data === 'object' && data !== null) {
    const record = data as Record<string, unknown>
    const nestedData = record.data

    if (typeof record.message === 'string') return record.message
    if (typeof nestedData === 'object' && nestedData !== null) {
      const nestedRecord = nestedData as Record<string, unknown>
      if (typeof nestedRecord.message === 'string') return nestedRecord.message
    }
    if (typeof record.error === 'string') return record.error
  }

  return typeof apiError.error === 'string' ? apiError.error : fallback
}

export function PipCreateForm({ embedded = false, onCreated, onCancel }: PipCreateFormProps) {
  const navigate = useNavigate()
  const { user } = useSelector((state: RootState) => state.auth)
  const { data: eligibleEmployees, isLoading: isLoadingEmployees } = useGetEligibleEmployeesQuery()
  const { data: existingPips } = useGetPipsQuery()
  const [createPip, { isLoading: isCreating }] = useCreatePipMutation()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [embeddedStep, setEmbeddedStep] = useState(1)
  const userRole = user?.role?.toUpperCase().replace(/\s+/g, '_') || ''
  const isHr = userRole === 'HR'
  const isManager = userRole === 'DEPARTMENT_HEAD' || userRole === 'TEAM_HEAD' || userRole === 'MANAGER'
  const routeBase = isHr ? '/hr/pip-monitoring' : '/manager/pip'
  const blockedEmployeeIds = useMemo(() => {
    return new Set(
      (existingPips || [])
        .filter((pip) => BLOCKING_PIP_STATUSES.includes(pip.status as (typeof BLOCKING_PIP_STATUSES)[number]))
        .map((pip) => pip.employee?.employee?.id)
        .filter((employeeId): employeeId is number => typeof employeeId === 'number' && Number.isFinite(employeeId)),
    )
  }, [existingPips])
  const selectableEmployees = useMemo(() => {
    const currentEmployeeId = user?.employeeId == null ? null : String(user.employeeId)
    return (eligibleEmployees || []).filter((employee) => {
      if (blockedEmployeeIds.has(employee.employeeId)) return false
      if (currentEmployeeId == null) return true
      return String(employee.employeeId) !== currentEmployeeId && String(employee.staffId ?? '') !== currentEmployeeId
    })
  }, [blockedEmployeeIds, eligibleEmployees, user])

  useEffect(() => {
    if (!embedded && isHr && !isManager) {
      navigate(routeBase, { replace: true })
    }
  }, [embedded, isHr, isManager, navigate, routeBase])

  const {
    control,
    register,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<PipCreateFormValues>({
    resolver: zodResolver(pipCreateSchema) as Resolver<PipCreateFormValues>,
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      employeeId: 0,
      startDate: '',
      endDate: '',
      totalHours: 1,
      objectives: [{ value: '' }],
      expectedImprovements: [{ value: '' }],
      reasonForPlan: '',
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'objectives' })
  const {
    fields: expectedImprovementFields,
    append: appendExpectedImprovement,
    remove: removeExpectedImprovement,
  } = useFieldArray({ control, name: 'expectedImprovements' })
  const watchedStartDate = useWatch({ control, name: 'startDate' })
  const watchedEndDate = useWatch({ control, name: 'endDate' })
  const watchedTotalHours = useWatch({ control, name: 'totalHours' })
  const watchedEmployeeId = useWatch({ control, name: 'employeeId' })
  const selectedMaxHours = getSelectedMaxHours(watchedStartDate, watchedEndDate)
  const selectedPipDays = selectedMaxHours ? Math.max(1, selectedMaxHours / HOURS_PER_DAY) : null
  const selectedEmployee = selectableEmployees.find((employee) => employee.employeeId === Number(watchedEmployeeId))

  useEffect(() => {
    void trigger('totalHours')
  }, [trigger, watchedStartDate, watchedEndDate, watchedTotalHours])

  const handleAddObjective = () => {
    append({ value: '' })
    appendExpectedImprovement({ value: '' })
  }

  const handleRemoveObjective = (index: number) => {
    remove(index)
    removeExpectedImprovement(index)
  }

  const isEmbeddedStepVisible = (stepId: number) => !embedded || embeddedStep === stepId

  const goToNextEmbeddedStep = async () => {
    const fields = EMBEDDED_STEP_FIELDS[embeddedStep] ?? []
    const valid = await trigger(fields as Parameters<typeof trigger>[0])
    if (!valid) return
    // Defer so the Continue click fully finishes before a submit button appears in the same spot.
    window.setTimeout(() => {
      setEmbeddedStep((prev) => Math.min(prev + 1, EMBEDDED_STEPS.length))
    }, 0)
  }

  const goToPreviousEmbeddedStep = () => {
    setEmbeddedStep((prev) => Math.max(prev - 1, 1))
  }

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (embedded && embeddedStep < EMBEDDED_STEPS.length) {
      void goToNextEmbeddedStep()
      return
    }
    void handleSubmit(onSubmit)(event)
  }

  const handleEmbeddedFormKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
    if (!embedded || embeddedStep >= EMBEDDED_STEPS.length) return
    if (event.key !== 'Enter' || event.target instanceof HTMLTextAreaElement) return
    event.preventDefault()
  }

  const onSubmit = async (values: PipCreateFormValues) => {
    setSubmitError(null)
    const expectedImprovements = values.expectedImprovements
      .map((item) => item.value?.trim())
      .filter(Boolean)
      .join('\n')
    const startDate = toIsoDate(values.startDate)
    const endDate = toIsoDate(values.endDate)

    try {
      await createPip({
        employeeId: values.employeeId,
        startDate,
        endDate,
        totalHours: values.totalHours,
        objectives: values.objectives.map((item) => item.value.trim()).filter(Boolean),
        expectedImprovements: expectedImprovements || undefined,
        reasonForPlan: values.reasonForPlan?.trim() || undefined,
      }).unwrap()
      if (onCreated) {
        onCreated()
      } else {
        navigate(routeBase)
      }
    } catch (error: unknown) {
      const message = getCreatePipErrorMessage(error)

      if (message === 'An active PIP already exists for this employee') {
        const employeeId = values.employeeId
        const existingPip = existingPips?.find((pip) => {
          const pipEmployeeId = pip.employee?.employee?.id
          return pipEmployeeId === employeeId && BLOCKING_PIP_STATUSES.includes(pip.status as (typeof BLOCKING_PIP_STATUSES)[number])
        })

        if (existingPip) {
          navigate(`${routeBase}/${existingPip.id}`, {
            replace: true,
            state: {
              pipRedirectMessage: 'This employee already has an active PIP. Opening the existing record.',
            },
          })
          return
        }
      }

      setSubmitError(message)
    }
  }

  const summaryPanel = (
    <aside className="h-fit rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50/40 p-5 shadow-sm lg:sticky lg:top-4">
      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#2463eb]">PIP Summary</p>
      <div className="mt-5 space-y-4">
        <div>
          <p className="text-xs font-bold text-slate-500">Employee</p>
          <p className="mt-1 text-base font-black text-slate-900">{selectedEmployee?.employeeName || 'Not selected'}</p>
          <p className="text-xs text-slate-500">{selectedEmployee?.departmentName || 'Choose a low performer'}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Days</p>
            <p className="mt-1 text-2xl font-black tabular-nums text-slate-900">{selectedPipDays ?? '–'}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Max Hours</p>
            <p className="mt-1 text-2xl font-black tabular-nums text-slate-900">{selectedMaxHours ?? '–'}</p>
          </div>
        </div>
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
          <p className="text-xs font-bold text-[#1d4ed8]">Hour rule</p>
          <p className="mt-1 text-sm font-medium leading-relaxed text-slate-700">
            {HOURS_PER_DAY} hours per PIP day. Total hours must stay within the selected date range.
          </p>
        </div>
      </div>
    </aside>
  )

  return (
    <div className={embedded ? 'pt-4' : 'mx-auto w-full p-6 lg:w-[80vw] lg:max-w-none lg:p-8'}>
      {!embedded && (
        <div className="mb-6 overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-[#2463eb] to-[#1d4ed8] px-7 py-6 text-white">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-100">Performance Improvement Plan</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight">Create New PIP</h1>
            <p className="mt-2 max-w-3xl text-sm font-medium text-blue-50">
              Set a focused support plan with clear objectives, measurable improvements, and an hour limit based on the selected PIP dates.
            </p>
          </div>
        </div>
      )}

      {embedded ? (
        <nav aria-label="PIP creation steps" className="mb-6">
          <ol className="flex items-center gap-1 sm:gap-2">
            {EMBEDDED_STEPS.map((step, index) => {
              const isActive = embeddedStep === step.id
              const isComplete = embeddedStep > step.id
              return (
                <li key={step.id} className="flex min-w-0 flex-1 items-center">
                  <button
                    type="button"
                    onClick={() => {
                      if (step.id < embeddedStep) setEmbeddedStep(step.id)
                    }}
                    disabled={step.id > embeddedStep}
                    className={`flex w-full min-w-0 flex-col items-center gap-1.5 rounded-xl px-1 py-2 transition sm:flex-row sm:justify-center sm:gap-2 sm:px-3 ${
                      isActive
                        ? 'bg-blue-50 text-[#2463eb]'
                        : isComplete
                          ? 'text-[#2463eb] hover:bg-slate-50'
                          : 'text-slate-400'
                    } ${step.id < embeddedStep ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                        isActive
                          ? 'bg-[#2463eb] text-white shadow-sm'
                          : isComplete
                            ? 'bg-[#2463eb]/15 text-[#2463eb]'
                            : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {isComplete ? <i className="bi bi-check-lg text-sm" /> : step.id}
                    </span>
                    <span className="hidden truncate text-[11px] font-bold sm:inline sm:text-xs">{step.shortLabel}</span>
                  </button>
                  {index < EMBEDDED_STEPS.length - 1 ? (
                    <div
                      className={`mx-0.5 hidden h-px w-4 shrink-0 sm:block sm:w-6 ${isComplete ? 'bg-[#2463eb]/40' : 'bg-slate-200'}`}
                      aria-hidden
                    />
                  ) : null}
                </li>
              )
            })}
          </ol>
        </nav>
      ) : null}

      <Box
        component="form"
        onSubmit={handleFormSubmit}
        onKeyDown={handleEmbeddedFormKeyDown}
        className={embedded ? 'space-y-0' : 'rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:p-6'}
      >
        {submitError ? <Alert severity="error" className="mb-5">{submitError}</Alert> : null}
        <div className={`grid gap-6 ${embedded ? 'lg:grid-cols-[minmax(0,1fr)_280px] xl:grid-cols-[minmax(0,1fr)_300px]' : 'xl:grid-cols-[minmax(0,1fr)_320px]'}`}>
          <div className="space-y-5">
            <section
              className={`${embedded ? '' : 'rounded-2xl border border-slate-200 bg-slate-50/60 p-5'} ${!isEmbeddedStepVisible(1) ? 'hidden' : ''}`}
            >
              <div className="mb-4">
                <p className="text-[11px] font-black uppercase tracking-widest text-[#2463eb]">Step 1</p>
                <h2 className="text-lg font-black text-slate-900">People & Timeline</h2>
              </div>
              <Stack spacing={2}>
          <TextField
            label="Manager"
            value={user?.name || user?.email || 'Current manager'}
            fullWidth
            disabled
            helperText="The PIP will be assigned to the currently logged-in manager account."
          />
          <Controller
            name="employeeId"
            control={control}
            render={({ field }) => (
              <Autocomplete
                loading={isLoadingEmployees}
                options={selectableEmployees}
                value={selectableEmployees.find((e) => e.employeeId === field.value) || null}
                isOptionEqualToValue={(option, value) => option.employeeId === (typeof value === 'number' ? value : value?.employeeId)}
                getOptionLabel={(option) => `${option.employeeName}${option.staffId ? ` (${option.staffId})` : ''} - ${option.departmentName || 'No Department'}`}
                onChange={(_, data) => field.onChange(data?.employeeId ?? 0)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Low Performer"
                    placeholder="Search by name, ID or department"
                    error={Boolean(errors.employeeId)}
                    helperText={errors.employeeId?.message || "Only employees with KPI score 50% or below are shown."}
                  />
                )}
                renderOption={(props, option) => {
                  const { key, ...rest } = props as HTMLAttributes<HTMLLIElement> & { key: Key }
                  return (
                    <li key={key} {...rest}>
                      <Box>
                        <Typography variant="body1">{option.employeeName}{option.staffId ? ` (StaffID: ${option.staffId})` : ''}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Dept: {option.departmentName} | KPI Score: {option.totalScore?.toFixed(2) ?? 'N/A'}%
                        </Typography>
                      </Box>
                    </li>
                  );
                }}
              />
            )}
          />
          <TextField
            type="number"
            label="Total Hours"
            fullWidth
            slotProps={{
              htmlInput: {
                min: 1,
                max: selectedMaxHours ?? undefined,
                dir: 'ltr',
                inputMode: 'numeric',
                pattern: '[0-9]*',
                style: { textAlign: 'left' },
                onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => {
                  if (['e', 'E', '+', '-', '.'].includes(event.key)) {
                    event.preventDefault()
                  }
                },
                onPaste: (event: ClipboardEvent<HTMLInputElement>) => {
                  const pastedText = event.clipboardData.getData('text')
                  if (!/^\d+$/.test(pastedText)) {
                    event.preventDefault()
                  }
                },
              },
            }}
            {...register('totalHours', { valueAsNumber: true })}
            error={Boolean(errors.totalHours)}
            helperText={errors.totalHours?.message || (selectedMaxHours ? `Maximum ${selectedMaxHours} hours for the selected PIP date range (${HOURS_PER_DAY} hours/day).` : `Select the PIP dates to calculate the maximum hours (${HOURS_PER_DAY} hours/day).`)}
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Controller
              name="startDate"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Start Date"
                  placeholder="dd/mm/yyyy"
                  fullWidth
                  slotProps={{
                    inputLabel: { shrink: true },
                    htmlInput: { inputMode: 'numeric' },
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton component="label" edge="end" aria-label="Choose start date" sx={{ position: 'relative', overflow: 'hidden' }}>
                            <i className="bi bi-calendar3" />
                          <input
                            type="date"
                            min={new Date().toISOString().split('T')[0]}
                            value={toDatePickerValue(field.value)}
                            onChange={(event) => field.onChange(toDisplayDateFromIso(event.target.value))}
                            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                          />
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                  error={Boolean(errors.startDate)}
                  helperText={errors.startDate?.message}
                />
              )}
            />
            <Controller
              name="endDate"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="End Date"
                  placeholder="dd/mm/yyyy"
                  fullWidth
                  slotProps={{
                    inputLabel: { shrink: true },
                    htmlInput: { inputMode: 'numeric' },
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton component="label" edge="end" aria-label="Choose end date" sx={{ position: 'relative', overflow: 'hidden' }}>
                            <i className="bi bi-calendar3" />
                          <input
                            type="date"
                            min={new Date().toISOString().split('T')[0]}
                            value={toDatePickerValue(field.value)}
                            onChange={(event) => field.onChange(toDisplayDateFromIso(event.target.value))}
                            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                          />
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                  error={Boolean(errors.endDate)}
                  helperText={errors.endDate?.message}
                />
              )}
            />
          </Stack>
              </Stack>
            </section>

            <section
              className={`${embedded ? '' : 'rounded-2xl border border-slate-200 bg-white p-5'} ${!isEmbeddedStepVisible(2) ? 'hidden' : ''}`}
            >
              <div className="mb-4">
                <p className="text-[11px] font-black uppercase tracking-widest text-[#2463eb]">Step 2</p>
                <h2 className="text-lg font-black text-slate-900">Objectives</h2>
              </div>
              <Stack spacing={1.5}>
            <Typography variant="subtitle2">Improvement Objectives</Typography>
            {fields.map((field, index) => (
              <Stack key={field.id} direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
                <Controller
                  control={control}
                  name={`objectives.${index}.value`}
                  render={({ field: objectiveField }) => (
                    <TextField
                      fullWidth
                      label={`Objective ${index + 1}`}
                      placeholder="Example: Improve report accuracy to the agreed standard by the end of the PIP period."
                      {...objectiveField}
                      error={Boolean(errors.objectives?.[index]?.value)}
                      helperText={errors.objectives?.[index]?.value?.message || 'Use SMART wording: specific action, measurable standard, owner, timeline, and result.'}
                    />
                  )}
                />
                {fields.length > 1 ? (
                  <IconButton type="button" color="error" onClick={() => handleRemoveObjective(index)} aria-label={`Remove objective ${index + 1}`}>
                    <i className="bi bi-trash" />
                  </IconButton>
                ) : null}
              </Stack>
            ))}
            <Box>
              <Button type="button" variant="text" onClick={handleAddObjective}>
                <i className="bi bi-plus-lg mr-2" /> Add Objective
              </Button>
            </Box>
          </Stack>
            </section>

            <section
              className={`${embedded ? '' : 'rounded-2xl border border-slate-200 bg-white p-5'} ${!isEmbeddedStepVisible(3) ? 'hidden' : ''}`}
            >
              <div className="mb-4">
                <p className="text-[11px] font-black uppercase tracking-widest text-[#2463eb]">Step 3</p>
                <h2 className="text-lg font-black text-slate-900">Expected Improvements</h2>
              </div>
              <Stack spacing={1.5}>
            <Typography variant="subtitle2">Expected Improvements</Typography>
            {expectedImprovementFields.map((field, index) => (
              <Stack key={field.id} direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
                <Controller
                  control={control}
                  name={`expectedImprovements.${index}.value`}
                  render={({ field: expectedImprovementField }) => (
                    <TextField
                      fullWidth
                      label={`Expected Improvement ${index + 1}`}
                      placeholder="Example: Submit work with no more than one material revision per deliverable."
                      {...expectedImprovementField}
                      error={Boolean(errors.expectedImprovements?.[index]?.value)}
                      helperText={errors.expectedImprovements?.[index]?.value?.message || 'State how improvement will be measured during the PIP period.'}
                    />
                  )}
                />
                {expectedImprovementFields.length > 1 ? (
                  <IconButton
                    type="button"
                    color="error"
                    onClick={() => handleRemoveObjective(index)}
                    aria-label={`Remove expected improvement ${index + 1}`}
                  >
                    <i className="bi bi-trash" />
                  </IconButton>
                ) : null}
              </Stack>
            ))}
            <Box>
              <Button type="button" variant="text" onClick={handleAddObjective}>
                <i className="bi bi-plus-lg mr-2" /> Add Objective
              </Button>
            </Box>
          </Stack>
            </section>

            <section
              className={`${embedded ? '' : 'rounded-2xl border border-slate-200 bg-white p-5'} ${!isEmbeddedStepVisible(4) ? 'hidden' : ''}`}
            >
          <div className={embedded ? 'mb-4' : ''}>
            {embedded ? (
              <>
                <p className="text-[11px] font-black uppercase tracking-widest text-[#2463eb]">Step 4</p>
                <h2 className="text-lg font-black text-slate-900">Reason for Plan</h2>
              </>
            ) : null}
          </div>
          <TextField
            label="Reason for Plan"
            fullWidth
            multiline
            rows={3}
            {...register('reasonForPlan')}
            placeholder="Describe the performance issues factually and respectfully, then state that management will provide regular feedback, check-ins, and reasonable support."
            helperText="Include performance issues, timeline context, support from management, and positive encouragement."
          />
            </section>
          </div>

          {summaryPanel}
        </div>

        <div className={`mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center ${embedded ? 'sm:justify-between' : 'sm:justify-end'}`}>
          {embedded ? (
            <p className="text-center text-xs font-semibold text-slate-400 sm:text-left">
              Step {embeddedStep} of {EMBEDDED_STEPS.length} · {EMBEDDED_STEPS[embeddedStep - 1]?.label}
            </p>
          ) : null}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            {embedded && embeddedStep > 1 ? (
              <Button type="button" variant="outlined" onClick={goToPreviousEmbeddedStep}>
                Back
              </Button>
            ) : (
              <Button type="button" variant="outlined" onClick={onCancel ?? (() => navigate(routeBase))}>
                Cancel
              </Button>
            )}
            {embedded && embeddedStep < EMBEDDED_STEPS.length ? (
              <Button type="button" variant="contained" onClick={() => void goToNextEmbeddedStep()}>
                Continue
              </Button>
            ) : embedded ? (
              <Button
                type="button"
                disabled={isCreating}
                variant="contained"
                onClick={() => void handleSubmit(onSubmit)()}
              >
                {isCreating ? 'Creating...' : 'Create PIP'}
              </Button>
            ) : (
              <Button type="submit" disabled={isCreating} variant="contained">
                {isCreating ? 'Creating...' : 'Create PIP'}
              </Button>
            )}
          </div>
        </div>
      </Box>
    </div>
  )
}

export default function PipCreatePage() {
  return <PipCreateForm />
}
