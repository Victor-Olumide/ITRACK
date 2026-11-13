import { useState } from 'react'
import { useNavigate } from 'react-router'
import { ChevronLeft, Laptop } from 'lucide-react'
import { useCreateAssetMutation } from '../lib/api/assets/assets-api'
import type { AssetType } from '../lib/api/assets/types'

interface RegisterDevicePageProps {
  basePath?: string
}

interface AssetForm {
  assetTag: string
  type: AssetType
  make: string
  model: string
  serialNumber: string
  purchaseDate: string
  warrantyExpiry: string
}

function messageFromError(error: unknown) {
  if (error && typeof error === 'object' && 'data' in error) {
    const data = error.data
    if (data && typeof data === 'object' && 'message' in data && typeof data.message === 'string') {
      return data.message
    }
    if (data && typeof data === 'object' && 'error' in data) {
      const nested = data.error
      if (nested && typeof nested === 'object' && 'message' in nested && typeof nested.message === 'string') {
        return nested.message
      }
    }
  }
  return 'Unable to register the device. Check the asset details and try again.'
}

export default function RegisterDevicePage({ basePath = '/devices' }: RegisterDevicePageProps) {
  const navigate = useNavigate()
  const [createAsset, { isLoading: isSaving }] = useCreateAssetMutation()
  const [saveError, setSaveError] = useState('')
  const [form, setForm] = useState<AssetForm>({
    assetTag: '',
    type: 'LAPTOP',
    make: '',
    model: '',
    serialNumber: '',
    purchaseDate: '',
    warrantyExpiry: '',
  })

  const saveAsset = async () => {
    setSaveError('')
    try {
      const asset = await createAsset({
        ...form,
        assetTag: form.assetTag.trim(),
        serialNumber: form.serialNumber.trim(),
        make: form.make.trim(),
        model: form.model.trim(),
        purchaseDate: form.purchaseDate || null,
        warrantyExpiry: form.warrantyExpiry || null,
      }).unwrap()
      navigate(`${basePath}/${asset.id}`)
    } catch (error) {
      setSaveError(messageFromError(error))
    }
  }

  return (
    <main className="min-h-full bg-[#f4f6fc] px-4 py-5 sm:px-6 sm:py-6 lg:px-7">
      <div className="mx-auto max-w-5xl">
        <div className="mb-4 flex items-center text-sm font-medium text-slate-500">
          <ChevronLeft size={16} className="mr-1" />
          <button type="button" onClick={() => navigate(basePath)} className="hover:text-[#3155ff]">Devices</button>
          <span className="mx-2">/</span>
          <span className="text-[#202844]">Register a device</span>
        </div>
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#111a3b]">Register a device</h1>
            <p className="mt-1 text-sm text-slate-500">Save asset details to the server.</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => navigate(basePath)} className="rounded-full border border-[#dce2ef] bg-white px-4 py-2.5 text-xs font-semibold text-[#202844]">
              Cancel
            </button>
            <button type="button" onClick={() => void saveAsset()} disabled={isSaving} className="rounded-full bg-[#3155ff] px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
              {isSaving ? 'Saving…' : 'Save device'}
            </button>
          </div>
        </header>

        <section className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(260px,0.6fr)]">
          <div className="rounded-2xl border border-[#e9edf6] bg-white p-5 sm:p-6">
            <h2 className="text-base font-bold text-[#111a38]">Asset details</h2>
            {saveError && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{saveError}</p>}
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="text-xs font-semibold text-slate-600">
                Asset tag
                <input required value={form.assetTag} onChange={(event) => setForm((current) => ({ ...current, assetTag: event.target.value }))} className="mt-1.5 w-full rounded-xl border border-[#e3e8f2] px-3 py-2.5 text-sm font-normal text-[#202844]" />
              </label>
              <label className="text-xs font-semibold text-slate-600">
                Device type
                <select value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as AssetType }))} className="mt-1.5 w-full rounded-xl border border-[#e3e8f2] bg-white px-3 py-2.5 text-sm font-normal text-[#202844]">
                  <option value="LAPTOP">Laptop</option>
                  <option value="DESKTOP">Desktop</option>
                  <option value="PRINTER">Printer</option>
                  <option value="NETWORK">Network</option>
                  <option value="OTHER">Other</option>
                </select>
              </label>
              <label className="text-xs font-semibold text-slate-600">
                Make
                <input required value={form.make} onChange={(event) => setForm((current) => ({ ...current, make: event.target.value }))} className="mt-1.5 w-full rounded-xl border border-[#e3e8f2] px-3 py-2.5 text-sm font-normal text-[#202844]" />
              </label>
              <label className="text-xs font-semibold text-slate-600">
                Model
                <input required value={form.model} onChange={(event) => setForm((current) => ({ ...current, model: event.target.value }))} className="mt-1.5 w-full rounded-xl border border-[#e3e8f2] px-3 py-2.5 text-sm font-normal text-[#202844]" />
              </label>
              <label className="text-xs font-semibold text-slate-600 sm:col-span-2">
                Serial number
                <input required value={form.serialNumber} onChange={(event) => setForm((current) => ({ ...current, serialNumber: event.target.value }))} className="mt-1.5 w-full rounded-xl border border-[#e3e8f2] px-3 py-2.5 text-sm font-normal text-[#202844]" />
              </label>
              <label className="text-xs font-semibold text-slate-600">
                Purchase date
                <input type="date" value={form.purchaseDate} onChange={(event) => setForm((current) => ({ ...current, purchaseDate: event.target.value }))} className="mt-1.5 w-full rounded-xl border border-[#e3e8f2] px-3 py-2.5 text-sm font-normal text-[#202844]" />
              </label>
              <label className="text-xs font-semibold text-slate-600">
                Warranty expiry
                <input type="date" value={form.warrantyExpiry} onChange={(event) => setForm((current) => ({ ...current, warrantyExpiry: event.target.value }))} className="mt-1.5 w-full rounded-xl border border-[#e3e8f2] px-3 py-2.5 text-sm font-normal text-[#202844]" />
              </label>
            </div>
          </div>

          <aside className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950">
            <div className="flex items-center gap-2">
              <Laptop size={18} />
              <h2 className="text-sm font-semibold">Additional workflows unavailable</h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-amber-900">
              Location assignment and the 3D model library are not in the current asset API contract.
              This form only submits supported asset fields.
            </p>
            {/* TODO(v2): Restore location assignment and model-library UI once their APIs are available. */}
          </aside>
        </section>
      </div>
    </main>
  )
}
