// src/pages/Home.jsx
// Home — dashboard with KPIs and quick queues. All data comes from
// src/lib/mockData (no inline dummy data).

import { Link } from 'react-router'
import { ArrowUpRight, Plus } from 'lucide-react'
import {
  metrics, ticketsByCategory, needsAction, todayQueue,
  technicianWorkload, deviceRegisterSegments, currentUser,
} from '../lib/mockData'

// ── tiny helpers ──────────────────────────────────────────────
function Card({ className = '', children }) {
  return (
    <div className={`rounded-2xl border border-gray-100 shadow-sm ${className}`}>
      {children}
    </div>
  )
}

function StatCard({ label, value, sub, subColor = 'text-red-500', arrow = true }) {
  return (
    <Card className="p-5 flex flex-col gap-1 relative">
      {arrow && (
        <ArrowUpRight className="absolute top-4 right-4 text-gray-300" size={16} />
      )}
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">{label}</p>
      <p className="text-4xl font-extrabold text-gray-900">{value}</p>
      {sub && <p className={`text-xs font-medium ${subColor} flex items-center gap-1`}>{sub}</p>}
    </Card>
  )
}

// ── bar chart (pure CSS) ───────────────────────────────────────
const MAX_VAL = Math.max(...ticketsByCategory.map((c) => c.value))
const CHART_H = 140 // px — fixed bar area height

function BarChart() {
  return (
    <div className="flex items-end justify-between gap-2 px-1">
      {ticketsByCategory.map(({ label, value, color }) => {
        const barH = Math.round((value / MAX_VAL) * CHART_H)
        return (
          <div key={label} className="flex flex-col items-center gap-1 flex-1">
            <span className="text-xs font-semibold text-gray-600">{value}</span>
            <div
              className="w-full rounded-t-md transition-all"
              style={{ height: barH, backgroundColor: color }}
            />
            <span className="text-[10px] text-gray-400 text-center leading-tight mt-1">{label}</span>
          </div>
        )
      })}
    </div>
  )
}

// ──────────────────────────────────────────────────────────────
export default function Home() {
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  return (
    <div className="bg-linear-to-br from-[#0B184C] to-[#0A174B] p-4">
      <div className="flex flex-col gap-5 min-h-full rounded-xl bg-gray-50 p-5">

        {/* ── Page header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">
              Good morning, {currentUser.name.split(' ')[0]}
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {today} · {metrics.unassignedTickets} tickets are waiting for someone
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/devices/register"
              className="px-4 py-2 rounded-full border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              Register device
            </Link>
            <Link
              to="/tickets"
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
            >
              <Plus size={16} />
              New ticket
            </Link>
          </div>
        </div>

        {/* ── Top stat row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Open Tickets"
            value={metrics.openTickets}
            sub={<><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> {metrics.unassignedTickets} unassigned</>}
          />
          <StatCard
            label="Devices Off-Site"
            value={metrics.devicesOffSite}
            sub={<><span className="w-2 h-2 rounded-full bg-orange-500 inline-block" /> 1 return overdue</>}
            subColor="text-orange-500"
          />
          <StatCard
            label="Warranties Ending"
            value={metrics.warrantiesEnding}
            sub={<><span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" /> Within 30 days</>}
            subColor="text-yellow-600"
          />

          {/* SLA goal card */}
          <Card className="p-5 bg-[#244BFE] text-white flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full text-black bg-[#CFF231]">SLA goal</span>
              <span className="text-xs text-slate-200">Target {metrics.slaTargetPercentage}%</span>
            </div>
            <div className="flex items-center justify-start gap-4">
              <p className="text-4xl font-extrabold text-white">{metrics.slaMetPercentage}%</p>
              <p className="text-xs text-slate-200">met in 30 days</p>
            </div>
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full rounded-full bg-[#CCFF00]" style={{ width: `${metrics.slaMetPercentage}%` }} />
            </div>
          </Card>
        </div>

        {/* ── Middle row: chart + needs action ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

          {/* Bar chart */}
          <Card className="lg:col-span-3 p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-bold text-gray-700">Tickets by category</p>
                <p className="text-xs text-gray-400">125 in 30 days</p>
              </div>
              <span className="text-xs text-gray-400">Last 30 days</span>
            </div>
            <BarChart />
          </Card>

          {/* Needs action */}
          <Card className="lg:col-span-2 p-5">
            <p className="text-sm font-bold text-gray-700 mb-4">
              Needs action <span className="ml-1 text-xs font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">{needsAction.length}</span>
            </p>
            <div className="flex flex-col divide-y divide-gray-50">
              {needsAction.map((a, i) => (
                <div key={i} className="py-3 flex gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${a.color}`}>
                    {a.num}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <p className="text-sm font-semibold text-gray-800">{a.title}</p>
                    <p className="text-xs text-gray-400">{a.desc}</p>
                    <a href="#" className="text-xs text-blue-600 hover:underline mt-0.5 inline-flex items-center gap-0.5">
                      {a.link}
                      <ArrowUpRight size={12} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ── Bottom row: device register + queue | workload ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

          {/* Device register + queue */}
          <Card className="lg:col-span-3 p-5 flex flex-col gap-4">

            {/* Device register */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-gray-700">Device register</p>
                <span className="text-xs text-gray-400">{metrics.devicesTotal} devices</span>
              </div>
              <div className="flex h-2.5 rounded-full overflow-hidden gap-0.5">
                {deviceRegisterSegments.map((s, i) => (
                  <div key={i} className={`${s.color}`} style={{ width: `${s.pct}%` }} />
                ))}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                {[
                  { color: 'bg-blue-600', label: `${metrics.devicesAssigned} Assigned` },
                  { color: 'bg-[#CCFF00]', label: `${metrics.devicesInStore} In store` },
                  { color: 'bg-violet-500', label: `${metrics.devicesOffSite} Off-site` },
                  { color: 'bg-orange-500', label: `${metrics.devicesInRepair} In repair` },
                  { color: 'bg-gray-400', label: `${metrics.devicesRetired} Retired` },
                ].map(({ color, label }) => (
                  <span key={label} className="flex items-center gap-1 text-xs text-gray-500">
                    <span className={`w-2 h-2 rounded-full ${color} inline-block`} />
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* Today's queue */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold text-gray-700">
                  Today's queue <span className="ml-1 text-xs font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">{todayQueue.length}</span>
                </p>
                <Link to="/tickets" className="text-xs text-blue-600 hover:underline">See all</Link>
              </div>

              <div className="flex flex-col divide-y divide-gray-50">
                {todayQueue.map((q, i) => (
                  <div key={i} className="py-3 flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full border-2 border-gray-200 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{q.title}</p>
                      <p className="text-xs text-gray-400">
                        {q.id} · <span className="text-gray-500">{q.cat}</span> · {q.user} · {q.dept}
                      </p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ${q.badgeColor}`}>
                      {q.badge}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Workload + unassigned */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <Card className="p-5 flex-1">
              <p className="text-sm font-bold text-gray-700 mb-4">Technician workload</p>
              <div className="flex flex-col gap-4">
                {technicianWorkload.map((t, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-700 text-xs font-bold flex items-center justify-center shrink-0">
                      {t.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold text-gray-800">{t.name}</p>
                        <span className="text-sm font-bold text-gray-600">{t.tickets}</span>
                      </div>
                      {t.sub && <p className="text-xs text-red-500 -mt-1 mb-1">{t.sub}</p>}
                      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${t.barColor} transition-all`}
                          style={{ width: `${(t.tickets / t.max) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Unassigned alert */}
            <Card className="p-4 bg-[#f5ffe0] border-[#CCFF00]">
              <p className="text-sm font-bold text-gray-800">{metrics.unassignedTickets} tickets unassigned</p>
              <p className="text-xs text-gray-500 mt-1">
                Ifeanyi has the most open work. Assign new tickets to Tunde or Kemi.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
