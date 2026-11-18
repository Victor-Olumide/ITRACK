export type DeviceView = '2D' | '3D'

export default function DeviceViewToggle({
  value,
  onChange,
  has3D = true,
}: {
  value: DeviceView
  onChange: (value: DeviceView) => void
  has3D?: boolean
}) {
  return (
    <div className="flex overflow-hidden rounded-full border border-white/80 bg-white/90 text-[10px] font-bold shadow-sm backdrop-blur-sm">
      {(['2D', '3D'] as const).map((view) => (
        <button
          key={view}
          type="button"
          disabled={view === '3D' && !has3D}
          aria-pressed={value === view}
          onClick={() => onChange(view)}
          className={`px-3 py-1.5 transition ${value === view ? 'bg-[#d2f54a] text-[#344500]' : 'text-slate-600 hover:bg-slate-50'} disabled:cursor-not-allowed disabled:opacity-40`}
        >
          {view}
        </button>
      ))}
    </div>
  )
}
