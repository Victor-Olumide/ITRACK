// W17 categories and SLA targets: how tickets are classified and how quickly
// each priority must be resolved before it shows as overdue.
import { useState, type SubmitEvent } from 'react'
import { Pencil, Tags, Timer, Trash2 } from 'lucide-react'
import Dropdown from '../components/Dropdown'
import { useToast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { getApiErrorMessage } from '../lib/api/error-message'
import { TICKET_PRIORITY_OPTIONS } from '../lib/api/tickets/ticket-priority'
import {
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useGetCategoriesQuery,
  useGetSlaTargetsQuery,
  useUpdateCategoryMutation,
  useUpdateSlaTargetsMutation,
  type ServerTicketPriority,
  type SlaTarget,
  type TicketCategory,
} from '../lib/api/catalog/catalog-api'

const PRIORITY_LABEL: Record<ServerTicketPriority, string> = {
  P1_CRITICAL: 'Critical',
  P2_HIGH: 'High',
  P3_MEDIUM: 'Medium',
  P4_LOW: 'Low',
  P5_PLANNING: 'Planning (legacy)',
}

// Most serious first, matching how people read an SLA table.
const EDITABLE_PRIORITIES = [...TICKET_PRIORITY_OPTIONS].reverse()
const PRIORITY_OPTIONS = EDITABLE_PRIORITIES.map((option) => ({ value: option.value, label: option.label }))

const input = 'h-10 w-full rounded-xl border border-[#d4daea] px-3 text-sm font-normal outline-none focus:border-[#3155ff] focus:ring-2 focus:ring-blue-100'

function formatMinutes(minutes: number | null) {
  if (minutes == null) return '—'
  if (minutes % (24 * 60) === 0) return `${minutes / (24 * 60)} d`
  if (minutes % 60 === 0) return `${minutes / 60} h`
  return `${minutes} min`
}

export default function CategoriesSla() {
  return (
    <main className="min-h-full px-4 py-5 sm:px-6 sm:py-6 lg:px-7">
      <h1 className="text-2xl font-bold tracking-tight text-[#111a3b]">Categories and SLA targets</h1>
      <p className="mt-1 text-sm text-slate-500">How tickets are classified, and how quickly each priority must be resolved.</p>
      <div className="mt-5 grid max-w-6xl gap-4 xl:grid-cols-[1fr_420px]">
        <CategoriesSection />
        <SlaSection />
      </div>
    </main>
  )
}

function CategoriesSection() {
  const toast = useToast()
  const query = useGetCategoriesQuery()
  const [remove] = useDeleteCategoryMutation()
  const [editing, setEditing] = useState<TicketCategory | 'new' | null>(null)
  const categories = query.data ?? []

  const deleteCategory = async (category: TicketCategory) => {
    if (!window.confirm(`Delete the "${category.name}" category?`)) return
    try {
      await remove(category.id).unwrap()
      toast(`"${category.name}" deleted.`)
    } catch (error) {
      toast(getApiErrorMessage(error, 'The category could not be deleted.'), 'error')
    }
  }

  return (
    <section className="rounded-2xl border border-[#e9edf6] bg-white p-5" aria-labelledby="categories-heading">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Tags size={17} className="text-[#3155ff]" />
          <h2 id="categories-heading" className="text-base font-bold text-[#111a38]">Ticket categories</h2>
        </div>
        <button type="button" onClick={() => setEditing('new')} className="rounded-full bg-[#3155ff] px-4 py-2 text-xs font-semibold text-white">Add category</button>
      </div>
      <p className="mt-1 text-xs text-slate-500">Keywords help ITrack suggest a category while someone describes a problem. Categories used by tickets can be renamed but not deleted.</p>
      {query.isLoading ? (
        <p className="mt-4 text-sm text-slate-500">Loading categories…</p>
      ) : query.isError ? (
        <p role="alert" className="mt-4 text-sm text-red-700">{getApiErrorMessage(query.error, 'Categories could not be loaded.')}</p>
      ) : categories.length === 0 ? (
        <p className="mt-4 rounded-xl bg-[#fafbfe] p-6 text-center text-sm text-slate-500">No categories yet. They are also created when someone reports a ticket under a new name.</p>
      ) : (
        <ul className="mt-4 divide-y divide-[#eef1f7]">
          {categories.map((category) => (
            <li key={category.id} className="flex items-start gap-3 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-[#202844]">{category.name}</p>
                  <span className="rounded-full bg-[#eef2ff] px-2 py-0.5 text-[10px] font-semibold text-[#3155ff]">Default {PRIORITY_LABEL[category.defaultPriority]}</span>
                  <span className="text-[11px] text-slate-500">{category.ticketCount} ticket{category.ticketCount === 1 ? '' : 's'}</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">{category.keywords.length ? category.keywords.join(', ') : 'No keywords'}</p>
              </div>
              <button type="button" onClick={() => setEditing(category)} className="rounded-full p-2 text-slate-500 hover:bg-slate-100" aria-label={`Edit ${category.name}`} title="Edit"><Pencil size={14} /></button>
              <button
                type="button"
                disabled={category.ticketCount > 0}
                onClick={() => void deleteCategory(category)}
                className="rounded-full p-2 text-slate-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-500"
                aria-label={`Delete ${category.name}`}
                title={category.ticketCount > 0 ? 'Used by tickets; rename it instead' : 'Delete'}
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>{editing !== null && <CategoryForm key={editing === 'new' ? 'new' : editing.id} category={editing === 'new' ? null : editing} onDone={() => setEditing(null)} />}</DialogContent>
      </Dialog>
    </section>
  )
}

function CategoryForm({ category, onDone }: { category: TicketCategory | null; onDone: () => void }) {
  const toast = useToast()
  const [create, createState] = useCreateCategoryMutation()
  const [update, updateState] = useUpdateCategoryMutation()
  const [name, setName] = useState(category?.name ?? '')
  const [priority, setPriority] = useState<ServerTicketPriority>(category?.defaultPriority === 'P5_PLANNING' ? 'P4_LOW' : category?.defaultPriority ?? 'P3_MEDIUM')
  const [keywords, setKeywords] = useState(category?.keywords.join(', ') ?? '')
  const [error, setError] = useState('')
  const busy = createState.isLoading || updateState.isLoading

  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    const body = {
      name: name.trim(),
      defaultPriority: priority,
      keywords: keywords.split(',').map((word) => word.trim()).filter((word) => word.length >= 2),
    }
    try {
      if (category) await update({ id: category.id, ...body }).unwrap()
      else await create(body).unwrap()
      toast(category ? `"${body.name}" updated.` : `"${body.name}" added.`)
      onDone()
    } catch (err) {
      setError(getApiErrorMessage(err, 'The category could not be saved.'))
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>{category ? 'Edit category' : 'Add category'}</DialogTitle>
        <DialogDescription>{category?.ticketCount ? `Renaming updates all ${category.ticketCount} tickets in this category.` : 'Used to group and route new tickets.'}</DialogDescription>
      </DialogHeader>
      <label className="block text-xs font-semibold text-slate-600">Name<input required minLength={2} maxLength={80} value={name} onChange={(event) => setName(event.target.value)} placeholder="Printers" className={`mt-1.5 ${input}`} /></label>
      <label className="block text-xs font-semibold text-slate-600">Default priority<div className="mt-1.5"><Dropdown value={priority} onChange={(value) => setPriority(value as ServerTicketPriority)} ariaLabel="Default priority" options={PRIORITY_OPTIONS} /></div></label>
      <label className="block text-xs font-semibold text-slate-600">Keywords<input value={keywords} onChange={(event) => setKeywords(event.target.value)} placeholder="toner, paper jam, scanner" className={`mt-1.5 ${input}`} /><span className="mt-1 block font-normal text-slate-400">Separate with commas.</span></label>
      {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onDone} className="rounded-full border border-[#dce2ef] px-4 py-2.5 text-xs font-semibold text-[#202844]">Cancel</button>
        <button type="submit" disabled={busy} className="rounded-full bg-[#3155ff] px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50">{busy ? 'Saving…' : 'Save'}</button>
      </div>
    </form>
  )
}

function SlaSection() {
  const query = useGetSlaTargetsQuery()
  return (
    <section className="rounded-2xl border border-[#e9edf6] bg-white p-5" aria-labelledby="sla-heading">
      <div className="flex items-center gap-2">
        <Timer size={17} className="text-[#3155ff]" />
        <h2 id="sla-heading" className="text-base font-bold text-[#111a38]">SLA targets</h2>
      </div>
      <p className="mt-1 text-xs text-slate-500">Open tickets older than their resolution target show as overdue on queues and the dashboard.</p>
      {query.isLoading ? (
        <p className="mt-4 text-sm text-slate-500">Loading targets…</p>
      ) : query.isError || !query.data ? (
        <p role="alert" className="mt-4 text-sm text-red-700">{getApiErrorMessage(query.error, 'SLA targets could not be loaded.')}</p>
      ) : (
        <SlaForm key={query.data.map((target) => `${target.priority}:${target.resolveMinutes}:${target.responseMinutes}`).join('|')} targets={query.data} />
      )}
    </section>
  )
}

type Unit = 'h' | 'd'

function toUnits(minutes: number | null): { value: string; unit: Unit } {
  if (minutes == null) return { value: '', unit: 'h' }
  if (minutes >= 24 * 60 && minutes % (24 * 60) === 0) return { value: String(minutes / (24 * 60)), unit: 'd' }
  return { value: String(Math.round((minutes / 60) * 100) / 100), unit: 'h' }
}

function toMinutes(value: string, unit: Unit): number | null {
  const number = Number(value)
  if (!value.trim() || !Number.isFinite(number) || number <= 0) return null
  return Math.round(number * (unit === 'd' ? 24 * 60 : 60))
}

function SlaForm({ targets }: { targets: SlaTarget[] }) {
  const toast = useToast()
  const [save, state] = useUpdateSlaTargetsMutation()
  const byPriority = new Map(targets.map((target) => [target.priority, target]))
  const [rows, setRows] = useState(() =>
    EDITABLE_PRIORITIES.map((option) => {
      const target = byPriority.get(option.value)
      return { priority: option.value as ServerTicketPriority, response: toUnits(target?.responseMinutes ?? null), resolve: toUnits(target?.resolveMinutes ?? null) }
    }),
  )
  const [error, setError] = useState('')

  const setRow = (index: number, field: 'response' | 'resolve', patch: Partial<{ value: string; unit: Unit }>) =>
    setRows((current) => current.map((row, i) => (i === index ? { ...row, [field]: { ...row[field], ...patch } } : row)))

  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    const payload = []
    for (const row of rows) {
      const resolveMinutes = toMinutes(row.resolve.value, row.resolve.unit)
      if (resolveMinutes == null) {
        setError(`Enter a resolution target for ${PRIORITY_LABEL[row.priority]}.`)
        return
      }
      payload.push({ priority: row.priority, resolveMinutes, responseMinutes: toMinutes(row.response.value, row.response.unit) })
    }
    try {
      await save(payload).unwrap()
      toast('SLA targets saved. Overdue flags now use the new targets.')
    } catch (err) {
      setError(getApiErrorMessage(err, 'SLA targets could not be saved.'))
    }
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-3">
      <div className="grid grid-cols-[80px_1fr_1fr] gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        <span>Priority</span><span>First response</span><span>Resolve within</span>
      </div>
      {rows.map((row, index) => {
        const target = byPriority.get(row.priority)
        return (
          <div key={row.priority} className="grid grid-cols-[80px_1fr_1fr] items-center gap-2">
            <div>
              <p className="text-sm font-semibold text-[#202844]">{PRIORITY_LABEL[row.priority]}</p>
              {target?.isDefault && <p className="text-[10px] text-slate-400">Default</p>}
            </div>
            {(['response', 'resolve'] as const).map((field) => (
              <div key={field} className="flex gap-1">
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={row[field].value}
                  onChange={(event) => setRow(index, field, { value: event.target.value })}
                  placeholder={field === 'response' ? 'Optional' : formatMinutes(target?.resolveMinutes ?? null)}
                  aria-label={`${PRIORITY_LABEL[row.priority]} ${field === 'response' ? 'first response' : 'resolution'} target`}
                  className={`${input} min-w-0 px-2`}
                />
                <select
                  value={row[field].unit}
                  onChange={(event) => setRow(index, field, { unit: event.target.value as Unit })}
                  aria-label={`${PRIORITY_LABEL[row.priority]} ${field} unit`}
                  className="h-10 rounded-xl border border-[#d4daea] bg-white px-1.5 text-xs"
                >
                  <option value="h">hours</option>
                  <option value="d">days</option>
                </select>
              </div>
            ))}
          </div>
        )
      })}
      {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
      <div className="flex justify-end">
        <button type="submit" disabled={state.isLoading} className="rounded-full bg-[#3155ff] px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50">{state.isLoading ? 'Saving…' : 'Save targets'}</button>
      </div>
    </form>
  )
}
