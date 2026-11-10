// src/components/Sidebar.jsx
// Dark, narrow left navigation. Icons come from lucide-react.
// Badge counts are derived from mockData — nothing is hard-coded inline.

import { useState } from 'react'
import { NavLink } from 'react-router'
import {
  Home, Ticket, Monitor, Package, ClipboardCheck,
  ScanLine, BarChart3, Settings, Menu, X,
} from 'lucide-react'
import { tickets, gatePasses, metrics } from '../lib/mockData'

const unassignedCount = tickets.filter((t) => !t.assigneeId && t.status !== 'Resolved').length
const passesWaiting = gatePasses.filter((g) => g.status === 'Waiting').length

const NAV = [
  { to: '/',         label: 'Home',     Icon: Home },
  { to: '/tickets',  label: 'Tickets',  Icon: Ticket,        badge: unassignedCount },
  { to: '/devices',  label: 'Devices',  Icon: Monitor },
  { to: '/stock',    label: 'Stock',    Icon: Package },
  { to: '/passes',   label: 'Passes',   Icon: ClipboardCheck, badge: passesWaiting },
  { to: '/gate',     label: 'Gate',     Icon: ScanLine },
  { to: '/reports',  label: 'Reports',  Icon: BarChart3 },
  { to: '/settings', label: 'Settings', Icon: Settings },
]

// ITrack logo mark (custom brand shape, kept as SVG — not a generic icon).
function LogoMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="11" r="9" stroke="white" strokeWidth="2" />
      <circle cx="11" cy="7" r="1.5" fill="#CCFF00" />
      <rect x="10" y="10" width="2" height="6" rx="1" fill="white" />
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
            {badge ? (
              <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-[#CCFF00] text-[#0a1628] leading-none">
                {badge}
              </span>
            ) : null}
          </NavLink>
        ))}
      </nav>

      {/* SLA meter */}
      <div className="m-3 p-4 rounded-xl bg-white/5 border border-white/10">
        <p className="text-xs text-slate-400 mb-1">SLA met this month</p>
        <p className="text-3xl font-extrabold text-white">{metrics.slaMetPercentage}%</p>
        <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full rounded-full bg-[#CCFF00]" style={{ width: `${metrics.slaMetPercentage}%` }} />
        </div>
        <p className="text-xs text-slate-500 mt-1">Target {metrics.slaTargetPercentage}%</p>
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
        onClick={() => setMobileOpen((p) => !p)}
        aria-label="Toggle sidebar"
      >
        {mobileOpen ? <X size={22} /> : <Menu size={22} />}
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
