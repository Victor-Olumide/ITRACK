import { Navigate, useLocation } from 'react-router'
import { homePathForRole, useAuth } from '../contexts/AuthContext'
import type { ReactNode } from 'react'
import type { UserRole } from '../lib/types'

interface RequireAuthProps {
  roles: UserRole[]
  children: ReactNode
}

export default function RequireAuth({ roles, children }: RequireAuthProps) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={homePathForRole(user.role)} replace />
  }

  return children
}
