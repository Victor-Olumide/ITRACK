/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { ROLES, users as seedUsers } from '../lib/mockData'
import type { Account, PublicUser, UserRole } from '../lib/types'

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
  login: (email: string, password: string) => boolean
  logout: () => void
  createUser: (input: CreateUserInput) => PublicUser
}

const AuthContext = createContext<AuthContextValue | null>(null)
const CURRENT_USER_KEY = 'itrack.auth.user'
const ACCOUNTS_KEY = 'itrack.auth.accounts'
export const DEMO_PASSWORD = 'ITrackDemo2026!'

function isAccount(value: unknown): value is Account {
  if (!value || typeof value !== 'object') return false
  const account = value as Record<string, unknown>
  return typeof account.id === 'string'
    && typeof account.name === 'string'
    && typeof account.email === 'string'
    && typeof account.role === 'string'
    && ROLES.some(({ value: role }) => role === account.role)
    && typeof account.department === 'string'
    && typeof account.staffId === 'string'
    && typeof account.password === 'string'
}

function readAccounts(): Account[] {
  const raw = window.sessionStorage.getItem(ACCOUNTS_KEY)
  if (raw === null) return seedUsers.map((user) => ({ ...user, password: DEMO_PASSWORD }))

  const accounts: unknown = JSON.parse(raw)
  if (!Array.isArray(accounts) || !accounts.every(isAccount)) {
    throw new Error('Invalid demo accounts in browser session storage.')
  }
  return accounts
}

function readCurrentUser(accounts: Account[]): PublicUser | null {
  const id = window.sessionStorage.getItem(CURRENT_USER_KEY)
  const account = accounts.find((item) => item.id === id)
  return account ? toPublicUser(account) : null
}

function toPublicUser(account: Account): PublicUser {
  return {
    id: account.id,
    name: account.name,
    email: account.email,
    role: account.role,
    department: account.department,
    staffId: account.staffId,
    ...(account.phone ? { phone: account.phone } : {}),
  }
}

export function homePathForRole(role: UserRole) {
  if (role === 'Technician') return '/technician'
  if (role === 'Employee') return '/employee'
  if (role === 'Security') return '/security'
  return '/'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState(readAccounts)
  const [user, setUser] = useState(() => readCurrentUser(accounts))
  const publicUsers = useMemo(() => accounts.map(toPublicUser), [accounts])

  const login = (email: string, password: string) => {
    const account = accounts.find((item) => item.email.toLowerCase() === email.trim().toLowerCase())
    if (!account || account.password !== password) return false
    window.sessionStorage.setItem(CURRENT_USER_KEY, account.id)
    setUser(toPublicUser(account))
    return true
  }

  const logout = () => {
    window.sessionStorage.removeItem(CURRENT_USER_KEY)
    setUser(null)
  }

  const createUser = (input: CreateUserInput) => {
    if (user?.role !== 'IT Admin') {
      throw new Error('Only IT Admins can create user accounts.')
    }

    const name = input.name.trim()
    const email = input.email.trim().toLowerCase()
    const department = input.department.trim()
    const password = input.password
    if (!name || !department || !email || password.length < 8) {
      throw new Error('Enter a name, department, valid email, and password with at least 8 characters.')
    }
    if (accounts.some((account) => account.email.toLowerCase() === email)) {
      throw new Error('An account with this email already exists.')
    }
    if (!ROLES.some(({ value }) => value === input.role)) {
      throw new Error('Select a valid account role.')
    }

    const id = `u-${crypto.randomUUID()}`
    const account = {
      id,
      name,
      email,
      role: input.role,
      department,
      staffId: input.staffId.trim() || `NEW-${id.slice(-8).toUpperCase()}`,
      password,
    }
    const nextAccounts = [...accounts, account]
    window.sessionStorage.setItem(ACCOUNTS_KEY, JSON.stringify(nextAccounts))
    setAccounts(nextAccounts)
    return toPublicUser(account)
  }

  const value: AuthContextValue = { user, users: publicUsers, login, logout, createUser }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider.')
  return context
}
