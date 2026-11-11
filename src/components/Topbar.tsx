// Full-width app bar with branding, quick actions, search, and the active user.

import { Bell, LogOut, Menu, Plus, Search } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import Logo from './Logo'
import { useAuth } from '../contexts/AuthContext'
import type { PublicUser, UserRole } from '../lib/types'

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
  const isSecurity = role === 'Security'
  const newTicketPath = role === 'Employee'
    ? '/employee/report'
    : role === 'Technician'
      ? '/technician/tickets'
      : '/tickets/new'
  const homePath = role === 'Employee'
    ? '/employee'
    : isSecurity
      ? '/security'
      : role === 'Technician'
        ? '/technician'
        : '/'
  const notificationsPath = role === 'IT Admin'
    ? '/notifications'
    : role === 'Technician'
      ? '/technician/notifications'
      : homePath
  const profilePath = role === 'IT Admin' ? '/settings' : homePath

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 bg-[#101c52] px-4 sm:px-5">
      <button
        type="button"
        onClick={onMenuClick}
        className="rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white md:hidden"
        aria-label="Open navigation"
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
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#d2f54a] text-[#16214b] transition hover:bg-[#e1ff72]"
        >
          <Plus size={20} />
        </Link>
      )}

      <label className="flex min-w-0 max-w-[760px] flex-1 items-center gap-2 rounded-full bg-[#1d2e70] px-3 py-2 text-slate-400">
        <Search size={16} className="shrink-0" />
        <input
          type="search"
          placeholder="Search tickets, devices, people"
          aria-label="Search tickets, devices, and people"
          className="min-w-0 flex-1 bg-transparent text-xs text-white placeholder:text-slate-400 focus:outline-none sm:text-sm"
        />
        <span className="hidden rounded border border-white/15 px-1.5 py-0.5 text-[10px] text-slate-400 sm:inline">
          /
        </span>
      </label>

      <div className="flex-1" />

      {(role === 'IT Admin' || role === 'Technician') && (
        <Link
          to={notificationsPath}
          aria-label="Notifications"
          className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1d2e70] text-slate-200 transition hover:bg-[#293d88]"
        >
          <Bell size={18} />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-orange-400" />
        </Link>
      )}

      <Link to={profilePath} className="flex shrink-0 items-center gap-2">
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
        onClick={() => {
          logout()
          navigate('/login', { replace: true })
        }}
        className="rounded-lg p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
        aria-label="Sign out"
        title="Sign out"
      >
        <LogOut size={17} />
      </button>
    </header>
  )
}
