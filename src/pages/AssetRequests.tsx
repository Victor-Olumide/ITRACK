import { useState, type SubmitEvent } from 'react'
import { Link } from 'react-router'
import Dropdown from '../components/Dropdown'
import DatePicker from '../components/DatePicker'
import { useGetAssetsQuery } from '../lib/api/assets/assets-api'
import {
  useCreateAssetRequestMutation,
  useFulfillAssetRequestMutation,
  useGetAssetRequestsQuery,
  useReviewAssetRequestMutation,
  type AssetRequest,
  type AssetRequestType,
  type RequestAssetType,
} from '../lib/api/asset-requests/asset-requests-api'
import { getApiErrorMessage } from '../lib/api/error-message'

type Mode = 'employee' | 'department' | 'admin'

const TYPE_OPTIONS: Array<{ value: AssetRequestType; label: string }> = [
  { value: 'NEW_DEVICE', label: 'New device' },
  { value: 'REPLACEMENT', label: 'Replacement device' },
  { value: 'PERFORMANCE_UPGRADE', label: 'Performance upgrade' },
  { value: 'ACCESSORY', label: 'Accessory' },
]

const ASSET_TYPE_OPTIONS: Array<{ value: RequestAssetType; label: string }> = [
  { value: 'LAPTOP', label: 'Laptop' },
  { value: 'DESKTOP', label: 'Desktop' },
  { value: 'PRINTER', label: 'Printer' },
  { value: 'NETWORK', label: 'Network device' },
  { value: 'OTHER', label: 'Other' },
]

const STATUS_LABELS: Record<AssetRequest['status'], string> = {
  PENDING_DEPARTMENT_APPROVAL: 'Waiting for department approval',
  APPROVED: 'Approved - awaiting IT fulfilment',
  REJECTED: 'Rejected',
  FULFILLED: 'Fulfilled',
  PROCUREMENT_REQUIRED: 'Procurement required',
  CANCELLED: 'Cancelled',
}

const TYPE_LABELS = Object.fromEntries(TYPE_OPTIONS.map((item) => [item.value, item.label])) as Record<AssetRequestType, string>

function RequestCard({ request, mode, onReview, onFulfill }: { request: AssetRequest; mode: Mode; onReview: (request: AssetRequest, status: 'APPROVED' | 'REJECTED') => void; onFulfill: (request: AssetRequest) => void }) {
  return (
    <article className="rounded-2xl border border-[#e9edf6] bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-bold text-[#18203e]">{TYPE_LABELS[request.type]}</h2>
            <span className="rounded-full bg-[#eef2ff] px-2 py-1 text-[10px] font-semibold text-[#3155ff]">{STATUS_LABELS[request.status]}</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">{request.requester.fullName} · {request.department.name} · {new Date(request.createdAt).toLocaleDateString('en-GB')}</p>
        </div>
        {request.assignedAsset && <span className="rounded-md bg-lime-300 px-2 py-1 font-mono text-[10px] font-bold text-slate-900">{request.assignedAsset.assetTag}</span>}
      </div>
      <dl className="mt-3 grid gap-2 text-xs text-[#3e4766] sm:grid-cols-2">
        <div><dt className="font-semibold text-slate-500">Requested equipment</dt><dd>{[request.requestedMake, request.requestedModel, request.assetType].filter(Boolean).join(' · ') || 'To be selected by IT'}</dd></div>
        <div><dt className="font-semibold text-slate-500">Needed by</dt><dd>{request.neededBy ? new Date(request.neededBy).toLocaleDateString('en-GB') : 'No date specified'}</dd></div>
        <div className="sm:col-span-2"><dt className="font-semibold text-slate-500">Specifications</dt><dd className="mt-0.5 whitespace-pre-wrap">{request.requestedSpecs}</dd></div>
        <div className="sm:col-span-2"><dt className="font-semibold text-slate-500">Business justification</dt><dd className="mt-0.5 whitespace-pre-wrap">{request.justification}</dd></div>
      </dl>
      {request.reviewNote && <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900"><b>Review note:</b> {request.reviewNote}</p>}
      {request.procurementNote && <p className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-900"><b>IT note:</b> {request.procurementNote}</p>}
      {mode === 'department' && request.status === 'PENDING_DEPARTMENT_APPROVAL' && (
        <div className="mt-3 flex flex-wrap justify-end gap-2">
          <button type="button" onClick={() => onReview(request, 'REJECTED')} className="rounded-full border border-red-200 px-3 py-2 text-xs font-semibold text-red-700">Reject</button>
          <button type="button" onClick={() => onReview(request, 'APPROVED')} className="rounded-full bg-[#3155ff] px-3 py-2 text-xs font-semibold text-white">Approve for IT</button>
        </div>
      )}
      {mode === 'admin' && request.status === 'APPROVED' && (
        <div className="mt-3 flex justify-end">
          <button type="button" onClick={() => onFulfill(request)} className="rounded-full bg-[#3155ff] px-3 py-2 text-xs font-semibold text-white">Fulfil request</button>
        </div>
      )}
    </article>
  )
}

function NewRequestForm({ onDone }: { onDone: () => void }) {
  const [create, state] = useCreateAssetRequestMutation()
  const [type, setType] = useState<AssetRequestType>('NEW_DEVICE')
  const [assetType, setAssetType] = useState<RequestAssetType | ''>('LAPTOP')
  const [make, setMake] = useState('')
  const [model, setModel] = useState('')
  const [specs, setSpecs] = useState('')
  const [justification, setJustification] = useState('')
  const [neededBy, setNeededBy] = useState('')
  const [error, setError] = useState('')
  const input = 'mt-1.5 h-10 w-full rounded-xl border border-[#d4daea] px-3 text-sm outline-none focus:border-[#3155ff] focus:ring-2 focus:ring-blue-100'

  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    try {
      await create({ type, assetType: assetType || null, requestedMake: make || null, requestedModel: model || null, requestedSpecs: specs.trim(), justification: justification.trim(), neededBy: neededBy || null }).unwrap()
      onDone()
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'The asset request could not be submitted.'))
    }
  }

  return (
    <form onSubmit={submit} className="mt-5 max-w-3xl space-y-4 rounded-2xl border border-[#e9edf6] bg-white p-4 sm:p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-xs font-semibold text-slate-600">Request type<div className="mt-1.5"><Dropdown value={type} onChange={(value) => setType(value as AssetRequestType)} ariaLabel="Asset request type" options={TYPE_OPTIONS} /></div></label>
        <label className="text-xs font-semibold text-slate-600">Device or accessory type<div className="mt-1.5"><Dropdown value={assetType} onChange={(value) => setAssetType(value as RequestAssetType | '')} ariaLabel="Requested asset type" options={ASSET_TYPE_OPTIONS} /></div></label>
        <label className="text-xs font-semibold text-slate-600">Preferred make<input value={make} onChange={(event) => setMake(event.target.value)} placeholder="Optional" className={input} /></label>
        <label className="text-xs font-semibold text-slate-600">Preferred model<input value={model} onChange={(event) => setModel(event.target.value)} placeholder="Optional" className={input} /></label>
        <label className="text-xs font-semibold text-slate-600">Needed by<div className="mt-1.5"><DatePicker value={neededBy} onChange={setNeededBy} /></div></label>
      </div>
      <label className="block text-xs font-semibold text-slate-600">Specifications<textarea required minLength={3} maxLength={1500} value={specs} onChange={(event) => setSpecs(event.target.value)} placeholder="For example: 16 GB RAM, 512 GB SSD, suitable for large datasets." rows={3} className="mt-1.5 w-full rounded-xl border border-[#d4daea] px-3 py-2.5 text-sm font-normal outline-none focus:border-[#3155ff] focus:ring-2 focus:ring-blue-100" /></label>
      <label className="block text-xs font-semibold text-slate-600">Business justification<textarea required minLength={10} maxLength={2500} value={justification} onChange={(event) => setJustification(event.target.value)} placeholder="Explain the work requirement, performance problem, or role change." rows={4} className="mt-1.5 w-full rounded-xl border border-[#d4daea] px-3 py-2.5 text-sm font-normal outline-none focus:border-[#3155ff] focus:ring-2 focus:ring-blue-100" /></label>
      {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
      <div className="flex justify-end gap-2"><button type="button" onClick={onDone} className="rounded-full border border-[#dce2ef] px-4 py-2.5 text-xs font-semibold text-[#202844]">Cancel</button><button type="submit" disabled={state.isLoading} className="rounded-full bg-[#3155ff] px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50">{state.isLoading ? 'Submitting…' : 'Submit request'}</button></div>
    </form>
  )
}

export default function AssetRequestsPage({ mode, create = false }: { mode: Mode; create?: boolean }) {
  const requestsQuery = useGetAssetRequestsQuery()
  const availableQuery = useGetAssetsQuery({ assignedToId: 'unassigned', page: 1, pageSize: 100 }, { skip: mode !== 'admin' })
  const [review] = useReviewAssetRequestMutation()
  const [fulfill] = useFulfillAssetRequestMutation()
  const [fulfillment, setFulfillment] = useState<Record<string, { assetId: string; note: string }>>({})
  const [error, setError] = useState('')
  const title = mode === 'employee' ? (create ? 'Request equipment' : 'My asset requests') : mode === 'department' ? 'Department asset requests' : 'Asset request fulfilment'
  const description = mode === 'employee' ? 'Request a device, replacement, upgrade, or accessory for your work.' : mode === 'department' ? 'Review requests from employees in your department.' : 'Assign available stock or record that procurement is required.'
  const requests = requestsQuery.data ?? []

  const reviewRequest = async (request: AssetRequest, status: 'APPROVED' | 'REJECTED') => {
    const reviewNote = status === 'REJECTED' ? window.prompt('Reason for rejection')?.trim() : undefined
    if (status === 'REJECTED' && !reviewNote) return
    try { await review({ id: request.id, status, reviewNote }).unwrap() } catch (caught) { setError(getApiErrorMessage(caught, 'The request could not be reviewed.')) }
  }

  const fulfillRequest = async (request: AssetRequest) => {
    const selected = fulfillment[request.id] ?? { assetId: '', note: '' }
    try {
      await fulfill({ id: request.id, action: selected.assetId ? 'ASSIGN_EXISTING' : 'PROCUREMENT_REQUIRED', ...(selected.assetId ? { assetId: selected.assetId } : { procurementNote: selected.note || 'Procurement required for this approved request.' }) }).unwrap()
    } catch (caught) { setError(getApiErrorMessage(caught, 'The request could not be fulfilled.')) }
  }

  if (mode === 'employee' && create) return <main className="min-h-full px-4 py-5 sm:px-6 sm:py-6 lg:px-7"><div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold tracking-tight text-[#111a3b]">{title}</h1><p className="mt-1 text-sm text-slate-500">{description}</p></div><Link to="/employee/asset-requests" className="rounded-full border border-[#dce2ef] bg-white px-4 py-2.5 text-xs font-semibold text-[#202844]">My requests</Link></div><NewRequestForm onDone={() => window.history.back()} /></main>

  return <main className="min-h-full px-4 py-5 sm:px-6 sm:py-6 lg:px-7"><div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold tracking-tight text-[#111a3b]">{title}</h1><p className="mt-1 text-sm text-slate-500">{description}</p></div>{mode === 'employee' && <Link to="/employee/asset-requests/new" className="rounded-full bg-[#3155ff] px-4 py-2.5 text-xs font-semibold text-white">New request</Link>}</div>{error && <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}<section className="mt-5 space-y-3">{requestsQuery.isLoading ? <p className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500">Loading requests…</p> : requestsQuery.isError ? <p className="rounded-2xl bg-white p-8 text-center text-sm text-red-700">Asset requests could not be loaded.</p> : requests.length ? requests.map((request) => <div key={request.id}><RequestCard request={request} mode={mode} onReview={reviewRequest} onFulfill={fulfillRequest}/>{mode === 'admin' && request.status === 'APPROVED' && <div className="-mt-2 rounded-b-2xl border border-t-0 border-[#e9edf6] bg-[#fafbfe] p-3"><div className="flex flex-wrap items-end gap-3"><label className="min-w-60 flex-1 text-xs font-semibold text-slate-600">Available asset<Dropdown value={fulfillment[request.id]?.assetId ?? ''} onChange={(value) => setFulfillment((current) => ({ ...current, [request.id]: { assetId: value, note: current[request.id]?.note ?? '' } }))} placeholder="Mark for procurement" ariaLabel="Available asset" options={(availableQuery.data?.data ?? []).map((asset) => ({ value: asset.id, label: `${asset.assetTag} · ${asset.make} ${asset.model}` }))}/></label><input value={fulfillment[request.id]?.note ?? ''} onChange={(event) => setFulfillment((current) => ({ ...current, [request.id]: { assetId: current[request.id]?.assetId ?? '', note: event.target.value } }))} placeholder="Procurement note (optional)" className="h-9 min-w-60 flex-1 rounded-lg border border-[#d4daea] px-2 text-xs"/><button type="button" onClick={() => void fulfillRequest(request)} className="h-9 rounded-lg bg-[#3155ff] px-3 text-xs font-semibold text-white">Confirm fulfilment</button></div></div>}</div>) : <p className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500">No asset requests yet.</p>}</section></main>
}
