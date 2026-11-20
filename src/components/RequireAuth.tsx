
import { Navigate, useLocation } from 'react-router'

import { homePathForRole, useAuth } from '../contexts/AuthContext'
import Logo from '../components/Logo'

import type { ReactNode } from 'react'
import type { UserRole } from '../types/types'

interface RequireAuthProps {
  roles: UserRole[]
  children: ReactNode
}

export function SessionSplash() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-[#f4f6fc] px-6 text-[#101a3b]"
      role="status"
      aria-live="polite"
    >
      <div className="mb-6 flex flex-col items-center">
        <Logo size={64} />

        <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#0B184C]">
          iTrack
        </h1>
      </div>

      <div className="flex flex-col items-center gap-4">
        <div
          className="h-8 w-8 animate-spin rounded-full border-[3px] border-blue-100 border-t-[#3155ff]"
          aria-hidden="true"
        />

        <div className="text-center">
          <p className="text-sm font-semibold text-[#0B184C]">
            Checking your session
          </p>

          <p className="mt-1 text-xs text-slate-500">
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

  if (isRestoringSession) {
    return <SessionSplash />
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    )
  }

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
