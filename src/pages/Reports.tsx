import { AlertTriangle, BarChart3, Clock3, Laptop, Ticket } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useGetDashboardSummaryQuery } from '../lib/api/dashboard/dashboard-api'

function SummaryCard({ label, value, note, Icon }: {
  label: string
  value: string | number
  note: string
  Icon: LucideIcon
}) {
  return (
    <article className="rounded-2xl border border-[#e9edf6] bg-white p-4 shadow-[0_1px_3px_rgba(16,28,82,0.04)] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-extrabold leading-none tracking-tight text-[#111a3b]">{value}</p>
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
          <Icon size={17} />
        </span>
      </div>
      <p className="mt-3 text-[11px] text-slate-500">{note}</p>
    </article>
  )
}

export default function Reports() {
  const summaryQuery = useGetDashboardSummaryQuery()
  const summary = summaryQuery.data
  const assetCount = summary?.assetSummary.countsByType.reduce((total, item) => total + item.count, 0)
  const openCount = Object.entries(summary?.counts.byStatus ?? {})
    .filter(([status]) => !['RESOLVED', 'CLOSED'].includes(status.toUpperCase()))
    .reduce((total, [, count]) => total + count, 0)

  return (
    <main className="min-h-full bg-[#f4f6fc] p-4 sm:p-6 lg:p-7">
      <header className="mb-5">
        <div className="flex items-center gap-2">
          <BarChart3 size={19} className="text-[#3155ff]" />
          <h1 className="text-2xl font-bold tracking-tight text-[#101a3b]">Reports</h1>
        </div>
        <p className="mt-1 text-sm text-slate-500">Live metrics provided by the v1 dashboard and asset APIs.</p>
      </header>

      {summaryQuery.isError && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">Dashboard report data could not be loaded.</p>}

      <section aria-label="Available report metrics" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Tickets"
          value={summaryQuery.isLoading ? '…' : summary?.counts.total ?? '—'}
          note={`${summary ? openCount : '—'} currently open`}
          Icon={Ticket}
        />
        <SummaryCard
          label="Overdue tickets"
          value={summaryQuery.isLoading ? '…' : summary?.overdueTickets.length ?? '—'}
          note="Server overdue flag"
          Icon={AlertTriangle}
        />
        <SummaryCard
          label="Average resolution"
          value={summaryQuery.isLoading
            ? '…'
            : summary?.resolutionTime.averageHours == null
              ? '—'
              : `${summary.resolutionTime.averageHours}h`}
          note="Server-calculated"
          Icon={Clock3}
        />
        <SummaryCard
          label="Assets"
          value={summaryQuery.isLoading ? '…' : assetCount ?? '—'}
          note="Count from dashboard summary"
          Icon={Laptop}
        />
      </section>

      <section className="mt-4 rounded-2xl border border-[#e9edf6] bg-white p-4 sm:p-5">
        <h2 className="text-sm font-bold text-[#18203e]">Tickets by category · last 30 days</h2>
        {summaryQuery.isLoading ? (
          <p className="py-6 text-center text-sm text-slate-500">Loading category counts…</p>
        ) : summary?.categoryBreakdown.length ? (
          <div className="mt-4 divide-y divide-[#edf0f7]">
            {summary.categoryBreakdown.map(({ categoryId, category, count }) => (
              <div key={categoryId} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <span className="text-sm font-medium text-[#27304d]">{category}</span>
                <span className="rounded-full bg-[#f0f2f8] px-2.5 py-1 text-xs font-semibold text-slate-600">{count}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-slate-500">No category data is available.</p>
        )}
      </section>

      <section className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-2">
        <article className="rounded-2xl border border-[#e9edf6] bg-white p-4 sm:p-5">
          <h2 className="text-sm font-bold text-[#18203e]">Tickets by status</h2>
          {summaryQuery.isLoading ? (
            <p className="py-6 text-center text-sm text-slate-500">Loading status counts…</p>
          ) : summary ? (
            <div className="mt-3 divide-y divide-[#edf0f7]">
              {Object.entries(summary.counts.byStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="text-[#27304d]">{status.replaceAll('_', ' ')}</span>
                  <span className="font-semibold text-slate-600">{count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-slate-500">Status counts are unavailable.</p>
          )}
        </article>
        <article className="rounded-2xl border border-[#e9edf6] bg-white p-4 sm:p-5">
          <h2 className="text-sm font-bold text-[#18203e]">Assets and warranty</h2>
          {summaryQuery.isLoading ? (
            <p className="py-6 text-center text-sm text-slate-500">Loading asset summary…</p>
          ) : summary ? (
            <>
              <div className="mt-3 divide-y divide-[#edf0f7]">
                {summary.assetSummary.countsByCondition.map(({ condition, count }) => (
                  <div key={condition} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <span className="text-[#27304d]">{condition}</span>
                    <span className="font-semibold text-slate-600">{count}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-sm text-slate-600">
                {summary.assetSummary.warrantiesExpiringIn30Days} warranties expiring within 30 days
              </p>
            </>
          ) : (
            <p className="py-6 text-center text-sm text-slate-500">Asset metrics are unavailable.</p>
          )}
        </article>
      </section>
    </main>
  )
}
