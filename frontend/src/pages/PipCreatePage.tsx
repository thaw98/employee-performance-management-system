import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Autocomplete, Box, Button, IconButton, InputAdornment, Stack, TextField, Typography } from '@mui/material'
import type { ClipboardEvent, HTMLAttributes, Key, KeyboardEvent } from 'react'
import { Controller, useFieldArray, useForm, type Resolver } from 'react-hook-form'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { z } from 'zod'
import { useCreatePipMutation, useGetEligibleEmployeesQuery, useGetPipsQuery } from '../features/pip/pipApi'
import type { RootState } from '../app/store'

const BLOCKING_PIP_STATUSES = ['ACTIVE', 'AUTO_CLOSED', 'REOPEN_REQUESTED'] as const
const DATE_DISPLAY_PATTERN = /^\d{2}\/\d{2}\/\d{4}$/
const HOURS_PER_DAY = 24

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
  const days = Math.ceil((endUtc - startUtc) / (1000 * 60 * 60 * 24))
  return Math.max(HOURS_PER_DAY, days * HOURS_PER_DAY)
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
    watch,
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
  const watchedStartDate = watch('startDate')
  const watchedEndDate = watch('endDate')
  const watchedTotalHours = watch('totalHours')

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

  const onSubmit = async (values: PipCreateFormValues) => {
    setSubmitError(null)
    const expectedImprovements = values.expectedImprovements
      .map((item) => item.value?.trim())
      .filter(Boolean)
      .join('\n')
    const startDate = toIsoDate(values.startDate)
    const endDate = toIsoDate(values.endDate)

    console.log('[PIP Create] Submitting payload:', {
      employeeId: values.employeeId,
      startDate,
      endDate,
      totalHours: values.totalHours,
      objectives: values.objectives.map((item) => item.value.trim()).filter(Boolean),
      expectedImprovements: expectedImprovements || undefined,
      reasonForPlan: values.reasonForPlan?.trim() || undefined,
    })
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
      console.error('[PIP Create] Request failed:', error)
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

  return (
    <div className={embedded ? '' : 'mx-auto max-w-2xl p-8'}>
      {!embedded && (
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Create New PIP</h1>
          <p className="text-slate-500">Create a respectful, measurable Performance Improvement Plan focused on support, accountability, and growth.</p>
        </div>
      )}

      <Box component="form" onSubmit={handleSubmit(onSubmit)} className={embedded ? 'space-y-6' : 'space-y-6 rounded-xl border border-slate-200 bg-white p-8 shadow-sm'}>
        <Stack spacing={2}>
          {submitError ? <Alert severity="error">{submitError}</Alert> : null}
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
            helperText={errors.totalHours?.message}
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
          <TextField
            label="Reason for Plan"
            fullWidth
            multiline
            rows={3}
            {...register('reasonForPlan')}
            placeholder="Describe the performance issues factually and respectfully, then state that management will provide regular feedback, check-ins, and reasonable support."
            helperText="Include performance issues, timeline context, support from management, and positive encouragement."
          />
        </Stack>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outlined" onClick={onCancel ?? (() => navigate(routeBase))}>
            Cancel
          </Button>
          <Button type="submit" disabled={isCreating} variant="contained">
            {isCreating ? 'Creating...' : 'Create PIP'}
          </Button>
        </div>
      </Box>
    </div>
  )
}

export default function PipCreatePage() {
  return <PipCreateForm />
}
