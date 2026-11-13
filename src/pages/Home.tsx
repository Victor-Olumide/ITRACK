import { Link } from 'react-router'
import { AlertTriangle, BarChart3, Laptop, Plus, Ticket, Timer } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useGetDashboardSummaryQuery } from '../lib/api/dashboard/dashboard-api'
import { useGetTicketsQuery } from '../lib/api/tickets/tickets-api'
import { toClientTicket } from '../lib/api/tickets/ticket-mappers'

function StatCard({ label, value, note, Icon }: {
  label: string
  value: string | number
  note: string
  Icon: LucideIcon
}) {
  return (
    <article className="relative flex min-h-28 flex-col justify-center gap-1 rounded-[18px] border border-[#e9edf6] bg-white px-4 py-4 shadow-[0_1px_3px_rgba(16,28,82,0.04)] sm:px-5">
      <Icon aria-hidden="true" size={16} className="absolute right-4 top-4 text-slate-400" />
      <p className="pr-6 text-[8px] font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="text-[28px] font-bold leading-tight tracking-tight text-[#111a3b]">{value}</p>
      <p className="text-[9px] font-medium text-slate-500">{note}</p>
    </article>
  )
}

export default function Home() {
  const { user } = useAuth()
  const summaryQuery = useGetDashboardSummaryQuery()
  const ticketQuery = useGetTicketsQuery({ page: 1, pageSize: 5 })
  const unassignedQuery = useGetTicketsQuery({ assigneeId: 'unassigned', page: 1, pageSize: 1 })
  const summary = summaryQuery.data
  const byStatus = summary?.counts.byStatus ?? {}
  const openCount = Object.entries(byStatus)
    .filter(([status]) => !['RESOLVED', 'CLOSED'].includes(status.toUpperCase()))
    .reduce((total, [, count]) => total + count, 0)
  const recentTickets = (ticketQuery.data?.data ?? []).map(toClientTicket)
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <main className="min-h-full px-4 py-5 sm:px-6 sm:py-6 lg:px-7">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[20px] font-bold tracking-tight text-[#111a3b] sm:text-2xl">
            Good morning, {user?.name.split(' ')[0] ?? 'there'}
          </h1>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">{today} · Live v1 workspace data</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/devices/register" className="rounded-full border border-[#dce2ef] bg-white px-4 py-2 text-xs font-semibold text-[#202844] hover:bg-slate-50">
            Register device
          </Link>
          <Link to="/tickets/new" className="inline-flex items-center gap-1.5 rounded-full bg-[#3155ff] px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700">
            <Plus size={14} /> New ticket
          </Link>
        </div>
      </header>

      {summaryQuery.isError && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">Dashboard data could not be loaded.</p>}
      {ticketQuery.isError && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">Ticket queue could not be loaded.</p>}

      <section aria-label="Dashboard summary" className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Tickets"
          value={summaryQuery.isLoading ? '…' : summary?.counts.total ?? '—'}
          note="All ticket records"
          Icon={Ticket}
        />
        <StatCard
          label="Open tickets"
          value={summaryQuery.isLoading ? '…' : summary ? openCount : '—'}
          note={unassignedQuery.data ? `${unassignedQuery.data.total} unassigned` : 'Open queue'}
          Icon={BarChart3}
        />
        <StatCard
          label="Overdue"
          value={summaryQuery.isLoading ? '…' : summary?.overdueTickets.length ?? '—'}
          note="Server overdue flag"
          Icon={AlertTriangle}
        />
        <StatCard
          label="Average resolution"
          value={summaryQuery.isLoading
            ? '…'
            : summary?.resolutionTime.averageHours == null
              ? '—'
              : `${summary.resolutionTime.averageHours}h`}
          note="Resolved in the last 30 days"
          Icon={Timer}
        />
      </section>

      <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-5">
        <section className="rounded-[18px] border border-[#e9edf6] bg-white p-4 shadow-[0_1px_3px_rgba(16,28,82,0.04)] sm:p-5 xl:col-span-3">
          <h2 className="text-sm font-bold text-[#18203e]">Tickets by category · last 30 days</h2>
          {summaryQuery.isLoading ? (
            <p className="py-6 text-center text-sm text-slate-500">Loading category counts…</p>
          ) : summary?.categoryBreakdown.length ? (
            <div className="mt-3 space-y-3">
              {summary.categoryBreakdown.map(({ categoryId, category, count }) => {
                const maxCount = Math.max(...summary.categoryBreakdown.map((item) => item.count), 1)
                return (
                  <div key={categoryId}>
                    <div className="mb-1 flex justify-between gap-3 text-xs">
                      <span className="font-medium text-[#27304d]">{category}</span>
                      <span className="text-slate-500">{count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-[#3155ff]" style={{ width: `${count / maxCount * 100}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-slate-500">No ticket categories in this period.</p>
          )}
        </section>

        <section className="rounded-[18px] border border-[#e9edf6] bg-white p-4 shadow-[0_1px_3px_rgba(16,28,82,0.04)] sm:p-5 xl:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#18203e]">Recent tickets</h2>
            <Link to="/tickets" className="text-[8px] font-semibold text-[#3155ff] hover:underline">See all</Link>
          </div>
          {ticketQuery.isLoading ? (
            <p className="py-6 text-center text-sm text-slate-500">Loading tickets…</p>
          ) : recentTickets.length ? (
            <div className="divide-y divide-[#edf0f7]">
              {recentTickets.map((ticket) => (
                <Link key={ticket.id} to={`/tickets?ticket=${encodeURIComponent(ticket.id)}`} className="block py-3 first:pt-1">
                  <span className="block truncate text-xs font-semibold text-[#202844]">{ticket.title}</span>
                  <span className="mt-1 block truncate text-[8px] text-slate-500">
                    {ticket.id} · {ticket.status} · {ticket.requesterName ?? 'Requester'}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-slate-500">No tickets found.</p>
          )}
        </section>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-2">
        <section className="rounded-[18px] border border-[#e9edf6] bg-white p-4 sm:p-5">
          <h2 className="text-sm font-bold text-[#18203e]">Overdue tickets</h2>
          {summaryQuery.isLoading ? (
            <p className="py-6 text-center text-sm text-slate-500">Loading overdue tickets…</p>
          ) : summary?.overdueTickets.length ? (
            <div className="mt-2 divide-y divide-[#edf0f7]">
              {summary.overdueTickets.map((ticket) => (
                <Link key={ticket.id} to={`/tickets?ticket=${encodeURIComponent(ticket.id)}`} className="block py-3 first:pt-1">
                  <span className="block truncate text-xs font-semibold text-[#202844]">{ticket.number} · {ticket.title}</span>
                  <span className="mt-1 block text-[8px] text-slate-500">
                    {ticket.priority} · {ticket.assignee?.fullName ?? 'Unassigned'}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-slate-500">No overdue tickets.</p>
          )}
        </section>

        <section className="rounded-[18px] border border-[#e9edf6] bg-white p-4 sm:p-5">
          <h2 className="text-sm font-bold text-[#18203e]">Technician workload</h2>
          {summaryQuery.isLoading ? (
            <p className="py-6 text-center text-sm text-slate-500">Loading workload…</p>
          ) : summary?.technicianWorkload.length ? (
            <div className="mt-2 divide-y divide-[#edf0f7]">
              {summary.technicianWorkload.map((technician) => (
                <div key={technician.technicianId} className="flex justify-between gap-3 py-3 first:pt-1">
                  <span className="text-xs font-medium text-[#202844]">{technician.technicianName}</span>
                  <span className="text-xs text-slate-500">
                    {technician.openTickets} open · {technician.overdueTickets} overdue
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-slate-500">No assigned technician workload.</p>
          )}
        </section>
      </div>

      <section className="mt-3 rounded-[18px] border border-[#e9edf6] bg-white p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <Laptop size={16} className="text-[#3155ff]" />
          <h2 className="text-sm font-bold text-[#18203e]">Asset summary</h2>
          <Link to="/devices" className="ml-auto text-[8px] font-semibold text-[#3155ff] hover:underline">View assets</Link>
        </div>
        {summaryQuery.isLoading ? (
          <p className="py-6 text-center text-sm text-slate-500">Loading asset summary…</p>
        ) : summary ? (
          <>
            <p className="mt-3 text-xs font-semibold text-slate-500">By type</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {summary.assetSummary.countsByType.map(({ type, count }) => (
                <span key={type} className="rounded-full bg-[#f0f2f8] px-3 py-1.5 text-xs text-slate-700">{type}: {count}</span>
              ))}
            </div>
            <p className="mt-3 text-xs font-semibold text-slate-500">By condition</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {summary.assetSummary.countsByCondition.map(({ condition, count }) => (
                <span key={condition} className="rounded-full bg-[#f0f2f8] px-3 py-1.5 text-xs text-slate-700">{condition}: {count}</span>
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-600">
              {summary.assetSummary.warrantiesExpiringIn30Days} warranties expiring within 30 days
            </p>
          </>
        ) : (
          <p className="py-6 text-center text-sm text-slate-500">Asset summary is unavailable.</p>
        )}
      </section>
    </main>
  )
}
