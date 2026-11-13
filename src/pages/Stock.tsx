import { Package } from 'lucide-react'

export default function Stock() {
  return (
    <main className="min-h-full px-4 py-5 sm:px-6 sm:py-6 lg:px-7">
      <div className="flex items-center gap-2">
        <Package size={19} className="text-[#3155ff]" />
        <h1 className="text-2xl font-bold tracking-tight text-[#111a3b]">Stock</h1>
      </div>
      {/* TODO(v2): Restore stock-room prototype UI after persistent stock APIs are available. */}
      <section role="status" className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950">
        <h2 className="text-sm font-semibold">Unavailable in v1</h2>
        <p className="mt-1 text-sm leading-6 text-amber-900">
          Inventory and stock movements are not supported by the current v1 API. This screen is disabled and does not display sample records.
        </p>
      </section>
    </main>
  )
}
