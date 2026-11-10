import { Printer, X } from 'lucide-react'
import { deviceByTag, userById } from '../lib/mockData'

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
}

function Field({ label, value, className = '' }) {
  return (
    <div className={`grid grid-cols-[minmax(90px,0.7fr)_minmax(0,1.3fr)] border-b border-r border-slate-300 last:border-r-0 ${className}`}>
      <dt className="bg-slate-50 px-2 py-1.5 text-[10px] font-semibold text-slate-700">{label}</dt>
      <dd className="min-w-0 px-2 py-1.5 text-[10px] text-slate-700">{value || '—'}</dd>
    </div>
  )
}

function GatePassSlip({ pass, viewer, onClose }) {
  const requester = userById(pass.requesterId)
  const items = pass.items ?? []
  const mainDeviceItem = items.find((item) => deviceByTag(item.tag))
  const mainDevice = mainDeviceItem ? deviceByTag(mainDeviceItem.tag) : null
  const printDate = new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date())
  const pieces = items.reduce((total, item) => total + (Number(item.qty) || 1), 0)
  const status = pass.status ?? 'Waiting'

  return (
    <div className="gate-pass-preview fixed inset-0 z-[70] overflow-y-auto bg-slate-100 p-3 sm:p-6">
      <div className="gate-pass-toolbar mx-auto mb-4 flex max-w-[210mm] items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-700">Print preview · {pass.id}</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-full bg-[#3155ff] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Printer size={16} /> Print slip
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close print preview"
            className="rounded-full border border-slate-300 bg-white p-2 text-slate-600 hover:bg-slate-50"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <article className="gate-pass-print mx-auto flex min-h-[270mm] max-w-[210mm] flex-col bg-white p-6 text-slate-800 shadow-lg sm:p-8">
        <header className="flex items-start justify-between gap-4 border-b-2 border-[#172554] pb-4">
          <div className="flex items-center gap-3">
            <img src="/favicon.svg" alt="" className="h-10 w-10 object-contain" />
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-[#111a38]">Gate pass · {pass.isReturnable === false ? 'Non-returnable items' : 'Returnable items'}</h1>
              <p className="mt-0.5 text-[10px] text-slate-500">IT Department · Afe Babalola University, Ado-Ekiti</p>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-mono text-lg font-bold">{pass.id}</p>
            <p className="text-[10px] text-slate-500">Issued {printDate}</p>
            <span className={`mt-1 inline-block rounded border px-2 py-0.5 text-[9px] font-bold uppercase ${status === 'Approved' ? 'border-emerald-700 text-emerald-800' : 'border-amber-700 text-amber-800'}`}>
              {status}
            </span>
          </div>
        </header>

        <section className="mt-4" aria-label="Pass details">
          <dl className="grid grid-cols-2 border-l border-t border-slate-300">
            <Field label="Taken by" value={`${requester?.name ?? '—'}${requester?.staffId ? ` · Staff ID ${requester.staffId}` : ''}`} />
            <Field label="Department" value={requester?.department} />
            {requester?.phone && <Field label="Phone" value={requester.phone} />}
            {pass.purpose && <Field label="Purpose" value={pass.purpose} />}
            <Field label="Destination" value={pass.destination} className="col-span-2" />
            <Field label="Out → back" value={`${formatDate(pass.outDate)} → ${formatDate(pass.returnDate)}`} className="col-span-2" />
          </dl>
        </section>

        {mainDevice && (
          <section className="mt-4">
            <h2 className="mb-2 text-xs font-bold text-[#111a38]">Main device</h2>
            <dl className="grid grid-cols-2 border-l border-t border-slate-300">
              <Field label="Device name" value={`${mainDevice.make} ${mainDevice.model}`} />
              <Field label="Asset tag" value={mainDevice.tag} />
              <Field label="Serial number" value={mainDevice.serialNumber} />
              <Field label="Location" value={mainDevice.location} />
            </dl>
          </section>
        )}

        <section className="mt-4">
          <h2 className="mb-2 text-xs font-bold text-[#111a38]">All items leaving the site</h2>
          <div className="overflow-hidden border border-slate-300">
            <table className="w-full table-fixed border-collapse text-left text-[9px]">
              <thead className="bg-slate-50">
                <tr>
                  <th className="w-[5%] border-b border-r border-slate-300 px-1.5 py-2">#</th>
                  <th className="w-[18%] border-b border-r border-slate-300 px-1.5 py-2">Item</th>
                  <th className="w-[14%] border-b border-r border-slate-300 px-1.5 py-2">Tag</th>
                  <th className="w-[22%] border-b border-r border-slate-300 px-1.5 py-2">Make and model</th>
                  <th className="w-[16%] border-b border-r border-slate-300 px-1.5 py-2">Serial number</th>
                  <th className="w-[7%] border-b border-r border-slate-300 px-1.5 py-2">Qty</th>
                  <th className="w-[14%] border-b border-slate-300 px-1.5 py-2">Condition out</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => {
                  const device = deviceByTag(item.tag)
                  return (
                    <tr key={`${item.tag}-${index}`}>
                      <td className="border-b border-r border-slate-300 px-1.5 py-2 align-top">{index + 1}</td>
                      <td className="break-words border-b border-r border-slate-300 px-1.5 py-2 align-top font-semibold">
                        {item.name ?? item.type ?? (device ? device.category.replace(/s$/, '') : 'Accessory')}
                      </td>
                      <td className="break-words border-b border-r border-slate-300 px-1.5 py-2 align-top font-mono">{item.tag}</td>
                      <td className="break-words border-b border-r border-slate-300 px-1.5 py-2 align-top">{item.make ?? `${device?.make ?? ''} ${device?.model ?? ''}`}</td>
                      <td className="break-words border-b border-r border-slate-300 px-1.5 py-2 align-top font-mono">{item.serial ?? device?.serialNumber ?? '—'}</td>
                      <td className="border-b border-r border-slate-300 px-1.5 py-2 align-top">{item.qty ?? 1}</td>
                      <td className="break-words border-b border-slate-300 px-1.5 py-2 align-top">{item.condition ?? 'Not recorded'}</td>
                    </tr>
                  )
                })}
                {items.length === 0 && (
                  <tr><td colSpan="7" className="px-2 py-4 text-center text-slate-500">No items recorded on this pass.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="mt-1 text-[9px] text-slate-500">
            {items.length} {items.length === 1 ? 'item' : 'items'}, {pieces} {pieces === 1 ? 'piece' : 'pieces'}.
            {' '}Security must see every item before release. Any item not returned keeps this pass open.
          </p>
        </section>

        <section className="mt-4 grid grid-cols-3 gap-2">
          {[
            { title: 'Prepared by', name: `${viewer.name} · ${viewer.role}${viewer.staffId ? ` · ${viewer.staffId}` : ''}` },
            { title: 'Received by', name: `${requester?.name ?? 'Requester'}${requester?.staffId ? ` · ${requester.staffId}` : ''}` },
            { title: 'Security release', name: 'Officer name and signature' },
          ].map(({ title, name }) => (
            <div key={title} className="min-h-[82px] rounded-md border border-slate-300 p-2">
              <h3 className="text-[9px] font-bold">{title}</h3>
              <div className="mt-7 border-b border-slate-400" />
              <p className="mt-1 text-[8px] text-slate-600">{name}</p>
            </div>
          ))}
        </section>

        {pass.isReturnable !== false && (
          <section className="mt-3 rounded-md border border-dashed border-slate-400 p-2">
            <h2 className="text-[9px] font-bold">Return check</h2>
            <div className="mt-2 grid grid-cols-3 gap-2 text-[8px]">
              <p>Date and time back: __________________</p>
              <p>Items checked in: ____ of {pieces}</p>
              <p>Officer: __________________</p>
            </div>
            <p className="mt-2 text-[8px]">Condition on return / notes: _________________________________________________</p>
          </section>
        )}

        <footer className="mt-auto flex justify-between gap-4 border-t border-slate-200 pt-2 text-[8px] text-slate-500">
          <p>{status === 'Approved' ? 'Approved pass. Present this slip at the security gate for item verification.' : 'This request is not yet approved. Do not release items until approval is recorded.'}</p>
          <p className="shrink-0">Copy: Gate · IT · Holder</p>
        </footer>
      </article>
    </div>
  )
}

export default GatePassSlip
