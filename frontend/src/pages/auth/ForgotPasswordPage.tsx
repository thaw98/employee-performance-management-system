import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, Send, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';

import { useSendForgotPasswordOtpMutation } from '../../features/auth/forgotPasswordApi';

const forgotSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required.')
    .email('Please enter a valid email address.'),
});

type ForgotFormValues = z.infer<typeof forgotSchema>;

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [sendOtp, { isLoading }] = useSendForgotPasswordOtpMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: ForgotFormValues) => {
    const email = values.email.trim().toLowerCase();

    try {
      const res = await sendOtp({ email }).unwrap();

      if (!res.success) {
        toast.error(res.message || 'Failed to send OTP.');
        return;
      }

      toast.success(res.message || 'OTP sent successfully!');
      sessionStorage.setItem('fpEmail', email);
      navigate('/verify-otp');
    } catch (err: any) {
      const msg = err?.data?.message || 'Failed to send OTP. Please try again.';
      toast.error(msg);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-[440px] rounded-3xl bg-white p-8 shadow-xl">
        {/* Logo */}
        <div className="mb-6 flex flex-col items-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 shadow-lg">
            <BarChart3 className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">EPMS</h1>
          <p className="mt-1 text-center text-sm text-slate-500">
            Employee Performance Management System
          </p>
        </div>

        {/* Back link */}
        <Link
          to="/login"
          className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition-colors hover:text-blue-600"
        >
          <ArrowLeft size={16} />
          Back to Login
        </Link>

        {/* Heading */}
        <div className="mb-6 space-y-2">
          <h2 className="text-xl font-black tracking-tight text-slate-900">Forgot Password?</h2>
          <p className="text-sm text-slate-500">
            Enter your work email and we'll send a 6-digit OTP to verify your identity.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
          <div>
            <label
              className="mb-1.5 block text-sm font-bold text-slate-700"
              htmlFor="fp-email"
            >
              Work Email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                id="fp-email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                className={`w-full rounded-xl border bg-white py-3.5 pl-12 pr-4 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                  errors.email
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                    : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'
                }`}
                {...register('email')}
              />
            </div>
            {errors.email && (
              <p className="mt-1.5 text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                Send OTP
                <Send size={18} />
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
