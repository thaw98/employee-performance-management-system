import { zodResolver } from '@hookform/resolvers/zod'
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
      navigate('/hr/pip-monitoring')
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="space-y-4">
          {submitError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {submitError}
            </div>
          ) : null}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Employee ID</label>
            <input
              placeholder="E.g. EMP001"
              {...register('employeeId')}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500"
            />
            {errors.employeeId?.message ? (
              <p className="mt-1 text-xs text-red-600">{errors.employeeId.message}</p>
            ) : null}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Total Hours</label>
            <input
              type="number"
              min={1}
              {...register('totalHours', { valueAsNumber: true })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500"
            />
            {errors.totalHours?.message ? (
              <p className="mt-1 text-xs text-red-600">{errors.totalHours.message}</p>
            ) : null}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Start Date</label>
              <input
                type="date"
                {...register('startDate')}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500"
              />
              {errors.startDate?.message ? (
                <p className="mt-1 text-xs text-red-600">{errors.startDate.message}</p>
              ) : null}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">End Date</label>
              <input
                type="date"
                {...register('endDate')}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500"
              />
              {errors.endDate?.message ? (
                <p className="mt-1 text-xs text-red-600">{errors.endDate.message}</p>
              ) : null}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700">Improvement Objectives</p>
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-start gap-2">
                <Controller
                  control={control}
                  name={`objectives.${index}.value`}
                  render={({ field: objectiveField }) => (
                    <div className="w-full">
                      <label className="mb-1 block text-sm font-medium text-slate-700">{`Objective ${index + 1}`}</label>
                      <input
                      {...objectiveField}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500"
                    />
                      {errors.objectives?.[index]?.value?.message ? (
                        <p className="mt-1 text-xs text-red-600">{errors.objectives[index]?.value?.message}</p>
                      ) : null}
                    </div>
                  )}
                />
                {fields.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    aria-label={`Remove objective ${index + 1}`}
                    className="mt-7 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-red-200 text-red-600 transition hover:bg-red-50"
                  >
                    <i className="bi bi-trash" />
                  </button>
                ) : null}
              </div>
            ))}
            <div>
              <button
                type="button"
                onClick={() => append({ value: '' })}
                className="inline-flex items-center rounded-lg px-2 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-50"
              >
                <i className="bi bi-plus-lg mr-2" /> Add Objective
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate('/hr/pip-monitoring')}
            className="inline-flex items-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? 'Creating...' : 'Create PIP'}
          </button>
        </div>
      </form>
    </div>
  )
}
