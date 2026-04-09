import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useChangePasswordMutation } from '../features/user/userApi'

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'At least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  })

type FormValues = z.infer<typeof changePasswordSchema>

export function ChangePasswordPage() {
  const [changePassword, { isLoading }] = useChangePasswordMutation()
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(changePasswordSchema) as never,
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (values: FormValues) => {
    setMessage(null)
    try {
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      }).unwrap()
      setMessage({ type: 'success', text: 'Password changed successfully.' })
      reset()
      setTimeout(() => setMessage(null), 4000)
    } catch (err: unknown) {
      const data = err as { data?: { message?: string } }
      setMessage({
        type: 'error',
        text: data.data?.message || 'Could not change password. Try again.',
      })
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Change Password</h1>
        <p className="mt-2 text-sm text-slate-600">
          Enter your current password, then choose a new one.
        </p>
      </div>

      {message ? (
        <div
          className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
            message.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {message.text}
        </div>
      ) : null}

      <div className="bg-white shadow-[0_4px_24px_rgba(0,0,0,0.02)] rounded-2xl overflow-hidden border border-slate-100 p-6 sm:p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-md space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Current password</label>
            <input
              type="password"
              autoComplete="current-password"
              {...register('currentPassword')}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-0 transition focus:border-blue-500"
            />
            {errors.currentPassword?.message ? (
              <p className="mt-1 text-xs text-red-600">{errors.currentPassword.message}</p>
            ) : null}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">New password</label>
            <input
              type="password"
              autoComplete="new-password"
              {...register('newPassword')}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-0 transition focus:border-blue-500"
            />
            {errors.newPassword?.message ? (
              <p className="mt-1 text-xs text-red-600">{errors.newPassword.message}</p>
            ) : null}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Confirm new password</label>
            <input
              type="password"
              autoComplete="new-password"
              {...register('confirmPassword')}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-0 transition focus:border-blue-500"
            />
            {errors.confirmPassword?.message ? (
              <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>
            ) : null}
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
              {isLoading ? 'Updating...' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  )
}
