// src/routes/ProtectedRoute.tsx
import { type ReactNode } from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAppSelector } from '../app/hooks';
import { getDashboardPath, getRoleGroup } from '../utils/dashboardRedirect';
import { FIRST_LOGIN_SET_PASSWORD_PATH } from './paths';

interface ProtectedRouteProps {
  children?: ReactNode;
  allowedRoleGroups?: ('HR' | 'MANAGER' | 'EMPLOYEE')[];
}

export function ProtectedRoute({ children, allowedRoleGroups }: ProtectedRouteProps) {
  const { isAuthenticated, user, token } = useAppSelector((state) => state.auth);
  const location = useLocation();

  // Not authenticated
  if (!isAuthenticated || !token || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Must change password
  if (user.mustChangePassword && location.pathname !== FIRST_LOGIN_SET_PASSWORD_PATH) {
    return <Navigate to={FIRST_LOGIN_SET_PASSWORD_PATH} replace />;
  }

  // Role-based access control
  if (allowedRoleGroups && allowedRoleGroups.length > 0) {
    const userRoleGroup = getRoleGroup(user);
    if (!allowedRoleGroups.includes(userRoleGroup)) {
      // Redirect to their own dashboard
      const dashboardPath = getDashboardPath(user);
      return <Navigate to={dashboardPath} replace />;
    }
  }

  return children ? <>{children}</> : <Outlet />;
}