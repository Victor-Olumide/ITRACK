import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { ChevronLeft } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useGetAssetQuery, useRetireAssetMutation, useUpdateAssetMutation } from '../lib/api/assets/assets-api'
import type { AssetCondition } from '../lib/api/assets/types'

const CONDITION_LABELS: Record<AssetCondition, string> = {
  NEW: 'New',
  GOOD: 'Good',
  FAIR: 'Fair',
  FAULTY: 'Faulty',
  RETIRED: 'Retired',
}

function formatDate(value: string | null) {
  if (!value) return 'Not recorded'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Not recorded' : date.toLocaleDateString('en-GB')
}

export default function DeviceDetailsPage({ basePath = '/devices' }: { basePath?: string }) {
  const navigate = useNavigate()
  const { tag } = useParams()
  const { user } = useAuth()
  const assetQuery = useGetAssetQuery(tag ?? '', { skip: !tag })
  const [updateAsset, updateState] = useUpdateAssetMutation()
  const [retireAsset, retireState] = useRetireAssetMutation()
  const [actionError, setActionError] = useState('')
  const asset = assetQuery.data

  const changeCondition = async (condition: AssetCondition) => {
    if (!asset) return
    setActionError('')
    try {
      await updateAsset({ id: asset.id, body: { condition } }).unwrap()
    } catch {
      setActionError('Unable to update the asset condition. Try again.')
    }
  }

  const retire = async () => {
    if (!asset || !window.confirm(`Retire asset ${asset.assetTag}?`)) return
    setActionError('')
    try {
      await retireAsset(asset.id).unwrap()
    } catch {
      setActionError('Unable to retire this asset. Try again.')
    }
  }

  if (assetQuery.isLoading) {
    return <main className="flex min-h-full items-center justify-center p-8 text-sm text-slate-500">Loading asset…</main>
  }

  if (assetQuery.isError || !asset) {
    return (
      <main className="flex min-h-full items-center justify-center px-4 py-10">
        <section className="max-w-md rounded-2xl border border-[#e9edf6] bg-white p-6 text-center">
          <h1 className="text-lg font-semibold text-[#111a3b]">{assetQuery.isError ? 'Asset could not be loaded' : 'Asset not found'}</h1>
          <p className="mt-2 text-sm text-slate-500">
            {assetQuery.isError ? 'The server request failed. Try again or return to the asset list.' : 'No asset matched this tag or ID.'}
          </p>
          <button type="button" onClick={() => navigate(basePath)} className="mt-4 rounded-full bg-[#3155ff] px-4 py-2 text-xs font-semibold text-white">
            Back to assets
          </button>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-full bg-[#f4f6fc] px-4 py-5 sm:px-6 sm:py-6 lg:px-7">
      <div className="mx-auto max-w-5xl">
        <button type="button" onClick={() => navigate(basePath)} className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-[#3155ff]">
          <ChevronLeft size={16} /> Assets
        </button>
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-mono text-xs font-semibold text-slate-500">{asset.assetTag}</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#111a3b]">{asset.make} {asset.model}</h1>
            <p className="mt-1 text-sm text-slate-500">{asset.type} · {CONDITION_LABELS[asset.condition]}</p>
          </div>
          <span className="rounded-full bg-[#edf1ff] px-3 py-1.5 text-xs font-semibold text-[#3155ff]">
            {asset.assignedTo?.fullName ?? 'Unassigned'}
          </span>
        </header>

        {actionError && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{actionError}</p>}

        <section className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-[#e9edf6] bg-white p-5">
            <h2 className="text-sm font-bold text-[#202844]">Asset details</h2>
            <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div><dt className="text-xs text-slate-500">Serial number</dt><dd className="mt-1 break-all text-sm font-medium text-[#202844]">{asset.serialNumber}</dd></div>
              <div><dt className="text-xs text-slate-500">Condition</dt><dd className="mt-1 text-sm font-medium text-[#202844]">{CONDITION_LABELS[asset.condition]}</dd></div>
              <div><dt className="text-xs text-slate-500">Purchase date</dt><dd className="mt-1 text-sm font-medium text-[#202844]">{formatDate(asset.purchaseDate)}</dd></div>
              <div><dt className="text-xs text-slate-500">Warranty expiry</dt><dd className="mt-1 text-sm font-medium text-[#202844]">{formatDate(asset.warrantyExpiry)}</dd></div>
              <div className="sm:col-span-2"><dt className="text-xs text-slate-500">Notes</dt><dd className="mt-1 whitespace-pre-wrap text-sm text-[#202844]">{asset.notes || 'No notes recorded'}</dd></div>
            </dl>
          </article>

          <article className="rounded-2xl border border-[#e9edf6] bg-white p-5">
            <h2 className="text-sm font-bold text-[#202844]">Related tickets</h2>
            {asset.tickets.length ? (
              <div className="mt-3 divide-y divide-[#edf0f7]">
                {asset.tickets.map((ticket) => (
                  <div key={ticket.id} className="py-3 first:pt-0 last:pb-0">
                    <p className="text-sm font-semibold text-[#202844]">{ticket.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{ticket.number} · {ticket.status} · {ticket.priority}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500">No related tickets.</p>
            )}
          </article>
        </section>

        <section className="mt-4 rounded-2xl border border-[#e9edf6] bg-white p-5">
          <h2 className="text-sm font-bold text-[#202844]">Assignment history</h2>
          {asset.assignmentHistory.length ? (
            <ol className="mt-3 divide-y divide-[#edf0f7]">
              {asset.assignmentHistory.map((change) => (
                <li key={change.id} className="py-3 first:pt-0 last:pb-0">
                  <p className="text-sm text-[#202844]">
                    {change.previousAssigneeName ?? 'Unassigned'} → {change.newAssigneeName ?? 'Unassigned'}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Changed by {change.changedBy.fullName} · {new Date(change.createdAt).toLocaleString('en-GB')}
                  </p>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-3 text-sm text-slate-500">No assignment changes recorded.</p>
          )}
        </section>

        {(user?.role === 'IT Admin' || user?.role === 'Technician') && asset.condition !== 'RETIRED' && (
          <section className="mt-4 rounded-2xl border border-[#e9edf6] bg-white p-5">
            <h2 className="text-sm font-bold text-[#202844]">Supported asset actions</h2>
            <div className="mt-3 flex flex-wrap items-end gap-3">
              <label className="text-xs font-semibold text-slate-600">
                Update condition
                <select
                  value={asset.condition}
                  disabled={updateState.isLoading}
                  onChange={(event) => void changeCondition(event.target.value as AssetCondition)}
                  className="mt-1.5 block rounded-xl border border-[#e3e8f2] bg-white px-3 py-2.5 text-sm font-normal text-[#202844]"
                >
                  {(['NEW', 'GOOD', 'FAIR', 'FAULTY'] as const).map((condition) => (
                    <option key={condition} value={condition}>{CONDITION_LABELS[condition]}</option>
                  ))}
                </select>
              </label>
              {user.role === 'IT Admin' && (
                <button type="button" disabled={retireState.isLoading} onClick={() => void retire()} className="rounded-full border border-red-200 px-4 py-2.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">
                  {retireState.isLoading ? 'Retiring…' : 'Retire asset'}
                </button>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
