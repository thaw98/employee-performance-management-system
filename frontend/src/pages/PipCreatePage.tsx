import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Autocomplete, Box, Button, IconButton, Stack, TextField, Typography } from '@mui/material'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useCreatePipMutation, useGetEligibleEmployeesQuery } from '../features/pip/pipApi'

const pipCreateSchema = z
  .object({
    employeeId: z
      .string()
      .min(1, 'Employee record ID is required')
      .regex(/^[0-9]+$/, 'Must be the numeric employee record ID'),
    totalHours: z.coerce.number().int().min(1, 'Total hours must be at least 1'),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    objectives: z
      .array(
        z.object({
          value: z.string().min(1, 'Objective is required'),
        }),
      )
      .min(1, 'At least one objective is required'),
  })
  .refine((v) => new Date(v.endDate) >= new Date(v.startDate), {
    path: ['endDate'],
    message: 'End date must be on or after start date',
  })

type PipCreateFormValues = z.infer<typeof pipCreateSchema>

export default function PipCreatePage() {
  const navigate = useNavigate()
  const { data: eligibleEmployees, isLoading: isLoadingEmployees } = useGetEligibleEmployeesQuery()
  const [createPip, { isLoading: isCreating }] = useCreatePipMutation()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PipCreateFormValues>({
    resolver: zodResolver(pipCreateSchema) as never,
    defaultValues: {
      employeeId: '',
      startDate: '',
      endDate: '',
      totalHours: 1,
      objectives: [{ value: '' }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'objectives' })

  const onSubmit = async (values: PipCreateFormValues) => {
    setSubmitError(null)
    try {
      await createPip({
        employeeId: Number(values.employeeId.trim()),
        startDate: values.startDate,
        endDate: values.endDate,
        totalHours: values.totalHours,
        objectives: values.objectives.map((item) => item.value.trim()).filter(Boolean),
      }).unwrap()
      navigate('../', { relative: 'path' })
    } catch {
      setSubmitError('Failed to create PIP. Please check the employee record ID and try again.')
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
          <Controller
            name="employeeId"
            control={control}
            render={({ field }) => (
              <Autocomplete
                loading={isLoadingEmployees}
                options={eligibleEmployees || []}
                getOptionLabel={(option) => `${option.employeeName} (${option.employeeId}) - ${option.departmentName}`}
                onChange={(_, data) => field.onChange(data?.employeeId || '')}
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
                  const { key, ...rest } = props as any; // MUI 5/6 specific key handling
                  return (
                    <li key={key} {...rest}>
                      <Box>
                        <Typography variant="body1">{option.employeeName} ({option.employeeId})</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Dept: {option.departmentName} | KPI Score: {option.totalScore?.toFixed(2)}%
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
                  <IconButton type="button" color="error" onClick={() => remove(index)} aria-label={`Remove objective ${index + 1}`}>
                    <i className="bi bi-trash" />
                  </IconButton>
                ) : null}
              </Stack>
            ))}
            <Box>
              <Button type="button" variant="text" onClick={() => append({ value: '' })}>
                <i className="bi bi-plus-lg mr-2" /> Add Objective
              </Button>
            </Box>
          </Stack>
        </Stack>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outlined" onClick={() => navigate('../', { relative: 'path' })}>
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
