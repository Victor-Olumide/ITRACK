import { ClipboardCheck } from 'lucide-react'

// TODO(v2): Restore the gate-pass prototype and connect it only after the server API is ready.
export default function GatePasses() {
  return (
    <main className="min-h-full px-4 py-5 sm:px-6 sm:py-6 lg:px-7">
      <div className="flex items-center gap-2">
        <ClipboardCheck size={19} className="text-[#3155ff]" />
        <h1 className="text-2xl font-bold tracking-tight text-[#111a3b]">Gate passes</h1>
      </div>
      <section
        role="status"
        className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950"
      >
        <h2 className="text-sm font-semibold">Not available yet</h2>
        <p className="mt-1 text-sm leading-6 text-amber-900">
          Gate-pass records and approvals are not supported by the current v1 API.
          This screen is disabled until the server provides a persistent endpoint.
        </p>
      </section>
    </main>
  )
}
