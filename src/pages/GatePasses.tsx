import { useState } from 'react'
import type { SubmitEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { ArrowRight, FileText, PenLine, Plus } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import DatePicker from '../components/DatePicker'
import Dropdown from '../components/Dropdown'
import PassStatePill from '../components/gate-pass/PassStatePill'
import HandoverDialog from '../components/gate-pass/HandoverDialog'
import {
  useCreateGatePassMutation,
  useGetGatePassesQuery,
  useGetMyGateAssetsQuery,
} from '../lib/api/gates/gates-api'
import type { GatePass } from '../lib/api/gates/types'
import { PASS_STATE_HINT, formatShortDay, passState } from '../lib/api/gates/gate-pass-format'
import { getApiErrorMessage } from '../lib/api/error-message'
import { pathsForRole, slipPath } from '../utils/role-paths'

const PURPOSES = [
  'Client or partner visit',
  'Working from home',
  'Field work',
  'Workshop or training',
  'Repair at a vendor',
  'Other',
]

const STEPS = [
  ['You send the request', 'Now'],
  ['IT checks and signs it', 'Within 1 working day. You get a notification.'],
  ['You collect and sign', 'At the IT office. You sign on screen for the items.'],
  ['Show the pass at the gate', 'Security ticks every item against its serial.'],
  ['Bring it all back', 'By the return date. Each item is checked back in.'],
] as const

const inputClass =
  'h-9 w-full rounded-lg border border-[#D4DAEA] bg-white px-3 text-xs text-[#0E1430] outline-none focus:border-[#3155ff] focus:ring-2 focus:ring-blue-100'

function todayInput() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

/** W14 "Request a gate pass" */
function RequestForm({ listPath }: { listPath: string }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const assetsQuery = useGetMyGateAssetsQuery()
  const [createGatePass, createState] = useCreateGatePassMutation()
  const [selected, setSelected] = useState<string[]>([])
  const [purpose, setPurpose] = useState(PURPOSES[0])
  const [otherPurpose, setOtherPurpose] = useState('')
  const [destination, setDestination] = useState('')
  const [leavesOn, setLeavesOn] = useState(todayInput())
  const [backBy, setBackBy] = useState('')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [returnable, setReturnable] = useState(true)
  const [error, setError] = useState('')

  const assets = assetsQuery.data ?? []
  const reason = purpose === 'Other' ? otherPurpose.trim() : purpose

  const toggle = (id: string) =>
    setSelected((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]))

  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    if (!selected.length) return setError('Pick at least one device.')
    if (reason.length < 3) return setError('Say what the devices are for.')
    if (returnable && !backBy) return setError('Choose the date everything comes back.')
    if (returnable && backBy < leavesOn) return setError('The return date cannot be before the leaving date.')
    try {
      const pass = await createGatePass({
        assetIds: selected,
        reason,
        destination: destination.trim(),
        leavesOn,
        expectedReturnAt: returnable ? backBy : null,
        contactPhone: phone.trim() || null,
        isReturnable: returnable,
      }).unwrap()
      navigate(listPath, { state: { flash: `${pass.code} sent. IT will check and sign it.` } })
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Could not send the gate-pass request.'))
    }
  }

  return (
    <div className="mt-5 grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
      <form onSubmit={submit} className="flex flex-col gap-3 rounded-[18px] bg-white p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-[#0E1430]">What are you taking?</h2>
          <span className="text-[13px] text-[#5B6480]">{selected.length} item{selected.length === 1 ? '' : 's'} selected</span>
        </div>

        {assetsQuery.isLoading ? (
          <p role="status" className="py-6 text-center text-sm text-slate-500">Loading your devices…</p>
        ) : assetsQuery.isError ? (
          <p role="alert" className="py-6 text-center text-sm text-red-700">{getApiErrorMessage(assetsQuery.error, 'Your devices could not be loaded.')}</p>
        ) : assets.length === 0 ? (
          <p className="rounded-xl bg-[#F7F8FC] px-4 py-6 text-center text-sm text-slate-600">
            No devices are assigned to you. Ask IT to assign the device before requesting a pass.
          </p>
        ) : (
          <fieldset className="flex flex-col gap-1.5">
            <legend className="sr-only">Devices</legend>
            {assets.map((asset) => {
              const checked = selected.includes(asset.id)
              const busy = Boolean(asset.openPass)
              return (
                <label
                  key={asset.id}
                  className={`grid grid-cols-[24px_minmax(0,1fr)] items-center gap-x-2.5 gap-y-1 rounded-xl px-3 py-2.5 sm:grid-cols-[24px_minmax(0,1fr)_130px_170px] ${busy ? 'cursor-not-allowed bg-[#F7F8FC] opacity-60' : 'cursor-pointer'} ${checked ? 'bg-[#E8ECFF]' : 'bg-[#F7F8FC]'}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={busy}
                    onChange={() => toggle(asset.id)}
                    className="h-[18px] w-[18px] accent-[#2F4BF5]"
                  />
                  <b className="truncate text-sm text-[#0E1430]">
                    {asset.make} {asset.model}
                    {busy && <span className="ml-2 text-xs font-semibold text-[#8A4B05]">On {asset.openPass}</span>}
                  </b>
                  <span className="col-start-2 w-fit rounded-[5px] bg-[#D6F25B] px-1.5 py-0.5 font-mono text-[11px] font-semibold text-[#1A2200] sm:col-start-auto">
                    {asset.assetTag}
                  </span>
                  <span className="col-start-2 font-mono text-xs text-[#3E4766] sm:col-start-auto">SN {asset.serialNumber}</span>
                </label>
              )
            })}
          </fieldset>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[#3E4766]">
            Purpose
            <Dropdown value={purpose} onChange={setPurpose} ariaLabel="Purpose" options={PURPOSES.map((value) => ({ value, label: value }))} />
          </label>
          <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[#3E4766]">
            Where are you taking it?
            <input required minLength={2} maxLength={255} value={destination} onChange={(event) => setDestination(event.target.value)} placeholder="e.g. Ondo State Ministry of Finance, Akure" className={inputClass} />
          </label>
          {purpose === 'Other' && (
            <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[#3E4766] sm:col-span-2">
              What is it for?
              <input required minLength={3} maxLength={500} value={otherPurpose} onChange={(event) => setOtherPurpose(event.target.value)} className={inputClass} />
            </label>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[#3E4766]">
            Leaving on
            <DatePicker value={leavesOn} onChange={setLeavesOn} />
          </label>
          {returnable ? (
            <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[#3E4766]">
              Back by
              <DatePicker value={backBy} onChange={setBackBy} />
            </label>
          ) : (
            <span className="flex flex-col gap-1.5 text-[13px] font-semibold text-[#3E4766]">
              Back by
              <span className="flex h-9 items-center rounded-lg bg-[#FEF3C7] px-3 text-xs text-[#5C3A06]">Leaves for good</span>
            </span>
          )}
          <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[#3E4766]">
            Phone while away
            <input type="tel" maxLength={40} value={phone} onChange={(event) => setPhone(event.target.value)} className={inputClass} />
          </label>
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-[13px] font-semibold text-[#3E4766]">Will everything come back?</legend>
          <div className="flex flex-col gap-2 sm:flex-row">
            {[
              { value: true, title: 'Yes, all of it', help: 'Returnable pass' },
              { value: false, title: 'No, some stays there', help: 'IT must approve a non-returnable pass' },
            ].map((option) => (
              <label
                key={option.title}
                className={`flex flex-1 cursor-pointer flex-col gap-0.5 rounded-xl px-3 py-2.5 ${returnable === option.value ? 'border-2 border-[#2F4BF5] bg-[#E8ECFF]' : 'border border-[#D4DAEA] bg-white'}`}
              >
                <span className="flex items-center gap-2 text-sm font-bold text-[#0E1430]">
                  <input type="radio" name="returnable" checked={returnable === option.value} onChange={() => setReturnable(option.value)} className="accent-[#2F4BF5]" />
                  {option.title}
                </span>
                <span className="pl-[22px] text-xs text-[#5B6480]">{option.help}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}

        <div className="flex justify-end gap-2">
          <Link to={listPath} className="inline-flex h-9 items-center rounded-full border-[1.5px] border-[#CBD2E6] bg-white px-3 text-xs font-bold text-[#0E1430]">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={createState.isLoading || !assets.length}
            className="inline-flex h-9 items-center gap-2 rounded-full bg-[#2F4BF5] px-4 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ArrowRight size={16} aria-hidden="true" /> {createState.isLoading ? 'Sending…' : 'Send request'}
          </button>
        </div>
      </form>

      <section className="flex flex-col gap-3 rounded-[18px] bg-white p-4">
        <span className="text-xs font-bold uppercase tracking-[0.06em] text-[#5B6480]">What happens next</span>
        {STEPS.map(([title, help], index) => (
          <div key={title} className="grid grid-cols-[28px_1fr] gap-2.5">
            <span className={`flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-bold ${index === 0 ? 'bg-[#2F4BF5] text-white' : 'bg-[#EEF1F8] text-[#3E4766]'}`}>{index + 1}</span>
            <span className="text-sm leading-[1.45]"><b>{title}</b><br /><span className="text-[#5B6480]">{help}</span></span>
          </div>
        ))}
        <div className="rounded-xl bg-[#FEF3C7] px-3 py-2.5 text-[13px] text-[#5C3A06]">
          If something isn’t back on time, the pass stays open and IT follows up.
        </div>
      </section>
    </div>
  )
}

function PassList({ newPath }: { newPath: string }) {
  const { user } = useAuth()
  const location = useLocation()
  const passesQuery = useGetGatePassesQuery()
  const [signing, setSigning] = useState<GatePass | null>(null)
  const flash = (location.state as { flash?: string } | null)?.flash
  const mine = (passesQuery.data ?? []).filter((pass) => pass.requester.id === user?.id)

  return (
    <section className="mt-5 rounded-[18px] bg-white p-4">
      {flash && <p role="status" className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-[#12733A]">{flash}</p>}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-[#18203e]">My gate-pass requests</h2>
        <Link to={newPath} className="inline-flex items-center gap-1.5 rounded-full bg-[#2F4BF5] px-3.5 py-2 text-xs font-semibold text-white">
          <Plus size={14} aria-hidden="true" /> New request
        </Link>
      </div>

      {passesQuery.isLoading ? (
        <p role="status" className="py-8 text-center text-sm text-slate-500">Loading requests…</p>
      ) : passesQuery.isError ? (
        <div role="alert" className="py-8 text-center">
          <p className="text-sm text-red-700">{getApiErrorMessage(passesQuery.error, 'Gate-pass requests could not be loaded.')}</p>
          <button type="button" onClick={() => void passesQuery.refetch()} className="mt-2 text-xs font-semibold text-[#3155ff] hover:underline">Retry</button>
        </div>
      ) : mine.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">No gate-pass requests yet.</p>
      ) : (
        <ul className="mt-3 divide-y divide-slate-100">
          {mine.map((pass) => {
            const state = passState(pass)
            return (
              <li key={pass.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-[#202844]">
                    <span className="font-mono">{pass.code}</span>
                    <span className="rounded bg-[#D6F25B] px-1.5 py-0.5 font-mono text-[11px] text-[#1A2200]">{pass.asset.assetTag}</span>
                    {pass.asset.make} {pass.asset.model}
                    {pass.items.length > 1 && <span className="font-normal text-slate-500">+ {pass.items.length - 1} items</span>}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {pass.destination} · {formatShortDay(pass.leavesOn)} → {pass.isReturnable ? formatShortDay(pass.expectedReturnAt) : 'for good'}
                  </p>
                  <p className="mt-1 text-xs text-[#3E4766]">
                    {state === 'Rejected' && pass.reviewNote ? `Rejected: ${pass.reviewNote}` : PASS_STATE_HINT[state]}
                  </p>
                </div>
                <PassStatePill pass={pass} />
                {pass.status === 'APPROVED' && (
                  <button type="button" onClick={() => setSigning(pass)} className="inline-flex items-center gap-1.5 rounded-full bg-[#0F1A4A] px-3 py-2 text-xs font-semibold text-white">
                    <PenLine size={13} aria-hidden="true" /> Sign for items
                  </button>
                )}
                {pass.issuerSignature && (
                  <Link to={slipPath(pass.id)} className="inline-flex items-center gap-1.5 rounded-full border border-[#CBD2E6] px-3 py-2 text-xs font-semibold text-[#0E1430]">
                    <FileText size={13} aria-hidden="true" /> Slip
                  </Link>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <HandoverDialog pass={signing} signingAsRequester onClose={() => setSigning(null)} />
    </section>
  )
}

export default function GatePasses({ section }: { section: 'list' | 'new' }) {
  const { user } = useAuth()
  const listPath = pathsForRole(user?.role).passes ?? '/employee/passes'
  const newPath = `${listPath}/new`

  return (
    <div className="min-h-full px-4 py-5 sm:px-6 sm:py-6 lg:px-7">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-[#111a3b]">{section === 'new' ? 'Request a gate pass' : 'Gate passes'}</h1>
        <p className="text-sm text-slate-500">
          {section === 'new' ? 'For taking university devices off campus.' : 'Track your device movement requests, sign for items and open your slip.'}
        </p>
      </div>
      {section === 'new' ? <RequestForm listPath={listPath} /> : <PassList newPath={newPath} />}
    </div>
  )
}
