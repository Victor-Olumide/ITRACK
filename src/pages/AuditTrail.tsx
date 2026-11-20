// W26 audit trail: who changed what, and when, across ITrack.
import { useState } from 'react'
import { ScrollText } from 'lucide-react'
import Dropdown from '../components/Dropdown'
import DatePicker from '../components/DatePicker'
import { getApiErrorMessage } from '../lib/api/error-message'
import { AUDIT_ENTITY_TYPES, useGetAuditEventsQuery, type AuditEntityType } from '../lib/api/audit/audit-api'

const TYPE_LABELS: Record<AuditEntityType, string> = {
  ticket: 'Tickets',
  'gate-pass': 'Gate passes',
  'asset-request': 'Equipment requests',
  asset: 'Devices',
  'asset-model': 'Model library',
  user: 'People',
  category: 'Categories',
  sla: 'SLA targets',
  stock: 'Stock',
}

const PAGE_SIZE = 25

export default function AuditTrail() {
  const [entityType, setEntityType] = useState<AuditEntityType | ''>('')
  const [search, setSearch] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)
  const query = useGetAuditEventsQuery({
    entityType: entityType || undefined,
    q: search.trim() || undefined,
    from: from || undefined,
    to: to || undefined,
    page,
    pageSize: PAGE_SIZE,
  })
  const items = query.data?.items ?? []
  const total = query.data?.total ?? 0
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  // Any filter change starts again from the first page.
  const filter = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value)
    setPage(1)
  }

  return (
    <main className="min-h-full px-4 py-5 sm:px-6 sm:py-6 lg:px-7">
      <div className="flex items-center gap-2">
        <ScrollText size={19} className="text-[#3155ff]" />
        <h1 className="text-2xl font-bold tracking-tight text-[#111a3b]">Audit trail</h1>
      </div>
      <p className="mt-1 text-sm text-slate-500">A permanent record of changes to tickets, passes, devices, people, stock and settings.</p>

      <section className="mt-5 flex flex-wrap items-end gap-3 rounded-2xl border border-[#e9edf6] bg-white p-3">
        <label className="min-w-48 flex-1 text-xs font-semibold text-slate-600">
          Search
          <input value={search} onChange={(event) => filter(setSearch)(event.target.value)} placeholder="Person, ticket number, asset tag…" className="mt-1.5 h-10 w-full rounded-xl border border-[#d4daea] px-3 text-sm font-normal outline-none focus:border-[#3155ff] focus:ring-2 focus:ring-blue-100" />
        </label>
        <label className="w-48 text-xs font-semibold text-slate-600">
          Area
          <div className="mt-1.5">
            <Dropdown value={entityType} onChange={(value) => filter(setEntityType)(value as AuditEntityType | '')} ariaLabel="Audit area" options={[{ value: '', label: 'Everything' }, ...AUDIT_ENTITY_TYPES.map((value) => ({ value, label: TYPE_LABELS[value] }))]} />
          </div>
        </label>
        <label className="w-40 text-xs font-semibold text-slate-600">From<div className="mt-1.5"><DatePicker value={from} onChange={filter(setFrom)} /></div></label>
        <label className="w-40 text-xs font-semibold text-slate-600">To<div className="mt-1.5"><DatePicker value={to} onChange={filter(setTo)} /></div></label>
      </section>

      <section className="mt-4 overflow-hidden rounded-2xl border border-[#e9edf6] bg-white">
        {query.isLoading ? (
          <p className="p-8 text-center text-sm text-slate-500">Loading the audit trail…</p>
        ) : query.isError ? (
          <p role="alert" className="p-8 text-center text-sm text-red-700">{getApiErrorMessage(query.error, 'The audit trail could not be loaded.')}</p>
        ) : items.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">No recorded changes match these filters.</p>
        ) : (
          <ol className={`divide-y divide-[#eef1f7] ${query.isFetching ? 'opacity-60' : ''}`}>
            {items.map((event) => (
              <li key={event.id} className="grid gap-1 px-4 py-3 sm:grid-cols-[150px_1fr_auto] sm:items-center sm:gap-4">
                <time dateTime={event.createdAt} className="font-mono text-[11px] text-slate-500">
                  {new Date(event.createdAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
                </time>
                <div className="min-w-0">
                  <p className="text-sm text-[#202844]">{event.summary}</p>
                  <p className="text-[11px] text-slate-500">{event.actorName ?? 'System'} · <span className="font-mono">{event.action}</span></p>
                </div>
                <span className="w-fit rounded-full bg-[#eef2ff] px-2 py-0.5 text-[10px] font-semibold text-[#3155ff]">{TYPE_LABELS[event.entityType] ?? event.entityType}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      {total > PAGE_SIZE && (
        <nav aria-label="Audit pages" className="mt-3 flex items-center justify-between text-xs text-slate-500">
          <span>{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}</span>
          <div className="flex gap-2">
            <button type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="rounded-full border border-[#dce2ef] bg-white px-3 py-1.5 font-semibold text-[#202844] disabled:opacity-40">Previous</button>
            <button type="button" disabled={page >= pages} onClick={() => setPage((value) => value + 1)} className="rounded-full border border-[#dce2ef] bg-white px-3 py-1.5 font-semibold text-[#202844] disabled:opacity-40">Next</button>
          </div>
        </nav>
      )}
    </main>
  )
}
