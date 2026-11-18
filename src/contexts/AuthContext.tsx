
/* eslint-disable react-refresh/only-export-components */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import type { ReactNode } from 'react'

import { useAppDispatch, useAppSelector } from '@/lib/stores/hooks'
import { appApi } from '@/lib/api/app-api'

import {
  useLoginMutation,
  useRefreshMutation,
  useLogoutMutation,
  useUpdateProfileMutation,
  useGetMeQuery,
} from '@/lib/api/auth/auth-api'

import { useGetUsersQuery } from '@/lib/api/users/users-api'

import {
  clearAuth,
  setAuthenticatedUser,
} from '@/lib/stores/auth-slice'

import type { AuthenticatedUser } from '@/lib/api/auth/types'
import type { PublicUser, UserRole } from '../types/types'

const AUTH_HISTORY_KEY = 'hasAuthenticatedBefore'

interface AuthContextValue {
  user: PublicUser | null
  users: PublicUser[]
  sessionExpired: boolean
  isRestoringSession: boolean

  login: (email: string, password: string) => Promise<PublicUser>
  updateProfile: (fullName: string) => Promise<PublicUser>
  logout: () => Promise<void>
  endSessionLocally: () => void

  usersError: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

const roleFromApi: Record<AuthenticatedUser['role'], UserRole> = {
  EMPLOYEE: 'Employee',
  DEPARTMENT_HEAD: 'Department Head',
  TECHNICIAN: 'Technician',
  IT_ADMIN: 'IT Admin',
  SECURITY: 'Security',
}

function toPublicUser(user: AuthenticatedUser): PublicUser {
  return {
    id: user.id,
    name: user.fullName,
    email: user.email,
    role: roleFromApi[user.role],
    department: user.department.name,
    staffId: user.staffId,
    ...(user.phone ? { phone: user.phone } : {}),
  }
}

function isUnauthorizedError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    error.status === 401
  )
}

export function homePathForRole(role: UserRole) {
  if (role === 'Department Head') return '/department'
  if (role === 'Technician') return '/technician'
  if (role === 'Employee') return '/employee'
  if (role === 'Security') return '/security'

  return '/'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch()

  const {
    user: authenticatedUser,
    sessionExpired,
  } = useAppSelector((state) => state.auth)

  // This is only a marker that tells us whether this browser
  // has authenticated before. It is not an authentication token.
  const [shouldRestoreSession, setShouldRestoreSession] = useState(
    () => localStorage.getItem(AUTH_HISTORY_KEY) === 'true',
  )

  // Only returning browsers attempt to restore a session.
  const meQuery = useGetMeQuery(undefined, {
    skip: !shouldRestoreSession,
  })

  const unauthorized = isUnauthorizedError(meQuery.error)

  // Do not trust a previously persisted Redux user until the
  // backend has verified the returning user's cookie.
  const sessionUser = shouldRestoreSession
    ? unauthorized
      ? null
      : meQuery.data?.user ?? null
    : authenticatedUser

  // Keep Redux synchronized with the verified backend user.
  useEffect(() => {
    if (meQuery.data?.user && !unauthorized) {
      dispatch(setAuthenticatedUser(meQuery.data.user))
    }
  }, [dispatch, meQuery.data?.user, unauthorized])

  // A 401 means the previous session is no longer valid.
  // No React state update is needed here: the query state
  // already tells us that session restoration has failed.
  useEffect(() => {
    if (unauthorized) {
      localStorage.removeItem(AUTH_HISTORY_KEY)
      dispatch(clearAuth())
    }
  }, [dispatch, unauthorized])

  const isRestoringSession =
    shouldRestoreSession &&
    !sessionUser &&
    !meQuery.isError &&
    (meQuery.isLoading || meQuery.isFetching)

  const [loginRequest] = useLoginMutation()
  const [refreshRequest] = useRefreshMutation()
  const [logoutRequest] = useLogoutMutation()
  const [updateProfileRequest] = useUpdateProfileMutation()

  const usersQuery = useGetUsersQuery(undefined, {
    skip: sessionUser?.role !== 'IT_ADMIN',
  })
  const sessionUserId = sessionUser?.id

  useEffect(() => {
    if (!sessionUserId) return

    const refresh = () => {
      void refreshRequest()
        .unwrap()
        .then((response) => dispatch(setAuthenticatedUser(response.user)))
        .catch(() => undefined)
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') refresh()
    }

    const interval = window.setInterval(refresh, 10 * 60 * 1000)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [dispatch, refreshRequest, sessionUserId])

  const user = useMemo(
    () => (sessionUser ? toPublicUser(sessionUser) : null),
    [sessionUser],
  )

  const login = async (
    email: string,
    password: string,
  ): Promise<PublicUser> => {
    const response = await loginRequest({
      email: email.trim(),
      password,
    }).unwrap()

    // A successful login means this browser has authenticated.
    localStorage.setItem(AUTH_HISTORY_KEY, 'true')

    // Session restoration is no longer needed in this app instance.
    setShouldRestoreSession(false)

    dispatch(setAuthenticatedUser(response.user))

    return toPublicUser(response.user)
  }

  const updateProfile = async (
    fullName: string,
  ): Promise<PublicUser> => {
    const response = await updateProfileRequest({
      fullName,
    }).unwrap()

    dispatch(setAuthenticatedUser(response.user))

    return toPublicUser(response.user)
  }

  const endSessionLocally = () => {
    // An intentional logout must prevent automatic restoration.
    localStorage.removeItem(AUTH_HISTORY_KEY)
    setShouldRestoreSession(false)

    dispatch(clearAuth())
    dispatch(appApi.util.resetApiState())
  }

  const logout = async () => {
    try {
      await logoutRequest().unwrap()
    } catch {
      // Continue with local sign-out if the access session has expired or the
      // API is temporarily unavailable. A logout action must not strand the
      // user in the protected workspace.
    } finally {
      // Signing out locally must succeed even when an expired session or a
      // transient API failure prevents the server-side cookie from being
      // revoked. The server endpoint remains responsible for revocation when
      // it is reachable.
      endSessionLocally()
    }
  }

  const value: AuthContextValue = {
    user,

    users: (usersQuery.data?.users ?? []).map(toPublicUser),

    sessionExpired,

    isRestoringSession,

    usersError: usersQuery.isError,

    login,
    updateProfile,
    logout,
    endSessionLocally,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider.')
  }

  return context
}
