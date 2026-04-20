import { Navigate, Outlet } from 'react-router-dom'

import { useAppSelector } from '../app/hooks'
import type { RoleGroup } from '../types/auth'
import { getDashboardPath, getRoleGroup } from '../utils/dashboardRedirect'

interface RoleRouteProps {
  allowedRoles: RoleGroup[]
}

export default function RoleRoute({ allowedRoles }: RoleRouteProps) {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth)

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  const group = getRoleGroup(user)
  if (!allowedRoles.includes(group)) {
    return <Navigate to={getDashboardPath(user)} replace />
  }

  return <Outlet />
}
