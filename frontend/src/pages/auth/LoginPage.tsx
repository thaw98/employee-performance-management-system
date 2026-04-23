// src/pages/auth/LoginPage.tsx
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../../app/hooks';
import { LoginForm } from '../../components/auth/LoginForm';
import { getDashboardPath } from '../../utils/dashboardRedirect';
import { FIRST_LOGIN_SET_PASSWORD_PATH } from '../../routes/paths';
import { BarChart3 } from 'lucide-react';

export function LoginPage() {
  const { isAuthenticated, user, token } = useAppSelector((state) => state.auth);

  // Redirect if already authenticated
  if (isAuthenticated && token && user) {
    if (user.mustChangePassword) {
      return <Navigate to={FIRST_LOGIN_SET_PASSWORD_PATH} replace />;
    }
    const dashboardPath = getDashboardPath(user);
    return <Navigate to={dashboardPath} replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-[440px] rounded-3xl bg-white p-8 shadow-xl">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 shadow-lg">
            <BarChart3 className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">EPMS</h1>
          <p className="mt-1 text-center text-sm text-slate-500">
            Employee Performance Management System
          </p>
        </div>

        {/* Login Form */}
        <LoginForm />

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