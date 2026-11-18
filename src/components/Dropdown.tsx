import { Children, isValidElement, useEffect, useRef, useState, type ReactNode } from 'react'
import { Check, ChevronDown } from 'lucide-react'

export interface DropdownOption {
  value: string
  label: string
}

export default function Dropdown({
  value,
  options,
  onChange,
  placeholder = 'Select an option',
  disabled = false,
  ariaLabel,
  searchable = false,
  searchPlaceholder = 'Search options',
  children,
}: {
  value: string
  options?: DropdownOption[]
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  ariaLabel?: string
  searchable?: boolean
  searchPlaceholder?: string
  children?: ReactNode
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [highlighted, setHighlighted] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const legacyOptions = Children.toArray(children).flatMap((child) => {
    if (!isValidElement(child) || child.type !== 'option') return []
    const props = child.props as { value?: unknown; children?: ReactNode }
    const optionValue = typeof props.value === 'string' ? props.value : String(props.children ?? '')
    return [{ value: optionValue, label: String(props.children ?? optionValue) }]
  })
  const resolvedOptions = legacyOptions.length ? legacyOptions : (options ?? [])
  const selected = resolvedOptions.find((option) => option.value === value)
  const filteredOptions = searchable && search.trim()
    ? resolvedOptions.filter((option) => option.label.toLowerCase().includes(search.trim().toLowerCase()))
    : resolvedOptions

  useEffect(() => {
    if (!open) return
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return
    if (event.key === 'ArrowDown') { event.preventDefault(); setHighlighted((index) => Math.min(index + 1, filteredOptions.length - 1)); setOpen(true) }
    if (event.key === 'ArrowUp') { event.preventDefault(); setHighlighted((index) => Math.max(index - 1, 0)); setOpen(true) }
    if (event.key === 'Enter' && open && filteredOptions[highlighted]) { event.preventDefault(); onChange(filteredOptions[highlighted].value); setOpen(false) }
    if (event.key === 'Escape') setOpen(false)
  }
  return (
    <div ref={rootRef} className="relative">
      <button type="button" onKeyDown={handleKeyDown} aria-haspopup="listbox" aria-expanded={open} aria-label={ariaLabel} disabled={disabled} onClick={() => { setOpen((current) => !current); setSearch(''); setHighlighted(0) }} className="flex h-10 w-full items-center justify-between gap-3 rounded-xl border border-[#e3e8f2] bg-white px-3 text-left text-sm text-slate-800 outline-none transition hover:border-blue-300 focus-visible:border-[#3155ff] focus-visible:ring-2 focus-visible:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50">
        <span className={selected ? '' : 'text-slate-400'}>{selected?.label ?? placeholder}</span>
        <ChevronDown size={16} className={`shrink-0 text-slate-400 transition ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {open && <div role="listbox" className="absolute z-40 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg shadow-slate-900/10">
        {searchable && <input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder={searchPlaceholder} aria-label={searchPlaceholder} className="mb-1 h-9 w-full rounded-lg border border-slate-200 px-2.5 text-xs outline-none focus:border-[#3155ff] focus:ring-2 focus:ring-blue-100" />}
        {filteredOptions.map((option, index) => <button key={option.value} type="button" role="option" aria-selected={option.value === value} onMouseEnter={() => setHighlighted(index)} onClick={() => { onChange(option.value); setOpen(false); setSearch('') }} className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-[#f4f6fc] hover:text-[#202844] ${index === highlighted ? 'bg-[#f4f6fc]' : ''}`}>
          {option.label}{option.value === value && <Check size={15} className="text-[#3155ff]" aria-hidden="true" />}
        </button>)}
        {filteredOptions.length === 0 && <p className="px-3 py-2 text-xs text-slate-500">No matching options.</p>}
      </div>}
    </div>
  )
}
