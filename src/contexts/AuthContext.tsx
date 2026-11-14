
/* eslint-disable react-refresh/only-export-components */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
} from 'react'

import type { ReactNode } from 'react'

import { useAppDispatch, useAppSelector } from '@/lib/stores/hooks'
import { appApi } from '@/lib/api/app-api'

import {
  useLoginMutation,
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

export function homePathForRole(role: UserRole) {
  if (role === 'Technician') return '/technician'
  if (role === 'Employee') return '/employee'
  if (role === 'Security') return '/workspace-unavailable'

  return '/'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch()

  const {
    user: authenticatedUser,
    sessionExpired,
  } = useAppSelector((state) => state.auth)

  // Restore the authenticated session whenever the application starts.
  const meQuery = useGetMeQuery()

  // Prefer the existing Redux user, otherwise use the restored API user.
  const sessionUser =
    authenticatedUser ?? meQuery.data?.user ?? null

  // Synchronize the restored user with Redux.
  useEffect(() => {
    if (meQuery.data?.user) {
      dispatch(setAuthenticatedUser(meQuery.data.user))
    }
  }, [dispatch, meQuery.data?.user])

  // Only block protected routes while the initial session check is running.
  const isRestoringSession =
    !sessionUser && meQuery.isFetching

  const [loginRequest] = useLoginMutation()
  const [logoutRequest] = useLogoutMutation()
  const [updateProfileRequest] = useUpdateProfileMutation()

  const usersQuery = useGetUsersQuery(undefined, {
    skip: sessionUser?.role !== 'IT_ADMIN',
  })

  const user = useMemo(
    () => sessionUser ? toPublicUser(sessionUser) : null,
    [sessionUser],
  )

  const login = async (email: string, password: string) => {
    const response = await loginRequest({
      email: email.trim(),
      password,
    }).unwrap()

    dispatch(setAuthenticatedUser(response.user))

    return toPublicUser(response.user)
  }

  const updateProfile = async (fullName: string) => {
    const response = await updateProfileRequest({
      fullName,
    }).unwrap()

    dispatch(setAuthenticatedUser(response.user))

    return toPublicUser(response.user)
  }

  const endSessionLocally = () => {
    dispatch(clearAuth())
    dispatch(appApi.util.resetApiState())
  }

  const logout = async () => {
    await logoutRequest().unwrap()

    endSessionLocally()
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
