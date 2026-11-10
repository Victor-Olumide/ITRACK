// Supporting IT admin screens that share the app shell and mock-data model.

import { useMemo, useState } from 'react'
import {
  Activity,
  Bell,
  Check,
  CheckCheck,
  Clock3,
  Cpu,
  MapPin,
  Search,
  ShieldAlert,
  Ticket,
} from 'lucide-react'
import { Link } from 'react-router'
import {
  deviceModels,
  devices,
  gatePasses,
  gateLog,
  metrics,
  tickets,
  ticketsByCategory,
  userById,
} from '../lib/mockData'
import { useAuth } from '../contexts/AuthContext'

function PageHeading({ icon: Icon, title, description, children }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <Icon size={19} className="text-[#3155ff]" />
          <h1 className="text-2xl font-bold tracking-tight text-[#111a3b]">{title}</h1>
        </div>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      {children}
    </div>
  )
}

function Locations() {
  const [query, setQuery] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [newLocation, setNewLocation] = useState('')
  const [addedLocations, setAddedLocations] = useState([])
  const locations = useMemo(() => {
    const counts = new Map()
    devices.forEach((device) => {
      const location = device.location
      counts.set(location, (counts.get(location) ?? 0) + 1)
    })
    addedLocations.forEach((location) => counts.set(location, 0))
    return [...counts].sort((a, b) => b[1] - a[1])
  }, [addedLocations])
  const filtered = locations.filter(([name]) => name.toLowerCase().includes(query.toLowerCase()))

  return (
    <div className="min-h-full px-4 py-5 sm:px-6 sm:py-6 lg:px-7">
      <PageHeading
        icon={MapPin}
        title="Locations"
        description="See where registered devices are assigned, stored, and supported."
      >
        <button
          type="button"
          onClick={() => setShowAdd((open) => !open)}
          className="rounded-full bg-[#3155ff] px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700"
        >
          {showAdd ? 'Cancel' : 'Add location'}
        </button>
      </PageHeading>
      {showAdd && (
        <form
          className="mt-4 flex flex-col gap-2 rounded-2xl border border-[#e9edf6] bg-white p-4 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault()
            const name = newLocation.trim()
            if (name && !locations.some(([location]) => location.toLowerCase() === name.toLowerCase())) {
              setAddedLocations((current) => [...current, name])
              setNewLocation('')
              setShowAdd(false)
            }
          }}
        >
          <label htmlFor="new-location" className="sr-only">Location name</label>
          <input
            id="new-location"
            autoFocus
            required
            value={newLocation}
            onChange={(event) => setNewLocation(event.target.value)}
            placeholder="Location name"
            className="min-w-0 flex-1 rounded-xl border border-[#e3e8f2] px-3 py-2.5 text-sm outline-none focus:border-blue-400"
          />
          <button type="submit" className="rounded-xl bg-[#3155ff] px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
            Save location
          </button>
        </form>
      )}
      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ['Locations', locations.length],
          ['Registered devices', devices.length],
          ['Off-site', devices.filter((device) => device.status === 'Off-site').length],
          ['In repair', devices.filter((device) => device.status === 'In repair').length],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-[#e9edf6] bg-white p-4">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-bold text-[#18203e]">{value}</p>
          </div>
        ))}
      </div>
      <section className="mt-4 overflow-hidden rounded-2xl border border-[#e9edf6] bg-white">
        <div className="flex items-center gap-2 border-b border-[#edf0f7] px-4 py-3">
          <Search size={16} className="text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search locations"
            aria-label="Search locations"
            className="min-w-0 flex-1 text-sm outline-none placeholder:text-slate-400"
          />
        </div>
        <div className="divide-y divide-[#edf0f7]">
          {filtered.map(([name, count]) => (
            <div key={name} className="flex items-center gap-3 px-5 py-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#edf1ff] text-[#3155ff]">
                <MapPin size={17} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[#202844]">{name}</p>
                <p className="text-xs text-slate-500">University location</p>
              </div>
              <span className="rounded-full bg-[#f0f2f8] px-2.5 py-1 text-xs font-semibold text-slate-600">
                {count} {count === 1 ? 'device' : 'devices'}
              </span>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="px-5 py-10 text-center text-sm text-slate-500">No locations found.</p>
          )}
        </div>
      </section>
    </div>
  )
}

function Categories() {
  const [categories, setCategories] = useState(ticketsByCategory)
  const [showAdd, setShowAdd] = useState(false)
  const [newCategory, setNewCategory] = useState('')
  return (
    <div className="min-h-full px-4 py-5 sm:px-6 sm:py-6 lg:px-7">
      <PageHeading
        icon={Clock3}
        title="Categories and SLA"
        description="Keep ticket categories and their response and resolution targets in one place."
      >
        <button
          type="button"
          onClick={() => setShowAdd((open) => !open)}
          className="rounded-full bg-[#3155ff] px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700"
        >
          {showAdd ? 'Cancel' : 'Add category'}
        </button>
      </PageHeading>
      {showAdd && (
        <form
          className="mt-4 flex flex-col gap-2 rounded-2xl border border-[#e9edf6] bg-white p-4 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault()
            const label = newCategory.trim()
            if (label && !categories.some((category) => category.label.toLowerCase() === label.toLowerCase())) {
              setCategories((current) => [...current, { label, value: 0, color: '#3155ff' }])
              setNewCategory('')
              setShowAdd(false)
            }
          }}
        >
          <label htmlFor="new-category" className="sr-only">Category name</label>
          <input
            id="new-category"
            autoFocus
            required
            value={newCategory}
            onChange={(event) => setNewCategory(event.target.value)}
            placeholder="Category name"
            className="min-w-0 flex-1 rounded-xl border border-[#e3e8f2] px-3 py-2.5 text-sm outline-none focus:border-blue-400"
          />
          <button type="submit" className="rounded-xl bg-[#3155ff] px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
            Save category
          </button>
        </form>
      )}
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          ['Target met', '90%', 'SLA goal'],
          ['Currently met', `${metrics.slaMetPercentage}%`, 'Across all tickets'],
          ['Categories', categories.length, 'Active categories'],
        ].map(([label, value, note]) => (
          <div key={label} className="rounded-2xl border border-[#e9edf6] bg-white p-5">
            <p className="text-xs font-medium text-slate-500">{label}</p>
            <p className="mt-1 text-3xl font-bold text-[#18203e]">{value}</p>
            <p className="mt-1 text-xs text-slate-500">{note}</p>
          </div>
        ))}
      </div>
      <section className="mt-4 overflow-x-auto rounded-2xl border border-[#e9edf6] bg-white">
        <table className="w-full min-w-[640px] text-left">
          <thead className="bg-[#f8f9fc] text-[10px] font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-5 py-3">Category</th>
              <th className="px-5 py-3">Tickets · 30 days</th>
              <th className="px-5 py-3">First response</th>
              <th className="px-5 py-3">Resolution</th>
              <th className="px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#edf0f7]">
            {categories.map((category, index) => (
              <tr key={category.label}>
                <td className="px-5 py-4">
                  <span className="flex items-center gap-2 text-sm font-semibold text-[#202844]">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: category.color }} />
                    {category.label}
                  </span>
                </td>
                <td className="px-5 py-4 text-sm text-slate-600">{category.value}</td>
                <td className="px-5 py-4 text-sm text-slate-600">{index < 2 ? '1 working hour' : '4 working hours'}</td>
                <td className="px-5 py-4 text-sm text-slate-600">{index < 2 ? '1 working day' : '3 working days'}</td>
                <td className="px-5 py-4">
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                    Active
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <p className="mt-3 text-xs text-slate-500">
        SLA targets shown are sample settings for this demo workspace.
      </p>
    </div>
  )
}

function AuditTrail() {
  const activity = useMemo(() => [
    ...tickets.flatMap((ticket) => ticket.history.map((entry, index) => ({
      id: `${ticket.id}-${index}`,
      time: entry.time,
      actor: ticket.assigneeId ? userById(ticket.assigneeId)?.name : userById(ticket.requesterId)?.name,
      action: entry.text,
      target: ticket.id,
      kind: 'Ticket',
    }))),
    ...gateLog.map((entry) => ({
      id: entry.id,
      time: entry.time,
      actor: userById(entry.loggedById)?.name ?? 'Security',
      action: `${entry.event} device at ${entry.gate}`,
      target: entry.passId,
      kind: 'Gate',
    })),
  ].sort((a, b) => b.time.localeCompare(a.time)), [])
  const [query, setQuery] = useState('')
  const [kind, setKind] = useState('All activity')
  const filtered = activity.filter((entry) => (
    (kind === 'All activity' || entry.kind === kind)
    && `${entry.actor} ${entry.action} ${entry.target}`.toLowerCase().includes(query.toLowerCase())
  ))

  return (
    <div className="min-h-full px-4 py-5 sm:px-6 sm:py-6 lg:px-7">
      <PageHeading
        icon={Activity}
        title="Audit trail"
        description="A searchable record of ticket updates and device movements."
      />
      <section className="mt-5 overflow-hidden rounded-2xl border border-[#e9edf6] bg-white">
        <div className="flex flex-col gap-3 border-b border-[#edf0f7] p-4 sm:flex-row">
          <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-[#e3e8f2] px-3 py-2.5 text-slate-400">
            <Search size={16} />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search people, actions, or references"
              aria-label="Search audit trail"
              className="min-w-0 flex-1 text-sm text-slate-800 outline-none placeholder:text-slate-400"
            />
          </label>
          <select
            value={kind}
            onChange={(event) => setKind(event.target.value)}
            aria-label="Filter audit activity"
            className="rounded-xl border border-[#e3e8f2] bg-white px-3 py-2.5 text-sm text-slate-700"
          >
            <option>All activity</option>
            <option>Ticket</option>
            <option>Gate</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-left">
            <thead className="bg-[#f8f9fc] text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3">Time</th>
                <th className="px-5 py-3">Person</th>
                <th className="px-5 py-3">Activity</th>
                <th className="px-5 py-3">Reference</th>
                <th className="px-5 py-3">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf0f7]">
              {filtered.map((entry) => (
                <tr key={entry.id}>
                  <td className="whitespace-nowrap px-5 py-3.5 text-xs text-slate-500">{entry.time}</td>
                  <td className="px-5 py-3.5 text-sm font-medium text-[#202844]">{entry.actor ?? 'System'}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-600">{entry.action}</td>
                  <td className="px-5 py-3.5 font-mono text-xs text-[#3155ff]">{entry.target}</td>
                  <td className="px-5 py-3.5 text-xs text-slate-500">{entry.kind}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-500">No matching activity.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function Models() {
  const [uploadedModels, setUploadedModels] = useState([])
  return (
    <div className="min-h-full px-4 py-5 sm:px-6 sm:py-6 lg:px-7">
      <PageHeading
        icon={Cpu}
        title="3D model library"
        description="Manage reusable device models that make the asset register easier to inspect."
      >
        <label className="cursor-pointer rounded-full bg-[#3155ff] px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700">
          Upload .glb
          <input
            type="file"
            accept=".glb,model/gltf-binary"
            className="sr-only"
            aria-label="Upload a GLB model"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) setUploadedModels((current) => [...current, file.name])
              event.target.value = ''
            }}
          />
        </label>
      </PageHeading>
      {uploadedModels.length > 0 && (
        <p className="mt-3 text-xs text-slate-500">
          Selected for this session: {uploadedModels.join(', ')}. Model files are not uploaded or saved in this demo.
        </p>
      )}
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {deviceModels.map((model) => (
          <article key={model.id} className="overflow-hidden rounded-2xl border border-[#e9edf6] bg-white">
            <div className="flex h-36 items-center justify-center bg-gradient-to-br from-[#eef2fc] to-[#e5ebfa] text-[#65729a]">
              <Cpu size={48} strokeWidth={1.2} />
            </div>
            <div className="p-4">
              <h2 className="text-sm font-bold text-[#202844]">{model.name}</h2>
              <p className="mt-1 text-xs text-slate-500">Shared model · GLB · CC0</p>
              <div className="mt-4 flex items-center justify-between border-t border-[#edf0f7] pt-3">
                <span className="text-xs text-slate-500">Used by {model.count} devices</span>
                <Link
                  to="/devices"
                  className="rounded-full bg-[#edf1ff] px-3 py-1.5 text-[11px] font-semibold text-[#3155ff] hover:bg-[#e1e8ff]"
                >
                  View devices
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

const INITIAL_NOTIFICATIONS = [
  ...tickets.filter((item) => item.status !== 'Resolved' && ['Breached', 'At risk'].includes(item.timeState))
    .map((item) => ({
      id: `ticket-${item.id}`,
      category: 'Tickets',
      title: `${item.id} ${item.timeState.toLowerCase()}`,
      detail: `${item.title} · ${userById(item.assigneeId)?.name ?? 'Unassigned'} · ${item.resolution}`,
      unread: true,
      Icon: item.timeState === 'Breached' ? ShieldAlert : Ticket,
      tone: item.timeState === 'Breached' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700',
    })),
  ...gatePasses.filter((item) => item.status === 'Waiting').map((item) => ({
    id: `pass-${item.id}`,
    category: 'Gate passes',
    title: `Gate pass waiting: ${item.id}`,
    detail: `${userById(item.requesterId)?.name ?? 'Requester'} · ${item.items.length} items · back ${item.returnDate}`,
    unread: true,
    Icon: Bell,
    tone: 'bg-violet-50 text-violet-700',
  })),
  ...gateLog.slice(0, 2).map((item) => ({
    id: `gate-${item.id}`,
    category: 'Security',
    title: `Device ${item.event === 'Back' ? 'back on site' : 'checked out'}`,
    detail: `${devices.find((device) => device.id === item.deviceId)?.tag ?? 'Device'} · ${userById(item.loggedById)?.name ?? 'Security'} · ${item.time}`,
    unread: false,
    Icon: item.event === 'Back' ? Check : ShieldAlert,
    tone: item.event === 'Back' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600',
  })),
]

function Notifications({ viewer }) {
  const [items, setItems] = useState(INITIAL_NOTIFICATIONS)
  const [filter, setFilter] = useState('All')
  const filters = ['All', 'Unread', 'Tickets', 'Gate passes', 'Security', 'Stock']
  const visible = items.filter((item) => (
    filter === 'All'
    || (filter === 'Unread' ? item.unread : item.category === filter)
  ))
  const unreadCount = items.filter((item) => item.unread).length

  return (
    <div className="min-h-full px-4 py-5 sm:px-6 sm:py-6 lg:px-7">
      <PageHeading
        icon={Bell}
        title="Notifications"
        description={`${unreadCount} unread`}
      >
        <button
          type="button"
          onClick={() => setItems((current) => current.map((item) => ({ ...item, unread: false })))}
          disabled={unreadCount === 0}
          className="inline-flex items-center gap-2 rounded-full border border-[#dce2ef] bg-white px-4 py-2.5 text-xs font-semibold text-[#202844] transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <CheckCheck size={15} />
          Mark all read
        </button>
      </PageHeading>
      <section className="mt-5 overflow-hidden rounded-2xl border border-[#e9edf6] bg-white">
        <div className="flex gap-1 overflow-x-auto border-b border-[#edf0f7] px-4 pt-3">
          {filters.map((name) => {
            const count = name === 'Unread'
              ? unreadCount
              : name === 'All'
                ? items.length
                : items.filter((item) => item.category === name).length
            return (
              <button
                key={name}
                type="button"
                onClick={() => setFilter(name)}
                className={`shrink-0 rounded-t-lg border-b-2 px-3 py-2 text-xs font-semibold ${
                  filter === name
                    ? 'border-[#3155ff] text-[#3155ff]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {name} <span className="ml-1 text-[10px] opacity-70">{count}</span>
              </button>
            )
          })}
        </div>
        <div className="divide-y divide-[#edf0f7]">
          {visible.map(({ id, title, detail, unread, Icon, tone }) => (
            <article key={id} className={`flex gap-3 px-4 py-4 sm:px-5 ${unread ? 'bg-[#fbfcff]' : ''}`}>
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tone}`}>
                <Icon size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[#202844]">{title}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>
              </div>
              {unread && (
                <button
                  type="button"
                  onClick={() => setItems((current) => current.map((item) => (
                    item.id === id ? { ...item, unread: false } : item
                  )))}
                  className="shrink-0 self-center text-[11px] font-semibold text-[#3155ff] hover:underline"
                  aria-label={`Mark ${title} as read`}
                >
                  Mark read
                </button>
              )}
            </article>
          ))}
          {visible.length === 0 && (
            <p className="px-5 py-12 text-center text-sm text-slate-500">You&apos;re all caught up.</p>
          )}
        </div>
      </section>
      <p className="mt-4 text-right text-xs text-slate-500">
        Notifications for {viewer.name}
      </p>
    </div>
  )
}

export default function AdminWorkspace({ section }) {
  const { user } = useAuth()
  if (section === 'locations') return <Locations />
  if (section === 'categories') return <Categories />
  if (section === 'audit') return <AuditTrail />
  if (section === 'models') return <Models />
  if (section === 'notifications') {
    return <Notifications viewer={user} />
  }
  return null
}
