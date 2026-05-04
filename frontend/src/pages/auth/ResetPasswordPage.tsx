import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Navigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, ArrowRight, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';

import { useResetForgotPasswordMutation } from '../../features/auth/forgotPasswordApi';
import { useAppDispatch } from '../../app/hooks';
import { setCredentials } from '../../features/auth/authSlice';
import { getDashboardPath } from '../../utils/dashboardRedirect';

const resetSchema = z
  .object({
    newPassword: z
      .string()
      .min(1, 'New password is required.'),
    confirmPassword: z.string().min(1, 'Confirm password is required.'),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match.',
  });

type ResetFormValues = z.infer<typeof resetSchema>;

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const email = sessionStorage.getItem('fpEmail');
  const otpSessionId = sessionStorage.getItem('fpOtpSessionId');
  const [hasResetSucceeded, setHasResetSucceeded] = useState(false);

  const [resetPassword, { isLoading }] = useResetForgotPasswordMutation();
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const onSubmit = async (values: ResetFormValues) => {
    if (!email || !otpSessionId) return;

    try {
      const res = await resetPassword({
        email,
        otpSessionId,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      }).unwrap();

      if (!res.success || !res.data) {
        toast.error(res.message || 'Password reset failed.');
        return;
      }

      // Auto-login: use the exact same flow as LoginForm
      const { token, user, expiresAt } = res.data;
      dispatch(setCredentials({ token, user, expiresAt, rememberMe: false }));

      setHasResetSucceeded(true);
      toast.success('Password reset successful!');

      const dashboardPath = getDashboardPath(user);
      navigate(dashboardPath, { replace: true });

      // Clean up reset flow data after successful login redirect.
      sessionStorage.removeItem('fpEmail');
      sessionStorage.removeItem('fpOtpSessionId');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Password reset failed. Please try again.');
    }
  };

  // Guard: if missing session data, redirect
  if ((!email || !otpSessionId) && !hasResetSucceeded) {
    return <Navigate to="/forgot-password" replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-[440px] rounded-3xl bg-white p-8 shadow-xl">
        {/* Logo */}
        <div className="mb-6 flex flex-col items-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 shadow-lg">
            <BarChart3 className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">EPMS</h1>
        </div>

        {/* Heading */}
        <div className="mb-6 space-y-2">
          <h2 className="text-xl font-black tracking-tight text-slate-900">Reset Password</h2>
          <p className="text-sm text-slate-500">
            Create a strong new password for your EPMS account.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          {/* New Password */}
          <div>
            <label
              className="mb-1.5 block text-sm font-bold text-slate-700"
              htmlFor="reset-new-password"
            >
              New Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                id="reset-new-password"
                type={showNewPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Enter your new password"
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
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                tabIndex={-1}
              >
                {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="mt-1.5 text-xs text-red-500">{errors.newPassword.message}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label
              className="mb-1.5 block text-sm font-bold text-slate-700"
              htmlFor="reset-confirm-password"
            >
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                id="reset-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Re-enter your new password"
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
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1.5 text-xs text-red-500">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                Reset Password
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} ACE Data Systems. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
