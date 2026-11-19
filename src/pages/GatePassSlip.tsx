import type { ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router'
import { ArrowLeft, Printer } from 'lucide-react'
import { useGetGatePassQuery } from '../lib/api/gates/gates-api'
import { formatDateTime, formatDay, itemCount, passState, shortHash } from '../lib/api/gates/gate-pass-format'
import { getApiErrorMessage } from '../lib/api/error-message'

function Row({ cells }: { cells: [string, ReactNode][] }) {
  return (
    <tr>
      {cells.map(([label, value]) => (
        <Cell key={label} label={label} value={value} wide={cells.length === 1} />
      ))}
    </tr>
  )
}

function Cell({ label, value, wide }: { label: string; value: ReactNode; wide?: boolean }) {
  return (
    <>
      <th className="w-[18%] border border-slate-300 bg-[#F4F6FB] px-2 py-1.5 text-left font-semibold">{label}</th>
      <td colSpan={wide ? 3 : 1} className="border border-slate-300 px-2 py-1.5">{value || '—'}</td>
    </>
  )
}

/** D19 "Printable gate pass slip (A4)" */
export default function GatePassSlip() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const passQuery = useGetGatePassQuery(id, { skip: !id })
  const pass = passQuery.data

  if (passQuery.isLoading) {
    return <p role="status" className="p-10 text-center text-sm text-slate-500">Loading the gate pass…</p>
  }
  if (passQuery.isError || !pass) {
    return (
      <div role="alert" className="p-10 text-center">
        <p className="text-sm text-red-700">{getApiErrorMessage(passQuery.error, 'This gate pass could not be loaded.')}</p>
        <button type="button" onClick={() => navigate(-1)} className="mt-3 text-sm font-semibold text-[#3155ff] hover:underline">Go back</button>
      </div>
    )
  }

  const pieces = itemCount(pass)
  const state = passState(pass)
  const back = pass.items.filter((item) => item.returnedAt).length

  return (
    <div className="gate-pass-preview min-h-screen bg-slate-100 p-3 sm:p-6">
      <div className="gate-pass-toolbar mx-auto mb-4 flex max-w-[210mm] items-center justify-between gap-3">
        <button type="button" onClick={() => navigate(-1)} className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          <ArrowLeft size={16} aria-hidden="true" /> Back
        </button>
        <p className="text-sm font-semibold text-slate-700">{pass.code} · {state}</p>
        <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-full bg-[#3155ff] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
          <Printer size={16} aria-hidden="true" /> Print slip
        </button>
      </div>

      <article className="gate-pass-print mx-auto flex min-h-[297mm] max-w-[210mm] flex-col gap-3.5 bg-white px-11 py-10 text-[12px] text-[#0E1430] shadow-lg">
        <header className="flex items-start gap-3.5 border-b-2 border-[#0F1A4A] pb-3">
          <img src="/favicons/favicon.svg" alt="" className="h-10 w-10 object-contain" />
          <div className="flex-1">
            <h1 className="text-[22px] font-bold">Gate pass · {pass.isReturnable ? 'Returnable items' : 'Non-returnable items'}</h1>
            <p className="text-[#5B6480]">IT Department · Afe Babalola University, Ado-Ekiti · Form ITR-GP-01</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-lg font-semibold">{pass.code}</p>
            <p className="text-[#5B6480]">Issued {formatDateTime(pass.approvedAt)}</p>
            <span className={`mt-1 inline-block rounded border-[1.5px] px-1.5 font-bold ${pass.isReturnable ? 'border-[#1C2E9E] text-[#1C2E9E]' : 'border-[#8A4B05] text-[#8A4B05]'}`}>
              {pass.isReturnable ? 'RETURNABLE' : 'NON-RETURNABLE'}
            </span>
          </div>
        </header>

        <table className="w-full border-collapse">
          <tbody>
            <Row cells={[['Taken by', `${pass.requester.fullName} · Staff ID ${pass.requester.staffId}`], ['Department', pass.requester.department.name]]} />
            <Row cells={[['Phone', pass.contactPhone ?? pass.requester.phone], ['Purpose', pass.reason]]} />
            <Row cells={[['Destination', pass.destination], ['Out → back', `${formatDay(pass.leavesOn)} → ${pass.isReturnable ? formatDay(pass.expectedReturnAt) : 'leaves for good'}`]]} />
          </tbody>
        </table>

        <div>
          <div className="mb-1.5 font-bold">Main device</div>
          <table className="w-full border-collapse">
            <tbody>
              <Row cells={[['Device name', <b key="name">{pass.asset.make} {pass.asset.model}</b>], ['Asset tag', <span key="tag" className="font-mono font-semibold">{pass.asset.assetTag}</span>]]} />
              <Row cells={[['Serial number', <span key="sn" className="font-mono font-semibold">{pass.asset.serialNumber}</span>], ['Type', pass.asset.type.charAt(0) + pass.asset.type.slice(1).toLowerCase()]]} />
            </tbody>
          </table>
        </div>

        <div>
          <div className="mb-1.5 font-bold">All items leaving the site</div>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#F4F6FB] text-left">
                {['#', 'Item', 'Tag', 'Make and model', 'Serial number', 'Qty', 'Condition out', 'Back ✓'].map((heading) => (
                  <th key={heading} className="border border-slate-300 px-1.5 py-1.5 font-semibold">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pass.items.map((item, index) => (
                <tr key={item.id}>
                  <td className="border border-slate-300 px-1.5 py-1.5">{index + 1}</td>
                  <td className="border border-slate-300 px-1.5 py-1.5 font-bold">{item.name}</td>
                  <td className="border border-slate-300 px-1.5 py-1.5 font-mono">{item.assetTag ?? '—'}</td>
                  <td className="border border-slate-300 px-1.5 py-1.5">{item.makeModel ?? '—'}</td>
                  <td className="border border-slate-300 px-1.5 py-1.5 font-mono font-semibold">{item.serialNumber ?? 'None printed'}</td>
                  <td className="border border-slate-300 px-1.5 py-1.5">{item.quantity}</td>
                  <td className="border border-slate-300 px-1.5 py-1.5">{item.conditionOut ?? '—'}</td>
                  <td className="border border-slate-300 px-1.5 py-1.5 text-center font-bold text-[#12733A]">{item.returnedAt ? '✓' : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-1 text-[#5B6480]">
            {pass.items.length} item{pass.items.length === 1 ? '' : 's'}, {pieces} piece{pieces === 1 ? '' : 's'}. Security must see every item before release.
            {pass.isReturnable ? ' Any item not returned keeps this pass open.' : ''}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          <div className="flex flex-col gap-1 rounded-md border border-[#9AA3BF] p-2.5">
            <b>Issued and approved by</b>
            <div className="flex h-[50px] items-center">
              {pass.issuerSignature?.image && <img src={pass.issuerSignature.image} alt={`Signature of ${pass.reviewer?.fullName ?? 'the issuer'}`} className="h-[50px] max-w-full object-contain" />}
            </div>
            <span className="border-t border-[#9AA3BF] pt-1">{pass.reviewer ? `${pass.reviewer.fullName} · ${pass.reviewer.staffId}` : '—'}</span>
            <span className="text-[10px] text-[#5B6480]">
              {pass.issuerSignature
                ? `E-signed ${formatDateTime(pass.issuerSignature.signedAt)} · PIN confirmed · sha256 ${shortHash(pass.issuerSignature.sha256)}`
                : 'Not yet signed by IT.'}
            </span>
          </div>
          <div className="flex flex-col gap-1 rounded-md border border-[#9AA3BF] p-2.5">
            <b>Received by</b>
            <div className="flex h-[50px] items-center">
              {pass.receiverSignature?.image && <img src={pass.receiverSignature.image} alt={`Signature of ${pass.requester.fullName}`} className="h-[50px] max-w-full object-contain" />}
            </div>
            <span className="border-t border-[#9AA3BF] pt-1">{pass.requester.fullName} · {pass.requester.staffId}</span>
            <span className="text-[10px] text-[#5B6480]">
              {pass.receiverSignature
                ? `Signed ${formatDateTime(pass.receiverSignature.signedAt)}. I accept these items in the condition stated.`
                : 'Signs on screen at handover.'}
            </span>
          </div>
          <div className="flex flex-col gap-1 rounded-md border border-[#9AA3BF] p-2.5">
            <b>Security release</b>
            <span className="flex h-[50px] items-center text-[#5B6480]">
              {pass.exitedAt ? `${pass.exitGate ?? 'Gate'} · ${formatDateTime(pass.exitedAt)}` : 'Gate ______ · Time ______'}
            </span>
            <span className="border-t border-[#9AA3BF] pt-1">{pass.exitedBy ? `${pass.exitedBy.fullName} · ${pass.exitedBy.staffId}` : 'Officer name and signature'}</span>
            <span className="text-[10px] text-[#5B6480]">Filled in automatically when scanned at the gate station.</span>
          </div>
        </div>

        {pass.isReturnable && (
          <div className="grid grid-cols-3 gap-2.5 rounded-md border border-dashed border-[#9AA3BF] p-2.5">
            <b className="col-span-3">Return check</b>
            <span>Date and time back: {pass.returnedAt ? formatDateTime(pass.returnedAt) : '__________'}</span>
            <span>Items checked in: {back} of {pass.items.length}</span>
            <span>Officer: {pass.returnedBy?.fullName ?? '__________'}</span>
            <span className="col-span-3 text-[#5B6480]">Condition on return / notes: {pass.returnNote ?? '______________________________________________'}</span>
          </div>
        )}

        <footer className="mt-auto flex justify-between gap-4 border-t border-[#D4DAEA] pt-2 text-[10px] text-[#5B6480]">
          <span>Signed passes cannot be edited. Check this pass at the gate station by scanning the main device tag.</span>
          <span>Copy: Gate · IT · Holder</span>
          <span>Page 1 of 1</span>
        </footer>
      </article>
    </div>
  )
}
