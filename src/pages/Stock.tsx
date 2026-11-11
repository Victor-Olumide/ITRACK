// Stock room register with low-stock filters and a local receive-stock flow.

import { useMemo, useState } from 'react'
import { AlertTriangle, Package, Printer, Search, Truck } from 'lucide-react'
import { stock as initialStock } from '../lib/data/mockData'
import type { FormEvent } from 'react'

const MINIMUM_STOCK = 6
const FILTERS = ['All items', 'Below minimum', 'Out with people']

export default function Stock() {
  const [items, setItems] = useState(initialStock)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All items')
  const [receiveOpen, setReceiveOpen] = useState(false)
  const [receiveItem, setReceiveItem] = useState(initialStock[0]?.id ?? '')
  const [receiveQuantity, setReceiveQuantity] = useState(1)
  const belowMinimum = items.filter((item) => item.inStock < MINIMUM_STOCK)
  const outWithPeople = items.filter((item) => item.total > item.inStock)
  const visibleItems = useMemo(() => items.filter((item) => {
    const matchesSearch = `${item.name} ${item.make} ${item.category} ${item.id}`
      .toLowerCase().includes(query.trim().toLowerCase())
    const matchesFilter = filter === 'All items'
      || (filter === 'Below minimum' && item.inStock < MINIMUM_STOCK)
      || (filter === 'Out with people' && item.total > item.inStock)
    return matchesSearch && matchesFilter
  }), [items, query, filter])

  const receiveStock = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const amount = Number(receiveQuantity)
    if (!Number.isInteger(amount) || amount < 1) return
    setItems((current) => current.map((item) => (
      item.id === receiveItem
        ? { ...item, inStock: item.inStock + amount, total: item.total + amount }
        : item
    )))
    setReceiveQuantity(1)
    setReceiveOpen(false)
  }

  return (
    <div className="min-h-full px-4 py-5 sm:px-6 sm:py-6 lg:px-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Package size={19} className="text-[#3155ff]" />
            <h1 className="text-2xl font-bold tracking-tight text-[#111a3b]">Stock</h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">Accessories, components and consumables in the IT storeroom.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-full border border-[#dce2ef] bg-white px-4 py-2.5 text-xs font-semibold text-[#202844] hover:bg-slate-50"
          >
            <Printer size={15} /> Print labels
          </button>
          <button
            type="button"
            onClick={() => setReceiveOpen((open) => !open)}
            className="inline-flex items-center gap-2 rounded-full bg-[#3155ff] px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700"
          >
            <Truck size={15} /> {receiveOpen ? 'Cancel' : 'Receive stock'}
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { label: 'Stock items', value: items.length, Icon: Package, tone: 'bg-[#edf1ff] text-[#3155ff]' },
          { label: 'Units on hand', value: items.reduce((total, item) => total + item.inStock, 0), Icon: Package, tone: 'bg-emerald-50 text-emerald-700' },
          { label: 'Below minimum', value: belowMinimum.length, Icon: AlertTriangle, tone: 'bg-amber-50 text-amber-700' },
          { label: 'Out with people', value: outWithPeople.length, Icon: Truck, tone: 'bg-violet-50 text-violet-700' },
        ].map(({ label, value, Icon, tone }) => (
          <article key={label} className="rounded-2xl border border-[#e9edf6] bg-white p-4">
            <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${tone}`}>
              <Icon size={16} />
            </span>
            <p className="mt-3 text-xs text-slate-500">{label}</p>
            <p className="mt-0.5 text-2xl font-bold text-[#18203e]">{value}</p>
          </article>
        ))}
      </div>

      {belowMinimum.length > 0 && (
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
          <AlertTriangle size={17} className="mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold">Items below minimum stock</p>
            <p className="mt-1 text-xs leading-5 text-amber-800">
              {belowMinimum.map((item) => `${item.name}: ${item.inStock} left (minimum ${MINIMUM_STOCK})`).join(' · ')}
            </p>
          </div>
        </div>
      )}

      {receiveOpen && (
        <form onSubmit={receiveStock} className="mt-4 grid grid-cols-1 gap-3 rounded-2xl border border-[#e9edf6] bg-white p-4 sm:grid-cols-[1fr_180px_auto] sm:items-end">
          <label className="text-xs font-semibold text-slate-600">
            Item
            <select
              value={receiveItem}
              onChange={(event) => setReceiveItem(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-[#e3e8f2] bg-white px-3 py-2.5 text-sm font-normal text-slate-800"
            >
              {items.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.make}</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Quantity received
            <input
              required
              min="1"
              step="1"
              type="number"
              value={receiveQuantity}
              onChange={(event) => setReceiveQuantity(Number(event.target.value))}
              className="mt-1.5 w-full rounded-xl border border-[#e3e8f2] px-3 py-2.5 text-sm font-normal text-slate-800"
            />
          </label>
          <button type="submit" className="rounded-xl bg-[#3155ff] px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
            Add to stock
          </button>
        </form>
      )}

      <section className="mt-4 overflow-hidden rounded-2xl border border-[#e9edf6] bg-white">
        <div className="flex flex-col gap-3 border-b border-[#edf0f7] p-4 lg:flex-row lg:items-center">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-[#e3e8f2] px-3 py-2.5 text-slate-400">
            <Search size={16} />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search items, tags, or category"
              aria-label="Search stock items"
              className="min-w-0 flex-1 text-sm text-slate-800 outline-none placeholder:text-slate-400"
            />
          </div>
          <div className="flex gap-1 overflow-x-auto">
            {FILTERS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold ${filter === item ? 'bg-[#101c52] text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                {item}
                {item === 'Below minimum' && <span className="ml-1 opacity-70">{belowMinimum.length}</span>}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left">
            <thead className="bg-[#f8f9fc] text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3">Item</th>
                <th className="px-5 py-3">Make / category</th>
                <th className="px-5 py-3">In stock</th>
                <th className="px-5 py-3">Minimum</th>
                <th className="px-5 py-3">Location</th>
                <th className="px-5 py-3">Serials</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf0f7]">
              {visibleItems.map((item) => {
                const lowStock = item.inStock < MINIMUM_STOCK
                return (
                  <tr key={item.id} className="transition hover:bg-[#f8faff]">
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-[#202844]">{item.name}</p>
                      <p className="mt-1 font-mono text-[10px] text-slate-500">{item.id}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-slate-700">{item.make}</p>
                      <p className="mt-1 text-xs text-slate-500">{item.category}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-sm font-bold ${lowStock ? 'text-amber-700' : 'text-[#202844]'}`}>{item.inStock}</span>
                      <span className="text-xs text-slate-400"> / {item.total}</span>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">{MINIMUM_STOCK}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{item.location}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{item.serials.length} tracked</td>
                  </tr>
                )
              })}
              {visibleItems.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-500">No items match these filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-[#edf0f7] px-5 py-3 text-xs text-slate-500">
          Showing {visibleItems.length} of {items.length} stock items · Low-stock threshold {MINIMUM_STOCK}
        </div>
      </section>
    </div>
  )
}
