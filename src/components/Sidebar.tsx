// Role-aware navigation for the desktop shell and mobile drawer.

import { NavLink } from 'react-router'
import {
  BarChart3,
  ClipboardCheck,
  Home,
  MapPin,
  Monitor,
  Package,
  PanelsTopLeft,
  ScanLine,
  Settings,
  Ticket,
  Users,
  Activity,
  X,
} from 'lucide-react'
// gatePasses, metrics mockData import removed; use API data only
import type { LucideIcon } from 'lucide-react'
import type { UserRole } from '../lib/types/types'
import { useAppSelector } from '../lib/stores/hooks'
import { useGetTicketsQuery } from '../lib/api/tickets/tickets-api'

interface NavigationLink {
  to: string
  label: string
  Icon: LucideIcon
  end?: boolean
  badge?: number
}

interface NavigationGroup {
  label: string
  links: NavigationLink[]
}

const ADMIN_NAV_GROUPS: NavigationGroup[] = [
  {
    label: 'WORKSPACE',
    links: [
      { to: '/', label: 'Home', Icon: Home, end: true },
      { to: '/tickets', label: 'Tickets', Icon: Ticket },
      { to: '/devices', label: 'Devices', Icon: Monitor },
      { to: '/passes', label: 'Gate passes', Icon: ClipboardCheck },
      { to: '/reports', label: 'Reports', Icon: BarChart3 },
    ],
  },
  {
    label: 'OPERATIONS',
    links: [
      { to: '/stock', label: 'Stock', Icon: Package },
      { to: '/gate', label: 'Gate', Icon: ScanLine },
      { to: '/models', label: '3D models', Icon: PanelsTopLeft },
    ],
  },
  {
    label: 'MANAGEMENT',
    links: [
      { to: '/people', label: 'People and roles', Icon: Users },
      { to: '/locations', label: 'Locations', Icon: MapPin },
      { to: '/categories', label: 'Categories and SLA', Icon: Settings },
      { to: '/audit', label: 'Audit trail', Icon: Activity },
      { to: '/settings', label: 'Settings', Icon: Settings },
    ],
  },
]

const ROLE_NAV_GROUPS: Partial<Record<UserRole, NavigationGroup[]>> = {
  Employee: [
    {
      label: 'YOUR WORKSPACE',
      links: [
        { to: '/employee', label: 'Home', Icon: Home, end: true },
        { to: '/employee/report', label: 'Report a problem', Icon: Ticket },
        { to: '/employee/tickets', label: 'My tickets', Icon: ClipboardCheck },
        { to: '/employee/passes', label: 'Gate passes', Icon: ScanLine },
      ],
    },
  ],
  Technician: [
    {
      label: 'YOUR WORKSPACE',
      links: [
        { to: '/technician', label: 'Home', Icon: Home, end: true },
        { to: '/technician/tickets', label: 'My tickets', Icon: Ticket },
        { to: '/technician/devices', label: 'Devices', Icon: Monitor },
        { to: '/technician/passes', label: 'Gate passes', Icon: ClipboardCheck },
      ],
    },
  ],
  Security: [
    {
      label: 'GATE',
      links: [
        { to: '/security', label: 'Gate station', Icon: ScanLine, end: true },
      ],
    },
  ],
}

function Navigation({ onNavigate, role }: { onNavigate?: () => void; role: UserRole }) {
  const { submittedPasses, gatePassStatusUpdates } = useAppSelector((state) => state.demoData)
  const waitingPasses = [...gatePasses, ...submittedPasses]
    .filter((pass) => (gatePassStatusUpdates[pass.id] ?? pass.status) === 'Waiting').length
  const unassignedTicketsQuery = useGetTicketsQuery(
    { assigneeId: 'unassigned', page: 1, pageSize: 1 },
    { skip: role === 'Employee' || role === 'Security' },
  )
  const unassignedTickets = unassignedTicketsQuery.data?.total ?? 0
  const adminGroups = ADMIN_NAV_GROUPS.map((group) => ({
    ...group,
    links: group.links.map((link) => (
      link.to === '/tickets'
        ? { ...link, badge: unassignedTickets }
        : link.to === '/passes'
          ? { ...link, badge: waitingPasses }
          : link
    )),
  }))
  const groups = ROLE_NAV_GROUPS[role] ?? adminGroups

  return (
    <nav aria-label="Main navigation" className="flex-1 space-y-6 px-3 py-5">
      {groups.map(({ label, links }) => (
        <section key={label}>
          <h2 className="mb-2 px-3 text-[10px] font-bold tracking-[0.14em] text-slate-500">
            {label}
          </h2>
          <div className="space-y-1">
            {links.map(({ to, label: linkLabel, Icon, badge, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors ${
                    isActive
                      ? 'bg-[#3155ff] text-white shadow-sm shadow-blue-950/20'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <Icon size={17} strokeWidth={1.8} />
                <span className="min-w-0 flex-1">{linkLabel}</span>
                {(badge ?? 0) > 0 && (
                  <span className="rounded-full bg-[#d2f54a] px-1.5 py-0.5 text-[10px] font-bold leading-none text-[#16214b]">
                    {badge}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        </section>
      ))}
    </nav>
  )
}

function SidebarContent({ onNavigate, role }: { onNavigate?: () => void; role: UserRole }) {
  const isEmployee = role === 'Employee'
  const isSecurity = role === 'Security'
  return (
    <div className="flex h-full flex-col bg-[#101c52]">
      <Navigation onNavigate={onNavigate} role={role} />
      {!isEmployee && !isSecurity && (
        <div className="mx-3 mb-3 rounded-xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-xs text-slate-400">SLA met this month</p>
          <div className="mt-1 flex items-baseline gap-2">
            <p className="text-2xl font-bold text-white">{metrics.slaMetPercentage}%</p>
            <p className="text-[11px] text-slate-400">Target {metrics.slaTargetPercentage}%</p>
          </div>
          <div
            className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"
            role="progressbar"
            aria-label="SLA met this month"
            aria-valuenow={metrics.slaMetPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-[#d2f54a]"
              style={{ width: `${metrics.slaMetPercentage}%` }}
            />
          </div>
        </div>
      )}
      {isEmployee && (
        <div className="mx-3 mb-3 rounded-xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-xs font-semibold text-white">Need help fast?</p>
          <p className="mt-2 text-xs text-slate-300">IT desk · ext. 2040</p>
          <p className="mt-1 text-[10px] text-slate-400">Mon–Fri, 07:30–18:00</p>
        </div>
      )}
    </div>
  )
}

interface SidebarProps {
  mobileOpen?: boolean
  onClose?: () => void
  role?: UserRole
}

export default function Sidebar({ mobileOpen = false, onClose, role = 'IT Admin' }: SidebarProps) {
  return (
    <>
      <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-56 shrink-0 flex-col overflow-y-auto md:flex">
        <SidebarContent role={role} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 top-16 z-40 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/55"
            aria-label="Close navigation"
            onClick={onClose}
          />
          <aside className="relative z-10 h-full w-72 max-w-[85vw] overflow-y-auto shadow-2xl">
            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-3 z-10 rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white"
              aria-label="Close navigation"
            >
              <X size={18} />
            </button>
            <SidebarContent onNavigate={onClose} role={role} />
          </aside>
        </div>
      )}
    </>
  )
}
