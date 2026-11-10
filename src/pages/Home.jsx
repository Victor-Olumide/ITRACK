// Admin dashboard — KPIs, action queue, device register, and team workload.

import { Link } from 'react-router'
import {
  AlertCircle,
  ArrowUpRight,
  CircleHelp,
  Clock3,
  Plus,
  Wrench,
} from 'lucide-react'
import {
  deviceRegisterSegments,
  metrics,
  needsAction,
  technicianWorkload,
  ticketsByCategory,
  todayQueue,
} from '../lib/mockData'
import { useAuth } from '../contexts/AuthContext'

const ACTION_ICONS = [AlertCircle, CircleHelp, Clock3, Wrench]
const ACTION_ROUTES = {
  'Review passes': '/passes',
  'View devices': '/devices',
  'View repairs': '/devices?status=In%20repair',
}
const MAX_CATEGORY_VALUE = Math.max(1, ...ticketsByCategory.map(({ value }) => value))
const CHART_TICKS = [3, 2, 1, 0].map((step) => Math.ceil(MAX_CATEGORY_VALUE / 3) * step)

function Card({ className = '', children }) {
  return (
    <section
      className={`rounded-[18px] border border-[#e9edf6] bg-white shadow-[0_1px_3px_rgba(16,28,82,0.04)] ${className}`}
    >
      {children}
    </section>
  )
}

function StatCard({ label, value, note, noteColor = 'text-slate-500' }) {
  return (
    <Card className="relative flex min-h-28 flex-col justify-center gap-1 px-4 py-4 sm:px-5">
      <ArrowUpRight
        aria-hidden="true"
        size={15}
        className="absolute right-4 top-4 text-slate-400"
      />
      <p className="pr-5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p className="text-[30px] font-bold leading-tight tracking-tight text-[#111a3b]">
        {value}
      </p>
      <p className={`flex items-center gap-1.5 text-[11px] font-medium ${noteColor}`}>
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
        {note}
      </p>
    </Card>
  )
}

function SlaCard() {
  return (
    <Card className="!border-[#3155ff] !bg-[#3155ff] flex min-h-28 flex-col justify-between px-4 py-4 text-white sm:px-5">
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-full bg-[#d2f54a] px-2 py-1 text-[10px] font-bold leading-none text-[#16214b]">
          SLA goal
        </span>
        <span className="text-[10px] font-medium text-blue-100">
          Target {metrics.slaTargetPercentage}%
        </span>
      </div>
      <div className="flex items-baseline gap-2">
        <p className="text-[30px] font-bold leading-tight tracking-tight">
          {metrics.slaMetPercentage}%
        </p>
        <p className="text-[10px] text-blue-100">met in 30 days</p>
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-white/25"
        role="progressbar"
        aria-label="SLA target met in the last 30 days"
        aria-valuenow={metrics.slaMetPercentage}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-[#d2f54a]"
          style={{ width: `${metrics.slaMetPercentage}%` }}
        />
      </div>
    </Card>
  )
}

function CategoryChart() {
  return (
    <div
      role="img"
      aria-label={`Tickets by category: ${ticketsByCategory.map(({ label, value }) => `${label}, ${value}`).join('; ')}`}
      className="grid grid-cols-[24px_minmax(0,1fr)] gap-2"
    >
      <div className="flex h-44 flex-col justify-between pb-6 text-right text-[10px] text-slate-400">
        {CHART_TICKS.map((tick) => <span key={tick}>{tick}</span>)}
      </div>
      <div className="min-w-0">
        <div className="relative h-44">
          {CHART_TICKS.map((tick, index) => (
            <div
              key={tick}
              className="absolute inset-x-0 border-t border-[#edf0f7]"
              style={{ top: `${index * 33.333}%` }}
            />
          ))}
          <div className="absolute inset-0 flex items-end justify-between gap-2 px-1">
            {ticketsByCategory.map(({ label, value, color }) => (
              <div
                key={label}
                className="relative z-10 flex h-full min-w-0 flex-1 flex-col items-center justify-end"
              >
                <span className="mb-1 text-[10px] font-bold text-[#27304d]">{value}</span>
                <div
                  className="w-full max-w-10 rounded-t-lg transition-[height]"
                  style={{
                    height: `${Math.max(14, (value / MAX_CATEGORY_VALUE) * 126)}px`,
                    backgroundColor: color,
                  }}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="mt-2 grid grid-cols-6 gap-1 text-center text-[9px] leading-tight text-slate-500 sm:text-[10px]">
          {ticketsByCategory.map(({ label }) => <span key={label}>{label}</span>)}
        </div>
      </div>
    </div>
  )
}

function NeedsActionCard() {
  return (
    <Card className="p-4 sm:p-5">
      <div className="mb-2 flex items-center gap-2">
        <h2 className="text-sm font-bold text-[#18203e]">Needs action</h2>
        <span className="rounded-full bg-[#f0f2f8] px-2 py-0.5 text-[10px] font-bold text-slate-600">
          {needsAction.length}
        </span>
      </div>
      <div className="divide-y divide-[#edf0f7]">
        {needsAction.map((action, index) => {
          const Icon = ACTION_ICONS[index]
          return (
            <div key={action.title} className="flex gap-2.5 py-3 last:pb-0">
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${action.color}`}>
                <Icon size={14} />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-bold leading-4 text-[#202844]">{action.title}</p>
                <p className="mt-0.5 text-[10px] leading-4 text-slate-500">{action.desc}</p>
                <Link
                  to={action.href ?? ACTION_ROUTES[action.link] ?? '/'}
                  className="mt-0.5 inline-flex items-center gap-0.5 text-[10px] font-semibold text-[#3155ff] hover:underline"
                >
                  {action.link}
                  <ArrowUpRight size={11} />
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function DeviceRegisterAndQueue() {
  const segments = [
    { color: 'bg-[#3155ff]', label: `${metrics.devicesAssigned} Assigned` },
    { color: 'bg-[#b2d833]', label: `${metrics.devicesInStore} In store` },
    { color: 'bg-violet-500', label: `${metrics.devicesOffSite} Off-site` },
    { color: 'bg-orange-500', label: `${metrics.devicesInRepair} In repair` },
    { color: 'bg-slate-400', label: `${metrics.devicesRetired} Retired` },
  ]

  return (
    <Card className="flex flex-col gap-4 p-4 sm:p-5">
      <section aria-labelledby="device-register-title">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h2 id="device-register-title" className="text-sm font-bold text-[#18203e]">
            Device register
          </h2>
          <span className="text-[10px] text-slate-500">{metrics.devicesTotal} devices</span>
        </div>
        <div
          className="flex h-2.5 gap-1 overflow-hidden rounded-full"
          role="img"
          aria-label={segments.map(({ label }) => label).join(', ')}
        >
          {deviceRegisterSegments.map((segment, index) => (
            <span
              key={segments[index].label}
              className={`${segment.color} h-full`}
              style={{ width: `${segment.pct}%` }}
            />
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
          {segments.map(({ color, label }) => (
            <span key={label} className="flex items-center gap-1 text-[10px] text-slate-600">
              <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
              <span className="font-semibold text-[#27304d]">{label.split(' ')[0]}</span>
              <span>{label.substring(label.indexOf(' ') + 1)}</span>
            </span>
          ))}
        </div>
      </section>

      <section aria-labelledby="today-queue-title" className="border-t border-[#edf0f7] pt-3">
        <div className="mb-1 flex items-center justify-between">
          <h2 id="today-queue-title" className="text-sm font-bold text-[#18203e]">
            Open queue
            <span className="ml-1.5 rounded-full bg-[#f0f2f8] px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
              {todayQueue.length}
            </span>
          </h2>
          <Link to="/tickets" className="text-[10px] font-semibold text-[#3155ff] hover:underline">
            See all
          </Link>
        </div>
        <div className="divide-y divide-[#edf0f7]">
          {todayQueue.map((ticket) => (
            <Link
              key={ticket.id}
              to={`/tickets?ticket=${ticket.id}`}
              className="flex min-w-0 items-center gap-2.5 py-2.5"
            >
              <span className="h-4 w-4 shrink-0 rounded-full border-2 border-[#cbd3e5]" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[11px] font-semibold text-[#202844]">
                  {ticket.title}
                </span>
                <span className="mt-0.5 block truncate text-[9px] text-slate-500">
                  <span className="font-mono font-semibold text-[#27304d]">{ticket.id}</span>
                  {' · '}{ticket.cat}{' · '}{ticket.user} · {ticket.dept}
                </span>
              </span>
              <span className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-semibold ${ticket.badgeColor}`}>
                {ticket.badge}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </Card>
  )
}

function WorkloadCard() {
  return (
    <Card className="p-4 sm:p-5">
      <h2 className="mb-4 text-sm font-bold text-[#18203e]">Technician workload</h2>
      <div className="space-y-4">
        {technicianWorkload.map((technician, index) => (
          <div key={technician.initials} className="flex items-center gap-2.5">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                index === 0
                  ? 'bg-[#ffeadf] text-[#c45523]'
                  : index === 1
                    ? 'bg-[#e6ebff] text-[#3155ff]'
                    : index === 2
                      ? 'bg-[#f0f7d8] text-[#657d1a]'
                      : 'bg-[#eee9ff] text-[#6844c5]'
              }`}
            >
              {technician.initials}
            </span>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-1.5">
                <p className="truncate text-[11px] font-semibold text-[#202844]">{technician.name}</p>
                {technician.sub && (
                  <span className="truncate text-[9px] text-slate-500">{technician.sub}</span>
                )}
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[#edf0f7]">
                <div
                  className={`h-full rounded-full ${technician.barColor}`}
                  style={{ width: `${(technician.tickets / technician.max) * 100}%` }}
                />
              </div>
            </div>
            <span className="w-4 text-right text-[10px] font-bold text-[#27304d]">
              {technician.tickets}
            </span>
          </div>
        ))}
      </div>
    </Card>
  )
}

export default function Home() {
  const { user } = useAuth()
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <div className="min-h-full px-4 py-5 sm:px-6 sm:py-6 lg:px-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-[#111a3b] sm:text-2xl">
            Good morning, {user.name.split(' ')[0]}
          </h1>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            {today} · {metrics.unassignedTickets} tickets are waiting for someone
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/devices/register"
            className="rounded-full border border-[#dce2ef] bg-white px-4 py-2 text-xs font-semibold text-[#202844] transition hover:bg-slate-50"
          >
            Register device
          </Link>
          <Link
            to="/tickets/new"
            className="inline-flex items-center gap-1.5 rounded-full bg-[#3155ff] px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
          >
            <Plus size={14} />
            New ticket
          </Link>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard
          label="Open tickets"
          value={metrics.openTickets}
          note={`${metrics.unassignedTickets} unassigned`}
          noteColor="text-[#d0453f]"
        />
        <StatCard
          label="Devices off-site"
          value={metrics.devicesOffSite}
          note={`${metrics.gatePassesOverdue} return${metrics.gatePassesOverdue === 1 ? '' : 's'} overdue`}
          noteColor="text-[#bd5e16]"
        />
        <StatCard
          label="Warranties ending"
          value={metrics.warrantiesEnding}
          note="Within 30 days"
        />
        <SlaCard />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-5">
        <Card className="p-4 sm:p-5 xl:col-span-3">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-bold text-[#18203e]">Tickets by category</h2>
                <span className="rounded-full bg-[#f0f2f8] px-2 py-0.5 text-[9px] font-semibold text-slate-600">
                  {ticketsByCategory.reduce((total, category) => total + category.value, 0)} tickets
                </span>
              </div>
            </div>
            <span className="shrink-0 text-[10px] text-slate-500">Current ticket register</span>
          </div>
          <CategoryChart />
        </Card>
        <div className="xl:col-span-2">
          <NeedsActionCard />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <DeviceRegisterAndQueue />
        </div>
        <div className="xl:col-span-2">
          <WorkloadCard />
        </div>
      </div>
    </div>
  )
}
