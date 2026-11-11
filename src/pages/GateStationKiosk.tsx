import { useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Circle,
  LogIn,
  LogOut,
  ScanLine,
  ShieldAlert,
  X,
} from 'lucide-react'
import { devices, gateLog as initialGateLog, gatePasses, userById, deviceById, deviceByTag } from '../lib/data/mockData'
import { useAppDispatch, useAppSelector } from '../lib/stores/hooks'
import { addGateEvents } from '../lib/stores/demo-data-slice'
import { useAuth } from '../contexts/AuthContext'
import type { GateEventType, GateLogEntry, GatePass, GatePassItem, PublicUser } from '../lib/types/types'

interface ActivePass {
  pass: GatePass
  direction: 'Out' | 'Back'
  verifiedTags: string[]
  lastScannedTag: string
}

interface GateNotice {
  kind: 'error' | 'warning' | 'success'
  text: string
}

function eventTime(entry: GateLogEntry) {
  return entry.occurredAt ?? Date.parse(entry.time)
}

function tagForEvent(entry: GateLogEntry) {
  return entry.assetTag ?? deviceById(entry.deviceId)?.tag
}

function formatTime(entry: GateLogEntry) {
  const date = new Date(eventTime(entry))
  return Number.isNaN(date.getTime())
    ? entry.time
    : new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' }).format(date)
}

function formatDate(value: string) {
  if (!value) return '—'
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(date)
}

function StatusPill({ event }: { event: GateEventType }) {
  const styles = {
    Out: 'bg-violet-900/80 text-violet-200',
    Back: 'bg-emerald-900/80 text-emerald-200',
    Stopped: 'bg-red-900/80 text-red-200',
  }
  return (
    <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${styles[event] ?? styles.Stopped}`}>
      {event}
    </span>
  )
}

function EntryRow({ entry, users }: { entry: GateLogEntry; users: PublicUser[] }) {
  const device = deviceById(entry.deviceId)
  const tag = tagForEvent(entry)
  const person = users.find((item) => item.id === entry.personId) ?? userById(entry.personId)
  const itemName = entry.itemName ?? (device ? `${device.make} ${device.model}` : 'Device')
  return (
    <div className="flex items-center gap-2.5 py-2.5 text-[11px]">
      <time className="shrink-0 font-mono text-slate-400">{formatTime(entry)}</time>
      <div className="min-w-0 flex-1">
        <p className="truncate font-mono font-semibold text-slate-200">{tag ?? 'Unregistered item'}</p>
        <p className="truncate text-slate-400">{person?.name ?? 'Unknown person'} · {itemName}</p>
      </div>
      <StatusPill event={entry.event} />
    </div>
  )
}

function PassItem({ item, checked, onToggle, isMain }: {
  item: GatePassItem
  checked: boolean
  onToggle: () => void
  isMain: boolean
}) {
  const device = deviceByTag(item.tag)
  const name = item.name ?? item.type ?? (device ? device.category.replace(/s$/, '') : 'Accessory')
  const description = item.make ?? `${device?.make ?? ''} ${device?.model ?? ''}`.trim()
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={checked}
      className="grid w-full grid-cols-[24px_minmax(75px,0.8fr)_minmax(95px,1fr)_minmax(110px,1.3fr)_minmax(110px,1.2fr)] items-center gap-2 border-b border-emerald-950/10 px-2 py-2 text-left last:border-b-0 hover:bg-white/50"
    >
      <span className={`flex h-5 w-5 items-center justify-center rounded-md border ${checked ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-emerald-700/40 bg-white text-transparent'}`}>
        {checked ? <Check size={14} strokeWidth={3} /> : <Circle size={14} />}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[11px] font-bold text-slate-800">{name}</span>
        {isMain && <span className="text-[9px] text-emerald-800">Main device</span>}
      </span>
      <span className="truncate font-mono text-[10px] text-slate-700">{item.tag}</span>
      <span className="truncate text-[10px] text-slate-600">{description || '—'}</span>
      <span className="truncate font-mono text-[10px] text-slate-700">{item.serial ?? device?.serialNumber ?? 'No serial listed'}</span>
    </button>
  )
}

export default function GateStationKiosk({ kiosk = false }: { kiosk?: boolean }) {
  const { user, users, logout } = useAuth()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { submittedPasses, gatePassStatusUpdates: statusUpdates, gateEvents } = useAppSelector((state) => state.demoData)
  const allPasses = [...gatePasses, ...submittedPasses]
  const entries = [...gateEvents, ...initialGateLog].sort((a, b) => eventTime(b) - eventTime(a))
  const tagInputRef = useRef<HTMLInputElement>(null)
  const [tag, setTag] = useState('')
  const [active, setActive] = useState<ActivePass | null>(null)
  const [notice, setNotice] = useState<GateNotice | null>(null)

  const today = new Date().toDateString()
  const todayEntries = entries.filter((entry) => new Date(eventTime(entry)).toDateString() === today)
  const outCount = todayEntries.filter((entry) => entry.event === 'Out').length
  const backCount = todayEntries.filter((entry) => entry.event === 'Back').length
  const stoppedCount = todayEntries.filter((entry) => entry.event === 'Stopped').length

  function latestEventForTag(assetTag: string) {
    return entries
      .filter((entry) => tagForEvent(entry) === assetTag)
      .sort((a, b) => eventTime(b) - eventTime(a))[0]
  }

  function scanTag(rawTag: string) {
    const scannedTag = rawTag.trim().toUpperCase()
    if (!scannedTag) return

    const itemPasses = allPasses
      .filter((pass) => pass.items.some((item) => item.tag.toUpperCase() === scannedTag))
      .sort((a, b) => b.outDate.localeCompare(a.outDate))
    if (!itemPasses.length) {
      setActive(null)
      setNotice({ kind: 'error', text: `No gate pass lists ${scannedTag}. Check the tag and scan again.` })
      return
    }

    const latest = latestEventForTag(scannedTag)
    const device = deviceByTag(scannedTag)
    const checkedOut = latest ? latest.event === 'Out' : device?.status === 'Off-site'
    let pass: GatePass | undefined
    let direction: 'Out' | 'Back'

    if (checkedOut) {
      direction = 'Back'
      pass = latest?.passId && latest.passId !== '—'
        ? allPasses.find((item) => item.id === latest.passId)
        : itemPasses.find((item) => (statusUpdates[item.id] ?? item.status) === 'Approved')
      if (!pass) {
        setActive(null)
        setNotice({ kind: 'error', text: `${scannedTag} is out, but no matching pass could be identified. Ask an administrator to reconcile the gate log.` })
        return
      }
    } else {
      direction = 'Out'
      pass = itemPasses[0]
    }

    if (active?.pass.id === pass.id && active.direction === direction) {
      const verified = new Set(active.verifiedTags)
      verified.add(scannedTag)
      setActive({ ...active, verifiedTags: [...verified], lastScannedTag: scannedTag })
      setNotice({ kind: 'success', text: `${scannedTag} verified against ${pass.id}.` })
    } else {
      setActive({
        pass,
        direction,
        verifiedTags: [scannedTag],
        lastScannedTag: scannedTag,
      })
      const approval = statusUpdates[pass.id] ?? pass.status
      setNotice(
        direction === 'Out' && approval !== 'Approved'
          ? { kind: 'warning', text: `${pass.id} is ${approval.toLowerCase()}. Verify the items, but exit remains blocked until IT approves the pass.` }
          : { kind: 'success', text: `${pass.id} loaded. Verify each listed item before logging ${direction === 'Out' ? 'exit' : 'return'}.` },
      )
    }
    setTag('')
  }

  function toggleItem(itemTag: string) {
    if (!active) return
    const verified = new Set(active.verifiedTags)
    if (verified.has(itemTag)) verified.delete(itemTag)
    else verified.add(itemTag)
    setActive({ ...active, verifiedTags: [...verified] })
  }

  function finishMovement(eventType: GateEventType | undefined = active?.direction) {
    if (!active || !eventType || !user) return
    const approved = (statusUpdates[active.pass.id] ?? active.pass.status) === 'Approved'
    if (eventType === 'Out' && !approved) {
      setNotice({ kind: 'error', text: 'This pass is not approved. Items cannot leave the site.' })
      return
    }

    const missing = active.pass.items.filter((item) => !active.verifiedTags.includes(item.tag))
    if (eventType !== 'Stopped' && missing.length) {
      setNotice({ kind: 'warning', text: `Verify all items first. ${missing.length} ${missing.length === 1 ? 'item remains' : 'items remain'} unchecked.` })
      return
    }

    const now = Date.now()
    const itemsToLog = eventType === 'Stopped'
      ? active.pass.items.filter((item) => item.tag === active.lastScannedTag)
      : active.pass.items
    const newEntries = itemsToLog.map((item, index) => {
      const device = deviceByTag(item.tag)
      return {
        id: `GL-${now}-${index}`,
        time: new Date(now + index).toLocaleString(),
        occurredAt: now + index,
        event: eventType,
        deviceId: device?.id ?? null,
        assetTag: item.tag,
        itemName: item.name ?? item.type ?? item.make ?? (device ? `${device.make} ${device.model}` : 'Item'),
        personId: active.pass.requesterId,
        gate: 'Gate A',
        passId: active.pass.id,
        loggedById: user.id,
      }
    })
    dispatch(addGateEvents(newEntries))
    setNotice({
      kind: eventType === 'Stopped' ? 'error' : 'success',
      text: eventType === 'Out'
        ? `${active.pass.id} cleared to leave. ${active.pass.items.length} ${active.pass.items.length === 1 ? 'item' : 'items'} logged out.`
        : eventType === 'Back'
          ? `${active.pass.id} return recorded. ${active.pass.items.length} ${active.pass.items.length === 1 ? 'item' : 'items'} checked in.`
          : `${active.pass.id} stopped and recorded in the gate log.`,
    })
    setActive(null)
  }

  async function exitKiosk() {
    if (kiosk) {
      try {
        await logout()
        navigate('/login', { replace: true })
      } catch {
        setNotice({ kind: 'error', text: 'Could not sign out. Check your connection and try again.' })
      }
    } else {
      navigate('/')
    }
  }

  const requester = active ? users.find((item) => item.id === active.pass.requesterId) ?? userById(active.pass.requesterId) : null
  const mainItem = active?.pass.items.find((item) => deviceByTag(item.tag)) ?? active?.pass.items[0]
  const mainDevice = mainItem ? deviceByTag(mainItem.tag) : null
  const verifiedCount = active?.verifiedTags.length ?? 0
  const allChecked = Boolean(active && active.pass.items.length && verifiedCount === active.pass.items.length)
  const passStatus = active ? statusUpdates[active.pass.id] ?? active.pass.status : null
  const allowedToLeave = active?.direction !== 'Out' || passStatus === 'Approved'
  const latestEntries = entries.slice(0, 7)

  return (
    <div className={`gate-station flex min-h-screen flex-col bg-[#071238] text-white ${kiosk ? 'fixed inset-0 z-50' : ''}`}>
      <header className="flex min-h-11 items-center gap-2 border-b border-white/10 px-4 py-2">
        <img src="/favicon.svg" alt="" className="h-5 w-5" />
        <span className="text-xs font-bold">Gate station · Gate A</span>
        <span className="rounded-full bg-[#1d2e70] px-2.5 py-1 text-[9px] font-semibold text-slate-300">Kiosk mode</span>
        <div className="ml-auto flex items-center gap-3 text-[10px] text-slate-400">
          <span className="hidden items-center gap-1.5 sm:flex"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Scanner input ready · {user?.name} on duty</span>
          <button type="button" onClick={exitKiosk} className="rounded-md border border-white/20 px-2.5 py-1.5 text-[10px] font-semibold text-white hover:bg-white/10">
            Exit kiosk
          </button>
        </div>
      </header>

      <main className="grid min-h-0 flex-1 grid-cols-1 gap-3 p-3 lg:grid-cols-[minmax(0,1fr)_290px]">
        <section className={`flex min-h-[70vh] flex-col rounded-[22px] p-4 sm:p-6 lg:min-h-0 lg:p-8 ${active && passStatus === 'Approved' ? 'bg-[#c9f3df] text-[#073d27]' : 'bg-[#eef2fb] text-[#111a38]'}`}>
          <form
            onSubmit={(event) => {
              event.preventDefault()
              scanTag(tag)
              window.setTimeout(() => tagInputRef.current?.focus(), 0)
            }}
            className="mb-5 flex flex-wrap items-center gap-2"
          >
            <label htmlFor="gate-item-tag" className="sr-only">Scan or enter an item tag</label>
            <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-slate-300/80 bg-white px-3 py-2.5 text-slate-600">
              <ScanLine size={17} className="shrink-0 text-[#3155ff]" />
              <input
                id="gate-item-tag"
                ref={tagInputRef}
                autoFocus
                value={tag}
                onChange={(event) => setTag(event.target.value)}
                placeholder="Scan or enter an item tag"
                autoComplete="off"
                className="min-w-0 flex-1 bg-transparent font-mono text-sm text-slate-800 outline-none placeholder:font-sans placeholder:text-slate-400"
              />
            </div>
            <button type="submit" className="rounded-xl bg-[#3155ff] px-5 py-3 text-sm font-bold text-white hover:bg-blue-700">
              Check pass
            </button>
            {active && (
              <button type="button" onClick={() => { setActive(null); setNotice(null) }} aria-label="Clear current pass" className="rounded-xl border border-slate-300 p-3 text-slate-600 hover:bg-white">
                <X size={16} />
              </button>
            )}
          </form>

          {notice && (
            <div role="status" className={`mb-4 flex items-start gap-2 rounded-xl px-3 py-2.5 text-xs font-medium ${
              notice.kind === 'error' ? 'bg-red-100 text-red-800'
                : notice.kind === 'warning' ? 'bg-amber-100 text-amber-900'
                  : 'bg-emerald-100 text-emerald-900'
            }`}>
              {notice.kind === 'error' ? <ShieldAlert size={16} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={16} className="mt-0.5 shrink-0" />}
              {notice.text}
            </div>
          )}

          {active ? (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-full ${allowedToLeave && passStatus === 'Approved' ? 'bg-emerald-600 text-white' : 'bg-amber-400 text-amber-950'}`}>
                  {allowedToLeave && passStatus === 'Approved' ? <Check size={29} strokeWidth={3} /> : <ShieldAlert size={24} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-2xl font-extrabold tracking-tight sm:text-4xl ${allowedToLeave && passStatus === 'Approved' ? 'text-emerald-900' : 'text-[#111a38]'}`}>
                    {active.direction === 'Back'
                      ? 'Return check'
                      : passStatus === 'Approved'
                        ? allChecked ? 'Cleared to leave' : 'Verify every item'
                        : passStatus === 'Waiting' ? 'Pass needs approval' : 'Pass not approved'}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">Pass {active.pass.id} · {active.direction === 'Back' ? 'returning items' : 'outbound check'} · {passStatus}</p>
                </div>
                <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-bold text-slate-700">
                  {verifiedCount} of {active.pass.items.length} verified
                </span>
              </div>

              <div className="mt-5 grid gap-2 sm:grid-cols-3">
                <div className="rounded-2xl bg-white/75 p-3">
                  <p className="text-[10px] text-slate-500">Carried by</p>
                  <p className="mt-0.5 font-bold text-slate-900">{requester?.name ?? 'Requester not found'}</p>
                  <p className="text-[10px] text-slate-600">{requester?.department ?? '—'}{requester?.staffId ? ` · Staff ID ${requester.staffId}` : ''}</p>
                </div>
                <div className="rounded-2xl bg-white/75 p-3">
                  <p className="text-[10px] text-slate-500">Main device</p>
                  <p className="mt-0.5 truncate font-bold text-slate-900">{mainDevice ? `${mainDevice.make} ${mainDevice.model}` : mainItem?.make ?? '—'}</p>
                  <p className="truncate font-mono text-[10px] text-slate-600">{mainItem?.tag ?? '—'}{mainItem?.serial ? ` · SN ${mainItem.serial}` : ''}</p>
                </div>
                <div className="rounded-2xl bg-white/75 p-3">
                  <p className="text-[10px] text-slate-500">Pass · {active.direction === 'Back' ? 'Return by' : 'Destination'}</p>
                  <p className="mt-0.5 truncate font-bold text-slate-900">{active.direction === 'Back' ? `Back by ${formatDate(active.pass.returnDate)}` : active.pass.destination}</p>
                  <p className="truncate text-[10px] text-slate-600">{active.direction === 'Back' ? 'Items being checked back in' : active.pass.destination}</p>
                </div>
              </div>

              <section className="mt-3 overflow-hidden rounded-2xl bg-white/80">
                <div className="flex items-center justify-between gap-2 border-b border-emerald-950/10 px-3 py-2">
                  <h2 className="text-xs font-bold text-[#111a38]">Check every item against its tag and serial</h2>
                  <span className={`shrink-0 text-[11px] font-bold ${allChecked ? 'text-emerald-700' : 'text-amber-700'}`}>{verifiedCount} of {active.pass.items.length} seen</span>
                </div>
                {active.pass.items.map((item, index) => (
                  <PassItem
                    key={`${item.tag}-${index}`}
                    item={item}
                    checked={active.verifiedTags.includes(item.tag)}
                    onToggle={() => toggleItem(item.tag)}
                    isMain={item.tag === mainItem?.tag}
                  />
                ))}
              </section>

              <div className="mt-3 rounded-xl bg-white/70 px-3 py-2 text-[10px] text-slate-600">
                <p className="font-semibold text-slate-800">Pass issued by {userById(active.pass.issuedById)?.name ?? 'IT Department'}</p>
                <p>Requester: {requester?.name ?? '—'} · Pass record {active.pass.id}</p>
              </div>

              <div className="mt-auto flex flex-wrap gap-2 pt-5">
                <button
                  type="button"
                  disabled={!allChecked || !allowedToLeave}
                  onClick={() => finishMovement()}
                  className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-emerald-900/30 disabled:text-white/70"
                >
                  {active.direction === 'Back' ? 'Log return' : 'Log exit'}
                  <ArrowRight size={17} />
                </button>
                <button
                  type="button"
                  onClick={() => finishMovement('Stopped')}
                  className="min-h-12 rounded-xl border border-red-300 px-4 py-3 text-sm font-bold text-red-800 hover:bg-red-50"
                >
                  Stop / flag
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#3155ff] text-white">
                <ScanLine size={38} />
              </div>
              <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-[#111a38] sm:text-5xl">Scan an item to begin</h1>
              <p className="mt-2 max-w-md text-sm text-slate-600">Scan any tag listed on the gate pass. We’ll load the pass and let you verify each item before logging the movement.</p>
              <p className="mt-5 rounded-full bg-white px-4 py-2 font-mono text-xs text-slate-500">Scanner supports keyboard input · manual entry available</p>
            </div>
          )}
        </section>

        <aside className="flex min-h-[420px] flex-col gap-3 lg:min-h-0">
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Out', count: outCount, Icon: LogOut, tone: 'bg-[#1b347b]' },
              { label: 'Back', count: backCount, Icon: LogIn, tone: 'bg-[#1b347b]' },
              { label: 'Stopped', count: stoppedCount, Icon: ShieldAlert, tone: 'bg-[#512020]' },
            ].map(({ label, count, Icon, tone }) => (
              <div key={label} className={`rounded-2xl ${tone} p-3`}>
                <div className="flex items-center gap-1 text-[10px] text-slate-300"><Icon size={12} /> {label}</div>
                <p className="mt-0.5 text-2xl font-extrabold leading-none">{count}</p>
              </div>
            ))}
          </div>

          <section className="flex min-h-[250px] flex-1 flex-col rounded-2xl bg-[#1b347b] p-3">
            <div className="mb-1 flex items-center justify-between">
              <h2 className="text-xs font-bold">Recent gate activity</h2>
              <span className="text-[10px] text-slate-400">{entries.length} total events</span>
            </div>
            <div className="divide-y divide-white/10">
              {latestEntries.map((entry) => <EntryRow key={entry.id} entry={entry} users={users} />)}
              {latestEntries.length === 0 && <p className="py-5 text-xs text-slate-400">No gate activity recorded.</p>}
            </div>
            <p className="mt-auto pt-3 text-[10px] font-semibold text-[#d2f54a]">Today · {todayEntries.length} events · Gate A</p>
          </section>

          <section className="rounded-2xl bg-[#1b347b] p-3">
            <p className="mb-2 text-[10px] text-slate-400">Quick scan · prototype tag entry</p>
            <div className="flex flex-wrap gap-1.5">
              {devices.slice(0, 2).map((device) => (
                <button key={device.id} type="button" onClick={() => scanTag(device.tag)} className="rounded-lg bg-[#3155ff] px-2.5 py-2 font-mono text-[9px] font-bold text-white hover:bg-blue-600">
                  {device.tag}
                </button>
              ))}
              <span className="rounded-lg border border-white/15 px-2.5 py-2 text-[9px] font-semibold text-slate-300">
                {allPasses.filter((pass) => (statusUpdates[pass.id] ?? pass.status) === 'Waiting').length} waiting
              </span>
            </div>
          </section>
        </aside>
      </main>
    </div>
  )
}
