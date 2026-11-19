import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router'
import { Plus, Trash2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog'
import DatePicker from '../components/DatePicker'
import PassStatePill from '../components/gate-pass/PassStatePill'
import HandoverDialog from '../components/gate-pass/HandoverDialog'
import {
  useGetGatePassesQuery,
  useLazyLookupGateAssetQuery,
  useMarkGateReturnMutation,
  useReviewGatePassMutation,
} from '../lib/api/gates/gates-api'
import { useGetMySignatureQuery } from '../lib/api/signatures/signatures-api'
import type { GatePass, GatePassItemClass } from '../lib/api/gates/types'
import { formatShortDay, passState, shortHash, toDateInput } from '../lib/api/gates/gate-pass-format'
import { getApiErrorMessage } from '../lib/api/error-message'
import { pathsForRole, slipPath } from '../utils/role-paths'

type Filter = 'Waiting' | 'Ready' | 'Out now' | 'Overdue' | 'All'

const FILTERS: { value: Filter; match: (pass: GatePass) => boolean }[] = [
  { value: 'Waiting', match: (pass) => pass.status === 'PENDING' },
  { value: 'Ready', match: (pass) => pass.status === 'APPROVED' || pass.status === 'ISSUED' },
  { value: 'Out now', match: (pass) => pass.status === 'EXITED' && pass.isReturnable },
  { value: 'Overdue', match: (pass) => pass.overdue },
  { value: 'All', match: () => true },
]

const cellInput =
  'h-8 w-full min-w-0 rounded-lg border border-[#D4DAEA] px-2 text-xs outline-none focus:border-[#3155ff] focus:ring-2 focus:ring-blue-100'
const fieldInput =
  'h-[38px] w-full rounded-[10px] border border-[#D4DAEA] px-2.5 text-[13px] outline-none focus:border-[#3155ff] focus:ring-2 focus:ring-blue-100'

interface ItemRow {
  key: string
  itemClass: GatePassItemClass
  name: string
  assetTag: string
  makeModel: string
  serialNumber: string
  quantity: number
  conditionOut: string
}

let rowCounter = 0
const nextKey = () => `row-${(rowCounter += 1)}`

function rowsFrom(pass: GatePass): ItemRow[] {
  return pass.items.map((item) => ({
    key: item.id,
    itemClass: item.itemClass,
    name: item.name,
    assetTag: item.assetTag ?? '',
    makeModel: item.makeModel ?? '',
    serialNumber: item.serialNumber ?? '',
    quantity: item.quantity,
    conditionOut: item.conditionOut ?? '',
  }))
}

/** D06b "Itemised pass builder and e-signature" */
function ReviewDialog({ pass, onClose }: { pass: GatePass; onClose: () => void }) {
  const { user } = useAuth()
  const signatureQuery = useGetMySignatureQuery()
  const [review, reviewState] = useReviewGatePassMutation()
  const [lookup, lookupState] = useLazyLookupGateAssetQuery()
  const [returnable, setReturnable] = useState(pass.isReturnable)
  const [reason, setReason] = useState(pass.reason)
  const [destination, setDestination] = useState(pass.destination)
  const [leavesOn, setLeavesOn] = useState(pass.leavesOn ?? '')
  const [backBy, setBackBy] = useState(toDateInput(pass.expectedReturnAt))
  const [rows, setRows] = useState<ItemRow[]>(() => rowsFrom(pass))
  const [tagInput, setTagInput] = useState('')
  const [pin, setPin] = useState('')
  const [applied, setApplied] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [rejectNote, setRejectNote] = useState('')
  const [error, setError] = useState('')

  const signature = signatureQuery.data?.signature ?? null
  const settingsPath = pathsForRole(user?.role).settings

  const update = (key: string, patch: Partial<ItemRow>) =>
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)))

  const addByTag = async () => {
    const tag = tagInput.trim().toUpperCase()
    if (!tag) return
    setError('')
    if (rows.some((row) => row.assetTag.toUpperCase() === tag)) {
      setError(`${tag} is already on this pass.`)
      return
    }
    try {
      const asset = await lookup(tag, false).unwrap()
      setRows((current) => [
        ...current,
        {
          key: nextKey(),
          itemClass: 'ASSET',
          name: asset.type.charAt(0) + asset.type.slice(1).toLowerCase(),
          assetTag: asset.assetTag,
          makeModel: `${asset.make} ${asset.model}`,
          serialNumber: asset.serialNumber,
          quantity: 1,
          conditionOut: asset.condition.charAt(0) + asset.condition.slice(1).toLowerCase(),
        },
      ])
      setTagInput('')
    } catch (caught) {
      setError(getApiErrorMessage(caught, `${tag} could not be found.`))
    }
  }

  const addAccessory = () =>
    setRows((current) => [
      ...current,
      { key: nextKey(), itemClass: 'ACCESSORY', name: '', assetTag: '', makeModel: '', serialNumber: '', quantity: 1, conditionOut: 'Good' },
    ])

  const approve = async () => {
    setError('')
    if (rows.some((row) => !row.name.trim())) return setError('Give every item a name.')
    if (!leavesOn) return setError('Set the date the items leave.')
    if (returnable && !backBy) return setError('Set the date everything comes back.')
    try {
      await review({
        id: pass.id,
        status: 'APPROVED',
        pin,
        isReturnable: returnable,
        reason: reason.trim(),
        destination: destination.trim(),
        leavesOn,
        expectedReturnAt: returnable ? backBy : null,
        items: rows.map((row) => ({
          itemClass: row.itemClass,
          assetTag: row.assetTag.trim() || null,
          name: row.name.trim(),
          makeModel: row.makeModel.trim() || null,
          serialNumber: row.serialNumber.trim() || null,
          quantity: row.quantity,
          conditionOut: row.conditionOut.trim() || null,
        })),
      }).unwrap()
      onClose()
    } catch (caught) {
      setApplied(false)
      setError(getApiErrorMessage(caught, 'The pass could not be approved.'))
    }
  }

  const reject = async () => {
    if (!rejecting) return setRejecting(true)
    if (!rejectNote.trim()) return setError('Say why you are rejecting it.')
    try {
      await review({ id: pass.id, status: 'REJECTED', reviewNote: rejectNote.trim() }).unwrap()
      onClose()
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'The pass could not be rejected.'))
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-start gap-3 pr-8">
        <div className="min-w-0 flex-1">
          <DialogTitle>Review {pass.code}</DialogTitle>
          <DialogDescription>
            {pass.requester.fullName} · staff ID {pass.requester.staffId} · {pass.contactPhone ?? pass.requester.phone ?? 'no phone'} · {pass.requester.department.name}
          </DialogDescription>
        </div>
        <div role="radiogroup" aria-label="Pass type" className="flex rounded-full bg-[#EEF1F8] p-[3px]">
          {[
            { value: true, label: 'Returnable' },
            { value: false, label: 'Non-returnable' },
          ].map((option) => (
            <button
              key={option.label}
              type="button"
              role="radio"
              aria-checked={returnable === option.value}
              onClick={() => setReturnable(option.value)}
              className={`h-8 rounded-full px-3.5 text-[13px] font-bold ${returnable === option.value ? 'bg-[#0F1A4A] text-white' : 'text-[#3E4766]'}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_170px_170px]">
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-[#3E4766]">Purpose
          <input value={reason} onChange={(event) => setReason(event.target.value)} className={fieldInput} />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-[#3E4766]">Destination
          <input value={destination} onChange={(event) => setDestination(event.target.value)} className={fieldInput} />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-[#3E4766]">Leaves on
          <DatePicker value={leavesOn} onChange={setLeavesOn} />
        </label>
        {returnable ? (
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-[#3E4766]">Back by
            <DatePicker value={backBy} onChange={setBackBy} />
          </label>
        ) : (
          <span className="flex flex-col gap-1.5 text-xs font-semibold text-[#3E4766]">Back by
            <span className="flex h-[38px] items-center rounded-[10px] bg-[#FEF3C7] px-2.5 text-xs text-[#5C3A06]">Leaves for good</span>
          </span>
        )}
      </div>

      <div className="overflow-hidden rounded-[14px] border border-[#E3E7F2]">
        <div className="flex flex-wrap items-center gap-2.5 bg-[#F7F8FC] px-3 py-2">
          <b className="text-[13px]">Items leaving · {rows.length}</b>
          <span className="text-xs text-[#5B6480]">Every item needs a serial if one is printed on it</span>
          <form
            className="ml-auto flex items-center gap-1.5 text-xs font-semibold"
            onSubmit={(event) => {
              event.preventDefault()
              void addByTag()
            }}
          >
            <label htmlFor="add-tag">Scan or type a tag</label>
            <input
              id="add-tag"
              value={tagInput}
              onChange={(event) => setTagInput(event.target.value)}
              placeholder="IT-LAP-…"
              className="h-[30px] w-[140px] rounded-lg border border-[#D4DAEA] px-2 font-mono text-xs"
            />
            <button type="submit" disabled={lookupState.isFetching} className="h-[30px] rounded-lg bg-[#0F1A4A] px-2.5 text-xs font-bold text-white disabled:opacity-50">
              Add
            </button>
            <button type="button" onClick={addAccessory} className="inline-flex h-[30px] items-center gap-1 rounded-lg border border-[#CBD2E6] bg-white px-2.5 text-xs font-bold text-[#0E1430]">
              <Plus size={12} aria-hidden="true" /> Accessory
            </button>
          </form>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] border-collapse text-[12.5px]">
            <thead>
              <tr className="text-left text-[10.5px] uppercase tracking-[0.05em] text-[#5B6480]">
                <th className="px-3 py-1.5">Item</th><th className="px-1.5 py-1.5">Class</th><th className="px-1.5 py-1.5">Tag</th>
                <th className="px-1.5 py-1.5">Make and model</th><th className="px-1.5 py-1.5">Serial number</th>
                <th className="px-1.5 py-1.5">Qty</th><th className="px-1.5 py-1.5">Condition</th><th className="px-3 py-1.5"><span className="sr-only">Remove</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key} className="border-t border-[#EEF1F8]">
                  <td className="px-3 py-1.5"><input aria-label="Item name" value={row.name} onChange={(event) => update(row.key, { name: event.target.value })} className={`${cellInput} font-bold`} /></td>
                  <td className="px-1.5 py-1.5 text-[#5B6480]">{row.itemClass === 'ASSET' ? 'Asset' : 'Accessory'}</td>
                  <td className="px-1.5 py-1.5">
                    {row.itemClass === 'ASSET' ? (
                      <span className="rounded bg-[#D6F25B] px-1.5 py-0.5 font-mono text-[11px] font-semibold text-[#1A2200]">{row.assetTag}</span>
                    ) : (
                      <input aria-label="Accessory tag" value={row.assetTag} onChange={(event) => update(row.key, { assetTag: event.target.value })} placeholder="Optional" className={`${cellInput} font-mono`} />
                    )}
                  </td>
                  <td className="px-1.5 py-1.5"><input aria-label="Make and model" value={row.makeModel} onChange={(event) => update(row.key, { makeModel: event.target.value })} className={cellInput} /></td>
                  <td className="px-1.5 py-1.5"><input aria-label="Serial number" value={row.serialNumber} onChange={(event) => update(row.key, { serialNumber: event.target.value })} placeholder="None printed" className={`${cellInput} font-mono font-semibold`} /></td>
                  <td className="w-16 px-1.5 py-1.5"><input aria-label="Quantity" type="number" min={1} max={999} value={row.quantity} onChange={(event) => update(row.key, { quantity: Math.max(1, Number(event.target.value) || 1) })} className={cellInput} /></td>
                  <td className="px-1.5 py-1.5"><input aria-label="Condition" value={row.conditionOut} onChange={(event) => update(row.key, { conditionOut: event.target.value })} className={cellInput} /></td>
                  <td className="px-3 py-1.5 text-right">
                    <button
                      type="button"
                      aria-label={`Remove ${row.name || 'item'}`}
                      disabled={rows.length === 1}
                      onClick={() => setRows((current) => current.filter((item) => item.key !== row.key))}
                      className="rounded-md p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5 rounded-[14px] border border-[#E3E7F2] px-3.5 py-3">
          <span className="text-[11px] font-bold uppercase tracking-[0.05em] text-[#5B6480]">Issued by</span>
          <b className="text-sm">{user?.name} · {user?.role} · {user?.staffId}</b>
          {signatureQuery.isLoading ? (
            <span role="status" className="text-xs text-slate-500">Loading your signature…</span>
          ) : !signature ? (
            <span className="text-xs text-[#8A4B05]">
              You have no saved signature. <Link to={settingsPath} className="font-semibold text-[#3155ff] underline">Add one in Settings</Link> to approve passes.
            </span>
          ) : applied ? (
            <div className="flex items-center gap-3">
              <img src={signature.image} alt={`Saved signature of ${user?.name}`} className="h-[54px] w-[170px] object-contain" />
              <span className="text-[11px] font-bold text-[#12733A]">
                Ready to apply<br /><span className="font-mono font-medium text-[#5B6480]">sha256 {shortHash(signature.sha256)}</span>
              </span>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor="review-pin" className="text-xs font-semibold text-[#3E4766]">PIN</label>
              <input
                id="review-pin"
                type="password"
                inputMode="numeric"
                autoComplete="off"
                maxLength={6}
                value={pin}
                onChange={(event) => setPin(event.target.value.replace(/\D/g, ''))}
                className="h-[34px] w-[90px] rounded-[9px] border border-[#D4DAEA] px-2"
              />
              <button
                type="button"
                disabled={!/^\d{4,6}$/.test(pin)}
                onClick={() => setApplied(true)}
                className="h-[34px] rounded-[9px] bg-[#0F1A4A] px-3 text-xs font-bold text-white disabled:opacity-50"
              >
                Apply my saved signature
              </button>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1.5 rounded-[14px] border border-dashed border-[#C3CADF] bg-[#FAFBFE] px-3.5 py-3">
          <span className="text-[11px] font-bold uppercase tracking-[0.05em] text-[#5B6480]">Received by</span>
          <b className="text-sm">{pass.requester.fullName}</b>
          <span className="text-xs text-[#5B6480]">Signs on screen at handover to accept the items and their condition. Security then releases the pass at the gate.</span>
        </div>
      </div>

      {rejecting && (
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[#3E4766]">
          <span>Why are you rejecting it? <span className="font-medium text-[#5B6480]">{pass.requester.fullName} sees this</span></span>
          <textarea
            rows={3}
            value={rejectNote}
            onChange={(event) => setRejectNote(event.target.value)}
            placeholder="For example: device is booked for the audit that week"
            className="rounded-xl border-[1.5px] border-[#C2261C] px-3 py-2.5 text-sm font-normal outline-none"
          />
        </label>
      )}

      {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}

      <div className="flex flex-wrap justify-between gap-2">
        <button
          type="button"
          onClick={() => void reject()}
          disabled={reviewState.isLoading}
          className="h-[42px] rounded-full border-[1.5px] border-[#F2B8B2] bg-white px-4 text-sm font-bold text-[#B42318]"
        >
          {rejecting ? 'Reject pass' : 'Reject…'}
        </button>
        <button
          type="button"
          onClick={() => void approve()}
          disabled={!applied || reviewState.isLoading}
          className="h-[42px] rounded-full bg-[#2F4BF5] px-5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-[#C3CADF]"
        >
          {reviewState.isLoading ? 'Saving…' : applied ? 'Approve pass' : 'Sign to approve'}
        </button>
      </div>
    </div>
  )
}

/** Return check from the slip: tick each item back in. */
function CheckInDialog({ pass, onClose }: { pass: GatePass; onClose: () => void }) {
  const [markReturn, state] = useMarkGateReturnMutation()
  const outstanding = pass.items.filter((item) => !item.returnedAt)
  const [ticked, setTicked] = useState<Record<string, boolean>>({})
  const [conditions, setConditions] = useState<Record<string, string>>({})
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const count = outstanding.filter((item) => ticked[item.id]).length

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    try {
      await markReturn({
        id: pass.id,
        items: outstanding.map((item) => ({ id: item.id, returned: Boolean(ticked[item.id]), conditionIn: conditions[item.id] || undefined })),
        note: note.trim() || undefined,
      }).unwrap()
      onClose()
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Items could not be checked in.'))
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <DialogHeader>
        <DialogTitle>Check in {pass.code}</DialogTitle>
        <DialogDescription>Tick each item as it comes back. Anything not ticked keeps the pass open.</DialogDescription>
      </DialogHeader>
      <ul className="divide-y divide-slate-100 rounded-xl border border-[#E3E7F2]">
        {pass.items.map((item) => (
          <li key={item.id} className="flex flex-wrap items-center gap-3 px-3 py-2 text-sm">
            <input
              type="checkbox"
              aria-label={`${item.name} returned`}
              checked={Boolean(item.returnedAt) || Boolean(ticked[item.id])}
              disabled={Boolean(item.returnedAt)}
              onChange={(event) => setTicked((current) => ({ ...current, [item.id]: event.target.checked }))}
              className="h-[18px] w-[18px] accent-[#12A150]"
            />
            <b>{item.name}</b>
            <span className="font-mono text-xs text-[#3E4766]">{item.assetTag ?? ''} · SN {item.serialNumber ?? 'None printed'}</span>
            {item.returnedAt ? (
              <span className="ml-auto text-xs font-semibold text-[#12733A]">Back · {item.conditionIn ?? 'checked in'}</span>
            ) : (
              <input
                aria-label={`Condition of ${item.name} on return`}
                placeholder="Condition on return"
                value={conditions[item.id] ?? ''}
                onChange={(event) => setConditions((current) => ({ ...current, [item.id]: event.target.value }))}
                className="ml-auto h-8 w-48 rounded-lg border border-[#D4DAEA] px-2 text-xs"
              />
            )}
          </li>
        ))}
      </ul>
      <label className="flex flex-col gap-1.5 text-xs font-semibold text-[#3E4766]">Notes
        <input value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} className={fieldInput} />
      </label>
      {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
      <div className="flex justify-end">
        <button type="submit" disabled={!count || state.isLoading} className="h-10 rounded-full bg-[#2F4BF5] px-5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-[#C3CADF]">
          {state.isLoading ? 'Saving…' : `Check in ${count} item${count === 1 ? '' : 's'}`}
        </button>
      </div>
    </form>
  )
}

/** D06 / W13 "Gate pass approvals" for IT Admin and technicians. */
export default function GatePassApprovals() {
  const { user } = useAuth()
  const passesQuery = useGetGatePassesQuery()
  const [filter, setFilter] = useState<Filter>('Waiting')
  const [reviewing, setReviewing] = useState<GatePass | null>(null)
  const [handingOver, setHandingOver] = useState<GatePass | null>(null)
  const [checkingIn, setCheckingIn] = useState<GatePass | null>(null)

  const passes = passesQuery.data ?? []
  const shown = passes.filter(FILTERS.find((item) => item.value === filter)!.match)

  return (
    <main className="min-h-full px-4 py-5 sm:px-6 sm:py-6 lg:px-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#111a3b]">Gate pass approvals</h1>
          <p className="mt-1 text-sm text-slate-500">Check every item, sign with your saved signature, and hand over. Approved passes reach the gate straight away.</p>
        </div>
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filter passes">
          {FILTERS.map((item) => {
            const count = passes.filter(item.match).length
            const active = filter === item.value
            return (
              <button
                key={item.value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(item.value)}
                className={`flex h-8 items-center rounded-[9px] px-3 text-[13px] font-semibold ${
                  active
                    ? 'bg-[#0F1A4A] text-white'
                    : item.value === 'Overdue' && count
                      ? 'bg-[#FDE7E5] font-bold text-[#B42318]'
                      : 'border border-[#D4DAEA] bg-white text-[#0E1430]'
                }`}
              >
                {item.value}{item.value === 'All' ? '' : ` ${count}`}
              </button>
            )
          })}
        </div>
      </div>

      <section className="mt-4 overflow-hidden rounded-2xl bg-white">
        {passesQuery.isLoading ? (
          <p role="status" className="py-10 text-center text-sm text-slate-500">Loading gate passes…</p>
        ) : passesQuery.isError ? (
          <div role="alert" className="py-10 text-center">
            <p className="text-sm text-red-700">{getApiErrorMessage(passesQuery.error, 'Gate passes could not be loaded.')}</p>
            <button type="button" onClick={() => void passesQuery.refetch()} className="mt-2 text-xs font-semibold text-[#3155ff] hover:underline">Retry</button>
          </div>
        ) : shown.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">No passes in “{filter}”.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-[13px]">
              <thead>
                <tr className="bg-[#F7F8FC] text-left text-[11px] uppercase tracking-[0.05em] text-[#5B6480]">
                  <th className="px-3.5 py-2.5">Pass</th><th className="px-2 py-2.5">Requested by</th><th className="px-2 py-2.5">Device</th>
                  <th className="px-2 py-2.5">Reason</th><th className="px-2 py-2.5">Out → back</th><th className="px-2 py-2.5">State</th>
                  <th className="px-3.5 py-2.5"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {shown.map((pass) => {
                  const own = pass.requester.id === user?.id
                  return (
                    <tr key={pass.id} className="border-t border-[#EEF1F8]">
                      <td className="px-3.5 py-3 font-mono font-semibold">{pass.code}</td>
                      <td className="px-2 py-3 font-semibold">{pass.requester.fullName} <span className="font-normal text-slate-500">· {pass.requester.department.name}</span></td>
                      <td className="px-2 py-3">
                        <span className="rounded bg-[#D6F25B] px-1.5 py-0.5 font-mono text-[11px] font-semibold text-[#1A2200]">{pass.asset.assetTag}</span>{' '}
                        {pass.asset.make} {pass.asset.model}
                        {pass.items.length > 1 && <span className="text-[#5B6480]"> + {pass.items.length - 1} items</span>}{' '}
                        <span className={`text-[11px] font-bold ${pass.isReturnable ? 'text-[#1C2E9E]' : 'text-[#8A4B05]'}`}>· {pass.isReturnable ? 'Returnable' : 'Non-returnable'}</span>
                      </td>
                      <td className="px-2 py-3 text-[#3E4766]">{pass.reason}</td>
                      <td className="px-2 py-3 font-mono text-xs">{formatShortDay(pass.leavesOn)} → {pass.isReturnable ? formatShortDay(pass.expectedReturnAt) : 'for good'}</td>
                      <td className="px-2 py-3"><PassStatePill pass={pass} /></td>
                      <td className="px-3.5 py-3 text-right">
                        <span className="inline-flex flex-wrap justify-end gap-1.5">
                          {pass.status === 'PENDING' && (
                            <button
                              type="button"
                              disabled={own}
                              title={own ? 'Someone else in IT has to review your own pass' : undefined}
                              onClick={() => setReviewing(pass)}
                              className="h-8 rounded-[9px] bg-[#2F4BF5] px-3 text-xs font-bold text-white disabled:cursor-not-allowed disabled:bg-[#C3CADF]"
                            >
                              Review
                            </button>
                          )}
                          {pass.status === 'APPROVED' && (
                            <button type="button" onClick={() => setHandingOver(pass)} className="h-8 rounded-[9px] bg-[#0F1A4A] px-3 text-xs font-bold text-white">
                              Hand over
                            </button>
                          )}
                          {pass.status === 'EXITED' && pass.isReturnable && (
                            <button type="button" onClick={() => setCheckingIn(pass)} className="h-8 rounded-[9px] bg-[#D6F25B] px-3 text-xs font-bold text-[#1A2200]">
                              Check in
                            </button>
                          )}
                          {pass.issuerSignature && (
                            <Link to={slipPath(pass.id)} className="flex h-8 items-center rounded-[9px] border border-[#CBD2E6] px-3 text-xs font-semibold text-[#0E1430]">
                              Slip
                            </Link>
                          )}
                        </span>
                        {passState(pass) === 'Rejected' && pass.reviewNote && <p className="mt-1 max-w-[200px] text-left text-[11px] text-[#B42318]">{pass.reviewNote}</p>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Dialog open={Boolean(reviewing)} onOpenChange={(open) => !open && setReviewing(null)}>
        <DialogContent className="max-w-[960px]">
          {reviewing && <ReviewDialog key={reviewing.id} pass={reviewing} onClose={() => setReviewing(null)} />}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(checkingIn)} onOpenChange={(open) => !open && setCheckingIn(null)}>
        <DialogContent className="max-w-2xl">
          {checkingIn && <CheckInDialog key={checkingIn.id} pass={checkingIn} onClose={() => setCheckingIn(null)} />}
        </DialogContent>
      </Dialog>

      <HandoverDialog pass={handingOver} signingAsRequester={false} onClose={() => setHandingOver(null)} />
    </main>
  )
}
