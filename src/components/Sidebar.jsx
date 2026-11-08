import React, { useState } from 'react'
import { NavLink } from 'react-router'
import {
  MdHome,
  MdConfirmationNumber,
  MdMonitor,
  MdMeetingRoom,
  MdBarChart,
  MdPeople,
  MdLocationOn,
  MdMenu,
  MdClose,
} from 'react-icons/md'

const NAV = [
  { to: '/',        label: 'Home',        Icon: MdHome,               badge: null },
  { to: '/issues',  label: 'Tickets',     Icon: MdConfirmationNumber, badge: 6    },
  { to: '/devices', label: 'Devices',     Icon: MdMonitor,            badge: null },
  { to: '/gate',    label: 'Gate passes', Icon: MdMeetingRoom,        badge: 2    },
  { to: '/reports', label: 'Reports',     Icon: MdBarChart,           badge: null },
]

const MGMT = [
  { to: '/team',     label: 'People and roles', Icon: MdPeople     },
  { to: '/settings', label: 'Locations',        Icon: MdLocationOn },
]

// ITrack logo mark (kept as SVG — it's a custom brand shape, not a generic icon)
function LogoMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="11" r="9" stroke="white" strokeWidth="2" />
      <circle cx="11" cy="7"  r="1.5" fill="#CCFF00" />
      <rect   x="10" y="10" width="2" height="6" rx="1" fill="white" />
    </svg>
  )
}

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full ${
      isActive
        ? 'bg-blue-600 text-white'
        : 'text-slate-300 hover:bg-white/10 hover:text-white'
    }`

  const content = (
    <div className="flex flex-col h-full w-full bg-[#0B184C]">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5">
        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
          <LogoMark />
        </div>
        <span className="text-white font-bold text-lg tracking-wide">ITrack</span>
      </div>

      {/* Primary nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        {NAV.map(({ to, label, Icon, badge }) => (
          <NavLink key={to} to={to} end={to === '/'} className={linkClass}>
            <Icon size={18} />
            <span className="flex-1">{label}</span>
            {badge && (
              <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-[#CCFF00] text-[#0a1628] leading-none">
                {badge}
              </span>
            )}
          </NavLink>
        ))}

        <p className="pt-5 pb-1 px-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
          Management
        </p>

        {MGMT.map(({ to, label, Icon }) => (
          <NavLink key={to} to={to} className={linkClass}>
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* SLA meter */}
      <div className="m-3 p-4 rounded-xl bg-white/5 border border-white/10">
        <p className="text-xs text-slate-400 mb-1">SLA met this month</p>
        <p className="text-3xl font-extrabold text-white">87%</p>
        <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full rounded-full bg-[#CCFF00]" style={{ width: '87%' }} />
        </div>
        <p className="text-xs text-slate-500 mt-1">Target 90%</p>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 bg-[#0B184C] min-h-screen sticky top-0 h-screen overflow-y-auto">
        {content}
      </aside>

      {/* Mobile toggle button */}
      <button
        className="md:hidden fixed bottom-4 left-4 z-50 w-12 h-12 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center"
        onClick={() => setMobileOpen(p => !p)}
        aria-label="Toggle sidebar"
      >
        {mobileOpen ? <MdClose size={22} /> : <MdMenu size={22} />}
      </button>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div className="md:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setMobileOpen(false)} />
          <aside className="md:hidden fixed top-0 left-0 h-full w-64 bg-[#0B184C] z-50 overflow-y-auto">
            {content}
          </aside>
        </>
      )}
    </>
  )
}
