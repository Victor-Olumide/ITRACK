/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo } from 'react'
import type { ReactNode } from 'react'
// users mockData import removed; use API data only
import { useAppDispatch, useAppSelector } from '@/lib/stores/hooks'
import { appApi } from '@/lib/api/app-api'
import { useLoginMutation, useLogoutMutation } from '@/lib/api/auth/auth-api'
import { useGetUsersQuery } from '@/lib/api/users/users-api'
import { clearAuth, setAuthenticatedUser } from '@/lib/stores/auth-slice'
import { useAuthSession } from '@/hooks/auth/use-auth-session'
import type { AuthenticatedUser } from '@/lib/api/auth/types'
import type { PublicUser, UserRole } from '../types/types'

interface AuthContextValue {
  user: PublicUser | null
  users: PublicUser[]
  isLoading: boolean
  sessionExpired: boolean
  login: (email: string, password: string) => Promise<PublicUser>
  logout: () => Promise<void>
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
  const { isLoading } = useAuthSession()
  const dispatch = useAppDispatch()
  const { user: authenticatedUser, sessionExpired } = useAppSelector((state) => state.auth)
  const [loginRequest] = useLoginMutation()
  const [logoutRequest] = useLogoutMutation()
  const usersQuery = useGetUsersQuery(undefined, {
    skip: authenticatedUser?.role !== 'IT_ADMIN',
  })
  const user = useMemo(
    () => authenticatedUser ? toPublicUser(authenticatedUser) : null,
    [authenticatedUser],
  )

  const login = async (email: string, password: string) => {
    const response = await loginRequest({ email: email.trim(), password }).unwrap()
    dispatch(setAuthenticatedUser(response.user))
    return toPublicUser(response.user)
  }

  const logout = async () => {
    await logoutRequest().unwrap()
    dispatch(clearAuth())
    dispatch(appApi.util.resetApiState())
  }

  const value: AuthContextValue = {
    user,
    users: (usersQuery.data?.users ?? []).map(toPublicUser),
    isLoading,
    sessionExpired,
    usersError: usersQuery.isError,
    login,
    logout,
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider.')
  return context
}
