// src/pages/GatePasses.jsx
// Gate pass approvals list + review modal. The Review button on each row
// opens a full-detail modal for that pass. All data comes from mockData.

import { useState } from 'react'
import { X, ClipboardCheck } from 'lucide-react'
import { gatePasses, userById, deviceByTag } from '../lib/mockData'
import Badge from '../components/Badge'
import AssetTag from '../components/AssetTag'
import { useAuth } from '../contexts/AuthContext'
import {
  getGatePassStatusUpdates,
  getSubmittedPasses,
  saveGatePassStatus,
} from '../lib/sessionData'
import GatePassSlip from './GatePassSlip'
import type { GatePass, GatePassItem, GatePassStatus, PublicUser } from '../lib/types'

// ── helpers ──────────────────────────────────────────────────
const CLASS_BY_PREFIX: Record<string, string> = {
  'IT-LAP': 'Asset', 'IT-DSK': 'Asset', 'IT-MON': 'Asset', 'IT-PHN': 'Asset',
  'IT-ACC': 'Accessory',
}

interface GatePassItemRow {
  item: string
  classType: string
  tag: string
  make?: string
  serial?: string
  qty: number
  condition?: string
}

function toItemRow(it: GatePassItem): GatePassItemRow {
  const prefix = it.tag.split('-').slice(0, 2).join('-')
  const device = deviceByTag(it.tag)
  return {
    item: device
      ? device.make + ' ' + device.model
      : it.make ?? 'Accessory',
    classType: CLASS_BY_PREFIX[prefix] ?? 'Asset',
    tag: it.tag,
    make: it.make,
    serial: it.serial,
    qty: 1,
    condition: it.condition,
  }
}

// ── Review modal ─────────────────────────────────────────────
interface ReviewModalProps {
  pass: GatePass
  onClose: () => void
  onPreview: (pass: GatePass) => void
  viewer: PublicUser
  users: PublicUser[]
  onResolve: (status: GatePassStatus) => void
}

function ReviewModal({ pass, onClose, onPreview, viewer, users, onResolve }: ReviewModalProps) {
  const [isReturnable, setIsReturnable] = useState(true)
  const [pin, setPin] = useState('')

  const requester = users.find((item) => item.id === pass.requesterId) ?? userById(pass.requesterId)
  const items = pass.items.map(toItemRow)

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#08143b]/40 backdrop-blur-[2px]"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Modal */}
      <div className="w-full max-w-[960px] bg-white rounded-[32px] shadow-2xl flex flex-col max-h-[95vh]">

        {/* Scrollable body */}
        <div className="p-7 sm:p-8 overflow-y-auto">

          {/* ── Header ── */}
          <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-2xl font-bold text-[#111a38]">Review {pass.id}</h2>
                <span className="bg-[#111a38] text-white text-[10px] font-bold px-2 py-0.5 rounded-md tracking-wide">
                  DB6b
                </span>
              </div>
              <p className="text-sm text-slate-400 font-medium">
                {requester?.name} · {requester?.department} · staff ID {requester?.staffId}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {/* Returnable toggle */}
              <div className="flex rounded-full border border-slate-200 bg-slate-50 p-1">
                <button
                  onClick={() => setIsReturnable(true)}
                  className={`px-5 py-1.5 rounded-full text-sm font-bold transition-colors ${
                    isReturnable ? 'bg-[#111a38] text-white' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Returnable
                </button>
                <button
                  onClick={() => setIsReturnable(false)}
                  className={`px-5 py-1.5 rounded-full text-sm font-bold transition-colors ${
                    !isReturnable ? 'bg-[#111a38] text-white' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Non-returnable
                </button>
              </div>

              {/* Close */}
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* ── Trip details ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <label className="block">
              <span className="block text-xs font-semibold text-slate-500 mb-1.5">Purpose</span>
              <input
                readOnly
                value={pass.destination}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 bg-white outline-none"
              />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-slate-500 mb-1.5">Destination</span>
              <input
                readOnly
                value={pass.destination}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 bg-white outline-none"
              />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-slate-500 mb-1.5">Leaves on</span>
              <input
                type="date"
                readOnly
                value={pass.outDate}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 bg-white outline-none"
              />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-slate-500 mb-1.5">Back by</span>
              <input
                type="date"
                readOnly
                value={pass.returnDate}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 bg-white outline-none"
              />
            </label>
          </div>

          {/* ── Items leaving ── */}
          <div className="mb-8">
            <div className="flex flex-wrap justify-between items-end gap-3 mb-4">
              <div>
                <span className="text-sm font-bold text-[#111a38] mr-2">
                  Items leaving · {items.length}
                </span>
                <span className="text-xs font-medium text-slate-400">
                  Every item needs a serial if one is printed on it
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Scan or type a tag</span>
                <input
                  placeholder="IT-ACC-..."
                  className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm w-32 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <th className="pb-3 pr-4">Item</th>
                    <th className="pb-3 pr-4">Class</th>
                    <th className="pb-3 pr-4">Tag</th>
                    <th className="pb-3 pr-4">Make and model</th>
                    <th className="pb-3 pr-4">Serial number</th>
                    <th className="pb-3 pr-4">Qty</th>
                    <th className="pb-3">Condition</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((row, idx) => (
                    <tr key={idx} className="border-b border-slate-50">
                      <td className="py-3 font-bold text-slate-700 pr-4 whitespace-nowrap">{row.item}</td>
                      <td className="py-3 text-slate-500 pr-4">{row.classType}</td>
                      <td className="py-3 pr-4">
                        <span className="inline-flex items-center rounded-md bg-[#e2f97a] px-2 py-0.5 font-mono text-[11px] font-bold text-[#4c5c16]">
                          {row.tag}
                        </span>
                      </td>
                      <td className="py-3 text-slate-600 pr-4 whitespace-nowrap">{row.make}</td>
                      <td className="py-3 font-mono text-slate-600 pr-4 whitespace-nowrap">
                        {row.serial === 'None printed'
                          ? <span className="text-slate-400 font-sans not-italic">None printed</span>
                          : row.serial
                        }
                      </td>
                      <td className="py-3 text-slate-600 pr-4">{row.qty}</td>
                      <td className="py-3 text-slate-500">{row.condition}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Signatures ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 rounded-2xl border border-slate-200 overflow-hidden">

            {/* Issued by */}
            <div className="p-5 sm:border-r border-b sm:border-b-0 border-slate-200 bg-white">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Issued By</h4>
              <p className="text-sm font-bold text-[#111a38] mb-4">
                {viewer.name} · {viewer.role} · {viewer.staffId}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600">PIN</span>
                  <input
                    type="password"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="••••"
                    className="w-14 rounded-lg border border-slate-200 px-2 py-1.5 text-center text-sm font-bold tracking-widest outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <button className="bg-[#111a38] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm hover:bg-[#1a254c] transition-colors">
                  Apply my saved signature
                </button>
              </div>
            </div>

            {/* Received by */}
            <div className="p-5 bg-slate-50/50">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Received By</h4>
              <p className="text-sm font-bold text-[#111a38] mb-1">{requester?.name}</p>
              <p className="text-[11px] font-medium text-slate-400 leading-relaxed max-w-[90%]">
                Signs on screen at handover to accept the items and their condition.
                Security then releases the pass at the gate.
              </p>
            </div>

          </div>
        </div>

        {/* ── Footer ── */}
        <div className="px-7 py-5 sm:px-8 border-t border-slate-100 flex items-center justify-between rounded-b-[32px] bg-white shrink-0">
          <button
            type="button"
            onClick={() => onResolve('Rejected')}
            className="text-red-600 text-sm font-bold px-4 py-2 rounded-xl hover:bg-red-50 transition-colors"
          >
            Reject…
            </button>
          <div className="flex gap-3">
          <button
            type="button"
            onClick={() => onPreview({ ...pass, isReturnable })}
            className="px-6 py-2.5 rounded-full border border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-50 transition-colors"
          >
            Preview slip
          </button>
          <button
            type="button"
            onClick={() => onResolve('Approved')}
            disabled={pin.length < 4}
              className={`px-6 py-2.5 rounded-full text-sm font-bold transition-colors ${
                pin.length >= 4
                  ? 'bg-[#3155ff] text-white hover:bg-blue-700 cursor-pointer'
                  : 'bg-[#c9d4ff] text-white cursor-not-allowed'
              }`}
            >
              Sign to approve
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

// ── Gate passes list ─────────────────────────────────────────
const STATUSES: GatePassStatus[] = ['Waiting', 'Approved', 'Overdue', 'Rejected']

export default function GatePasses() {
  const { user, users } = useAuth()
  const [passes, setPasses] = useState<GatePass[]>(() => {
    const updates = getGatePassStatusUpdates()
    return [...gatePasses, ...getSubmittedPasses()].map((pass) => ({
      ...pass,
      status: updates[pass.id] ?? pass.status,
    }))
  })
  const [reviewPass, setReviewPass] = useState<GatePass | null>(null)
  const [previewPass, setPreviewPass] = useState<GatePass | null>(null)

  const counts = STATUSES.reduce<Record<GatePassStatus, number>>((acc, status) => {
    acc[status] = passes.filter((pass) => pass.status === status).length
    return acc
  }, { Waiting: 0, Approved: 0, Overdue: 0, Rejected: 0 })

  const resolvePass = (status: GatePassStatus) => {
    if (!reviewPass) return
    saveGatePassStatus(reviewPass.id, status)
    setPasses((current) => current.map((pass) => (
      pass.id === reviewPass.id ? { ...pass, status } : pass
    )))
    setReviewPass(null)
  }

  return (
    <div className="min-h-full bg-[#f4f6fc] p-5 sm:p-7">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#101a3b]">Gate passes</h1>
          <p className="mt-1 text-sm text-slate-500">Approve or reject requests to take devices off-site.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="bg-[#111a38] text-white px-3 py-1.5 rounded-full text-xs font-bold">
            Waiting {counts.Waiting}
          </span>
          <span className="bg-white text-slate-600 px-3 py-1.5 rounded-full text-xs font-bold border border-slate-200">
            Out now {counts.Approved}
          </span>
          <span className="bg-red-100 text-red-700 px-3 py-1.5 rounded-full text-xs font-bold">
            Overdue {counts.Overdue}
          </span>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-5 py-4 font-semibold">Pass</th>
                <th className="px-5 py-4 font-semibold">Requested by</th>
                <th className="px-5 py-4 font-semibold">Destination</th>
                <th className="px-5 py-4 font-semibold">Items</th>
                <th className="px-5 py-4 font-semibold">Out — Back</th>
                <th className="px-5 py-4 font-semibold">State</th>
                <th className="px-5 py-4 font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {passes.map((pass) => {
                const requester = users.find((item) => item.id === pass.requesterId) ?? userById(pass.requesterId)
                return (
                  <tr key={pass.id} className="border-t border-slate-100 hover:bg-blue-50/40">
                    <td className="px-5 py-4 font-mono font-semibold text-slate-800">{pass.id}</td>
                    <td className="px-5 py-4 text-slate-700">
                      {requester?.name ?? '—'}
                      <span className="block text-xs text-slate-400">{requester?.department}</span>
                    </td>
                    <td className="px-5 py-4 text-slate-600 max-w-[180px] truncate">{pass.destination}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1">
                        {pass.items.slice(0, 2).map((it) => (
                          <AssetTag key={it.tag} tag={it.tag} size="sm" />
                        ))}
                        {pass.items.length > 2 && (
                          <span className="text-xs text-slate-400 self-center">+{pass.items.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-500 whitespace-nowrap">
                      {pass.outDate} — {pass.returnDate}
                    </td>
                    <td className="px-5 py-4"><Badge label={pass.status} /></td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => setReviewPass(pass)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#3155ff] px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors"
                      >
                        <ClipboardCheck size={14} /> Review
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Review modal (portal-free, rendered at end of page) ── */}
      {reviewPass && user && (
        <ReviewModal
          pass={reviewPass}
          viewer={user}
          users={users}
          onClose={() => setReviewPass(null)}
          onPreview={setPreviewPass}
          onResolve={resolvePass}
        />
      )}
      {previewPass && user && (
        <GatePassSlip
          pass={previewPass}
          viewer={user}
          onClose={() => setPreviewPass(null)}
        />
      )}
    </div>
  )
}
