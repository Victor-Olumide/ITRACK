import { Navigate, useLocation } from 'react-router'

import { homePathForRole, useAuth } from '../contexts/AuthContext'

import type { ReactNode } from 'react'
import type { UserRole } from '../types/types'

interface RequireAuthProps {
  roles: UserRole[]
  children: ReactNode
}

export default function RequireAuth({
  roles,
  children,
}: RequireAuthProps) {
  const {
    user,
    isRestoringSession,
  } = useAuth()

  const location = useLocation()

  // Wait until the initial authentication check completes.
  if (isRestoringSession) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Restoring your session...</p>
      </div>
    )
  }

  // No authenticated user after session restoration.
  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    )
  }

  // Check whether the authenticated user has the required role.
  if (!roles.includes(user.role)) {
    return (
      <Navigate
        to={homePathForRole(user.role)}
        replace
      />
    )
  }

  return children
}