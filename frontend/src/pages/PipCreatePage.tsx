import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Autocomplete, Box, Button, IconButton, Stack, TextField, Typography } from '@mui/material'
import type { HTMLAttributes, Key } from 'react'
import { Controller, useFieldArray, useForm, type Resolver } from 'react-hook-form'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { z } from 'zod'
import { useCreatePipMutation, useGetEligibleEmployeesQuery, useGetPipsQuery } from '../features/pip/pipApi'
import type { RootState } from '../app/store'

const BLOCKING_PIP_STATUSES = ['ACTIVE', 'AUTO_CLOSED', 'REOPEN_REQUESTED'] as const

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
  .refine((v) => new Date(v.endDate) >= new Date(v.startDate), {
    path: ['endDate'],
    message: 'End date must be on or after start date',
  })

type PipCreateFormValues = z.infer<typeof pipCreateSchema>

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

export default function PipCreatePage() {
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
  }, [blockedEmployeeIds, eligibleEmployees, user?.employeeId])

  useEffect(() => {
    if (isHr && !isManager) {
      navigate(routeBase, { replace: true })
    }
  }, [isHr, isManager, navigate, routeBase])

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PipCreateFormValues>({
    resolver: zodResolver(pipCreateSchema) as Resolver<PipCreateFormValues>,
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

    console.log('[PIP Create] Submitting payload:', {
      employeeId: values.employeeId,
      startDate: values.startDate,
      endDate: values.endDate,
      totalHours: values.totalHours,
      objectives: values.objectives.map((item) => item.value.trim()).filter(Boolean),
      expectedImprovements: expectedImprovements || undefined,
      reasonForPlan: values.reasonForPlan?.trim() || undefined,
    })
    try {
      await createPip({
        employeeId: values.employeeId,
        startDate: values.startDate,
        endDate: values.endDate,
        totalHours: values.totalHours,
        objectives: values.objectives.map((item) => item.value.trim()).filter(Boolean),
        expectedImprovements: expectedImprovements || undefined,
        reasonForPlan: values.reasonForPlan?.trim() || undefined,
      }).unwrap()
      navigate(routeBase)
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
    <div className="mx-auto max-w-2xl p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Create New PIP</h1>
        <p className="text-slate-500">Initiate a Performance Improvement Plan for an employee.</p>
      </div>

      <Box component="form" onSubmit={handleSubmit(onSubmit)} className="space-y-6 rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
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
                    helperText={errors.employeeId?.message || "Only employees with KPI score < 70% are shown."}
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
            slotProps={{ htmlInput: { min: 1 } }}
            {...register('totalHours', { valueAsNumber: true })}
            error={Boolean(errors.totalHours)}
            helperText={errors.totalHours?.message}
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              type="date"
              label="Start Date"
              fullWidth
              slotProps={{
                inputLabel: { shrink: true },
                htmlInput: { min: new Date().toISOString().split('T')[0] }
              }}
              {...register('startDate')}
              error={Boolean(errors.startDate)}
              helperText={errors.startDate?.message}
            />
            <TextField
              type="date"
              label="End Date"
              fullWidth
              slotProps={{
                inputLabel: { shrink: true },
                htmlInput: { min: new Date().toISOString().split('T')[0] }
              }}
              {...register('endDate')}
              error={Boolean(errors.endDate)}
              helperText={errors.endDate?.message}
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
                      {...objectiveField}
                      error={Boolean(errors.objectives?.[index]?.value)}
                      helperText={errors.objectives?.[index]?.value?.message}
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
                      {...expectedImprovementField}
                      error={Boolean(errors.expectedImprovements?.[index]?.value)}
                      helperText={errors.expectedImprovements?.[index]?.value?.message}
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
            helperText="Explain the reason for initiating this PIP."
          />
        </Stack>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outlined" onClick={() => navigate(routeBase)}>
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
