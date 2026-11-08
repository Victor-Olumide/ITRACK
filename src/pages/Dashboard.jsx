import React from 'react'
import { Link } from 'react-router'
import { TbArrowUpRight } from 'react-icons/tb'
import { MdAdd } from 'react-icons/md'

// ── tiny helpers ──────────────────────────────────────────────
function Card({ className = '', children }) {
  return (
    <div className={` rounded-2xl border border-gray-100 shadow-sm ${className}`}>
      {children}
    </div>
  )
}

function StatCard({ label, value, sub, subColor = 'text-red-500', arrow = true }) {
  return (
    <Card className="p-5 flex flex-col gap-1 relative">
      {arrow && (
        <TbArrowUpRight className="absolute top-4 right-4 text-gray-300" size={16} />
      )}
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">{label}</p>
      <p className="text-4xl font-extrabold text-gray-900">{value}</p>
      {sub && <p className={`text-xs font-medium ${subColor} flex items-center gap-1`}>{sub}</p>}
    </Card>
  )
}

// ── bar chart (pure CSS) ──────────────────────────────────────
const BAR_DATA = [
  { label: 'Printer',     value: 31, color: '#254BFE' },
  { label: 'Requests',    value: 27, color: '#ADD900' },
  { label: 'Network',     value: 24, color: '#8159FF' },
  { label: 'PC hardware', value: 19, color: '#FF6E2F' },
  { label: 'Software',    value: 15, color: '#00A9A6' },
  { label: 'Accounts',    value: 9,  color: '#0B184C' },
]
const MAX_VAL = 35

const CHART_H = 140 // px — fixed bar area height

function BarChart() {
  return (
    <div className="flex items-end justify-between gap-2 px-1">
      {BAR_DATA.map(({ label, value, color }) => {
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

// ── needs action items ────────────────────────────────────────
const ACTIONS = [
  {
    color: 'bg-red-100 text-red-600',
    num: '!',
    title: '1 ticket breached its target',
    desc: 'IT-0181 has passed its 8 hour resolution time.',
    link: 'Open ticket',
  },
  {
    color: 'bg-gray-100 text-gray-500',
    num: '?',
    title: '2 gate passes waiting',
    desc: 'Devices can only leave once you approve them.',
    link: 'Review passes',
  },
  {
    color: 'bg-yellow-100 text-yellow-600',
    num: '!',
    title: '4 warranties ending soon',
    desc: 'Renew or claim before cover runs out.',
    link: 'View devices',
  },
  {
    color: 'bg-blue-100 text-blue-600',
    num: 'i',
    title: '5 devices in repair',
    desc: 'Two have been in repair for over a week.',
    link: 'View repairs',
  },
]

// ── today's queue ─────────────────────────────────────────────
const QUEUE = [
  {
    title: 'PC switches off during work',
    id: 'IT-0181', cat: 'PC hardware', user: 'Bola K.', dept: 'Finance',
    badge: 'Breached 1h 20m', badgeColor: 'bg-red-50 text-red-600 border border-red-200',
  },
  {
    title: 'Need a new mouse',
    id: 'IT-0169', cat: 'Requests', user: 'Yusuf B.', dept: 'Operations',
    badge: 'At risk · 5h left', badgeColor: 'bg-orange-50 text-orange-600 border border-orange-200',
  },
  {
    title: 'Printer keeps showing a paper jam',
    id: 'IT-0187', cat: 'Printer', user: 'Amaka O.', dept: 'Finance',
    badge: '7h 40m left', badgeColor: 'bg-green-50 text-green-700 border border-green-200',
  },
  {
    title: 'Fan very loud on desktop',
    id: 'IT-0175', cat: 'PC hardware', user: 'Chidi N.', dept: 'HR',
    badge: '20h left', badgeColor: 'bg-green-50 text-green-700 border border-green-200',
  },
]

// ── technician workload ───────────────────────────────────────
const TECHS = [
  { initials: 'IO', name: 'Ifeanyi O.', sub: '2 at risk',   tickets: 5, barColor: 'bg-orange-500', max: 6 },
  { initials: 'TA', name: 'Tunde A.',   sub: '1 breached',  tickets: 4, barColor: 'bg-blue-600',   max: 6 },
  { initials: 'KS', name: 'Kemi S.',    sub: '',            tickets: 4, barColor: 'bg-blue-600',   max: 6 },
  { initials: 'SB', name: 'Sade B.',    sub: '',            tickets: 4, barColor: 'bg-blue-600',   max: 6 },
]

// ── device register bar ───────────────────────────────────────
const DEVICE_SEGS = [
  { pct: 68, color: 'bg-blue-600'   },
  { pct: 23, color: 'bg-[#CCFF00]' },
  { pct: 4,  color: 'bg-violet-500' },
  { pct: 3,  color: 'bg-orange-500' },
  { pct: 2,  color: 'bg-gray-400'   },
]

// ─────────────────────────────────────────────────────────────
export default function Dashboard() {
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  return (
    <div className=' bg-linear-to-br from-[#0B184C] to-[#0A174B] p-4'> 
    <div className="flex flex-col gap-5 min-h-full rounded-xl bg-gray-50 p-5">

      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Good morning, Ngozi</h1>
          <p className="text-sm text-gray-400 mt-0.5">{today} · 6 tickets are waiting for someone</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 rounded-full border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
            Register device
          </button>
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition">
            <MdAdd size={16} />
            New ticket
          </button>
        </div>
      </div>

      {/* ── Top stat row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Open Tickets"
          value="23"
          sub={<><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> 6 unassigned</>}
        />
        <StatCard
          label="Devices Off-Site"
          value="6"
          sub={<><span className="w-2 h-2 rounded-full bg-orange-500 inline-block" /> 1 return overdue</>}
          subColor="text-orange-500"
        />
        <StatCard
          label="Warranties Ending"
          value="4"
          sub={<><span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" /> Within 30 days</>}
          subColor="text-yellow-600"
        />

        {/* SLA goal card */}
        <Card className="p-5 bg-[#244BFE] text-white flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full text-black bg-[#CFF231]">SLA goal</span>
            <span className="text-xs text-slate-200">Target 90%</span>
          </div>
          <div className="flex items-center justify-start gap-4">
          <p className="text-4xl font-extrabold text-white">87%</p>
          <p className="text-xs text-slate-200">met in 30 days</p>
          </div>
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full bg-[#CCFF00]" style={{ width: '87%' }} />
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
            Needs action <span className="ml-1 text-xs font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">4</span>
          </p>
          <div className="flex flex-col divide-y divide-gray-50">
            {ACTIONS.map((a, i) => (
              <div key={i} className="py-3 flex gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${a.color}`}>
                  {a.num}
                </div>
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-semibold text-gray-800">{a.title}</p>
                  <p className="text-xs text-gray-400">{a.desc}</p>
                  <a href="#" className="text-xs text-blue-600 hover:underline mt-0.5 inline-flex items-center gap-0.5">
                    {a.link}
                    <TbArrowUpRight size={12} />
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
              <span className="text-xs text-gray-400">150 devices</span>
            </div>
            <div className="flex h-2.5 rounded-full overflow-hidden gap-0.5">
              {DEVICE_SEGS.map((s, i) => (
                <div key={i} className={`${s.color}`} style={{ width: `${s.pct}%` }} />
              ))}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
              {[
                { color: 'bg-blue-600',    label: '102 Assigned'  },
                { color: 'bg-[#CCFF00]',  label: '34 In store'   },
                { color: 'bg-violet-500',  label: '6 Off-site'    },
                { color: 'bg-orange-500',  label: '5 In repair'   },
                { color: 'bg-gray-400',    label: '3 Retired'     },
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
                Today's queue <span className="ml-1 text-xs font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">4</span>
              </p>
              <a href="#" className="text-xs text-blue-600 hover:underline">See all</a>
            </div>

            <div className="flex flex-col divide-y divide-gray-50">
              {QUEUE.map((q, i) => (
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
              {TECHS.map((t, i) => (
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
            <p className="text-sm font-bold text-gray-800">6 tickets unassigned</p>
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
