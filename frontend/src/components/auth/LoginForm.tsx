import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'

import { useAppDispatch } from '../../app/hooks'
import { useLoginMutation } from '../../features/auth/authApi'
import { persistAuth } from '../../features/auth/authStorage'
import { setCredentials } from '../../features/auth/authSlice'
import { FIRST_LOGIN_SET_PASSWORD_PATH } from '../../routes/paths'

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
    defaultValues: {
      identifier: '',
      password: '',
      rememberMe: false,
    },
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
      if (res.data.user.mustChangePassword) {
        navigate(FIRST_LOGIN_SET_PASSWORD_PATH, { replace: true })
      } else {
        navigate('/hr/dashboard', { replace: true })
      }
    } catch {
      setGenericError('Invalid credentials')
    }
  }

  const alertMessage =
    genericError ||
    errors.identifier?.message ||
    errors.password?.message ||
    null

  return (
    <div className="epms-login-form-wrapper">
      <div className="epms-login-mobile-logo">
        <i className="bi bi-bar-chart-line-fill" aria-hidden />
        <span>EPMS</span>
      </div>

      <div className="epms-login-form-header">
        <h2 className="epms-login-form-title">Welcome Back</h2>
        <p className="epms-login-form-desc">
          Sign in to your performance management portal
        </p>
      </div>

      {alertMessage ? (
        <div className="epms-login-error" role="alert">
          <i className="bi bi-exclamation-circle-fill" aria-hidden />
          <span>{alertMessage}</span>
        </div>
      ) : null}

      <form
        className="epms-login-form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <div className="epms-login-field">
          <label className="epms-login-label" htmlFor="identifier">
            Email or numeric record ID <span className="epms-login-required">*</span>
          </label>
          <div className="epms-login-input-wrapper">
            <span className="epms-login-input-icon">
              <i className="bi bi-envelope-fill" aria-hidden />
            </span>
            <input
              id="identifier"
              type="text"
              className="epms-login-input"
              placeholder="you@acedatasystems.com or EMP-001"
              autoComplete="username"
              aria-invalid={errors.identifier ? 'true' : 'false'}
              {...register('identifier', { required: 'This field is required' })}
            />
          </div>
        </div>

        <div className="epms-login-field">
          <label className="epms-login-label" htmlFor="password">
            Password <span className="epms-login-required">*</span>
          </label>
          <div className="epms-login-input-wrapper">
            <span className="epms-login-input-icon">
              <i className="bi bi-lock-fill" aria-hidden />
            </span>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              className="epms-login-input"
              placeholder="Enter your password"
              autoComplete="current-password"
              aria-invalid={errors.password ? 'true' : 'false'}
              {...register('password', { required: 'This field is required' })}
            />
            <button
              type="button"
              className="epms-login-toggle-pw"
              onClick={() => setShowPassword((v) => !v)}
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              <i
                className={`bi ${showPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}
                aria-hidden
              />
            </button>
          </div>
        </div>

        <div className="epms-login-options">
          <label className="epms-login-remember">
            <input type="checkbox" {...register('rememberMe')} />
            <span className="epms-login-remember-checkmark" />
            <span>Remember me</span>
          </label>
          <Link to="/forgot-password" className="epms-login-forgot">
            Forgot Password?
          </Link>
        </div>

        <button
          type="submit"
          className="epms-login-submit"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="epms-login-spinner" />
          ) : (
            <>
              Sign In
              <i className="bi bi-arrow-right" aria-hidden />
            </>
          )}
        </button>
      </form>

      <p className="epms-login-footer-text">
        Need help? Contact <span className="epms-login-link">IT Support</span>
      </p>
    </div>
  )
}
