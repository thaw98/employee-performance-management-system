import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'

import { useAppDispatch } from '../../app/hooks'
import { useLoginMutation } from '../../features/auth/authApi'
import { persistAuth } from '../../features/auth/authStorage'
import { setCredentials } from '../../features/auth/authSlice'

const PRIMARY = '#0855BF'

interface LoginFormValues {
  identifier: string
  password: string
  rememberMe: boolean
}

export function LoginForm() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [login, { isLoading }] = useLoginMutation()
  const [showPassword, setShowPassword] = useState(false)
  const [genericError, setGenericError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    defaultValues: { identifier: '', password: '', rememberMe: false },
  })

  const onSubmit = async (values: LoginFormValues) => {
    setGenericError(null)
    try {
      const res = await login({
        identifier: values.identifier.trim(),
        password: values.password,
      }).unwrap()
      if (!res.success || !res.data) {
        setGenericError('Invalid credentials')
        return
      }
      persistAuth(values.rememberMe, res.data.token, res.data.user)
      dispatch(setCredentials({ token: res.data.token, user: res.data.user }))
      navigate('/admin/dashboard', { replace: true })
    } catch {
      setGenericError('Invalid credentials')
    }
  }

  return (
    <form
      className="flex w-full flex-col gap-5"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      {genericError ? (
        <p
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
          role="alert"
        >
          {genericError}
        </p>
      ) : null}

      <div className="flex flex-col gap-1.5 text-left">
        <label htmlFor="identifier" className="text-sm font-medium text-slate-700">
          Email or Employee ID
        </label>
        <input
          id="identifier"
          type="text"
          autoComplete="username"
          className="rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 shadow-sm outline-none transition focus:border-[#0855BF] focus:ring-2 focus:ring-[#0855BF]/25"
          aria-invalid={errors.identifier ? 'true' : 'false'}
          {...register('identifier', { required: 'This field is required' })}
        />
        {errors.identifier ? (
          <span className="text-sm text-red-600">{errors.identifier.message}</span>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5 text-left">
        <label htmlFor="password" className="text-sm font-medium text-slate-700">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 pr-11 text-slate-900 shadow-sm outline-none transition focus:border-[#0855BF] focus:ring-2 focus:ring-[#0855BF]/25"
            aria-invalid={errors.password ? 'true' : 'false'}
            {...register('password', { required: 'This field is required' })}
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'} text-lg`} />
          </button>
        </div>
        {errors.password ? (
          <span className="text-sm text-red-600">{errors.password.message}</span>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-[#0855BF] focus:ring-[#0855BF]"
            {...register('rememberMe')}
          />
          Remember Me
        </label>
        <Link
          to="/forgot-password"
          className="text-sm font-medium text-[#0855BF] underline-offset-2 hover:underline"
          style={{ color: PRIMARY }}
        >
          Forgot Password?
        </Link>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="mt-1 w-full rounded-lg px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
        style={{ backgroundColor: PRIMARY }}
      >
        {isLoading ? 'Signing in…' : 'Login'}
      </button>
    </form>
  )
}
