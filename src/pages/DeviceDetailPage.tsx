import { useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router';
import { deviceByTag, userById } from '../lib/data/mockData';
import { useAuth } from '../contexts/AuthContext';
import {
  ChevronLeft, HelpCircle, RotateCcw, ZoomOut, ZoomIn,
  Rotate3D, Maximize, MapPin, Monitor, Laptop, Smartphone, Printer
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react'
import type { Device, DeviceStatus } from '../lib/types/types'

const statusStyles: Record<DeviceStatus, string> = {
  Assigned:   'bg-blue-100   text-blue-800',
  'In store': 'bg-lime-100   text-lime-800',
  'Off-site': 'bg-purple-100 text-purple-700',
  'In repair':'bg-orange-100 text-orange-800',
  Retired:    'bg-slate-200  text-slate-600',
}

// Fallback icon per category
function CategoryIcon({ category, size = 65 }: { category?: string; size?: number }) {
  const map: Record<string, LucideIcon> = {
    Laptop:           Laptop,
    'Desktop tower':  Monitor,
    Monitor:          Monitor,
    'Laser printer':  Printer,
    'Work phone':     Smartphone,
  }
  const Icon = map[category ?? ''] ?? Monitor
  return <Icon size={size} strokeWidth={1} />
}

// Device image with fallback
interface DeviceView {
  id: string
  name: string
  tag: string
  category: string
  specs: string
  status: DeviceStatus
  assignedTo: string
  initials: string
  location: string
  warranty: string
  image: string
}

function DeviceImage({ device }: { device: DeviceView | null }) {
  const [failed, setFailed] = useState(false)

  return (
    <div className="relative flex min-h-[320px] flex-1 items-center justify-center overflow-hidden rounded-[24px] bg-gradient-to-b from-[#f1f4fc] to-[#e8edf9]">
      {failed || !device?.image ? (
        <div className="flex flex-col items-center gap-2 text-slate-300">
          <CategoryIcon category={device?.category} />
          <span className="text-xs text-slate-400">{device?.category}</span>
        </div>
      ) : (
        <img
          src={device.image}
          alt={device.name}
          onError={() => setFailed(true)}
          className="h-[80%] w-[80%] object-contain"
        />
      )}
    </div>
  )
}

function fromAssetRecord(record: Device | undefined): DeviceView | null {
  if (!record) return null
  const owner = userById(record.assigneeId)
  const category = ({
    Laptops: 'Laptop',
    Desktops: 'Desktop tower',
    Monitors: 'Monitor',
    Phones: 'Work phone',
  } as Record<string, string>)[record.category] ?? record.category
  const warranty = new Date(record.warrantyEnds)

  return {
    id: record.id,
    name: `${record.make} ${record.model}`,
    tag: record.tag,
    category,
    specs: '',
    status: record.status,
    assignedTo: owner?.name ?? 'Not assigned',
    initials: owner?.name.split(' ').map((part) => part[0]).join('').slice(0, 2) ?? '—',
    location: record.location,
    warranty: Number.isNaN(warranty.getTime())
      ? '—'
      : warranty.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }),
    image: '',
  }
}

export default function DeviceDetailsPage({ basePath = '/devices' }: { basePath?: string }) {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { tag } = useParams()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('Overview')

  const assetRecord = deviceByTag(tag ?? '')
  const hasAccess = user !== null && (user.role !== 'Employee' || assetRecord?.assigneeId === user.id)
  const device: DeviceView | null = hasAccess ? location.state?.device ?? fromAssetRecord(assetRecord) : null

  if (!device) {
    return (
      <main className="min-h-screen bg-[#0B184C] flex items-center justify-center p-8">
        <div className="text-center text-white">
          <p className="text-lg font-semibold mb-3">Device not found.</p>
          <button
            onClick={() => navigate(basePath)}
            className="text-sm text-blue-300 hover:underline"
          >
            ← Back to Devices
          </button>
        </div>
      </main>
    )
  }

  const tabs = ['Overview', 'Specs', 'History', 'Tickets']

  return (
    <main className="min-h-screen bg-[#0B184C] p-4 sm:p-6 lg:p-8 font-sans text-slate-800">
      <div className="mx-auto max-w-[1400px]">

        {/* BREADCRUMB */}
        <div className="mb-6 flex items-center text-sm font-medium text-white/70">
          <ChevronLeft size={16} className="mr-1" />
          <button
            onClick={() => navigate(basePath)}
            className="hover:text-white transition-colors"
          >
            Devices
          </button>
          <span className="mx-2 text-white/40">/</span>
          <span className="text-white">{device.tag}</span>
        </div>

        {/* MAIN WHITE CONTAINER */}
        <div className="rounded-[32px] bg-white p-3 sm:p-4 shadow-2xl">
          <div className="flex flex-col lg:flex-row gap-4">

            {/* LEFT — 3D viewer area */}
            <section className="relative flex min-h-[500px] lg:min-h-[680px] flex-1 flex-col rounded-[28px] bg-[#f4f6fc] p-6 lg:p-8">

              <div className="flex items-center gap-3 z-10">
                <span className="rounded-full bg-slate-200/70 px-3 py-1 text-xs font-bold text-slate-500 shadow-sm">
                  3D model
                </span>
                <span className="text-sm font-medium text-slate-400">
                  Shared by all {device.name}s
                </span>
              </div>

              {/* Viewer placeholder */}
              <div className="flex flex-1 flex-col items-center justify-center gap-4">
                <DeviceImage key={device.tag} device={device} />
                <div className="text-sm font-medium text-slate-400">
                  3D viewer — connect a .glb model via React Three Fiber
                </div>
              </div>

              {/* 3D toolbar */}
              <div className="absolute bottom-20 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-2xl bg-[#1e2440] p-1.5 text-white shadow-xl">
                {[HelpCircle, RotateCcw, ZoomOut, ZoomIn].map((Ic, i) => (
                  <button key={i} className="rounded-xl p-2.5 text-slate-300 hover:bg-white/10 hover:text-white transition-colors">
                    <Ic size={18} strokeWidth={2.5} />
                  </button>
                ))}
                <button className="rounded-xl bg-[#3155ff] p-2.5 text-white shadow-md transition-colors">
                  <Rotate3D size={18} strokeWidth={2.5} />
                </button>
                <button className="rounded-xl p-2.5 text-slate-300 hover:bg-white/10 hover:text-white transition-colors">
                  <Maximize size={18} strokeWidth={2.5} />
                </button>
              </div>

              {/* Footer meta */}
              <div className="mt-auto flex flex-col justify-between gap-4 border-t border-slate-200/60 pt-5 text-xs font-medium sm:flex-row sm:items-center">
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-slate-500">
                  <span>Triangles <span className="text-slate-800">—</span></span>
                  <span>Vertices <span className="text-slate-800">—</span></span>
                  <span>File <span className="font-bold text-slate-800">0.4 MB .glb</span></span>
                  <span>Licence <span className="font-bold text-slate-800">CC0</span></span>
                </div>
                <button className="font-bold text-[#3155ff] hover:underline">Replace model</button>
              </div>
            </section>

            {/* RIGHT — device details */}
            <section className="flex w-full flex-col gap-6 lg:w-[420px]">

              {/* Dark info card */}
              <div className="rounded-[28px] bg-[#0C194D] p-7 text-white shadow-lg">
                <div className="mb-5 flex items-start justify-between">
                  <span className={`rounded-full px-4 py-1.5 text-xs font-bold ${statusStyles[device.status] ?? 'bg-white/10 text-white'}`}>
                    {device.status}
                  </span>
                  <span className="rounded-lg bg-[#DCF230] px-3 py-1.5 font-mono text-xs font-bold text-[#445b0f]">
                    {device.tag}
                  </span>
                </div>

                <h1 className="mb-1.5 text-2xl font-bold tracking-tight">{device.name}</h1>
                <p className="mb-8 text-sm font-medium text-slate-400">
                  {device.category}{device.specs ? ` · ${device.specs}` : ''}
                </p>

                <div className="mb-8 space-y-2">
                  {/* Assigned to */}
                  <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-3.5 border border-white/5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#DCF230] text-sm font-bold text-[#445b0f]">
                      {device.initials !== '—' ? device.initials : '?'}
                    </div>
                    <div>
                      <div className="text-sm font-bold">{device.assignedTo}</div>
                      <div className="text-xs font-medium text-slate-400">{device.location}</div>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-3.5 border border-white/5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-slate-300">
                      <MapPin size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-bold">{device.location}</div>
                      <div className="text-xs font-medium text-slate-400">Warranty · {device.warranty}</div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2.5">
                  <button className="flex-1 rounded-xl bg-[#DCF230] py-2.5 text-sm font-bold text-[#111a38] transition hover:bg-[#bce028]">
                    Reassign
                  </button>
                  <button className="flex-1 rounded-xl border border-white/20 py-2.5 text-sm font-semibold transition hover:bg-white/10">
                    Gate pass
                  </button>
                  <button className="flex-1 rounded-xl border border-white/20 py-2.5 text-sm font-semibold transition hover:bg-white/10">
                    Send to repair
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="p-3">
                <div className="mb-6 flex gap-6 border-b border-slate-100 text-sm font-semibold">
                  {tabs.map(t => (
                    <button
                      key={t}
                      onClick={() => setActiveTab(t)}
                      className={`pb-3 transition-colors -mb-[1px] ${
                        activeTab === t
                          ? 'border-b-2 border-slate-900 text-slate-900'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                {activeTab === 'Overview' && (
                  <div className="grid grid-cols-2 gap-y-7 text-sm">
                    <div>
                      <div className="mb-1 text-slate-500">Category</div>
                      <div className="font-bold text-[#111a38]">{device.category}</div>
                    </div>
                    <div>
                      <div className="mb-1 text-slate-500">Status</div>
                      <div className="font-bold text-[#111a38]">{device.status}</div>
                    </div>
                    <div>
                      <div className="mb-1 text-slate-500">Assigned to</div>
                      <div className="font-bold text-[#111a38]">{device.assignedTo}</div>
                    </div>
                    <div>
                      <div className="mb-1 text-slate-500">Warranty</div>
                      <div className={`font-bold ${device.warranty.startsWith('Ends') ? 'text-orange-600' : 'text-[#111a38]'}`}>
                        {device.warranty}
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 text-slate-500">Location</div>
                      <div className="font-bold text-[#111a38]">{device.location}</div>
                    </div>
                    <div>
                      <div className="mb-1 text-slate-500">Asset tag</div>
                      <div className="font-mono font-bold text-[#111a38]">{device.tag}</div>
                    </div>
                  </div>
                )}

                {activeTab === 'Specs' && (
                  <div className="grid grid-cols-2 gap-y-7 text-sm">
                    <div>
                      <div className="mb-1 text-slate-500">Model</div>
                      <div className="font-bold text-[#111a38]">{device.name}</div>
                    </div>
                    {device.specs && (
                      <div>
                        <div className="mb-1 text-slate-500">Size</div>
                        <div className="font-bold text-[#111a38]">{device.specs}</div>
                      </div>
                    )}
                    <div>
                      <div className="mb-1 text-slate-500">Serial number</div>
                      <div className="font-mono font-bold text-[#111a38]">—</div>
                    </div>
                  </div>
                )}

                {activeTab === 'History' && (
                  <p className="text-sm text-slate-400">No history recorded yet.</p>
                )}

                {activeTab === 'Tickets' && (
                  <p className="text-sm text-slate-400">No open tickets for this device.</p>
                )}
              </div>
            </section>

          </div>
        </div>
      </div>
    </main>
  )
}
