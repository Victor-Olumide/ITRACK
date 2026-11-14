// People directory — manage internal users and their ITrack roles.

import { useState } from 'react'
import type { SubmitEvent } from 'react'
import { Pencil, Search, UserPlus, Users } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAuth } from '@/contexts/AuthContext'
const ROLES = [
  { label: 'IT Admin', value: 'IT Admin' },
  { label: 'Technician', value: 'Technician' },
  { label: 'Employee', value: 'Employee' },
] as const
import { useGetDepartmentsQuery } from '@/lib/api/auth/auth-api'
import {
  useCreateUserMutation,
  useGetUsersQuery,
  useUpdateUserMutation,
} from '@/lib/api/users/users-api'
import { toCreateUserRequest } from '@/lib/api/users/create-user-form'
import type { UserRole as ApiUserRole } from '@/lib/api/auth/types'
import type { UserRole as DisplayUserRole } from '../types/types'

function getCreateUserErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'data' in error) {
    const data = error.data
    if (typeof data === 'object' && data !== null) {
      if (
        'error' in data &&
        typeof data.error === 'object' &&
        data.error !== null &&
        'message' in data.error &&
        typeof data.error.message === 'string'
      ) {
        return data.error.message
      }
      if ('message' in data && typeof data.message === 'string') {
        return data.message
      }
    }
  }
  if (error instanceof Error) return error.message
  return 'Unable to create the account. Please try again.'
}

const ROLE_TONES = {
  'IT Admin': 'bg-violet-50 text-violet-700',
  Technician: 'bg-blue-50 text-blue-700',
  Employee: 'bg-slate-100 text-slate-600',
  Security: 'bg-amber-50 text-amber-700',
}

interface DirectoryUser {
  id: string
  name: string
  email: string
  staffId: string
  department: string
  role: DisplayUserRole
  isActive: boolean
}

export default function Team({ showCreateForm = false }) {
  const { user: currentUser } = useAuth()
  const { data: usersResponse, isLoading, error: usersError } = useGetUsersQuery()
  const { data: departmentsResponse } = useGetDepartmentsQuery()
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation()
  const [updateUser, { isLoading: isUpdatingUser }] = useUpdateUserMutation()
  const [query, setQuery] = useState('')
  const [role, setRole] = useState('All roles')
  const [showInvite, setShowInvite] = useState(showCreateForm)
  const [inviteName, setInviteName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteDepartment, setInviteDepartment] = useState('')
  const [inviteStaffId, setInviteStaffId] = useState('')
  const [invitePassword, setInvitePassword] = useState('')
  const [inviteRole, setInviteRole] = useState<DisplayUserRole>('Employee')
  const [formError, setFormError] = useState('')
  const [createdMessage, setCreatedMessage] = useState('')
  const [editingUser, setEditingUser] = useState<DirectoryUser | null>(null)
  const [editName, setEditName] = useState('')
  const [editRole, setEditRole] = useState<DisplayUserRole>('Employee')
  const [editError, setEditError] = useState('')
  const apiRoleLabels: Record<ApiUserRole, DisplayUserRole> = { EMPLOYEE: 'Employee', TECHNICIAN: 'Technician', IT_ADMIN: 'IT Admin', SECURITY: 'Security' }
  const apiRoleValues: Record<DisplayUserRole, ApiUserRole> = { Employee: 'EMPLOYEE', Technician: 'TECHNICIAN', 'IT Admin': 'IT_ADMIN', Security: 'SECURITY' }
  const allUsers = usersResponse?.users.filter((user) => user.role !== 'SECURITY').map((user) => ({
    id: user.id,
    name: user.fullName,
    email: user.email,
    staffId: user.staffId,
    department: user.department.name,
    role: apiRoleLabels[user.role],
    isActive: user.isActive,
  })) ?? []
  const filteredUsers = allUsers.filter((user) => {
    const matchesQuery = `${user.name} ${user.department} ${user.staffId}`
      .toLowerCase().includes(query.trim().toLowerCase())
    return matchesQuery && (role === 'All roles' || user.role === role)
  })
  const roleOptions = ['All roles', ...new Set(allUsers.map((user) => user.role))]

  const openEditProfile = (person: DirectoryUser) => {
    setEditingUser(person)
    setEditName(person.name)
    setEditRole(person.role)
    setEditError('')
  }

  const handleUpdateProfile = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editingUser) return

    setEditError('')
    try {
      const body = {
        fullName: editName.trim(),
        ...(editingUser.id !== currentUser?.id && editRole !== editingUser.role
          ? { role: apiRoleValues[editRole] }
          : {}),
      }
      const response = await updateUser({ id: editingUser.id, body }).unwrap()
      setCreatedMessage(`Profile updated for ${response.user.fullName}.`)
      setEditingUser(null)
    } catch (error) {
      setEditError(getCreateUserErrorMessage(error))
    }
  }

  return (
    <div className="min-h-full px-4 py-5 sm:px-6 sm:py-6 lg:px-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Users size={19} className="text-[#3155ff]" />
            <h1 className="text-2xl font-bold tracking-tight text-[#111a3b]">People and roles</h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {allUsers.length} people · Manage access for IT staff and employees.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowInvite((open) => !open)}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#3155ff] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-700"
        >
          <UserPlus size={15} />
          {showInvite ? 'Cancel' : 'Invite person'}
        </button>
      </div>

      {showInvite && (
        <form
          className="mt-4 grid grid-cols-1 gap-3 rounded-2xl border border-[#e9edf6] bg-white p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_180px_auto]"
          onSubmit={async (event) => {
            event.preventDefault()
            setFormError('')
            setCreatedMessage('')
            try {
              const created = await createUser(toCreateUserRequest({
                fullName: inviteName,
                email: inviteEmail,
                departmentId: inviteDepartment,
                staffId: inviteStaffId,
                password: invitePassword,
                role: apiRoleValues[inviteRole],
              })).unwrap()
              setCreatedMessage(`Account created for ${created.user.fullName}. They can now sign in with their email and password.`)
              setInviteName('')
              setInviteEmail('')
              setInviteDepartment('')
              setInviteStaffId('')
              setInvitePassword('')
              setShowInvite(false)
            } catch (error) {
              setFormError(getCreateUserErrorMessage(error))
            }
          }}
        >
          <label className="text-xs font-semibold text-slate-600">
            Full name
            <input
              required
              value={inviteName}
              onChange={(event) => setInviteName(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-[#e3e8f2] px-3 py-2.5 text-sm font-normal text-slate-800 outline-none focus:border-blue-400"
            />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Work email
            <input
              required
              type="email"
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-[#e3e8f2] px-3 py-2.5 text-sm font-normal text-slate-800 outline-none focus:border-blue-400"
            />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Department
            <select
              required
              value={inviteDepartment}
              onChange={(event) => setInviteDepartment(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-[#e3e8f2] px-3 py-2.5 text-sm font-normal text-slate-800 outline-none focus:border-blue-400"
            >
              <option value="">Select a department</option>
              {departmentsResponse?.departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Staff ID (optional)
            <input
              value={inviteStaffId}
              onChange={(event) => setInviteStaffId(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-[#e3e8f2] px-3 py-2.5 text-sm font-normal text-slate-800 outline-none focus:border-blue-400"
            />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Role
            <select
              value={inviteRole}
              onChange={(event) => {
                const nextRole = ROLES.find(({ value }) => value === event.target.value)?.value
                if (nextRole) setInviteRole(nextRole)
              }}
              className="mt-1.5 w-full rounded-xl border border-[#e3e8f2] bg-white px-3 py-2.5 text-sm font-normal text-slate-800"
            >
              {ROLES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Temporary password
            <input
              required
              minLength={8}
              type="password"
              autoComplete="new-password"
              value={invitePassword}
              onChange={(event) => setInvitePassword(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-[#e3e8f2] px-3 py-2.5 text-sm font-normal text-slate-800 outline-none focus:border-blue-400"
            />
          </label>
          <button type="submit" disabled={isCreating} className="self-end rounded-xl bg-[#3155ff] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
            Create account
          </button>
          {formError && <p role="alert" className="text-xs text-red-700 sm:col-span-2">{formError}</p>}
        </form>
      )}
      {createdMessage && <p role="status" className="mt-3 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800">{createdMessage}</p>}

      <section className="mt-5 overflow-hidden rounded-2xl border border-[#e9edf6] bg-white">
        <div className="flex flex-col gap-3 border-b border-[#edf0f7] p-4 sm:flex-row sm:items-center">
          <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-[#e3e8f2] px-3 py-2.5 text-slate-400">
            <Search size={16} />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, department, or staff ID"
              aria-label="Search people"
              className="min-w-0 flex-1 text-sm text-slate-800 outline-none placeholder:text-slate-400"
            />
          </label>
          <select
            value={role}
            onChange={(event) => setRole(event.target.value)}
            aria-label="Filter by role"
            className="rounded-xl border border-[#e3e8f2] bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400"
          >
            {roleOptions.map((option) => <option key={option}>{option}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead className="bg-[#f8f9fc] text-[8px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3">Person</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Staff ID</th>
                <th className="px-5 py-3">Department</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Access</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf0f7]">
              {isLoading && <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-500">Loading people…</td></tr>}
              {usersError && <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-red-700">Unable to load people from the server.</td></tr>}
              {!isLoading && !usersError && filteredUsers.map((user) => (
                <tr key={user.id} className="transition hover:bg-[#f8faff]">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#edf1ff] text-xs font-bold text-[#3155ff]">
                        {user.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-[#202844]">{user.name}</p>
                        <p className="text-xs text-slate-500">{user.department}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-600">{user.email}</td>
                  <td className="px-5 py-3.5 font-mono text-xs text-slate-600">{user.staffId}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-600">{user.department}</td>
                  <td className="px-5 py-3.5">
                    <span className={`rounded-full px-2.5 py-1 text-[9px] font-semibold ${ROLE_TONES[user.role] ?? ROLE_TONES.Employee}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs font-medium text-emerald-700">
                    {'isActive' in user && user.isActive === false ? 'Inactive' : 'Active'}
                  </td>
                  <td className="px-5 py-3.5">
                    {user.id === currentUser?.id ? (
                      <span className="text-xs text-slate-400">You</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openEditProfile(user)}
                        aria-label={`Update profile for ${user.name}`}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#3155ff] transition hover:bg-blue-50"
                      >
                        <Pencil size={14} aria-hidden="true" />
                        Update profile
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!isLoading && !usersError && filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-500">
                    No people match those filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-[#edf0f7] px-5 py-3 text-xs text-slate-500">
          Showing {filteredUsers.length} of {allUsers.length} people
        </div>
      </section>
      <Dialog
        open={editingUser !== null}
        onOpenChange={(open) => {
          if (!open && !isUpdatingUser) setEditingUser(null)
        }}
      >
        <DialogContent showCloseButton={!isUpdatingUser}>
          <DialogHeader className="pr-8">
            <DialogTitle>Update profile</DialogTitle>
            <DialogDescription>Update this person’s name and ITrack role.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <label className="block space-y-1.5 text-sm font-medium text-slate-700">
              Full name
              <input
                required
                maxLength={120}
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-normal text-slate-900 outline-none focus:border-[#3155ff] focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <label className="block space-y-1.5 text-sm font-medium text-slate-700">
              Role
              <select
                value={editRole}
                onChange={(event) => {
                  const nextRole = ROLES.find(({ value }) => value === event.target.value)?.value
                  if (nextRole) setEditRole(nextRole)
                }}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal text-slate-900 outline-none focus:border-[#3155ff] focus:ring-2 focus:ring-blue-100"
              >
                {ROLES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            {editError && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{editError}</p>}
            <DialogFooter>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                disabled={isUpdatingUser}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdatingUser || editName.trim().length === 0}
                className="rounded-lg bg-[#3155ff] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
              >
                {isUpdatingUser ? 'Saving…' : 'Save profile'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
