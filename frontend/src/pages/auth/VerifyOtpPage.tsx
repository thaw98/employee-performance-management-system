import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, RefreshCw } from 'lucide-react';
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

const OTP_LIFETIME_SECONDS = 5 * 60;
const RESEND_COOLDOWN_SECONDS = 60;

export function VerifyOtpPage() {
  const navigate = useNavigate();
  const email = sessionStorage.getItem('fpEmail');

  const [verifyOtp, { isLoading: verifying }] = useVerifyForgotPasswordOtpMutation();
  const [resendOtp, { isLoading: resending }] = useResendForgotPasswordOtpMutation();

  const [otpTimeLeft, setOtpTimeLeft] = useState(OTP_LIFETIME_SECONDS);
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

  useEffect(() => {
    if (otpTimeLeft <= 0) return;
    const timer = setInterval(() => {
      setOtpTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpTimeLeft]);

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

  if (!email) {
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

            {/* Back link */}
            <Link
              to="/forgot-password"
              className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition-colors hover:text-[#2563FF]"
            >
              <ArrowLeft size={16} />
              Back
            </Link>

            <div className="mb-8">
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Verify OTP</h2>
              <p className="mt-2 text-sm text-slate-500 font-medium">
                Enter the 6-digit code sent to{' '}
                <span className="font-semibold text-slate-700">{email}</span>
              </p>
            </div>

            {/* OTP expiry indicator */}
            <div
              className={`mb-6 flex items-center gap-3 rounded-[14px] border px-4 py-3 ${
                otpTimeLeft > 60
                  ? 'border-blue-100 bg-[#EAF1FB]'
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
                  className="mb-2 block text-sm font-bold text-slate-700"
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
                  className={`w-full h-[64px] rounded-[14px] border bg-[#EAF1FB] border-[#D8E2F0] text-center text-2xl font-bold tracking-[0.4em] text-slate-800 placeholder:text-slate-400/80 focus:outline-none focus:ring-2 focus:ring-blue-100/50 focus:border-[#2563FF] transition-all ${
                    errors.otp
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                      : ''
                  }`}
                  {...register('otp')}
                />
                {errors.otp && (
                  <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.otp.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={verifying || otpTimeLeft === 0}
                className="flex w-full h-[64px] items-center justify-center gap-2 rounded-[14px] bg-[#2563FF] font-bold text-white transition-all hover:bg-[#1E63FF] hover:shadow-lg disabled:opacity-50 active:scale-[0.99]"
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
                <p className="text-sm text-slate-400 font-medium">
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
                  className="inline-flex items-center gap-2 text-sm font-bold text-[#2563FF] transition-colors hover:text-[#1E63FF] disabled:opacity-50"
                >
                  <RefreshCw size={14} className={resending ? 'animate-spin' : ''} />
                  Resend OTP
                </button>
              )}
            </div>
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
