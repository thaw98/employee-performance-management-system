import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Box, Button, IconButton, Stack, TextField, Typography } from '@mui/material'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useCreatePipMutation } from '../features/pip/pipApi'

const pipCreateSchema = z
  .object({
    employeeId: z.string().min(1, 'Employee ID is required'),
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
  const [createPip, { isLoading }] = useCreatePipMutation()
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
        employeeId: values.employeeId.trim(),
        startDate: values.startDate,
        endDate: values.endDate,
        totalHours: values.totalHours,
        objectives: values.objectives.map((item) => item.value.trim()).filter(Boolean),
      }).unwrap()
      navigate('/admin/pip-monitoring')
    } catch {
      setSubmitError('Failed to create PIP. Please check employee ID and try again.')
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
            label="Employee ID"
            placeholder="E.g. EMP001"
            fullWidth
            {...register('employeeId')}
            error={Boolean(errors.employeeId)}
            helperText={errors.employeeId?.message}
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
              slotProps={{ inputLabel: { shrink: true } }}
              {...register('startDate')}
              error={Boolean(errors.startDate)}
              helperText={errors.startDate?.message}
            />
            <TextField
              type="date"
              label="End Date"
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
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
          <Button type="button" variant="outlined" onClick={() => navigate('/admin/pip-monitoring')}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading} variant="contained">
            {isLoading ? 'Creating...' : 'Create PIP'}
          </Button>
        </div>
      </Box>
    </div>
  )
}
