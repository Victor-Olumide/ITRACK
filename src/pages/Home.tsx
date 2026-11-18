import { Link } from 'react-router'
import { AlertTriangle, Laptop, Plus, ShieldCheck, Ticket, Wrench } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useGetDashboardSummaryQuery } from '../lib/api/dashboard/dashboard-api'
import TicketStatusChart from '../components/dashbaord/ticket-status-chart'
import { getHomepageGreeting } from '../utils/get-homepage-greeting'

function Card({ label, value, note, className = '', to }: { label: string; value: string | number; note: string; className?: string; to?: string }) {
  const body = <article className={`rounded-[18px] border border-[#e9edf6] px-4 py-4 shadow-[0_1px_3px_rgba(16,28,82,0.04)] ${className || 'bg-white'}`}><p className="text-[8px] font-bold uppercase tracking-[.12em] opacity-70">{label}</p><p className="mt-2 text-[28px] font-bold leading-none tracking-tight">{value}</p><p className="mt-2 text-[9px] font-medium opacity-70">{note}</p></article>
  return to ? <Link to={to} className="block rounded-[18px]">{body}</Link> : body
}

export default function Home() {
  const { user } = useAuth()
  const query = useGetDashboardSummaryQuery()
  const summary = query.data
  const greeting = getHomepageGreeting(new Date())
  const firstName = user?.name?.split(/\s+/)[0] || 'there'
  const open = summary ? Object.entries(summary.counts.byStatus).filter(([key]) => !['RESOLVED', 'CLOSED'].includes(key)).reduce((a, [, v]) => a + v, 0) : '—'
  const actions = summary ? [
    ['Breached tickets', summary.needsAction.breachedTickets, '/tickets?queue=overdue', AlertTriangle],
    ['Gate passes waiting', summary.needsAction.gatePassesWaiting, '/gate-passes', ShieldCheck],
    ['Warranties ending soon', summary.needsAction.warrantiesEndingSoon, '/devices', Laptop],
    ['Devices in repair', summary.needsAction.devicesInRepair, '/devices', Wrench],
  ] as const : []
  return <main className="min-h-full px-4 py-5 sm:px-6 sm:py-6 lg:px-7">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-[20px] font-bold tracking-tight text-[#111a3b] sm:text-2xl">{greeting.title.replace(/([.!?])$/, `, ${firstName}$1`)}</h1><p className="mt-1 text-sm text-slate-500">{greeting.subtitle}</p></div><div className="flex gap-2"><Link to="/devices/register" className="rounded-full border border-[#dce2ef] bg-white px-4 py-2 text-xs font-semibold text-[#202844]">Register device</Link><Link to="/tickets/new" className="inline-flex items-center gap-1.5 rounded-full bg-[#3155ff] px-4 py-2 text-xs font-semibold text-white"><Plus size={14}/>New ticket</Link></div></header>
    {query.isError && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">Dashboard data could not be loaded.</p>}
    <section className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4"><Card label="Open tickets" value={query.isLoading ? '…' : open} note="Currently active" to="/tickets"/><Card label="Devices off-site" value="—" note="Checked out through gate" to="/gate-passes"/><Card label="Warranties ending" value={summary?.assetSummary.warrantiesExpiringIn30Days ?? '—'} note="Within 30 days" to="/devices"/><Card label="SLA goal" value={`${summary?.slaGoal.metPercentage ?? 0}%`} note={`Target ${summary?.slaGoal.targetPercentage ?? 90}% · met in 30 days`} className="bg-[#3155ff] text-white"/></section>
    <section className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-5"><div className="rounded-[18px] border border-[#e9edf6] bg-white p-4 sm:p-5 xl:col-span-3"><div className="flex items-start justify-between"><div><h2 className="text-sm font-bold text-[#18203e]">Tickets by category</h2><p className="mt-1 text-xs text-slate-500">Last 30 days</p></div><Ticket size={17} className="text-[#3155ff]"/></div>{query.isLoading ? <p className="py-8 text-center text-sm text-slate-500">Loading analytics…</p> : <TicketStatusChart categories={summary?.categoryBreakdown ?? []}/>}</div><div className="rounded-[18px] border border-[#e9edf6] bg-white p-4 sm:p-5 xl:col-span-2"><div className="flex items-center justify-between"><h2 className="text-sm font-bold text-[#18203e]">Needs action</h2><span className="rounded-full bg-[#efffbb] px-2 py-1 text-[9px] font-bold text-[#526800]">{actions.reduce((a, [, v]) => a + Number(v), 0)}</span></div><div className="mt-2 divide-y divide-[#edf0f7]">{actions.map(([label, value, to, Icon]) => <Link key={label} to={to} className="flex items-center gap-3 py-3 first:pt-1"><span className="rounded-xl bg-[#f3f5fa] p-2 text-[#3155ff]"><Icon size={15}/></span><span className="flex-1 text-xs font-semibold text-[#202844]">{label}</span><span className="text-sm font-bold text-[#111a3b]">{value}</span></Link>)}</div></div></section>
    <section className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-2"><div className="rounded-[18px] border border-[#e9edf6] bg-white p-4 sm:p-5"><div className="flex items-center justify-between"><h2 className="text-sm font-bold text-[#18203e]">Device register</h2><Link to="/devices" className="text-[9px] font-semibold text-[#3155ff]">View register</Link></div><div className="mt-4 grid grid-cols-4 gap-2 text-center">{[['In store', summary?.assetSummary.countsByCondition.reduce((a, x) => a + x.count, 0) ?? 0], ['Assigned', '—'], ['Off-site', '—'], ['In repair', summary?.needsAction.devicesInRepair ?? 0]].map(([label, value]) => <div key={String(label)} className="rounded-xl bg-[#f5f6fa] px-2 py-3"><p className="text-lg font-bold text-[#111a3b]">{value}</p><p className="mt-1 text-[9px] text-slate-500">{label}</p></div>)}</div></div><div className="rounded-[18px] border border-[#e9edf6] bg-white p-4 sm:p-5"><h2 className="text-sm font-bold text-[#18203e]">Technician workload</h2>{summary?.technicianWorkload.length ? <div className="mt-2 divide-y divide-[#edf0f7]">{summary.technicianWorkload.map(item => <div key={item.technicianId} className="flex items-center gap-3 py-2.5"><span className="grid h-7 w-7 place-items-center rounded-full bg-[#3155ff] text-[9px] font-bold text-white">{item.technicianName.split(' ').map(n => n[0]).join('').slice(0, 2)}</span><span className="flex-1 text-xs font-semibold text-[#202844]">{item.technicianName}</span><span className="text-[9px] text-slate-500">{item.openTickets} open · {item.overdueTickets} at risk</span></div>)}</div> : <p className="py-6 text-center text-sm text-slate-500">No technician workload.</p>}</div></section>
  </main>
}
