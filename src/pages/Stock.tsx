// W25 stock and licences: on-hand counts, reorder levels, licence expiry and
// a logged history of every issue and restock.
import { useState, type SubmitEvent } from 'react'
import { AlertTriangle, History, Package, Plus } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import Dropdown from '../components/Dropdown'
import DatePicker from '../components/DatePicker'
import { useToast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { getApiErrorMessage } from '../lib/api/error-message'
import {
  useAdjustStockMutation,
  useCreateStockItemMutation,
  useGetStockItemQuery,
  useGetStockQuery,
  useGetStockSummaryQuery,
  useUpdateStockItemMutation,
  type StockItem,
  type StockKind,
} from '../lib/api/stock/stock-api'

const KIND_LABELS: Record<StockKind, string> = {
  ACCESSORY: 'Accessory',
  PART: 'Part',
  CONSUMABLE: 'Consumable',
  LICENCE: 'Licence',
}

const KIND_OPTIONS = (Object.keys(KIND_LABELS) as StockKind[]).map((value) => ({ value, label: KIND_LABELS[value] }))

const input = 'mt-1.5 h-10 w-full rounded-xl border border-[#d4daea] px-3 text-sm font-normal outline-none focus:border-[#3155ff] focus:ring-2 focus:ring-blue-100'

function formatDate(iso: string | null) {
  return iso ? new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
}

function StatusPill({ item }: { item: StockItem }) {
  if (item.isArchived) return <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">Archived</span>
  if (item.licenceStatus === 'EXPIRED') return <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700">Expired</span>
  if (item.licenceStatus === 'EXPIRING') return <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800">Expires soon</span>
  if (item.isLow) return <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800">Low stock</span>
  return <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">In stock</span>
}

export default function Stock() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'IT Admin'
  const [kind, setKind] = useState<StockKind | ''>('')
  const [search, setSearch] = useState('')
  const [lowOnly, setLowOnly] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [creating, setCreating] = useState(false)
  const [adjusting, setAdjusting] = useState<StockItem | null>(null)
  const [historyFor, setHistoryFor] = useState<StockItem | null>(null)
  const toast = useToast()
  const [updateItem] = useUpdateStockItemMutation()

  const query = useGetStockQuery({ kind: kind || undefined, q: search.trim() || undefined, lowStock: lowOnly, includeArchived: showArchived })
  const summary = useGetStockSummaryQuery()
  const items = query.data ?? []

  const toggleArchive = async (item: StockItem) => {
    try {
      await updateItem({ id: item.id, isArchived: !item.isArchived }).unwrap()
      toast(item.isArchived ? `${item.name} restored.` : `${item.name} archived.`)
    } catch (error) {
      toast(getApiErrorMessage(error, 'The item could not be updated.'), 'error')
    }
  }

  const tiles = [
    { label: 'Items tracked', value: summary.data?.totalItems },
    { label: 'Low stock', value: summary.data?.lowStock, warn: Boolean(summary.data?.lowStock) },
    { label: 'Licences expiring in 30 days', value: summary.data?.licencesExpiringSoon, warn: Boolean(summary.data?.licencesExpiringSoon) },
    { label: 'Licences expired', value: summary.data?.licencesExpired, warn: Boolean(summary.data?.licencesExpired) },
  ]

  return (
    <main className="min-h-full px-4 py-5 sm:px-6 sm:py-6 lg:px-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Package size={19} className="text-[#3155ff]" />
            <h1 className="text-2xl font-bold tracking-tight text-[#111a3b]">Stock and licences</h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">Accessories, spare parts, consumables and software licences. Every change is logged.</p>
        </div>
        {isAdmin && (
          <button type="button" onClick={() => setCreating(true)} className="inline-flex items-center gap-1.5 rounded-full bg-[#3155ff] px-4 py-2.5 text-xs font-semibold text-white">
            <Plus size={14} /> Add item
          </button>
        )}
      </div>

      <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Stock summary">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-2xl border border-[#e9edf6] bg-white p-4">
            <p className="text-xs font-medium text-slate-500">{tile.label}</p>
            <p className={`mt-1 text-2xl font-bold ${tile.warn ? 'text-amber-700' : 'text-[#111a3b]'}`}>{tile.value ?? '—'}</p>
          </div>
        ))}
      </section>

      <section className="mt-4 flex flex-wrap items-end gap-3 rounded-2xl border border-[#e9edf6] bg-white p-3">
        <label className="min-w-48 flex-1 text-xs font-semibold text-slate-600">
          Search
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, SKU or vendor" className={input} />
        </label>
        <label className="w-44 text-xs font-semibold text-slate-600">
          Type
          <div className="mt-1.5"><Dropdown value={kind} onChange={(value) => setKind(value as StockKind | '')} ariaLabel="Stock type" options={[{ value: '', label: 'All types' }, ...KIND_OPTIONS]} /></div>
        </label>
        <label className="flex h-10 items-center gap-2 text-xs font-semibold text-slate-600">
          <input type="checkbox" checked={lowOnly} onChange={(event) => setLowOnly(event.target.checked)} className="size-4 accent-[#3155ff]" /> Low stock only
        </label>
        <label className="flex h-10 items-center gap-2 text-xs font-semibold text-slate-600">
          <input type="checkbox" checked={showArchived} onChange={(event) => setShowArchived(event.target.checked)} className="size-4 accent-[#3155ff]" /> Show archived
        </label>
      </section>

      <section className="mt-4 overflow-x-auto rounded-2xl border border-[#e9edf6] bg-white">
        {query.isLoading ? (
          <p className="p-8 text-center text-sm text-slate-500">Loading stock…</p>
        ) : query.isError ? (
          <p role="alert" className="p-8 text-center text-sm text-red-700">{getApiErrorMessage(query.error, 'Stock could not be loaded.')}</p>
        ) : items.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">
            {search || kind || lowOnly ? 'No items match these filters.' : isAdmin ? 'No stock yet. Add your first item to start tracking it.' : 'No stock has been added yet.'}
          </p>
        ) : (
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead className="bg-[#fafbfe] text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Item</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 text-right font-semibold">On hand</th>
                <th className="px-4 py-3 text-right font-semibold">Reorder at</th>
                <th className="px-4 py-3 font-semibold">Location / expiry</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eef1f7] text-[#202844]">
              {items.map((item) => (
                <tr key={item.id} className={item.isArchived ? 'opacity-60' : ''}>
                  <td className="px-4 py-3">
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-[11px] text-slate-500">{[item.sku, item.vendor].filter(Boolean).join(' · ') || '—'}</p>
                  </td>
                  <td className="px-4 py-3">{KIND_LABELS[item.kind]}</td>
                  <td className={`px-4 py-3 text-right font-mono text-sm font-bold ${item.isLow ? 'text-amber-700' : ''}`}>
                    {item.quantity} <span className="font-sans text-[11px] font-normal text-slate-500">{item.kind === 'LICENCE' ? 'seats' : item.unit}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">{item.reorderLevel}</td>
                  <td className="px-4 py-3">{item.kind === 'LICENCE' ? `Expires ${formatDate(item.licenceExpiresAt)}` : item.location || '—'}</td>
                  <td className="px-4 py-3"><StatusPill item={item} /></td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      <button type="button" onClick={() => setHistoryFor(item)} className="rounded-full p-2 text-slate-500 hover:bg-slate-100" aria-label={`History for ${item.name}`} title="History">
                        <History size={14} />
                      </button>
                      {!item.isArchived && (
                        <button type="button" onClick={() => setAdjusting(item)} className="rounded-full border border-[#dce2ef] px-3 py-1.5 font-semibold">
                          {item.kind === 'LICENCE' ? 'Assign / free seats' : 'Issue / restock'}
                        </button>
                      )}
                      {isAdmin && (
                        <button type="button" onClick={() => void toggleArchive(item)} className="rounded-full px-3 py-1.5 font-semibold text-slate-500 hover:bg-slate-100">
                          {item.isArchived ? 'Restore' : 'Archive'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="max-w-2xl">{creating && <CreateItemForm onDone={() => setCreating(false)} />}</DialogContent>
      </Dialog>
      <Dialog open={Boolean(adjusting)} onOpenChange={(open) => !open && setAdjusting(null)}>
        <DialogContent>{adjusting && <AdjustForm key={adjusting.id} item={adjusting} onDone={() => setAdjusting(null)} />}</DialogContent>
      </Dialog>
      <Dialog open={Boolean(historyFor)} onOpenChange={(open) => !open && setHistoryFor(null)}>
        <DialogContent className="max-w-xl">{historyFor && <StockHistory key={historyFor.id} item={historyFor} />}</DialogContent>
      </Dialog>
    </main>
  )
}

function CreateItemForm({ onDone }: { onDone: () => void }) {
  const toast = useToast()
  const [create, state] = useCreateStockItemMutation()
  const [kind, setKind] = useState<StockKind>('ACCESSORY')
  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
  const [unit, setUnit] = useState('pcs')
  const [quantity, setQuantity] = useState('0')
  const [reorderLevel, setReorderLevel] = useState('0')
  const [location, setLocation] = useState('')
  const [vendor, setVendor] = useState('')
  const [expires, setExpires] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const isLicence = kind === 'LICENCE'

  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    try {
      const item = await create({
        kind,
        name: name.trim(),
        sku: sku.trim() || null,
        unit: isLicence ? 'seats' : unit.trim() || 'pcs',
        quantity: Number(quantity) || 0,
        reorderLevel: Number(reorderLevel) || 0,
        location: location.trim() || null,
        vendor: vendor.trim() || null,
        licenceExpiresAt: isLicence ? expires || null : null,
        notes: notes.trim() || null,
      }).unwrap()
      toast(`${item.name} added to stock.`)
      onDone()
    } catch (err) {
      setError(getApiErrorMessage(err, 'The item could not be added.'))
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>Add stock item</DialogTitle>
        <DialogDescription>The opening quantity is recorded as the first entry in the item's history.</DialogDescription>
      </DialogHeader>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-semibold text-slate-600">Type<div className="mt-1.5"><Dropdown value={kind} onChange={(value) => setKind(value as StockKind)} ariaLabel="Item type" options={KIND_OPTIONS} /></div></label>
        <label className="text-xs font-semibold text-slate-600">Name<input required minLength={2} maxLength={120} value={name} onChange={(event) => setName(event.target.value)} placeholder={isLicence ? 'Microsoft 365 Business' : 'USB-C charger 65W'} className={input} /></label>
        <label className="text-xs font-semibold text-slate-600">SKU<input maxLength={60} value={sku} onChange={(event) => setSku(event.target.value)} placeholder="Optional, must be unique" className={input} /></label>
        <label className="text-xs font-semibold text-slate-600">Vendor<input maxLength={120} value={vendor} onChange={(event) => setVendor(event.target.value)} placeholder="Optional" className={input} /></label>
        <label className="text-xs font-semibold text-slate-600">{isLicence ? 'Unassigned seats' : 'Opening quantity'}<input type="number" min={0} required value={quantity} onChange={(event) => setQuantity(event.target.value)} className={input} /></label>
        <label className="text-xs font-semibold text-slate-600">Reorder level<input type="number" min={0} required value={reorderLevel} onChange={(event) => setReorderLevel(event.target.value)} className={input} /></label>
        {isLicence ? (
          <label className="text-xs font-semibold text-slate-600">Licence expires<div className="mt-1.5"><DatePicker value={expires} onChange={setExpires} /></div></label>
        ) : (
          <>
            <label className="text-xs font-semibold text-slate-600">Unit<input maxLength={30} value={unit} onChange={(event) => setUnit(event.target.value)} placeholder="pcs, boxes, cartridges" className={input} /></label>
            <label className="text-xs font-semibold text-slate-600">Location<input maxLength={120} value={location} onChange={(event) => setLocation(event.target.value)} placeholder="IT store, shelf B" className={input} /></label>
          </>
        )}
      </div>
      <label className="block text-xs font-semibold text-slate-600">Notes<textarea maxLength={1000} value={notes} onChange={(event) => setNotes(event.target.value)} rows={2} className="mt-1.5 w-full rounded-xl border border-[#d4daea] px-3 py-2.5 text-sm font-normal outline-none focus:border-[#3155ff] focus:ring-2 focus:ring-blue-100" /></label>
      {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onDone} className="rounded-full border border-[#dce2ef] px-4 py-2.5 text-xs font-semibold text-[#202844]">Cancel</button>
        <button type="submit" disabled={state.isLoading} className="rounded-full bg-[#3155ff] px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50">{state.isLoading ? 'Adding…' : 'Add item'}</button>
      </div>
    </form>
  )
}

function AdjustForm({ item, onDone }: { item: StockItem; onDone: () => void }) {
  const toast = useToast()
  const [adjust, state] = useAdjustStockMutation()
  const [direction, setDirection] = useState<'out' | 'in'>('out')
  const [amount, setAmount] = useState('1')
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const unit = item.kind === 'LICENCE' ? 'seats' : item.unit
  const count = Math.max(0, Math.floor(Number(amount) || 0))
  const after = item.quantity + (direction === 'in' ? count : -count)

  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    try {
      const updated = await adjust({ id: item.id, delta: direction === 'in' ? count : -count, reason: reason.trim() }).unwrap()
      toast(`${updated.name}: ${updated.quantity} ${unit} on hand.`)
      if (updated.isLow && !item.isLow) toast(`${updated.name} is now at or below its reorder level.`, 'info')
      onDone()
    } catch (err) {
      setError(getApiErrorMessage(err, 'The adjustment could not be saved.'))
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>{item.name}</DialogTitle>
        <DialogDescription>{item.quantity} {unit} on hand. Each change is recorded with your name and reason.</DialogDescription>
      </DialogHeader>
      <div role="group" aria-label="Adjustment direction" className="grid grid-cols-2 rounded-full border border-[#dce2ef] p-0.5 text-xs font-semibold">
        {(['out', 'in'] as const).map((value) => (
          <button key={value} type="button" aria-pressed={direction === value} onClick={() => setDirection(value)} className={`rounded-full py-2 ${direction === value ? 'bg-[#101c52] text-white' : 'text-slate-600'}`}>
            {value === 'out' ? (item.kind === 'LICENCE' ? 'Assign seats' : 'Issue') : item.kind === 'LICENCE' ? 'Free seats' : 'Restock'}
          </button>
        ))}
      </div>
      <label className="block text-xs font-semibold text-slate-600">Quantity ({unit})<input type="number" min={1} required value={amount} onChange={(event) => setAmount(event.target.value)} className={input} /></label>
      <label className="block text-xs font-semibold text-slate-600">Reason<input required minLength={3} maxLength={300} value={reason} onChange={(event) => setReason(event.target.value)} placeholder={direction === 'out' ? 'Issued to Finance for IT-0042' : 'Delivery from supplier, PO 1183'} className={input} /></label>
      <p className={`flex items-center gap-1.5 text-xs ${after < 0 ? 'text-red-700' : after <= item.reorderLevel ? 'text-amber-800' : 'text-slate-500'}`}>
        {after <= item.reorderLevel && <AlertTriangle size={13} aria-hidden="true" />}
        {after < 0 ? `Only ${item.quantity} ${unit} available.` : `After this change: ${after} ${unit}${after <= item.reorderLevel ? ' (at or below reorder level)' : ''}.`}
      </p>
      {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onDone} className="rounded-full border border-[#dce2ef] px-4 py-2.5 text-xs font-semibold text-[#202844]">Cancel</button>
        <button type="submit" disabled={state.isLoading || count < 1 || after < 0} className="rounded-full bg-[#3155ff] px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50">{state.isLoading ? 'Saving…' : 'Save change'}</button>
      </div>
    </form>
  )
}

function StockHistory({ item }: { item: StockItem }) {
  const query = useGetStockItemQuery(item.id)
  const unit = item.kind === 'LICENCE' ? 'seats' : item.unit
  return (
    <div>
      <DialogHeader>
        <DialogTitle>{item.name}</DialogTitle>
        <DialogDescription>Latest 50 changes, newest first.</DialogDescription>
      </DialogHeader>
      {query.isLoading ? (
        <p className="mt-4 text-sm text-slate-500">Loading history…</p>
      ) : query.isError || !query.data ? (
        <p role="alert" className="mt-4 text-sm text-red-700">{getApiErrorMessage(query.error, 'History could not be loaded.')}</p>
      ) : query.data.movements.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">No changes recorded yet.</p>
      ) : (
        <ol className="mt-4 divide-y divide-[#eef1f7]">
          {query.data.movements.map((movement) => (
            <li key={movement.id} className="flex items-start justify-between gap-3 py-2.5 text-xs">
              <div className="min-w-0">
                <p className="font-semibold text-[#202844]">{movement.reason}</p>
                <p className="text-slate-500">{movement.actor.fullName} · {new Date(movement.createdAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</p>
              </div>
              <div className="shrink-0 text-right font-mono">
                <p className={`font-bold ${movement.delta > 0 ? 'text-emerald-700' : 'text-[#202844]'}`}>{movement.delta > 0 ? '+' : ''}{movement.delta}</p>
                <p className="text-[11px] text-slate-500">{movement.quantityAfter} {unit}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
