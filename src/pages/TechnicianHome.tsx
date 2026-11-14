// Technician queue summary with assigned work and SLA status.

import { Link } from 'react-router'
import { ArrowRight, Ticket, TriangleAlert } from 'lucide-react'
import Badge from '../components/Badge'
import { useAuth } from '../contexts/AuthContext'
import { useGetTicketsQuery } from '../lib/api/tickets/tickets-api'
import { toClientTicket } from '../lib/api/tickets/ticket-mappers'
import { getApiErrorMessage } from '../lib/api/error-message'

export default function TechnicianHome() {
  const { user } = useAuth()
  const ticketsQuery = useGetTicketsQuery(
    { assigneeId: user?.id, page: 1, pageSize: 100 },
    { skip: !user?.id },
  )
  const myTickets = (ticketsQuery.data?.data ?? []).map(toClientTicket)
  const activeTickets = myTickets.filter((ticket) => !['Resolved', 'Closed'].includes(ticket.status))
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <div className="min-h-full px-4 py-5 sm:px-6 sm:py-6 lg:px-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#3155ff]">Technician workspace</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#111a3b]">
            Good morning, {user?.name.split(' ')[0] ?? 'there'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{today} · {activeTickets.length} tickets assigned to you</p>
        </div>
        <Link
          to="/technician/tickets"
          className="inline-flex items-center gap-2 rounded-full bg-[#3155ff] px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700"
        >
          Open my queue <ArrowRight size={14} />
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: 'Assigned to me', value: ticketsQuery.isLoading ? '…' : ticketsQuery.isError ? '—' : activeTickets.length, icon: Ticket, tone: 'bg-[#edf1ff] text-[#3155ff]' },
          { label: 'Breached', value: ticketsQuery.isLoading ? '…' : ticketsQuery.isError ? '—' : activeTickets.filter((ticket) => ticket.timeState === 'Breached').length, icon: TriangleAlert, tone: 'bg-red-50 text-red-600' },
          { label: 'Resolved', value: ticketsQuery.isLoading ? '…' : ticketsQuery.isError ? '—' : myTickets.filter((ticket) => ticket.status === 'Resolved').length, icon: Ticket, tone: 'bg-emerald-50 text-emerald-700' },
        ].map(({ label, value, icon: Icon, tone }) => (
          <article key={label} className="rounded-2xl border border-[#e9edf6] bg-white p-4">
            <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}>
              <Icon size={17} />
            </span>
            <p className="mt-3 text-xs font-medium text-slate-500">{label}</p>
            <p className="mt-0.5 text-2xl font-bold text-[#18203e]">{value}</p>
          </article>
        ))}
      </div>

      <section className="mt-4 overflow-hidden rounded-2xl border border-[#e9edf6] bg-white">
        <div className="flex items-center justify-between border-b border-[#edf0f7] px-4 py-4 sm:px-5">
          <div>
            <h2 className="text-sm font-bold text-[#18203e]">My work queue</h2>
            <p className="mt-1 text-xs text-slate-500">Assigned ticket records from the server.</p>
          </div>
          <Link to="/technician/tickets" className="text-xs font-semibold text-[#3155ff] hover:underline">
            See all
          </Link>
        </div>
        <div className="divide-y divide-[#edf0f7]">
          {ticketsQuery.isLoading ? (
            <p role="status" className="px-5 py-12 text-center text-sm text-slate-500">Loading your queue…</p>
          ) : ticketsQuery.isError ? (
            <div role="alert" className="px-5 py-8 text-center">
              <p className="text-sm text-red-700">{getApiErrorMessage(ticketsQuery.error, 'Your queue could not be loaded.')}</p>
              <button
                type="button"
                onClick={() => void ticketsQuery.refetch()}
                className="mt-2 text-xs font-semibold text-[#3155ff] hover:underline"
              >
                Retry
              </button>
            </div>
          ) : activeTickets.map((ticket) => (
              <Link
                key={ticket.id}
                to={`/technician/tickets?ticket=${ticket.id}`}
                className="flex flex-wrap items-center gap-3 px-4 py-4 transition hover:bg-[#f8faff] sm:px-5"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f0f3fb] text-slate-500">
                  <Ticket size={17} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-[#202844]">{ticket.title}</span>
                  <span className="mt-1 block text-xs text-slate-500">
                    {ticket.id} · {ticket.category} · {ticket.requesterName ?? 'Requester'}
                    {ticket.requesterDepartment ? ` · ${ticket.requesterDepartment}` : ''}
                  </span>
                </span>
                <Badge label={ticket.priority} />
                <Badge label={ticket.timeState} />
                <ArrowRight size={15} className="text-slate-400" />
              </Link>
          ))}
          {!ticketsQuery.isLoading && !ticketsQuery.isError && activeTickets.length === 0 && (
            <p className="px-5 py-12 text-center text-sm text-slate-500">Your queue is clear.</p>
          )}
        </div>
      </section>
    </div>
  )
}
