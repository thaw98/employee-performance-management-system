import { useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'

import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { setCredentials } from '../../features/auth/authSlice'
import { updatePersistedUser } from '../../features/auth/authStorage'
import { useChangePasswordMutation } from '../../features/user/userApi'
import { getDashboardPath } from '../../utils/dashboardRedirect'

function buildSchema(variant: SetNewPasswordFormVariant) {
  return z
    .object({
      currentPassword:
        variant === 'settingsPage'
          ? z.string().min(1, 'Current password is required')
          : z.string().optional(),
      newPassword: z.string().min(8, 'At least 8 characters'),
      confirmPassword: z.string().min(1, 'Please confirm your new password'),
    })
    .refine((v) => v.newPassword === v.confirmPassword, {
      path: ['confirmPassword'],
      message: 'Passwords do not match',
    })
}

type FormValues = z.infer<ReturnType<typeof buildSchema>>

export type SetNewPasswordFormVariant = 'loginPanel' | 'settingsPage'

interface SetNewPasswordFormProps {
  variant: SetNewPasswordFormVariant
}

export function SetNewPasswordForm({ variant }: SetNewPasswordFormProps) {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const token = useAppSelector((s) => s.auth.token)
  const user = useAppSelector((s) => s.auth.user)
  const [changePassword, { isLoading }] = useChangePasswordMutation()
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const schema = useMemo(() => buildSchema(variant), [variant])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as never,
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  const onSubmit = async (values: FormValues) => {
    setMessage(null)
    try {
      await changePassword({
        ...(variant === 'settingsPage' ? { currentPassword: values.currentPassword ?? '' } : {}),
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      }).unwrap()
      toast.success('Password changed successfully! Redirecting...')
      reset()
      const nextUser = token && user ? { ...user, mustChangePassword: false } : null
      if (nextUser) {
        dispatch(setCredentials({ token: token!, user: nextUser }))
        updatePersistedUser(nextUser)
      }
      if (variant === 'loginPanel') {
        setTimeout(() => {
          navigate(nextUser ? getDashboardPath(nextUser) : '/hr/dashboard', { replace: true })
        }, 1200)
      } else {
        setTimeout(() => setMessage(null), 4000)
      }
    } catch (err: unknown) {
      const data = err as { data?: { message?: string } }
      setMessage({
        type: 'error',
        text: data.data?.message || 'Could not change password. Try again.',
      })
    }
  }

  /* ───── loginPanel variant ───── */
  if (variant === 'loginPanel') {
    return (
      <>
        {/* Message block */}
        {message && (
          <div
            className={`mb-5 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium ${
              message.type === 'success'
                ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                : 'border-red-100 bg-red-50 text-red-600'
            }`}
            role={message.type === 'error' ? 'alert' : 'status'}
          >
            {message.type !== 'success' && (
              <i className="bi bi-exclamation-triangle-fill shrink-0" />
            )}
            {message.text}
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* New Password */}
          <div>
            <label className="mb-1.5 block text-sm font-bold text-slate-700" htmlFor="new-password-first">
              New Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                id="new-password-first"
                type={showNewPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                aria-invalid={errors.newPassword ? 'true' : 'false'}
                className={`w-full rounded-xl border bg-white py-3.5 pl-12 pr-12 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                  errors.newPassword
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                    : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'
                }`}
                {...register('newPassword')}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                tabIndex={-1}
              >
                {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.newPassword?.message && (
              <p className="mt-1.5 text-xs text-red-500">{errors.newPassword.message}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="mb-1.5 block text-sm font-bold text-slate-700" htmlFor="confirm-password-first">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                id="confirm-password-first"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Re-enter your new password"
                aria-invalid={errors.confirmPassword ? 'true' : 'false'}
                className={`w-full rounded-xl border bg-white py-3.5 pl-12 pr-12 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                  errors.confirmPassword
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                    : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'
                }`}
                {...register('confirmPassword')}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.confirmPassword?.message && (
              <p className="mt-1.5 text-xs text-red-500">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-bold text-white transition-all hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                Set Password
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
        </form>
      </>
    )
  }

  /* ───── settingsPage variant (unchanged) ───── */
  const settingsMessage = message ? (
    <div
      className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
        message.type === 'success'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-red-200 bg-red-50 text-red-700'
      }`}
      role={message.type === 'error' ? 'alert' : 'status'}
    >
      {message.text}
    </div>
  ) : null

  return (
    <>
      {settingsMessage}
      <div className="bg-white shadow-[0_4px_24px_rgba(0,0,0,0.02)] rounded-2xl overflow-hidden border border-slate-100 p-6 sm:p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-md space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="settings-current-password">
              Current password
            </label>
            <input
              id="settings-current-password"
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
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="settings-new-password">
              New password
            </label>
            <input
              id="settings-new-password"
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
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="settings-confirm-password">
              Confirm new password
            </label>
            <input
              id="settings-confirm-password"
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
    </>
  )
}
