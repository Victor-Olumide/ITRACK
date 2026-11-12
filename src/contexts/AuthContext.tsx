/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo } from 'react'
import type { ReactNode } from 'react'
import { users } from '../lib/data/mockData'
import { useAppDispatch, useAppSelector } from '@/lib/stores/hooks'
import { appApi } from '@/lib/api/app-api'
import { useLoginMutation, useLogoutMutation } from '@/lib/api/auth/auth-api'
import { clearAuth, setAuthenticatedUser } from '@/lib/stores/auth-slice'
import { useAuthSession } from '@/hooks/auth/use-auth-session'
import type { AuthenticatedUser } from '@/lib/api/auth/types'
import type { PublicUser, UserRole } from '../lib/types/types'

interface CreateUserInput {
  name: string
  email: string
  department: string
  staffId: string
  password: string
  role: UserRole
}

interface AuthContextValue {
  user: PublicUser | null
  users: PublicUser[]
  isLoading: boolean
  login: (email: string, password: string) => Promise<PublicUser>
  logout: () => Promise<void>
  createUser: (input: CreateUserInput) => PublicUser
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
  if (role === 'Security') return '/security'
  return '/'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isLoading } = useAuthSession()
  const dispatch = useAppDispatch()
  const authenticatedUser = useAppSelector((state) => state.auth.user)
  const [loginRequest] = useLoginMutation()
  const [logoutRequest] = useLogoutMutation()
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

  const createUser = (): PublicUser => {
    throw new Error('Account creation is not supported by the server yet.')
  }

  const value: AuthContextValue = {
    user,
    users,
    isLoading,
    login,
    logout,
    createUser,
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider.')
  return context
}
