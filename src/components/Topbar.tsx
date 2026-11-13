// Full-width app bar with branding, quick actions, search, and the active user.

import { ChevronDown, LogOut, Menu, Plus, Ticket } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { useEffect, useRef, useState } from 'react'
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
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement>(null)
  const profileButtonRef = useRef<HTMLButtonElement>(null)
  const isSecurity = role === 'Security'
  const newTicketPath = role === 'Employee'
    ? '/employee/report'
    : role === 'Technician'
      ? '/technician/tickets'
      : '/tickets/new'
  const ticketsPath = role === 'Employee'
    ? '/employee/tickets'
    : role === 'Technician'
      ? '/technician/tickets'
      : '/tickets'
  const ticketsLabel = role === 'IT Admin' ? 'Tickets' : 'My tickets'
  const homePath = homePathForRole(role)

  useEffect(() => {
    if (!profileMenuOpen) return

    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !profileMenuRef.current?.contains(event.target)) {
        setProfileMenuOpen(false)
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setProfileMenuOpen(false)
        profileButtonRef.current?.focus()
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [profileMenuOpen])

  const handleLogout = async () => {
    setLogoutError('')
    try {
      await logout()
      navigate('/login', { replace: true })
    } catch {
      setLogoutError('Could not sign out. Check your connection and try again.')
    }
  }

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
        <span className="text-[15px] font-bold tracking-tight text-white">ITrack</span>
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

      <div className="relative shrink-0" ref={profileMenuRef}>
        <button
          ref={profileButtonRef}
          type="button"
          onClick={() => setProfileMenuOpen((open) => !open)}
          className="flex items-center gap-2 rounded-xl p-1.5 text-left transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d2f54a]"
          aria-label={`Account menu for ${user?.name ?? 'user'}`}
          aria-expanded={profileMenuOpen}
          aria-controls="profile-menu"
          title="Account menu"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d2f54a] text-xs font-bold text-[#16214b]">
            {initials(user?.name)}
          </div>
          <div className="hidden leading-tight sm:block">
            <p className="text-xs font-semibold text-white">{user?.name}</p>
            <p className="text-[8px] text-slate-400">{user?.role}</p>
          </div>
          <ChevronDown size={16} className="text-slate-300" aria-hidden="true" />
        </button>
        {profileMenuOpen && (
          <div
            id="profile-menu"
            className="absolute right-0 top-full z-50 mt-0.5 w-40 overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-xl"
          >
           
            <div className="p-0.5">
              <Link
                to={ticketsPath}
                onClick={() => setProfileMenuOpen(false)}
                className="flex items-center gap-1 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-[#3155ff] focus-visible:outline-2 focus-visible:outline-[#3155ff]"
              >
                <Ticket size={17} aria-hidden="true" />
                {ticketsLabel}
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-[#3155ff]"
              >
                <LogOut size={17} aria-hidden="true" />
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
      {logoutError && (
        <p role="alert" className="absolute right-4 top-full mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 shadow">
          {logoutError}
        </p>
      )}
    </header>
  )
}
