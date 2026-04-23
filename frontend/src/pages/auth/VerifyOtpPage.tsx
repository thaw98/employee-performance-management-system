import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, BarChart3, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

import {
  useVerifyForgotPasswordOtpMutation,
  useResendForgotPasswordOtpMutation,
} from '../../features/auth/forgotPasswordApi';

const otpSchema = z.object({
  otp: z
    .string()
    .min(1, 'OTP is required.')
    .regex(/^[0-9]{6}$/, 'OTP must be exactly 6 digits.'),
});

type OtpFormValues = z.infer<typeof otpSchema>;

const OTP_LIFETIME_SECONDS = 5 * 60; // 5 minutes
const RESEND_COOLDOWN_SECONDS = 60;

export function VerifyOtpPage() {
  const navigate = useNavigate();
  const email = sessionStorage.getItem('fpEmail');

  const [verifyOtp, { isLoading: verifying }] = useVerifyForgotPasswordOtpMutation();
  const [resendOtp, { isLoading: resending }] = useResendForgotPasswordOtpMutation();

  // OTP expiry timer
  const [otpTimeLeft, setOtpTimeLeft] = useState(OTP_LIFETIME_SECONDS);
  // Resend cooldown timer
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: '' },
  });

  // OTP expiry countdown
  useEffect(() => {
    if (otpTimeLeft <= 0) return;
    const timer = setInterval(() => {
      setOtpTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpTimeLeft]);

  // Resend cooldown countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleResend = useCallback(async () => {
    if (!email || resendCooldown > 0 || resending) return;
    try {
      const res = await resendOtp({ email }).unwrap();
      if (!res.success) {
        toast.error(res.message || 'Failed to resend OTP.');
        return;
      }
      toast.success(res.message || 'A new OTP has been sent!');
      reset();
      setOtpTimeLeft(OTP_LIFETIME_SECONDS);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to resend OTP.');
    }
  }, [email, resendCooldown, resending, resendOtp, reset]);

  const onSubmit = async (values: OtpFormValues) => {
    if (!email) return;

    try {
      const res = await verifyOtp({ email, otp: values.otp.trim() }).unwrap();

      if (!res.success || !res.data) {
        toast.error(res.message || 'OTP verification failed.');
        return;
      }

      toast.success(res.message || 'OTP verified!');
      sessionStorage.setItem('fpOtpSessionId', res.data.otpSessionId);
      navigate('/reset-password');
    } catch (err: any) {
      toast.error(err?.data?.message || 'OTP verification failed.');
    }
  };

  // Guard: if no email in session, send user back
  if (!email) {
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

        {/* Back link */}
        <Link
          to="/forgot-password"
          className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition-colors hover:text-blue-600"
        >
          <ArrowLeft size={16} />
          Back
        </Link>

        {/* Heading */}
        <div className="mb-6 space-y-2">
          <h2 className="text-xl font-black tracking-tight text-slate-900">Verify OTP</h2>
          <p className="text-sm text-slate-500">
            Enter the 6-digit code sent to{' '}
            <span className="font-semibold text-slate-700">{email}</span>
          </p>
        </div>

        {/* OTP expiry indicator */}
        <div
          className={`mb-6 flex items-center gap-3 rounded-xl border px-4 py-3 ${
            otpTimeLeft > 60
              ? 'border-blue-100 bg-blue-50'
              : otpTimeLeft > 0
                ? 'border-amber-100 bg-amber-50'
                : 'border-red-100 bg-red-50'
          }`}
        >
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
              otpTimeLeft > 60
                ? 'bg-blue-100'
                : otpTimeLeft > 0
                  ? 'bg-amber-100'
                  : 'bg-red-100'
            }`}
          >
            <ShieldCheck
              className={`h-5 w-5 ${
                otpTimeLeft > 60
                  ? 'text-blue-600'
                  : otpTimeLeft > 0
                    ? 'text-amber-600'
                    : 'text-red-600'
              }`}
            />
          </div>
          <div>
            <p
              className={`text-sm font-semibold ${
                otpTimeLeft > 60
                  ? 'text-blue-800'
                  : otpTimeLeft > 0
                    ? 'text-amber-800'
                    : 'text-red-800'
              }`}
            >
              {otpTimeLeft > 0
                ? `OTP expires in ${formatTime(otpTimeLeft)}`
                : 'OTP has expired'}
            </p>
            {otpTimeLeft === 0 && (
              <p className="text-xs text-red-600">Please resend a new OTP.</p>
            )}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
          <div>
            <label
              className="mb-1.5 block text-sm font-bold text-slate-700"
              htmlFor="otp-input"
            >
              OTP Code <span className="text-red-500">*</span>
            </label>
            <input
              id="otp-input"
              type="text"
              inputMode="numeric"
              maxLength={6}
              autoComplete="one-time-code"
              placeholder="000000"
              className={`w-full rounded-xl border bg-white py-3.5 text-center text-2xl font-bold tracking-[0.4em] text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 ${
                errors.otp
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                  : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'
              }`}
              {...register('otp')}
            />
            {errors.otp && (
              <p className="mt-1.5 text-xs text-red-500">{errors.otp.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={verifying || otpTimeLeft === 0}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-700 disabled:opacity-50"
          >
            {verifying ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                Verify OTP
                <ShieldCheck size={18} />
              </>
            )}
          </button>
        </form>

        {/* Resend */}
        <div className="mt-5 text-center">
          {resendCooldown > 0 ? (
            <p className="text-sm text-slate-400">
              Resend available in{' '}
              <span className="font-bold text-slate-600">
                {formatTime(resendCooldown)}
              </span>
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 transition-colors hover:text-blue-700 disabled:opacity-50"
            >
              <RefreshCw size={14} className={resending ? 'animate-spin' : ''} />
              Resend OTP
            </button>
          )}
        </div>

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
