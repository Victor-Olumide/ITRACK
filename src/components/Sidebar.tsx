import { useState } from 'react'
import { NavLink } from 'react-router'
import {
  BarChart3,
  ChevronLeft,
  ClipboardCheck,
  Home,
  Monitor,
  Tags,
  Ticket,
  Users,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { UserRole } from '../types/types'
import { useGetTicketsQuery } from '../lib/api/tickets/tickets-api'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTitle,
} from './ui/drawer'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip'

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
      { to: '/reports', label: 'Reports', Icon: BarChart3 },
    ],
  },
  // {
  //   label: 'OPERATIONS',
  //   links: [
  //   ],
  // },
  {
    label: 'MANAGEMENT',
    links: [
      { to: '/people', label: 'People and roles', Icon: Users },
      { to: '/categories', label: 'Categories', Icon: Tags },
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
      ],
    },
  ],
  Security: [],
}

interface NavigationProps {
  onNavigate?: () => void
  role: UserRole
  collapsed?: boolean
}

function Navigation({ onNavigate, role, collapsed = false }: NavigationProps) {
  const unassignedTicketsQuery = useGetTicketsQuery(
    { assigneeId: 'unassigned', page: 1, pageSize: 1 },
    { skip: role === 'Employee' || role === 'Security' },
  )
  const unassignedTickets = unassignedTicketsQuery.data?.total ?? 0
  const adminGroups = ADMIN_NAV_GROUPS.map((group) => ({
    ...group,
    links: group.links.map((link) => (
      link.to === '/tickets'
        ? { ...link, ...(unassignedTicketsQuery.data ? { badge: unassignedTickets } : {}) }
        : link
    )),
  }))
  const groups = ROLE_NAV_GROUPS[role] ?? adminGroups

  return (
    <nav
      aria-label="Main navigation"
      className={`flex-1 px-3 py-3 ${collapsed ? 'space-y-3' : 'space-y-6'}`}
    >
      {groups.map(({ label, links }, groupIndex) => (
        <section
          key={label}
          className={collapsed && groupIndex > 0 ? 'border-t border-white/10 pt-3' : ''}
        >
          {!collapsed && (
            <h2 className="mb-2 px-3 text-[8px] font-bold tracking-[0.14em] text-slate-500">
              {label}
            </h2>
          )}
          <div className="space-y-1">
            {links.map(({ to, label: linkLabel, Icon, badge, end }) => {
              const link = (
                <NavLink
                  to={to}
                  end={end}
                  onClick={onNavigate}
                  aria-label={collapsed ? linkLabel : undefined}
                  className={({ isActive }) =>
                    `relative flex w-full items-center rounded-xl py-2.5 text-[11px] font-medium transition-colors ${
                      collapsed ? 'justify-center px-0' : 'gap-3 px-3'
                    } ${
                      isActive
                        ? 'bg-[#3155ff] text-white shadow-sm shadow-blue-950/20'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  <Icon size={17} strokeWidth={1.8} />
                  {!collapsed && <span className="min-w-0 flex-1">{linkLabel}</span>}
                  {(badge ?? 0) > 0 && (
                    collapsed ? (
                      <span className="absolute right-2 top-2 size-2 rounded-full bg-[#d2f54a]" />
                    ) : (
                      <span className="rounded-full bg-[#d2f54a] px-1.5 py-0.5 text-[8px] font-bold leading-none text-[#16214b]">
                        {badge}
                      </span>
                    )
                  )}
                </NavLink>
              )

              if (!collapsed) return <div key={to}>{link}</div>

              return (
                <Tooltip key={to}>
                  <TooltipTrigger render={<div />}>{link}</TooltipTrigger>
                  <TooltipContent>{linkLabel}</TooltipContent>
                </Tooltip>
              )
            })}
          </div>
        </section>
      ))}
    </nav>
  )
}

interface SidebarContentProps {
  onNavigate?: () => void
  role: UserRole
  collapsed?: boolean
}

function SidebarContent({ onNavigate, role, collapsed = false }: SidebarContentProps) {
  const isEmployee = role === 'Employee'
  return (
    <div className="flex h-full flex-col bg-[#101c52]">
      <Navigation onNavigate={onNavigate} role={role} collapsed={collapsed} />
      {/* TODO(v2): Restore the SLA summary panel when the server exposes an SLA reporting contract. */}
      {isEmployee && !collapsed && (
        <div className="mx-3 mb-3 rounded-xl border border-white/10 bg-white/4 p-4">
          <p className="text-xs font-semibold text-white">Need help fast?</p>
          <p className="mt-2 text-xs text-slate-300">IT desk · ext. 2040</p>
          <p className="mt-1 text-[8px] text-slate-400">Mon–Fri, 07:30–18:00</p>
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
  const [collapsed, setCollapsed] = useState(false)

  return (
    <TooltipProvider>
      <aside
        className={`sticky top-16 hidden h-[calc(100vh-4rem)] shrink-0 flex-col overflow-y-auto bg-[#101c52] transition-[width] duration-200 md:flex ${
          collapsed ? 'w-16' : 'w-56'
        }`}
      >
        <div className={`flex px-3 pt-3 ${collapsed ? 'justify-center' : 'justify-end'}`}>
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            className="rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronLeft
              size={18}
              className={`transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
        <SidebarContent role={role} collapsed={collapsed} />
      </aside>

      <Drawer
        open={mobileOpen}
        onOpenChange={(open) => {
          if (!open) onClose?.()
        }}
        swipeDirection="left"
      >
        <DrawerContent className="w-72 max-w-[85vw] border-0 bg-[#101c52] text-white md:hidden">
          <DrawerTitle className="sr-only">Navigation</DrawerTitle>
          <DrawerClose
            className="absolute right-3 top-3 z-10 rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white"
            aria-label="Close navigation"
            title="Close navigation"
          >
            <X size={18} />
          </DrawerClose>
          <div className="overflow-y-auto pt-10">
            <SidebarContent onNavigate={onClose} role={role} />
          </div>
        </DrawerContent>
      </Drawer>
    </TooltipProvider>
  )
}