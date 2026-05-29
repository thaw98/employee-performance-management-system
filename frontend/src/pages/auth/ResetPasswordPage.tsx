import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Navigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
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

      const { token, user, expiresAt } = res.data;
      dispatch(setCredentials({ token, user, expiresAt, rememberMe: false }));

      setHasResetSucceeded(true);
      toast.success('Password reset successful!');

      const dashboardPath = getDashboardPath(user);
      navigate(dashboardPath, { replace: true });

      sessionStorage.removeItem('fpEmail');
      sessionStorage.removeItem('fpOtpSessionId');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Password reset failed. Please try again.');
    }
  };

  if ((!email || !otpSessionId) && !hasResetSucceeded) {
    return <Navigate to="/forgot-password" replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F3F6FA] p-4 sm:p-6 font-sans">
      <div className="flex w-full max-w-[1080px] md:h-[640px] flex-col md:flex-row overflow-hidden rounded-[32px] bg-white shadow-[0_20px_50px_rgba(0,0,0,0.08)]">

        {/* Left Branding Panel (40% width) */}
        <div className="relative flex w-full md:w-[40%] flex-col justify-between bg-gradient-to-b from-[#2563EB] to-[#3730A3] p-8 md:p-10 text-white text-center">
          <div className="absolute -left-16 -top-16 h-48 w-48 rounded-full bg-white/5 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 h-48 w-48 rounded-full bg-white/5 blur-2xl pointer-events-none" />

          <div className="relative flex flex-col items-center justify-center flex-grow">
            <div className="mb-6 flex h-[120px] w-[120px] items-center justify-center rounded-[24px] bg-white p-4 shadow-lg hover:scale-105 transition-transform duration-300">
              <img src="/ace-logo.png" alt="Ace Data Systems Logo" className="h-full w-full object-contain" />
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold tracking-wider text-white">EPMS</h1>
            <p className="mt-3 text-xs md:text-sm text-blue-100/90 leading-relaxed font-semibold max-w-[260px]">
              Employee Performance Management System
            </p>
          </div>

          <div className="relative text-center text-xs font-semibold text-blue-200/90 tracking-wide mt-4 md:mt-0">
            Ace Data Systems Co., Ltd.
          </div>
        </div>

        {/* Right Form Panel (60% width) */}
        <div className="w-full md:w-[60%] bg-white p-8 sm:p-12 flex flex-col justify-between">
          <div className="flex-grow flex flex-col justify-center max-w-[500px] w-full mx-auto">
            {/* Mobile Logo Header */}
            <div className="mb-8 flex flex-col items-center md:hidden">
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-[18px] bg-[#EAF1FB] p-2 shadow-sm border border-[#D8E2F0]">
                <img src="/ace-logo.png" alt="Ace Data Systems Logo" className="h-full w-full object-contain" />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">EPMS</h1>
              <p className="text-xs text-slate-500 font-medium">Employee Performance Management System</p>
            </div>

            <div className="mb-8">
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Reset Password</h2>
              <p className="mt-2 text-sm text-slate-500 font-medium">
                Create a strong new password for your EPMS account.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              {/* New Password */}
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700" htmlFor="reset-new-password">
                  New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    id="reset-new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Enter your new password"
                    className={`w-full h-[64px] rounded-[14px] border bg-[#EAF1FB] border-[#D8E2F0] pl-12 pr-12 text-slate-800 placeholder:text-slate-400/80 focus:outline-none focus:ring-2 focus:ring-blue-100/50 focus:border-[#2563FF] transition-all ${
                      errors.newPassword
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                        : ''
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
                  <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.newPassword.message}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700" htmlFor="reset-confirm-password">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    id="reset-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Re-enter your new password"
                    className={`w-full h-[64px] rounded-[14px] border bg-[#EAF1FB] border-[#D8E2F0] pl-12 pr-12 text-slate-800 placeholder:text-slate-400/80 focus:outline-none focus:ring-2 focus:ring-blue-100/50 focus:border-[#2563FF] transition-all ${
                      errors.confirmPassword
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                        : ''
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
                  <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.confirmPassword.message}</p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full h-[64px] items-center justify-center gap-2 rounded-[14px] bg-[#2563FF] font-bold text-white transition-all hover:bg-[#1E63FF] hover:shadow-lg disabled:opacity-50 active:scale-[0.99]"
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
          </div>

          {/* Footer under form */}
          <div className="mt-8 text-center border-t border-slate-100 pt-4">
            <p className="text-xs text-slate-400 font-semibold tracking-wide">
              © 2026 ACE Data Systems. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
