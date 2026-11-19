import { useState } from 'react'
import type { FormEvent } from 'react'
import { Check, ScanLine, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import {
  useGetGateLogQuery,
  useLazyGateCheckQuery,
  useLogGateStopMutation,
  useMarkGateExitMutation,
  useMarkGateReturnMutation,
} from '../lib/api/gates/gates-api'
import type { GateCheckResult, GatePass } from '../lib/api/gates/types'
import { formatDateTime, formatDay, formatShortDay, formatTime } from '../lib/api/gates/gate-pass-format'
import { getApiErrorMessage } from '../lib/api/error-message'

const GATE_NAME_KEY = 'itrack:gate-name'

function readGateName() {
  try {
    return localStorage.getItem(GATE_NAME_KEY) || 'Gate A'
  } catch {
    return 'Gate A'
  }
}

function startOfToday() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
}

const EVENT_STYLE = {
  EXIT: { label: 'Out', className: 'bg-[#3B2D7A] text-[#E6DEFF]' },
  RETURN: { label: 'Back', className: 'bg-[#14452B] text-[#C8F2D9]' },
  STOPPED: { label: 'Stopped', className: 'bg-[#5A1A15] text-[#FFD6D1]' },
} as const

function ItemChecklist({
  pass,
  ticked,
  onToggle,
  mode,
}: {
  pass: GatePass
  ticked: Record<string, boolean>
  onToggle: (id: string) => void
  mode: 'exit' | 'return'
}) {
  const items = mode === 'return' ? pass.items.filter((item) => !item.returnedAt) : pass.items
  const seen = items.filter((item) => ticked[item.id]).length
  return (
    <div className="flex flex-col gap-1 rounded-[18px] bg-white/85 px-4 py-3">
      <div className="flex items-center gap-2.5 text-[15px]">
        <b>{mode === 'exit' ? 'Check every item against its serial' : 'Tick each item coming back'}</b>
        <span className={`ml-auto font-bold ${seen === items.length ? 'text-[#0B5C2E]' : 'text-[#8A4B05]'}`}>
          {seen} of {items.length} {mode === 'exit' ? 'seen' : 'back'}
        </span>
      </div>
      {items.map((item) => {
        const on = Boolean(ticked[item.id])
        return (
          <button
            key={item.id}
            type="button"
            role="checkbox"
            aria-checked={on}
            onClick={() => onToggle(item.id)}
            className="grid min-h-10 grid-cols-[30px_minmax(0,1.3fr)_minmax(0,1fr)] items-center gap-2.5 border-t border-[#DDEBE2] py-0.5 text-left text-[15px] text-[#0E1430] sm:grid-cols-[30px_1.3fr_130px_1fr_1.1fr]"
          >
            <span className={`flex h-[26px] w-[26px] items-center justify-center rounded-lg font-extrabold ${on ? 'bg-[#12A150] text-white' : 'border-2 border-[#8FB8A0] bg-white'}`}>
              {on ? '✓' : ''}
            </span>
            <b className="truncate">{item.name}{item.quantity > 1 ? ` ×${item.quantity}` : ''}</b>
            <span className="hidden font-mono text-[13px] sm:block">{item.assetTag ?? '—'}</span>
            <span className="hidden truncate text-[#3E4766] sm:block">{item.makeModel}</span>
            <span className="truncate font-mono text-sm font-semibold">SN {item.serialNumber ?? 'None printed'}</span>
          </button>
        )
      })}
    </div>
  )
}

function PassFacts({ pass, tone }: { pass: GatePass; tone: 'green' | 'blue' }) {
  const sub = tone === 'green' ? 'text-[#2B4A36]' : 'text-[#1C2E9E]'
  return (
    <div className="grid grid-cols-1 gap-3 text-base md:grid-cols-[1fr_1.2fr_1fr]">
      <div className="rounded-2xl bg-white/75 px-4 py-3">
        <div className={`text-[13px] ${sub}`}>Carried by</div>
        <div className="text-[22px] font-bold">{pass.requester.fullName}</div>
        <div>{pass.requester.department.name} · Staff ID {pass.requester.staffId}</div>
      </div>
      <div className="rounded-2xl bg-white/75 px-4 py-3">
        <div className={`text-[13px] ${sub}`}>Main device</div>
        <div className="text-[22px] font-bold">{pass.asset.make} {pass.asset.model}</div>
        <div className="font-mono text-sm">{pass.asset.assetTag} · SN {pass.asset.serialNumber}</div>
      </div>
      <div className="rounded-2xl bg-white/75 px-4 py-3">
        <div className={`text-[13px] ${sub}`}>Pass {pass.code} · {pass.isReturnable ? 'Returnable' : 'Non-returnable'}</div>
        <div className="text-[22px] font-bold">{pass.isReturnable ? `Back by ${formatDay(pass.expectedReturnAt)}` : 'Leaves for good'}</div>
        <div>{pass.destination}</div>
      </div>
    </div>
  )
}

/** D07-D10: Security's gate station. */
export default function GateStation() {
  const { user } = useAuth()
  const [gateName, setGateName] = useState(readGateName)
  const [typed, setTyped] = useState('')
  const [check, checkState] = useLazyGateCheckQuery()
  const [result, setResult] = useState<GateCheckResult | null>(null)
  const [ticked, setTicked] = useState<Record<string, boolean>>({})
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [from] = useState(startOfToday)
  const logQuery = useGetGateLogQuery(from)
  const [markExit, exitState] = useMarkGateExitMutation()
  const [markReturn, returnState] = useMarkGateReturnMutation()
  const [logStop, stopState] = useLogGateStopMutation()

  const reset = () => {
    setResult(null)
    setTicked({})
    setTyped('')
    setError('')
  }

  const saveGateName = (value: string) => {
    setGateName(value)
    try {
      localStorage.setItem(GATE_NAME_KEY, value)
    } catch {
      // Storage can be unavailable; the name then lasts for this visit only.
    }
  }

  const runCheck = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const tag = typed.trim()
    if (!tag) return
    setError('')
    setMessage('')
    setTicked({})
    try {
      setResult(await check(tag, false).unwrap())
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'That tag could not be checked.'))
    }
  }

  const toggle = (id: string) => setTicked((current) => ({ ...current, [id]: !current[id] }))

  const pass = result?.pass ?? null
  const exitItems = pass?.items ?? []
  const allSeen = exitItems.length > 0 && exitItems.every((item) => ticked[item.id])
  const returning = pass ? pass.items.filter((item) => !item.returnedAt) : []
  const backCount = returning.filter((item) => ticked[item.id]).length

  const logExit = async () => {
    if (!pass) return
    try {
      await markExit({ id: pass.id, seenItemIds: exitItems.map((item) => item.id), gate: gateName }).unwrap()
      setMessage(`Exit logged for ${pass.code} at ${formatTime(new Date().toISOString())}.`)
      reset()
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'The exit could not be logged.'))
    }
  }

  const logBack = async () => {
    if (!pass) return
    try {
      await markReturn({
        id: pass.id,
        items: returning.map((item) => ({ id: item.id, returned: Boolean(ticked[item.id]) })),
        gate: gateName,
      }).unwrap()
      setMessage(`${backCount} item${backCount === 1 ? '' : 's'} on ${pass.code} checked back in.`)
      reset()
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'The return could not be logged.'))
    }
  }

  const stop = async () => {
    if (!result) return
    try {
      await logStop({ assetTag: result.tag, note: result.reason ?? undefined, gate: gateName }).unwrap()
      setMessage(`${result.tag} logged as stopped at the gate.`)
      reset()
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'The stopped device could not be logged.'))
    }
  }

  const tone = !result ? 'wait' : result.result === 'CLEARED' ? 'ok' : result.result === 'RETURNING' ? 'back' : 'bad'
  const panel = { wait: 'bg-[#F4F6FB]', ok: 'bg-[#D7F3E2]', back: 'bg-[#E8ECFF]', bad: 'bg-[#FBDCD8]' }[tone]
  const log = logQuery.data

  return (
    <main className="min-h-full bg-[#0F1A4A] px-4 py-4 text-white sm:px-5">
      <div className="mb-4 flex flex-wrap items-center gap-3 text-[13px] text-[#C9D2F5]">
        <h1 className="text-base font-bold text-white">Gate station</h1>
        <label className="flex items-center gap-2">
          <span className="sr-only">Gate name</span>
          <input
            value={gateName}
            onChange={(event) => saveGateName(event.target.value)}
            maxLength={60}
            className="h-8 w-28 rounded-full bg-[#1B2A6B] px-3 text-xs font-semibold text-white outline-none focus:ring-2 focus:ring-[#D6F25B]"
          />
        </label>
        <span className="ml-auto">{user?.name} on duty</span>
      </div>

      <div className="flex flex-col gap-5 xl:flex-row">
        <section className={`flex min-h-[560px] min-w-0 flex-1 flex-col gap-6 rounded-[28px] px-6 py-8 text-[#0E1430] sm:px-10 ${panel}`}>
          {message && <p role="status" className="rounded-xl bg-white/80 px-4 py-2 text-sm font-semibold text-[#12733A]">{message}</p>}
          {error && <p role="alert" className="rounded-xl bg-white/80 px-4 py-2 text-sm font-semibold text-red-700">{error}</p>}

          {!result && (
            <form onSubmit={runCheck} className="flex flex-1 flex-col items-center justify-center gap-7 text-center">
              <span className="flex h-[150px] w-[220px] items-center justify-center rounded-[22px] border-[3px] border-[#2F4BF5] bg-white text-[#2F4BF5]">
                <ScanLine size={72} aria-hidden="true" />
              </span>
              <h2 className="text-4xl font-semibold sm:text-5xl">Scan the asset tag</h2>
              <p className="text-lg text-[#3E4766]">Hold the scanner over the barcode on the yellow sticker, or type the tag below.</p>
              <label className="flex w-full max-w-[560px] gap-2.5">
                <span className="sr-only">Asset tag</span>
                <input
                  autoFocus
                  value={typed}
                  onChange={(event) => setTyped(event.target.value)}
                  placeholder="IT-LAP-0057"
                  className="h-16 min-w-0 flex-1 rounded-2xl border-2 border-[#CBD2E6] px-[18px] font-mono text-2xl font-semibold uppercase text-[#0E1430] outline-none focus:border-[#2F4BF5]"
                />
                <button type="submit" disabled={checkState.isFetching} className="h-16 rounded-2xl bg-[#2F4BF5] px-6 text-xl font-bold text-white disabled:opacity-60">
                  {checkState.isFetching ? 'Checking…' : 'Check'}
                </button>
              </label>
            </form>
          )}

          {result?.result === 'CLEARED' && pass && (
            <>
              <div className="flex items-center gap-4">
                <span className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#12A150] text-white"><Check size={42} strokeWidth={3} aria-hidden="true" /></span>
                <h2 className="text-4xl font-bold text-[#0B5C2E] sm:text-6xl">Cleared to leave</h2>
              </div>
              <PassFacts pass={pass} tone="green" />
              <ItemChecklist pass={pass} ticked={ticked} onToggle={toggle} mode="exit" />
              <div className="flex flex-wrap items-center gap-3.5 rounded-2xl bg-white/75 px-4 py-2">
                {pass.issuerSignature?.image && (
                  <img src={pass.issuerSignature.image} alt={`Signature of ${pass.reviewer?.fullName ?? 'the issuer'}`} className="h-[42px] w-[130px] object-contain" />
                )}
                <span className="text-sm">
                  <b>Issued by {pass.reviewer?.fullName ?? '—'}</b> · e-signed {formatDateTime(pass.issuerSignature?.signedAt)}
                  <br />
                  <span className="text-[#2B4A36]">Received and signed by {pass.requester.fullName} at handover, {formatDateTime(pass.receiverSignedAt)}</span>
                </span>
                {pass.receiverSignature?.image && (
                  <img src={pass.receiverSignature.image} alt={`Signature of ${pass.requester.fullName}`} className="ml-auto h-[42px] w-[130px] object-contain" />
                )}
              </div>
              <div className="mt-auto flex flex-col gap-3.5 sm:flex-row">
                <button
                  type="button"
                  onClick={() => void logExit()}
                  disabled={!allSeen || exitState.isLoading}
                  className="h-[76px] flex-1 rounded-[20px] bg-[#0B5C2E] text-2xl font-bold text-white disabled:cursor-not-allowed disabled:bg-[#9DBFAA]"
                >
                  {exitState.isLoading ? 'Logging…' : allSeen ? `Log exit · all ${exitItems.length} items` : 'Tick every item to log exit'}
                </button>
                <button type="button" onClick={reset} className="h-[76px] rounded-[20px] border-2 border-[#0B5C2E] px-8 text-xl font-bold text-[#0B5C2E]">Next scan</button>
              </div>
            </>
          )}

          {result?.result === 'RETURNING' && pass && (
            <>
              <div className="flex items-center gap-4">
                <span className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#2F4BF5] text-white"><Check size={42} strokeWidth={3} aria-hidden="true" /></span>
                <h2 className="text-4xl font-bold text-[#1C2E9E] sm:text-6xl">Coming back</h2>
              </div>
              <PassFacts pass={pass} tone="blue" />
              <ItemChecklist pass={pass} ticked={ticked} onToggle={toggle} mode="return" />
              <div className="mt-auto flex flex-col gap-3.5 sm:flex-row">
                <button
                  type="button"
                  onClick={() => void logBack()}
                  disabled={!backCount || returnState.isLoading}
                  className="h-[76px] flex-1 rounded-[20px] bg-[#1C2E9E] text-2xl font-bold text-white disabled:cursor-not-allowed disabled:bg-[#AEB8E6]"
                >
                  {returnState.isLoading ? 'Logging…' : `Log return · ${backCount} of ${returning.length} items`}
                </button>
                <button type="button" onClick={reset} className="h-[76px] rounded-[20px] border-2 border-[#1C2E9E] px-8 text-xl font-bold text-[#1C2E9E]">Next scan</button>
              </div>
            </>
          )}

          {result?.result === 'NOT_CLEARED' && (
            <>
              <div className="flex items-center gap-4">
                <span className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#C2261C] text-white"><X size={40} strokeWidth={3} aria-hidden="true" /></span>
                <h2 className="text-4xl font-bold text-[#8F1A11] sm:text-6xl">Not cleared</h2>
              </div>
              <p className="text-2xl text-[#3B0E0A]">{result.reason}</p>
              <div className="rounded-[18px] bg-white/75 px-5 py-4 text-lg text-[#3B0E0A]">
                {result.asset?.assignedTo
                  ? <>Registered to <b>{result.asset.assignedTo.fullName}</b> · {result.asset.assignedTo.department.name}. Ask the person to request a pass in ITrack, or call the IT desk.</>
                  : result.pass
                    ? <>Pass holder <b>{result.pass.requester.fullName}</b> · {result.pass.requester.department.name}. Send them to the IT office.</>
                    : <>Call the IT desk before letting this device leave.</>}
              </div>
              <div className="mt-auto flex flex-col gap-3.5 sm:flex-row">
                <button type="button" onClick={() => void stop()} disabled={stopState.isLoading} className="h-[76px] flex-1 rounded-[20px] bg-[#8F1A11] text-[22px] font-bold text-white disabled:opacity-60">
                  {stopState.isLoading ? 'Logging…' : 'Log stopped device'}
                </button>
                <button type="button" onClick={reset} className="h-[76px] rounded-[20px] border-2 border-[#8F1A11] px-8 text-xl font-bold text-[#8F1A11]">Next scan</button>
              </div>
            </>
          )}
        </section>

        <aside aria-label="Today at the gate" className="flex w-full flex-none flex-col gap-3.5 xl:w-[340px]">
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Out', value: log?.counts.out, className: 'bg-[#1B2A6B] text-[#AEB8E6]' },
              { label: 'Back', value: log?.counts.back, className: 'bg-[#1B2A6B] text-[#AEB8E6]' },
              { label: 'Stopped', value: log?.counts.stopped, className: 'bg-[#3A1714] text-[#F2B8B2]' },
            ].map((tile) => (
              <div key={tile.label} className={`rounded-2xl p-3 ${tile.className}`}>
                <div className="text-xs">{tile.label}</div>
                <div className="text-[28px] font-semibold text-white">{tile.value ?? '–'}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2.5 rounded-[20px] bg-[#1B2A6B] p-4">
            <h2 className="text-[13px] font-bold uppercase tracking-[0.08em] text-[#AEB8E6]">Today</h2>
            {logQuery.isLoading ? (
              <p role="status" className="text-sm text-[#AEB8E6]">Loading the gate log…</p>
            ) : logQuery.isError ? (
              <p role="alert" className="text-sm text-[#FFD6D1]">{getApiErrorMessage(logQuery.error, 'The gate log could not be loaded.')}</p>
            ) : log?.events.length ? (
              log.events.map((event) => (
                <div key={event.id} className="grid grid-cols-[46px_minmax(0,1fr)_auto] items-center gap-2 text-sm">
                  <span className="font-mono text-[#AEB8E6]">{formatTime(event.createdAt)}</span>
                  <span className="truncate">{event.assetTag ?? '—'} · {event.pass?.requester ?? 'no pass'}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${EVENT_STYLE[event.type].className}`}>{EVENT_STYLE[event.type].label}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-[#AEB8E6]">Nothing logged yet today.</p>
            )}
          </div>

          <div className="flex flex-col gap-2.5 rounded-[20px] bg-[#1B2A6B] p-4">
            <h2 className="text-[13px] font-bold uppercase tracking-[0.08em] text-[#F2B8B2]">Overdue returns · {log?.counts.overdue ?? 0}</h2>
            {log?.overdue.length ? (
              log.overdue.map((item) => (
                <div key={item.id} className="text-sm">
                  <span className="font-mono font-semibold">{item.code}</span> · {item.requester.fullName}
                  <div className="text-xs text-[#FFD6D1]">{item.asset.assetTag} · was due {formatShortDay(item.expectedReturnAt)} · {item.requester.phone ?? item.contactPhone ?? 'no phone'}</div>
                </div>
              ))
            ) : (
              <p className="text-sm text-[#AEB8E6]">No overdue returns.</p>
            )}
            <p className="text-xs text-[#AEB8E6]">{log?.counts.outNow ?? 0} returnable passes are out right now.</p>
          </div>
        </aside>
      </div>
    </main>
  )
}
