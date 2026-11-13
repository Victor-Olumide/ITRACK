// Full-width app bar with branding, quick actions, search, and the active user.

import { LogOut, Menu, Plus } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { useState } from 'react'
import Logo from './Logo'
import { homePathForRole, useAuth } from '../contexts/AuthContext'
import type { PublicUser, UserRole } from '../types/types'

const initials = (name = '') =>
  name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()

interface TopbarProps {
  onMenuClick: () => void
  user: PublicUser | null
  role: UserRole
}

export default function Topbar({ onMenuClick, user, role }: TopbarProps) {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [logoutError, setLogoutError] = useState('')
  const isSecurity = role === 'Security'
  const newTicketPath = role === 'Employee'
    ? '/employee/report'
    : role === 'Technician'
      ? '/technician/tickets'
      : '/tickets/new'
  const homePath = homePathForRole(role)

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 bg-[#101c52] px-4 sm:px-5">
      <button
        type="button"
        onClick={onMenuClick}
        className="rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white md:hidden"
        aria-label="Toggle navigation"
        title="Toggle navigation"
      >
        <Menu size={20} />
      </button>

      <Link to={homePath} className="flex w-auto shrink-0 items-center gap-2 md:w-44">
        <Logo size={32} className="rounded-xl" />
        <span className="text-[17px] font-bold tracking-tight text-white">ITrack</span>
      </Link>

      {!isSecurity && (
        <Link
          to={newTicketPath}
          aria-label="Create a new ticket"
          title="Create a new ticket"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#d2f54a] text-[#16214b] transition hover:bg-[#e1ff72]"
        >
          <Plus size={20} />
        </Link>
      )}

      <div className="flex-1" />

      <Link to={homePath} className="flex shrink-0 items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d2f54a] text-xs font-bold text-[#16214b]">
          {initials(user?.name)}
        </div>
        <div className="hidden leading-tight sm:block">
          <p className="text-xs font-semibold text-white">{user?.name}</p>
          <p className="text-[10px] text-slate-400">{user?.role}</p>
        </div>
      </Link>
      <button
        type="button"
        onClick={async () => {
          setLogoutError('')
          try {
            await logout()
            navigate('/login', { replace: true })
          } catch {
            setLogoutError('Could not sign out. Check your connection and try again.')
          }
        }}
        className="rounded-lg p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
        aria-label="Sign out"
        title="Sign out"
      >
        <LogOut size={17} />
      </button>
      {logoutError && (
        <p role="alert" className="absolute right-4 top-full mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 shadow">
          {logoutError}
        </p>
      )}
    </header>
  )
}
