import { Link } from 'react-router'
import {
  ArrowUpRight,
  BarChart3,
  BriefcaseBusiness,
  CircleAlert,
  Clock3,
  Laptop,
  Ticket,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { devices, gatePasses, tickets, userById } from '../lib/mockData'
import {
  getGatePassStatusUpdates,
  getSubmittedPasses,
  getSubmittedTickets,
} from '../lib/sessionData'

const TICKET_STATES = [
  { label: 'In progress', color: '#3155ff' },
  { label: 'Waiting on user', color: '#8b5cf6' },
  { label: 'Unassigned', color: '#f59e0b' },
  { label: 'Resolved', color: '#10b981' },
]
const SLA_STATES = [
  { label: 'Breached', color: '#ef4444' },
  { label: 'At risk', color: '#f97316' },
  { label: 'On track', color: '#10b981' },
  { label: 'Paused', color: '#94a3b8' },
]
const DEVICE_STATES = [
  { label: 'Assigned', color: '#3155ff' },
  { label: 'In store', color: '#84cc16' },
  { label: 'Off-site', color: '#8b5cf6' },
  { label: 'In repair', color: '#f97316' },
  { label: 'Retired', color: '#94a3b8' },
]
const CATEGORY_COLORS = ['#3155ff', '#84cc16', '#8b5cf6', '#f97316', '#06b6d4', '#0f1b4c']

function countBy(records, getKey) {
  return records.reduce((counts, record) => {
    const key = getKey(record)
    counts.set(key, (counts.get(key) ?? 0) + 1)
    return counts
  }, new Map())
}

function SummaryCard({ label, value, note, Icon, tone }) {
  return (
    <article className="rounded-2xl border border-[#e9edf6] bg-white p-4 shadow-[0_1px_3px_rgba(16,28,82,0.04)] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-extrabold leading-none tracking-tight text-[#111a3b]">{value}</p>
        </div>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tone}`}>
          <Icon size={17} />
        </span>
      </div>
      <p className="mt-3 text-[11px] text-slate-500">{note}</p>
    </article>
  )
}

function Panel({ title, description, children, className = '' }) {
  return (
    <section className={`rounded-2xl border border-[#e9edf6] bg-white p-4 shadow-[0_1px_3px_rgba(16,28,82,0.04)] sm:p-5 ${className}`}>
      <div className="mb-4">
        <h2 className="text-sm font-bold text-[#18203e]">{title}</h2>
        {description && <p className="mt-1 text-[11px] leading-5 text-slate-500">{description}</p>}
      </div>
      {children}
    </section>
  )
}

function BarList({ rows, total, emptyMessage = 'No records to report.' }) {
  if (!rows.length) return <p className="py-6 text-center text-xs text-slate-500">{emptyMessage}</p>

  return (
    <div className="space-y-3">
      {rows.map(({ label, value, color, href, note }) => (
        <div key={label}>
          <div className="mb-1 flex items-center justify-between gap-3 text-[11px]">
            {href ? (
              <Link to={href} className="font-semibold text-[#27304d] hover:text-[#3155ff] hover:underline">{label}</Link>
            ) : (
              <span className="font-semibold text-[#27304d]">{label}</span>
            )}
            <span className="shrink-0 text-slate-500">{value}{note ? ` · ${note}` : ''}</span>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full bg-[#eef1f7]"
            role="img"
            aria-label={`${label}: ${value} of ${total}`}
          >
            <div className="h-full rounded-full" style={{ width: `${total ? value / total * 100 : 0}%`, backgroundColor: color }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function TicketAttention({ items }) {
  if (!items.length) {
    return <p className="py-6 text-center text-xs text-slate-500">No breached or at-risk tickets right now.</p>
  }

  return (
    <div className="divide-y divide-[#edf0f7]">
      {items.map((ticket) => {
        const requester = userById(ticket.requesterId)
        const breached = ticket.timeState === 'Breached'
        return (
          <Link
            key={ticket.id}
            to={`/tickets?ticket=${ticket.id}`}
            className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
          >
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${breached ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}`}>
              <CircleAlert size={15} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-semibold text-[#202844]">{ticket.id} · {ticket.title}</span>
              <span className="mt-0.5 block truncate text-[10px] text-slate-500">{requester?.name ?? 'Requester'} · {ticket.assigneeId ? userById(ticket.assigneeId)?.name ?? 'Assigned' : 'Unassigned'}</span>
            </span>
            <span className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-bold ${breached ? 'bg-red-50 text-red-700' : 'bg-orange-50 text-orange-700'}`}>
              {ticket.timeState}
            </span>
          </Link>
        )
      })}
    </div>
  )
}

export default function Reports() {
  const { users } = useAuth()
  const allTickets = [...tickets, ...getSubmittedTickets()]
  const allPasses = [...gatePasses, ...getSubmittedPasses()]
  const passUpdates = getGatePassStatusUpdates()
  const openTickets = allTickets.filter((ticket) => ticket.status !== 'Resolved')
  const attentionTickets = openTickets
    .filter((ticket) => ['Breached', 'At risk'].includes(ticket.timeState))
    .sort((a, b) => (a.timeState === 'Breached' ? -1 : 0) - (b.timeState === 'Breached' ? -1 : 0))
  const ticketStates = countBy(allTickets, (ticket) => ticket.status)
  const slaStates = countBy(allTickets, (ticket) => SLA_STATES.some(({ label }) => label === ticket.timeState) ? ticket.timeState : 'Paused')
  const deviceStates = countBy(devices, (device) => device.status)
  const categories = [...countBy(allTickets, (ticket) => ticket.category || 'Uncategorized')]
    .map(([label, value], index) => ({ label, value, color: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }))
    .sort((a, b) => b.value - a.value)
  const technicians = users.filter((user) => user.role === 'Technician')
    .map((technician) => ({
      ...technician,
      assigned: openTickets.filter((ticket) => ticket.assigneeId === technician.id).length,
      breached: openTickets.filter((ticket) => ticket.assigneeId === technician.id && ticket.timeState === 'Breached').length,
    }))
    .sort((a, b) => b.assigned - a.assigned || a.name.localeCompare(b.name))
  const passCounts = countBy(allPasses, (pass) => passUpdates[pass.id] ?? pass.status ?? 'Unknown')
  const onTrackCount = slaStates.get('On track') ?? 0
  const slaOnTrackRate = allTickets.length ? Math.round(onTrackCount / allTickets.length * 100) : 0
  const avgResolution = allTickets
    .filter((ticket) => ticket.status === 'Resolved' && Number.isFinite(ticket.resolutionHours))
    .map((ticket) => ticket.resolutionHours)
  const avgResolutionHours = avgResolution.length
    ? Math.round(avgResolution.reduce((total, hours) => total + hours, 0) / avgResolution.length * 10) / 10
    : null
  const maxCategory = Math.max(1, ...categories.map(({ value }) => value))
  const chartMax = Math.ceil(maxCategory / 3) * 3
  const chartTicks = [3, 2, 1, 0].map((step) => chartMax / 3 * step)

  return (
    <div className="min-h-full bg-[#f4f6fc] p-4 sm:p-6 lg:p-7">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 size={19} className="text-[#3155ff]" />
            <h1 className="text-2xl font-bold tracking-tight text-[#101a3b]">Reports</h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">Current snapshot of the ticket queue, SLA states, assets, and gate passes.</p>
          <p className="mt-1 text-[10px] text-slate-400">Based on seeded demo records and submissions saved in this browser session.</p>
        </div>
        <span className="rounded-full border border-[#dce2ef] bg-white px-3 py-1.5 text-[10px] font-semibold text-slate-500">
          {new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date())}
        </span>
      </header>

      <section aria-label="Key metrics" className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-5">
        <SummaryCard label="Total tickets" value={allTickets.length} note={`${openTickets.length} currently open`} Icon={Ticket} tone="bg-blue-50 text-blue-700" />
        <SummaryCard label="Needs attention" value={attentionTickets.length} note={`${slaStates.get('Breached') ?? 0} breached · ${slaStates.get('At risk') ?? 0} at risk`} Icon={CircleAlert} tone="bg-orange-50 text-orange-700" />
        <SummaryCard label="SLA on track" value={`${slaOnTrackRate}%`} note={`${onTrackCount} of ${allTickets.length} ticket records`} Icon={Clock3} tone="bg-emerald-50 text-emerald-700" />
        <SummaryCard label="Avg. resolution" value={avgResolutionHours == null ? '—' : `${avgResolutionHours}h`} note={`${avgResolution.length} resolved ticket${avgResolution.length === 1 ? '' : 's'} with duration data`} Icon={BriefcaseBusiness} tone="bg-violet-50 text-violet-700" />
        <SummaryCard label="Devices" value={devices.length} note={`${deviceStates.get('Off-site') ?? 0} off-site · ${deviceStates.get('In repair') ?? 0} in repair`} Icon={Laptop} tone="bg-slate-100 text-slate-700" />
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Tickets by category" description={`${allTickets.length} ticket records across ${categories.length} categories.`}>
          <div
            role="img"
            aria-label={`Tickets by category: ${categories.map(({ label, value }) => `${label}, ${value}`).join('; ')}`}
            className="relative"
          >
            {categories.length > 0 && (
              <div className="grid grid-cols-[24px_minmax(0,1fr)] gap-2">
                <div className="flex h-40 flex-col justify-between pb-0.5 text-right text-[10px] leading-none text-slate-400" aria-hidden="true">
                  {chartTicks.map((tick) => <span key={tick}>{tick}</span>)}
                </div>
                <div>
                  <div className="relative h-40">
                    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between" aria-hidden="true">
                      {chartTicks.map((tick) => (
                        <span key={tick} className="border-t border-dashed border-[#e7ebf4]" />
                      ))}
                    </div>
                    <div className="relative justify-between w-full h-full flex flex-row items-end gap-2 px-1">
                      {categories.map(({ label, value, color }) => (
                        <div key={label} className="flex h-full min-w-0 flex-col items-center justify-end">
                          <span className="mb-1 text-[10px] font-bold leading-none text-[#27304d]">{value}</span>
                          <div
                            className="w-24 max-w-24 rounded-t-lg transition-[height]"
                            style={{ height: `${value ? Math.max(3, value / chartMax * 120) : 0}px`, backgroundColor: color }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-row justify-between gap-2 px-1 pt-2">
                    {categories.map(({ label }) => (
                      <span key={label} className="min-w-0 text-center text-[9px] leading-3 text-slate-500 sm:text-[10px]">
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {!categories.length && <p className="py-6 text-center text-xs text-slate-500">No tickets to report.</p>}
          </div>
        </Panel>

        <Panel title="Ticket status and SLA" description="Counts reflect the current status recorded on each ticket.">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <h3 className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Ticket status</h3>
              <BarList
                total={allTickets.length}
                rows={TICKET_STATES.map(({ label, color }) => ({
                  label,
                  value: ticketStates.get(label) ?? 0,
                  color,
                  href: '/tickets',
                }))}
              />
            </div>
            <div>
              <h3 className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">SLA state</h3>
              <BarList
                total={allTickets.length}
                rows={SLA_STATES.map(({ label, color }) => ({
                  label,
                  value: slaStates.get(label) ?? 0,
                  color,
                  href: '/tickets',
                }))}
              />
            </div>
          </div>
        </Panel>

        <Panel title="Tickets needing attention" description="Open items marked breached or at risk." className="min-w-0">
          <TicketAttention items={attentionTickets.slice(0, 6)} />
          {attentionTickets.length > 6 && (
            <Link to="/tickets" className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-[#3155ff] hover:underline">
              View all {attentionTickets.length} tickets <ArrowUpRight size={13} />
            </Link>
          )}
        </Panel>

        <Panel title="Technician workload" description="Open tickets currently assigned to each technician.">
          <div className="space-y-3">
            {technicians.map((technician) => (
              <div key={technician.id} className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#edf1ff] text-[10px] font-bold text-[#3155ff]">
                  {technician.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[11px] font-semibold text-[#27304d]">{technician.name}</span>
                  <span className="block text-[10px] text-slate-500">{technician.department}{technician.breached ? ` · ${technician.breached} breached` : ''}</span>
                </span>
                <span className="w-8 text-right text-xs font-bold text-[#27304d]">{technician.assigned}</span>
                <span className="hidden w-24 overflow-hidden rounded-full bg-[#eef1f7] sm:block">
                  <span className="block h-1.5 rounded-full bg-[#3155ff]" style={{ width: `${technicians.length ? technician.assigned / Math.max(1, ...technicians.map((person) => person.assigned)) * 100 : 0}%` }} />
                </span>
              </div>
            ))}
            {!technicians.length && <p className="py-6 text-center text-xs text-slate-500">No technicians in the user directory.</p>}
          </div>
        </Panel>

        <Panel title="Device register" description={`${devices.length} tracked assets by their recorded status.`}>
          <BarList
            total={devices.length}
            rows={DEVICE_STATES.map(({ label, color }) => ({
              label,
              value: deviceStates.get(label) ?? 0,
              color,
              href: label === 'In repair' ? '/devices?status=In%20repair' : '/devices',
              note: `${devices.length ? Math.round((deviceStates.get(label) ?? 0) / devices.length * 100) : 0}%`,
            }))}
          />
          <Link to="/devices" className="mt-4 inline-flex items-center gap-1 text-[11px] font-semibold text-[#3155ff] hover:underline">
            Open device register <ArrowUpRight size={13} />
          </Link>
        </Panel>

        <Panel title="Gate pass overview" description={`${allPasses.length} pass requests, including browser-session submissions.`}>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {['Waiting', 'Approved', 'Overdue', 'Rejected'].map((status) => (
              <Link key={status} to="/passes" className="rounded-xl border border-[#edf0f7] p-3 transition hover:border-[#3155ff]/40 hover:bg-[#f8f9ff]">
                <span className="block text-[10px] font-semibold text-slate-500">{status}</span>
                <span className="mt-1 block text-2xl font-bold text-[#18203e]">{passCounts.get(status) ?? 0}</span>
              </Link>
            ))}
          </div>
          <Link to="/passes" className="mt-4 inline-flex items-center gap-1 text-[11px] font-semibold text-[#3155ff] hover:underline">
            Review gate passes <ArrowUpRight size={13} />
          </Link>
        </Panel>
      </div>
    </div>
  )
}
