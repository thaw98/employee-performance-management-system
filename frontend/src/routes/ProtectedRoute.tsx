import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { useAppSelector } from '../app/hooks'

interface ProtectedRouteProps {
  children: ReactNode
  allowedRoleIds?: number[]
}

export function ProtectedRoute({ children, allowedRoleIds }: ProtectedRouteProps) {
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated)
  const roleId = useAppSelector((s) => s.auth.user?.roleId)
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (allowedRoleIds && (!roleId || !allowedRoleIds.includes(roleId))) {
    return <Navigate to="/admin/dashboard" replace />
  }

  return children
}
