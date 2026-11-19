
import { useState } from 'react'
import { NavLink } from 'react-router'
import {
  BarChart3,
  ChevronLeft,
  ClipboardCheck,
  BriefcaseBusiness,
  Home,
  Monitor,
  ShieldCheck,
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
      { to: '/gate-passes', label: 'Gate passes', Icon: ShieldCheck },
      { to: '/reports', label: 'Reports', Icon: BarChart3 },
    ],
  },
  {
    label: 'MANAGEMENT',
    links: [
      { to: '/people', label: 'People and roles', Icon: Users },
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
        { to: '/employee/passes', label: 'Gate passes', Icon: ShieldCheck },
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
        { to: '/technician/passes', label: 'Gate passes', Icon: ShieldCheck },
      ],
    },
  ],
  'Department Head': [
    {
      label: 'DEPARTMENT WORKSPACE',
      links: [
        { to: '/department', label: 'Overview', Icon: BriefcaseBusiness, end: true },
        { to: '/department/employees', label: 'Employees', Icon: Users },
        { to: '/department/assets', label: 'Department assets', Icon: Monitor },
        { to: '/department/tickets', label: 'My tickets', Icon: ClipboardCheck },
        { to: '/department/tickets/new', label: 'Create ticket', Icon: Ticket },
        { to: '/department/passes', label: 'Gate passes', Icon: ShieldCheck },
      ],
    },
  ],
  Security: [{ label: 'SECURITY', links: [{ to: '/security', label: 'Gate station', Icon: ShieldCheck, end: true }] }],
}

interface NavigationProps {
  onNavigate?: () => void
  role: UserRole
  collapsed?: boolean
  onToggleCollapse?: () => void
}

function Navigation({
  onNavigate,
  role,
  collapsed = false,
  onToggleCollapse,
}: NavigationProps) {
  const unassignedTicketsQuery = useGetTicketsQuery(
    { assigneeId: 'unassigned', page: 1, pageSize: 1 },
    { skip: role === 'Employee' || role === 'Department Head' || role === 'Security' },
  )

  const unassignedTickets = unassignedTicketsQuery.data?.total ?? 0

  const adminGroups = ADMIN_NAV_GROUPS.map((group) => ({
    ...group,
    links: group.links.map((link) =>
      link.to === '/tickets'
        ? {
            ...link,
            ...(unassignedTicketsQuery.data
              ? { badge: unassignedTickets }
              : {}),
          }
        : link,
    ),
  }))

  const groups = ROLE_NAV_GROUPS[role] ?? adminGroups

  return (
    <nav
      aria-label="Main navigation"
      className={`flex-1 px-3 py-3 ${
        collapsed ? 'space-y-3' : 'space-y-6'
      }`}
    >
      {groups.map((group, groupIndex) => (
        <div key={group.label}>
          {!collapsed ? (
            <div className="mb-2 flex min-h-8 items-center justify-between px-3">
              <h2 className="text-[8px] font-bold tracking-[0.14em] text-slate-500">
                {group.label}
              </h2>

              {groupIndex === 0 && onToggleCollapse && (
                <button
                  type="button"
                  onClick={onToggleCollapse}
                  className="rounded-md p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
                  aria-label="Collapse sidebar"
                  aria-expanded={!collapsed}
                  title="Collapse sidebar"
                >
                  <ChevronLeft size={16} />
                </button>
              )}
            </div>
          ) : (
            groupIndex === 0 &&
            onToggleCollapse && (
              <div className="mb-2 flex justify-center">
                <button
                  type="button"
                  onClick={onToggleCollapse}
                  className="rounded-md p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
                  aria-label="Expand sidebar"
                  aria-expanded={!collapsed}
                  title="Expand sidebar"
                >
                  <ChevronLeft
                    size={16}
                    className="rotate-180"
                  />
                </button>
              </div>
            )
          )}

          <div className="space-y-1">
            {group.links.map(({ to, label, Icon, end, badge }) => {
              const link = (
                <NavLink
                  to={to}
                  end={end}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `group relative flex min-h-10 items-center rounded-lg text-xs font-medium transition-colors ${
                      collapsed
                        ? 'justify-center px-0'
                        : 'gap-3 px-3'
                    } ${
                      isActive
                        ? 'bg-white/12 text-white shadow-sm'
                        : 'text-slate-300 hover:bg-white/8 hover:text-white'
                    }`
                  }
                >
                  <span className="relative flex shrink-0 items-center justify-center">
                    <Icon size={17} strokeWidth={1.8} />

                    {collapsed && badge !== undefined && badge > 0 && (
                      <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#d2f54a] px-1 text-[9px] font-bold text-[#101c52]">
                        {badge > 99 ? '99+' : badge}
                      </span>
                    )}
                  </span>

                  {!collapsed && (
                    <>
                      <span className="min-w-0 flex-1 truncate">
                        {label}
                      </span>

                      {badge !== undefined && badge > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#d2f54a] px-1.5 text-[10px] font-semibold text-[#101c52]">
                          {badge > 99 ? '99+' : badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              )

              return collapsed ? (
                <Tooltip key={to}>
                  <TooltipTrigger>
                    {link}
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>
                    {label}
                  </TooltipContent>
                </Tooltip>
              ) : (
                <div key={to}>{link}</div>
              )
            })}
          </div>
        </div>
      ))}
    </nav>
  )
}

interface SidebarContentProps {
  onNavigate?: () => void
  role: UserRole
  collapsed?: boolean
  onToggleCollapse?: () => void
}

function SidebarContent({
  onNavigate,
  role,
  collapsed = false,
  onToggleCollapse,
}: SidebarContentProps) {
  const isEmployee = role === 'Employee'

  return (
    <div className="flex h-full flex-col bg-[#101c52]">
      <Navigation
        onNavigate={onNavigate}
        role={role}
        collapsed={collapsed}
        onToggleCollapse={onToggleCollapse}
      />

      {/* TODO(v2): Restore the SLA summary panel when the server exposes an SLA reporting contract. */}
      {isEmployee && !collapsed && (
        <div className="mx-3 mb-3 rounded-xl border border-white/10 bg-white/4 p-4">
          <p className="text-xs font-semibold text-white">
            Need help fast?
          </p>
          <p className="mt-2 text-xs text-slate-300">
            IT desk · ext. 2040
          </p>
          <p className="mt-1 text-[8px] text-slate-400">
            Mon–Fri, 07:30–18:00
          </p>
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

export default function Sidebar({
  mobileOpen = false,
  onClose,
  role = 'IT Admin',
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)

  const toggleCollapse = () => {
    setCollapsed((value) => !value)
  }

  return (
    <TooltipProvider>
      <aside
        className={`sticky top-16 hidden h-[calc(100vh-4rem)] shrink-0 flex-col overflow-y-auto bg-[#101c52] transition-[width] duration-200 md:flex ${
          collapsed ? 'w-16' : 'w-56'
        }`}
      >
        <SidebarContent
          role={role}
          collapsed={collapsed}
          onToggleCollapse={toggleCollapse}
        />
      </aside>

      <Drawer
        open={mobileOpen}
        onOpenChange={(open) => {
          if (!open) onClose?.()
        }}
        swipeDirection="left"
      >
        <DrawerContent className="w-72 max-w-[85vw] border-0 bg-[#101c52] text-white md:hidden">
          <DrawerTitle className="sr-only">
            Navigation
          </DrawerTitle>

          <DrawerClose
            className="absolute right-3 top-3 z-10 rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white"
            aria-label="Close navigation"
            title="Close navigation"
          >
            <X size={18} />
          </DrawerClose>

          <div className="overflow-y-auto pt-10">
            <SidebarContent
              onNavigate={onClose}
              role={role}
            />
          </div>
        </DrawerContent>
      </Drawer>
    </TooltipProvider>
  )
}
