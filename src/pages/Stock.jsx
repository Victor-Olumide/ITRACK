// src/pages/Stock.jsx
// Stock — accessories, components and consumables. Table view sourced
// from mockData. Placeholder UI that proves the data wiring works.

import { Search } from 'lucide-react'
import { stock } from '../lib/mockData'
import Badge from '../components/Badge'

export default function Stock() {
  return (
    <div className="min-h-full bg-[#f4f6fc] p-5 sm:p-7">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#101a3b]">Stock</h1>
          <p className="mt-1 text-sm text-slate-500">
            Accessories, components and consumables in the IT storeroom.
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search size={17} className="absolute left-3 top-3 text-slate-400" />
          <input
            placeholder="Search stock..."
            className="w-full rounded-full border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-400"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-5 py-4 font-semibold">Item</th>
                <th className="px-5 py-4 font-semibold">Make</th>
                <th className="px-5 py-4 font-semibold">Category</th>
                <th className="px-5 py-4 font-semibold">In stock</th>
                <th className="px-5 py-4 font-semibold">Location</th>
                <th className="px-5 py-4 font-semibold">Serials</th>
              </tr>
            </thead>
            <tbody>
              {stock.map((item) => (
                <tr key={item.id} className="border-t border-slate-100 hover:bg-blue-50/40">
                  <td className="px-5 py-4 font-bold text-slate-800">{item.name}</td>
                  <td className="px-5 py-4 text-slate-600">{item.make}</td>
                  <td className="px-5 py-4"><Badge label={item.category} /></td>
                  <td className="px-5 py-4">
                    <span className="font-bold text-slate-800">{item.inStock}</span>
                    <span className="text-slate-400"> / {item.total}</span>
                  </td>
                  <td className="px-5 py-4 text-slate-500">{item.location}</td>
                  <td className="px-5 py-4 text-slate-500">{item.serials.length} units</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
