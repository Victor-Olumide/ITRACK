import { LoaderCircle, Search, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { useGlobalSearchQuery } from '@/lib/api/search/search-api';
import type { GlobalSearchDevice, GlobalSearchTicket } from '@/lib/api/search/types';
import type { UserRole } from '@/types/types';

function useDebouncedValue(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function GlobalSearch({ role }: { role: UserRole }) {
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState('');
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const [shortcutHintVisible, setShortcutHintVisible] = useState(false);
  const debounced = useDebouncedValue(value.trim(), 250);
  const query = useGlobalSearchQuery(debounced, { skip: debounced.length < 2 });
  const results = useMemo(() => [
    ...(query.data?.tickets ?? []).map((item) => ({ type: 'ticket' as const, item })),
    ...(query.data?.devices ?? []).map((item) => ({ type: 'device' as const, item })),
    ...(query.data?.people ?? []).map((item) => ({ type: 'person' as const, item })),
  ], [query.data]);

  useEffect(() => {
    const showHint = () => {
      if (!window.matchMedia('(min-width: 1024px)').matches) return;
      setShortcutHintVisible(true);
      window.setTimeout(() => setShortcutHintVisible(false), 2400);
    };
    const timer = window.setInterval(showHint, 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault(); inputRef.current?.focus(); setOpen(true);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => { document.removeEventListener('pointerdown', onPointerDown); document.removeEventListener('keydown', onKeyDown); };
  }, []);

  const ticketPath = role === 'Employee' ? '/employee/tickets' : role === 'Department Head' ? '/department/tickets' : role === 'Technician' ? '/technician/tickets' : '/tickets';
  const deviceBase = role === 'Employee' ? '/employee/devices' : role === 'Department Head' ? '/department/assets' : role === 'Technician' ? '/technician/devices' : '/devices';
  const peoplePath = role === 'Department Head' ? '/department/employees' : '/people';

  const select = (result: typeof results[number]) => {
    const path = result.type === 'ticket'
      ? `${ticketPath}?ticket=${encodeURIComponent((result.item as GlobalSearchTicket).id)}`
      : result.type === 'device'
        ? `${deviceBase}/${encodeURIComponent((result.item as GlobalSearchDevice).assetTag)}`
        : peoplePath;
    setOpen(false); setValue(''); navigate(path);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') { setOpen(false); return; }
    if (!open || !results.length) return;
    if (event.key === 'ArrowDown') { event.preventDefault(); setHighlighted((current) => (current + 1) % results.length); }
    if (event.key === 'ArrowUp') { event.preventDefault(); setHighlighted((current) => (current - 1 + results.length) % results.length); }
    if (event.key === 'Enter') { event.preventDefault(); select(results[Math.min(highlighted, results.length - 1)]); }
  };

  const showDropdown = open && value.trim().length >= 2;
  return <div ref={rootRef} className="relative min-w-0 flex-1">
    <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
    <input ref={inputRef} value={value} onFocus={() => setOpen(true)} onChange={(event) => { setValue(event.target.value); setOpen(true); }} onKeyDown={onKeyDown} placeholder="Search tickets, devices, people" aria-label="Search tickets, devices, people" aria-expanded={showDropdown} aria-controls="global-search-results" role="combobox" className="h-9 w-full rounded-full border border-white/10 bg-[#1b2a69] pl-9 pr-16 text-xs text-white outline-none placeholder:text-slate-400 focus:border-[#d2f54a] focus:ring-2 focus:ring-[#d2f54a]/20" />
    {value && <button type="button" onClick={() => { setValue(''); setOpen(false); inputRef.current?.focus(); }} aria-label="Clear search" className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"><X size={14} /></button>}
    <span className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-white/20 px-1 text-[9px] text-slate-400 transition-all duration-300 max-lg:hidden ${shortcutHintVisible ? 'scale-110 border-[#d2f54a]/70 text-[#d2f54a] opacity-100' : 'opacity-70'}`}>Ctrl K</span>
    {showDropdown && <div id="global-search-results" role="listbox" className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[min(70vh,30rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 text-slate-900 shadow-2xl shadow-slate-950/20 sm:min-w-[28rem]">
      {query.isFetching && <div className="flex items-center gap-2 px-3 py-4 text-xs text-slate-500"><LoaderCircle size={15} className="animate-spin" /> Searching…</div>}
      {!query.isFetching && query.isError && <div className="px-3 py-4 text-xs text-red-600">Search is temporarily unavailable. Try again.</div>}
      {!query.isFetching && !query.isError && !results.length && debounced.length >= 2 && <div className="px-3 py-4 text-xs text-slate-500">No matching tickets, devices, or people.</div>}
      {!query.isFetching && !query.isError && <>
        {query.data?.tickets.length ? <ResultGroup title="Tickets">{query.data.tickets.map((item) => <ResultRow key={item.id} active={results[highlighted]?.item === item} onClick={() => select({ type: 'ticket', item })}><span className="font-mono text-[10px] text-slate-500">{item.number}</span><span className="truncate font-semibold">{item.title}</span><span className="text-[10px] text-slate-500">{item.status.replaceAll('_', ' ')}</span></ResultRow>)}</ResultGroup> : null}
        {query.data?.devices.length ? <ResultGroup title="Devices">{query.data.devices.map((item) => <ResultRow key={item.id} active={results[highlighted]?.item === item} onClick={() => select({ type: 'device', item })}><span className="truncate font-semibold">{item.make} {item.model}</span><span className="font-mono text-[10px] text-slate-500">{item.assetTag}</span></ResultRow>)}</ResultGroup> : null}
        {query.data?.people.length ? <ResultGroup title="People">{query.data.people.map((item) => <ResultRow key={item.id} active={results[highlighted]?.item === item} onClick={() => select({ type: 'person', item })}><span className="truncate font-semibold">{item.fullName}</span><span className="truncate text-[10px] text-slate-500">{item.email}</span></ResultRow>)}</ResultGroup> : null}
      </>}
    </div>}
  </div>;
}

function ResultGroup({ title, children }: { title: string; children: ReactNode }) { return <section className="px-1 py-1"><h2 className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">{title}</h2>{children}</section>; }
function ResultRow({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) { return <button type="button" role="option" aria-selected={active} onClick={onClick} className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-xs transition ${active ? 'bg-blue-50 text-[#3155ff]' : 'hover:bg-slate-50'}`}>{children}</button>; }
