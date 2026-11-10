// src/pages/GateStation.jsx
// Gate station — kiosk mode for scanning items in/out, with a live gate
// log. Sourced from mockData. Scanner interactions are stubbed for now.

import { ScanLine, LogOut, LogIn, Hand } from 'lucide-react'
import { gateLog, userById, deviceById } from '../lib/mockData'
import AssetTag from '../components/AssetTag'

const EVENT_META = {
  Out:     { Icon: LogOut, tone: 'text-orange-600 bg-orange-100' },
  Back:    { Icon: LogIn,  tone: 'text-green-600 bg-green-100' },
  Stopped: { Icon: Hand,   tone: 'text-red-600 bg-red-100' },
}

export default function GateStation() {
  return (
    <div className="min-h-full bg-[#f4f6fc] p-5 sm:p-7">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-[#101a3b]">Gate station</h1>
        <p className="mt-1 text-sm text-slate-500">
          Scan or look up a device leaving or returning to the building.
        </p>
      </div>

      {/* Scanner */}
      <div className="rounded-2xl bg-[#0B184C] p-6 text-white mb-6">
        <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-slate-300">
          <ScanLine size={18} /> Scan a tag
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            placeholder="IT-LAP-0042..."
            className="flex-1 rounded-xl bg-white/10 border border-white/10 px-4 py-3 font-mono text-sm text-white placeholder:text-slate-400 outline-none focus:border-[#CDF22F]"
          />
          <button className="rounded-xl bg-[#CDF22F] px-5 py-3 text-sm font-bold text-[#0a1628] hover:opacity-90">
            Check out
          </button>
          <button className="rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">
            Check in
          </button>
        </div>
      </div>

      {/* Gate log */}
      <div className="rounded-2xl bg-white shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-700">Gate log</h2>
          <span className="text-xs text-slate-400">{gateLog.length} events</span>
        </div>
        <div className="divide-y divide-slate-50">
          {gateLog.map((entry) => {
            const device = deviceById(entry.deviceId)
            const person = userById(entry.personId)
            const loggedBy = userById(entry.loggedById)
            const meta = EVENT_META[entry.event]
            return (
              <div key={entry.id} className="flex items-center gap-3 px-5 py-3.5">
                <span className={`flex h-8 w-8 items-center justify-center rounded-full ${meta.tone}`}>
                  <meta.Icon size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800">
                    {entry.event} — {device ? `${device.make} ${device.model}` : 'Device'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {person?.name} · {entry.gate} · logged by {loggedBy?.name}
                  </p>
                </div>
                {device && <AssetTag tag={device.tag} size="sm" />}
                <span className="font-mono text-xs text-slate-400">{entry.time}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
