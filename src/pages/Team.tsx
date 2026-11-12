// People directory — manage internal users and their ITrack roles.

import { useMemo, useState } from 'react'
import { Search, UserPlus, Users } from 'lucide-react'
import { ROLES } from '../lib/data/mockData'
import { useAuth } from '../contexts/AuthContext'
import { useGetDepartmentsQuery } from '@/lib/api/auth/auth-api'
import { useCreateUserMutation, useGetUsersQuery } from '@/lib/api/users/users-api'
import type { UserRole as ApiUserRole } from '@/lib/api/auth/types'
import type { UserRole as DisplayUserRole } from '../lib/types/types'

const ROLE_TONES = {
  'IT Admin': 'bg-violet-50 text-violet-700',
  Technician: 'bg-blue-50 text-blue-700',
  Employee: 'bg-slate-100 text-slate-600',
  Security: 'bg-amber-50 text-amber-700',
}

export default function Team({ showCreateForm = false }) {
  const { users: demoUsers } = useAuth()
  const { data: usersResponse, isLoading, error: usersError } = useGetUsersQuery()
  const { data: departmentsResponse } = useGetDepartmentsQuery()
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation()
  const [query, setQuery] = useState('')
  const [role, setRole] = useState('All roles')
  const [showInvite, setShowInvite] = useState(showCreateForm)
  const [inviteName, setInviteName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteDepartment, setInviteDepartment] = useState('')
  const [inviteStaffId, setInviteStaffId] = useState('')
  const [invitePassword, setInvitePassword] = useState('')
  const [inviteRole, setInviteRole] = useState(ROLES.find(({ value }) => value === 'Employee')?.value ?? ROLES[0].value)
  const [formError, setFormError] = useState('')
  const [createdMessage, setCreatedMessage] = useState('')
  const apiRoleLabels: Record<ApiUserRole, DisplayUserRole> = { EMPLOYEE: 'Employee', TECHNICIAN: 'Technician', IT_ADMIN: 'IT Admin', SECURITY: 'Security' }
  const apiRoleValues: Record<DisplayUserRole, ApiUserRole> = { Employee: 'EMPLOYEE', Technician: 'TECHNICIAN', 'IT Admin': 'IT_ADMIN', Security: 'SECURITY' }
  const allUsers = usersResponse?.users.map((user) => ({
    id: user.id,
    name: user.fullName,
    email: user.email,
    staffId: user.staffId,
    department: user.department.name,
    role: apiRoleLabels[user.role],
    isActive: user.isActive,
  })) ?? demoUsers
  const filteredUsers = useMemo(() => allUsers.filter((user) => {
    const matchesQuery = `${user.name} ${user.department} ${user.staffId}`
      .toLowerCase().includes(query.trim().toLowerCase())
    return matchesQuery && (role === 'All roles' || user.role === role)
  }), [allUsers, query, role])
  const roleOptions = ['All roles', ...new Set(allUsers.map((user) => user.role))]

  return (
    <div className="min-h-full px-4 py-5 sm:px-6 sm:py-6 lg:px-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Users size={19} className="text-[#3155ff]" />
            <h1 className="text-2xl font-bold tracking-tight text-[#111a3b]">People and roles</h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {allUsers.length} people · Manage access for IT, employees, and security.
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

      <p role="status" className="mt-4 rounded-xl border border-amber-100 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
        The people directory below is demo data. The server does not yet provide an endpoint to load or manage users.
      </p>

      {showInvite && (
        <form
          className="mt-4 grid grid-cols-1 gap-3 rounded-2xl border border-[#e9edf6] bg-white p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_180px_auto]"
          onSubmit={async (event) => {
            event.preventDefault()
            setFormError('')
            setCreatedMessage('')
            try {
              const created = await createUser({
                fullName: inviteName,
                email: inviteEmail,
                departmentId: inviteDepartment,
                staffId: inviteStaffId,
                password: invitePassword,
                role: apiRoleValues[inviteRole],
              }).unwrap()
              setCreatedMessage(`Account created for ${created.user.fullName}. They can now sign in with their email and password.`)
              setInviteName('')
              setInviteEmail('')
              setInviteDepartment('')
              setInviteStaffId('')
              setInvitePassword('')
              setShowInvite(false)
            } catch (error) {
              setFormError(error instanceof Error ? error.message : 'Unable to create the account.')
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
          <table className="w-full min-w-[640px] text-left">
            <thead className="bg-[#f8f9fc] text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3">Person</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Staff ID</th>
                <th className="px-5 py-3">Department</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Access</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf0f7]">
              {isLoading && <tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-500">Loading people…</td></tr>}
              {usersError && <tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-red-700">Unable to load people from the server.</td></tr>}
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
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${ROLE_TONES[user.role] ?? ROLE_TONES.Employee}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs font-medium text-emerald-700">
                    {'isActive' in user && user.isActive === false ? 'Inactive' : 'Active'}
                  </td>
                </tr>
              ))}
              {!isLoading && !usersError && filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-500">
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
    </div>
  )
}
