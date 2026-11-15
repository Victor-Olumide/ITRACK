
import { Navigate, useLocation } from 'react-router'

import { homePathForRole, useAuth } from '../contexts/AuthContext'

import type { ReactNode } from 'react'
import type { UserRole } from '../types/types'

interface RequireAuthProps {
  roles: UserRole[]
  children: ReactNode
}

export function SessionSplash() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-foreground transition-colors duration-300"
      role="status"
      aria-live="polite"
    >
      <div className="mb-8 flex flex-col items-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-primary-foreground shadow-lg">
          i
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          iTrack
        </h1>

        <p className="mt-1 text-xs font-medium text-muted-foreground">
          Asset & Ticket Management
        </p>
      </div>

      <div className="flex flex-col items-center gap-4">
        <div
          className="h-8 w-8 animate-spin rounded-full border-[3px] border-border border-t-primary"
          aria-hidden="true"
        />

        <div className="text-center">
          <p className="text-sm font-semibold text-foreground">
            Checking your session
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Please wait while we securely restore your access.
          </p>
        </div>
      </div>
    </div>
  )
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

  // Wait for the backend to verify a returning user's session.
  if (isRestoringSession) {
    return <SessionSplash />
  }

  // No authenticated user after the session check.
  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    )
  }

  // Ensure the user has permission to access this route.
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
