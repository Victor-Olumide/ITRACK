// src/pages/Reports.jsx
// Reports landing — KPIs and a category breakdown sourced from mockData.

import { metrics, ticketsByCategory } from '../lib/mockData'

const MAX_VAL = Math.max(...ticketsByCategory.map((c) => c.value))

function Kpi({ label, value, sub }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-1 text-3xl font-extrabold text-slate-900">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
    </div>
  )
}

export default function Reports() {
  return (
    <div className="min-h-full bg-[#f4f6fc] p-5 sm:p-7">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-[#101a3b]">Reports</h1>
        <p className="mt-1 text-sm text-slate-500">
          Performance and asset overview for the last 30 days.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Kpi label="Open tickets" value={metrics.openTickets} sub={`${metrics.unassignedTickets} unassigned`} />
        <Kpi label="Avg. resolution" value={`${metrics.avgResolutionHours}h`} />
        <Kpi label="SLA met" value={`${metrics.slaMetPercentage}%`} sub={`Target ${metrics.slaTargetPercentage}%`} />
        <Kpi label="Devices" value={metrics.devicesTotal} sub={`${metrics.devicesAssigned} assigned`} />
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-slate-700 mb-4">Tickets by category</h2>
        <div className="flex items-end justify-between gap-3">
          {ticketsByCategory.map(({ label, value, color }) => (
            <div key={label} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-xs font-semibold text-slate-600">{value}</span>
              <div
                className="w-full rounded-t-md transition-all"
                style={{ height: Math.round((value / MAX_VAL) * 140), backgroundColor: color }}
              />
              <span className="text-[10px] text-slate-400 text-center leading-tight">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
