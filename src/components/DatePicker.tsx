import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function monthKeyFromValue(value: string) {
  const match = /^(\d{4})-(\d{2})-\d{2}$/.exec(value)
  if (match) return `${match[1]}-${Number(match[2]) - 1}`
  const today = new Date()
  return `${today.getFullYear()}-${today.getMonth()}`
}

function formatValue(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return 'Select a date'
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    .format(new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])))
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

export default function DatePicker({ value, onChange, label }: { value: string; onChange: (value: string) => void; label?: string }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [monthKey, setMonthKey] = useState(() => monthKeyFromValue(value))
  const [year, month] = monthKey.split('-').map(Number)
  const firstWeekday = new Date(year, month, 1).getDay()
  const totalDays = daysInMonth(year, month)
  const selectedDay = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)?.[3]

  useEffect(() => {
    if (!open) return
    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [open])

  const moveMonth = (offset: number) => {
    const next = new Date(year, month + offset, 1)
    setMonthKey(`${next.getFullYear()}-${next.getMonth()}`)
  }

  const selectDay = (day: number) => {
    onChange(`${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`)
    setOpen(false)
  }

  return (
    <div ref={rootRef} className="relative">
      {label && <span className="block text-xs font-semibold text-slate-600">{label}</span>}
      <button type="button" onClick={() => setOpen((current) => !current)} aria-haspopup="dialog" aria-expanded={open} aria-label={label ?? 'Choose date'} className="mt-1 flex h-10 w-full items-center gap-2 rounded-xl border border-[#e3e8f2] bg-white px-3 text-left text-sm font-normal text-slate-800 outline-none transition hover:border-blue-300 focus:border-[#3155ff] focus:ring-2 focus:ring-blue-100">
        <CalendarDays size={15} className="shrink-0 text-slate-400" aria-hidden="true" />
        <span className={value ? 'text-slate-800' : 'text-slate-400'}>{formatValue(value)}</span>
      </button>

      {open && <div role="dialog" aria-label="Date picker" className="absolute left-0 top-full z-50 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-3 text-slate-800 shadow-xl shadow-slate-950/10">
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => moveMonth(-1)} aria-label="Previous month" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"><ChevronLeft size={16} /></button>
          <p className="text-xs font-bold">{new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }).format(new Date(year, month, 1))}</p>
          <button type="button" onClick={() => moveMonth(1)} aria-label="Next month" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"><ChevronRight size={16} /></button>
        </div>
        <div className="mt-2 grid grid-cols-7 text-center text-[10px] font-semibold text-slate-400">
          {WEEKDAYS.map((day) => <span key={day} className="py-1">{day}</span>)}
          {Array.from({ length: firstWeekday }, (_, index) => <span key={`empty-${index}`} />)}
          {Array.from({ length: totalDays }, (_, index) => {
            const day = index + 1
            const isSelected = selectedDay === String(day).padStart(2, '0') && value.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)
            return <button key={day} type="button" onClick={() => selectDay(day)} aria-label={`${day} ${year}`} aria-pressed={isSelected} className={`rounded-lg py-1.5 text-xs transition ${isSelected ? 'bg-[#3155ff] font-bold text-white' : 'hover:bg-blue-50 hover:text-[#3155ff]'}`}>{day}</button>
          })}
        </div>
      </div>}
    </div>
  )
}
