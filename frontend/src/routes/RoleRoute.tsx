import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import type { RoleGroup } from '../types/auth';

interface RoleRouteProps {
  allowedRoles: RoleGroup[];
}

const RoleRoute: React.FC<RoleRouteProps> = ({ allowedRoles }) => {
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user && !allowedRoles.includes(user.roleGroup)) {
    // Redirect to their own dashboard if they try to access wrong one
    const dashboardPath = `/${user.roleGroup.toLowerCase()}/dashboard`;
    return <Navigate to={dashboardPath} replace />;
  }

  return <Outlet />;
};

export default RoleRoute;
