import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { useAppSelector } from '../app/hooks'

import { FIRST_LOGIN_SET_PASSWORD_PATH } from './paths'

interface ProtectedRouteProps {
  children: ReactNode
  allowedRoleIds?: number[]
}

export function ProtectedRoute({ children, allowedRoleIds }: ProtectedRouteProps) {
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated)
  const roleId = useAppSelector((s) => s.auth.user?.roleId)
  const mustChangePassword = useAppSelector((s) => s.auth.user?.mustChangePassword === true)
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (mustChangePassword && location.pathname !== FIRST_LOGIN_SET_PASSWORD_PATH) {
    return <Navigate to={FIRST_LOGIN_SET_PASSWORD_PATH} replace />
  }

  if (allowedRoleIds && (!roleId || !allowedRoleIds.includes(roleId))) {
    return <Navigate to="/hr/dashboard" replace />
  }

  return children
}
