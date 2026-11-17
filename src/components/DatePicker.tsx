import { CalendarDays } from 'lucide-react'

export default function DatePicker({ value, onChange, label }: { value: string; onChange: (value: string) => void; label?: string }) {
  return <span className="block text-xs font-semibold text-slate-600">
    {label && <span className="block">{label}</span>}
    <span className="relative mt-1 block">
      <CalendarDays size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
      <input type="date" value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full rounded-xl border border-[#e3e8f2] bg-white pl-9 pr-3 text-sm font-normal text-slate-800 outline-none transition focus:border-[#3155ff] focus:ring-2 focus:ring-blue-100" />
    </span>
  </span>
}
