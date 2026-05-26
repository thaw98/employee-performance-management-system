// frontend/src/components/auth/LoginForm.tsx

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch } from 'react-redux';
import { Eye, EyeOff, Lock, Mail, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

import { useLoginMutation } from '../../features/auth/authApi';
import { setCredentials } from '../../features/auth/authSlice';
import { getDashboardPath } from '../../utils/dashboardRedirect';

/** Single toast for login failures — avoids stacked duplicates from Strict Mode or double handlers. */
const LOGIN_CREDENTIALS_TOAST_ID = 'login-credentials-error';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [login, { isLoading }] = useLoginMutation();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      const response = await login({
        email: values.email.trim().toLowerCase(),
        password: values.password,
      }).unwrap();

      if (!response.success || !response.data) {
        toast.error('Invalid email or password', { id: LOGIN_CREDENTIALS_TOAST_ID });
        return;
      }

      const { token, user, expiresAt } = response.data;

      // Save credentials to Redux and storage
      dispatch(setCredentials({ token, user, expiresAt, rememberMe: values.rememberMe }));

      toast.dismiss(LOGIN_CREDENTIALS_TOAST_ID);
      toast.success(`Welcome back, ${user.name}!`);

      // Check if password change is required
      if (user.mustChangePassword) {
        navigate('/first-login/set-password', { replace: true });
        return;
      }

      // Redirect to appropriate dashboard based on role
      const dashboardPath = getDashboardPath(user);
      navigate(dashboardPath, { replace: true });

    } catch (err: any) {
      const errorMessage = err?.data?.message || err?.message || 'Invalid email or password';
      toast.error(errorMessage, { id: LOGIN_CREDENTIALS_TOAST_ID });
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-5">
        {/* Email Field */}
        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">
            Work Email <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              placeholder="you@company.com"
              className={`w-full h-[64px] rounded-[14px] border bg-[#EAF1FB] border-[#D8E2F0] pl-12 pr-4 text-slate-800 placeholder:text-slate-400/80 focus:outline-none focus:ring-2 focus:ring-blue-100/50 focus:border-[#2563FF] transition-all ${
                errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-100' : ''
              }`}
              {...register('email')}
            />
          </div>
          {errors.email && (
            <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.email.message}</p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">
            Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              className={`w-full h-[64px] rounded-[14px] border bg-[#EAF1FB] border-[#D8E2F0] pl-12 pr-12 text-slate-800 placeholder:text-slate-400/80 focus:outline-none focus:ring-2 focus:ring-blue-100/50 focus:border-[#2563FF] transition-all ${
                errors.password ? 'border-red-300 focus:border-red-500 focus:ring-red-100' : ''
              }`}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.password.message}</p>
          )}
        </div>
      </div>

      {/* Remember Me & Forgot Password */}
      <div className="flex items-center justify-between">
        <label className="flex cursor-pointer items-center gap-2 select-none">
          <input
            type="checkbox"
            className="h-4.5 w-4.5 rounded border-slate-300 text-[#2563FF] focus:ring-0 focus:ring-offset-0 cursor-pointer"
            {...register('rememberMe')}
          />
          <span className="text-sm font-semibold text-slate-600">Remember me</span>
        </label>
        <Link
          to="/forgot-password"
          className="text-sm font-bold text-[#2563FF] transition-colors hover:text-[#1E63FF] hover:underline"
        >
          Forgot password?
        </Link>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="flex w-full h-[64px] items-center justify-center gap-2 rounded-[14px] bg-[#2563FF] font-bold text-white transition-all hover:bg-[#1E63FF] hover:shadow-lg disabled:opacity-50 active:scale-[0.99]"
      >
        {isLoading ? (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : (
          <>
            Sign In
            <ArrowRight className="h-5 w-5" />
          </>
        )}
      </button>
    </form>
  );
}