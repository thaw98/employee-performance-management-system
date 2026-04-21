import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import toast from 'react-hot-toast';

const forgotSchema = z.object({
  email: z.string().email('Please enter a valid work email'),
});

type ForgotFormValues = z.infer<typeof forgotSchema>;

export function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (_data: ForgotFormValues) => {
    setIsLoading(true);
    try {
      // API call would go here
      toast.success('Reset link sent to your email');
      setIsSent(true);
    } catch (error) {
      toast.error('Failed to send reset link');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 space-y-8">
        <Link to="/login" className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors font-bold text-sm">
          <ArrowLeft size={16} />
          Back to Login
        </Link>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Forgot Password?</h1>
          <p className="text-slate-500 text-sm">
            Enter your work email and we'll send you instructions to reset your password.
          </p>
        </div>

        {!isSent ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Work Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  {...register('email')}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-12 pr-4 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  placeholder="you@company.com"
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1 font-medium">{errors.email.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? 'Sending...' : 'Send Reset Link'}
              {!isLoading && <Send size={20} />}
            </button>
          </form>
        ) : (
          <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl text-center space-y-3">
             <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white mx-auto mb-2">
                <Send size={20} />
             </div>
             <h3 className="text-blue-900 font-bold">Check your email</h3>
             <p className="text-blue-700 text-sm">
               We have sent a password reset link to your email address.
             </p>
             <button 
               onClick={() => setIsSent(false)}
               className="text-blue-600 font-bold text-xs hover:underline mt-4"
              >
               Didn't receive it? Click to retry
             </button>
          </div>
        )}
      </div>
    </div>
  );
}
