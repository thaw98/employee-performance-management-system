import { useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { setCredentials } from '../../features/auth/authSlice'
import { updatePersistedUser } from '../../features/auth/authStorage'
import { useChangePasswordMutation } from '../../features/user/userApi'

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
      setMessage({ type: 'success', text: 'Password changed successfully.' })
      reset()
      if (token && user) {
        const nextUser = { ...user, mustChangePassword: false }
        dispatch(setCredentials({ token, user: nextUser }))
        updatePersistedUser(nextUser)
      }
      if (variant === 'loginPanel') {
        setTimeout(() => {
          setMessage(null)
          navigate('/hr/dashboard', { replace: true })
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

  const messageBlock =
    message && variant === 'loginPanel' ? (
      message.type === 'error' ? (
        <div className="epms-login-error" role="alert">
          <i className="bi bi-exclamation-circle-fill" aria-hidden />
          <span>{message.text}</span>
        </div>
      ) : (
        <div
          className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          role="status"
        >
          {message.text}
        </div>
      )
    ) : message && variant === 'settingsPage' ? (
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

  if (variant === 'loginPanel') {
    return (
      <div className="epms-login-form-wrapper">
        <div className="epms-login-mobile-logo">
          <i className="bi bi-bar-chart-line-fill" aria-hidden />
          <span>EPMS</span>
        </div>
        <div className="epms-login-form-header">
          <h2 className="epms-login-form-title">Set your password</h2>
          <p className="epms-login-form-desc">
            You signed in with a temporary password. Choose a new password (at least 8 characters) to
            continue.
          </p>
        </div>
        {messageBlock}
        <form className="epms-login-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="epms-login-field">
            <label className="epms-login-label" htmlFor="new-password-first">
              New password <span className="epms-login-required">*</span>
            </label>
            <div className="epms-login-input-wrapper">
              <span className="epms-login-input-icon">
                <i className="bi bi-lock-fill" aria-hidden />
              </span>
              <input
                id="new-password-first"
                type="password"
                autoComplete="new-password"
                className="epms-login-input"
                placeholder="At least 8 characters"
                aria-invalid={errors.newPassword ? 'true' : 'false'}
                {...register('newPassword')}
              />
            </div>
            {errors.newPassword?.message ? (
              <p className="mt-1 text-xs text-red-600">{errors.newPassword.message}</p>
            ) : null}
          </div>
          <div className="epms-login-field">
            <label className="epms-login-label" htmlFor="confirm-password-first">
              Confirm new password <span className="epms-login-required">*</span>
            </label>
            <div className="epms-login-input-wrapper">
              <span className="epms-login-input-icon">
                <i className="bi bi-lock-fill" aria-hidden />
              </span>
              <input
                id="confirm-password-first"
                type="password"
                autoComplete="new-password"
                className="epms-login-input"
                placeholder="Re-enter your new password"
                aria-invalid={errors.confirmPassword ? 'true' : 'false'}
                {...register('confirmPassword')}
              />
            </div>
            {errors.confirmPassword?.message ? (
              <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>
            ) : null}
          </div>
          <button type="submit" className="epms-login-submit" disabled={isLoading}>
            {isLoading ? (
              <span className="epms-login-spinner" />
            ) : (
              <>
                Continue
                <i className="bi bi-arrow-right" aria-hidden />
              </>
            )}
          </button>
        </form>
      </div>
    )
  }

  return (
    <>
      {messageBlock}
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
