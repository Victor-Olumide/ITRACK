import { useState } from 'react'
import { ChevronLeft, ChevronRight, RefreshCw, Search } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useGetTicketsQuery } from '../lib/api/tickets/tickets-api'
import type {
  ApiTicketPriority,
  ApiTicketStatus,
  TicketApiRecord,
} from '../lib/api/tickets/types'

const PAGE_SIZE = 100

const statuses: { value: ApiTicketStatus; label: string }[] = [
  { value: 'NEW', label: 'New' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'WAITING_ON_USER', label: 'Waiting on user' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'CLOSED', label: 'Closed' },
]

const priorities: { value: ApiTicketPriority; label: string }[] = [
  { value: 'P1_CRITICAL', label: 'Critical' },
  { value: 'P2_HIGH', label: 'High' },
  { value: 'P3_MEDIUM', label: 'Medium' },
  { value: 'P4_LOW', label: 'Low' },
  { value: 'P5_PLANNING', label: 'Planning' },
]

const statusStyles: Record<ApiTicketStatus, string> = {
  NEW: 'bg-slate-100 text-slate-700',
  ASSIGNED: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-indigo-100 text-indigo-700',
  WAITING_ON_USER: 'bg-amber-100 text-amber-800',
  RESOLVED: 'bg-emerald-100 text-emerald-700',
  CLOSED: 'bg-slate-100 text-slate-500',
}

const priorityStyles: Record<ApiTicketPriority, string> = {
  P1_CRITICAL: 'text-red-700',
  P2_HIGH: 'text-orange-700',
  P3_MEDIUM: 'text-blue-700',
  P4_LOW: 'text-slate-600',
  P5_PLANNING: 'text-slate-500',
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
  }).format(new Date(value))
}

function TicketRow({ ticket }: { ticket: TicketApiRecord }) {
  const priorityLabel = priorities.find(({ value }) => value === ticket.priority)?.label
  const statusLabel = statuses.find(({ value }) => value === ticket.status)?.label

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-semibold text-slate-500">
              {ticket.number}
            </span>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[ticket.status]}`}>
              {statusLabel}
            </span>
          </div>
          <h2 className="mt-2 text-base font-semibold text-slate-900">
            {ticket.title}
          </h2>
          <p className="mt-1 line-clamp-2 text-sm text-slate-600">
            {ticket.description}
          </p>
        </div>

        <span className={`shrink-0 text-sm font-semibold ${priorityStyles[ticket.priority]}`}>
          {priorityLabel} priority
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
        <span>{ticket.category.name}</span>
        <span>Created {formatDate(ticket.createdAt)}</span>
        <span>
          {ticket.assignee ? `Assigned to ${ticket.assignee.fullName}` : 'Unassigned'}
        </span>
        {ticket.asset && <span>Asset {ticket.asset.assetTag}</span>}
      </div>
    </article>
  )
}

export default function TicketQueue() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<ApiTicketStatus | ''>('')
  const [priority, setPriority] = useState<ApiTicketPriority | ''>('')
  const [page, setPage] = useState(1)

  const { data, isError, isFetching, isLoading, refetch } = useGetTicketsQuery(
    {
      q: search.trim() || undefined,
      status: status || undefined,
      priority: priority || undefined,
      page,
      pageSize: PAGE_SIZE,
    },
    { skip: !user },
  )

  if (!user) {
    return (
      <section className="p-6 text-sm text-slate-600 sm:p-8">
        Sign in to view your tickets.
      </section>
    )
  }

  const tickets = (data?.data ?? []).filter(
    (ticket) => ticket.reporter.id === user.id || ticket.assignee?.id === user.id,
  )
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1

  return (
    <section className="p-6 sm:p-8">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">My tickets</h1>
        <p className="mt-1 text-sm text-gray-500">
          Tickets you created and those assigned to you.
        </p>
      </header>

      <div className="mt-6 grid gap-3 sm:grid-cols-[minmax(12rem,1fr)_12rem_12rem]">
        <label className="relative">
          <span className="sr-only">Search tickets</span>
          <Search
            aria-hidden="true"
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
            placeholder="Search title or description"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </label>

        <label>
          <span className="sr-only">Filter by status</span>
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as ApiTicketStatus | '')
              setPage(1)
            }}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">All statuses</option>
            {statuses.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
        </label>

        <label>
          <span className="sr-only">Filter by priority</span>
          <select
            value={priority}
            onChange={(event) => {
              setPriority(event.target.value as ApiTicketPriority | '')
              setPage(1)
            }}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">All priorities</option>
            {priorities.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-5" aria-live="polite">
        {isFetching && !isLoading && (
          <p className="mb-3 text-sm text-slate-500">Updating tickets…</p>
        )}

        {isLoading ? (
          <p className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500">
            Loading tickets…
          </p>
        ) : isError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-sm text-red-800">
              Tickets could not be loaded. Check your connection and try again.
            </p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-red-800 ring-1 ring-red-200 hover:bg-red-100"
            >
              <RefreshCw size={15} aria-hidden="true" />
              Retry
            </button>
          </div>
        ) : tickets.length > 0 ? (
          <div className="space-y-3">
            {tickets.map((ticket) => <TicketRow key={ticket.id} ticket={ticket} />)}
          </div>
        ) : data?.total ? (
          <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500">
            No tickets created by or assigned to you are on this page.
          </div>
        ) : (
          <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500">
            No tickets match your filters.
          </div>
        )}
      </div>

      {data && totalPages > 1 && (
        <nav
          aria-label="Ticket pages"
          className="mt-5 flex items-center justify-between gap-3"
        >
          <button
            type="button"
            disabled={page <= 1 || isFetching}
            onClick={() => setPage((current) => current - 1)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronLeft size={16} aria-hidden="true" />
            Previous
          </button>
          <span className="text-sm text-slate-500">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages || isFetching}
            onClick={() => setPage((current) => current + 1)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </nav>
      )}
    </section>
  )
}
