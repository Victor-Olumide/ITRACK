// W12 3D model library: catalogue makes and models with an optional .glb model
// and photo, which every device of that model then shows in its 3D viewer.
import { useEffect, useState, type SubmitEvent } from 'react'
import { Box, Plus, RotateCcw } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import Dropdown from '../components/Dropdown'
import { useToast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { getApiErrorMessage } from '../lib/api/error-message'
import { useCreateAssetModelMutation, useGetAssetModelsQuery } from '../lib/api/assets/assets-api'
import type { AssetModelRecord, AssetType } from '../lib/api/assets/types'
import { BUILT_IN_MODELS, localDeviceModelUrl } from '../utils/device-models'

const TYPE_LABELS: Record<AssetType, string> = {
  LAPTOP: 'Laptop',
  DESKTOP: 'Desktop',
  PRINTER: 'Printer',
  NETWORK: 'Network',
  OTHER: 'Other',
}
const TYPE_OPTIONS = (Object.keys(TYPE_LABELS) as AssetType[]).map((value) => ({ value, label: TYPE_LABELS[value] }))
const MAX_MODEL_BYTES = 50 * 1024 * 1024
const MAX_IMAGE_BYTES = 10 * 1024 * 1024

export default function ModelLibrary() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'IT Admin'
  const [type, setType] = useState<AssetType | ''>('')
  const [adding, setAdding] = useState(false)
  const [previewing, setPreviewing] = useState<{ title: string; url: string; note?: string } | null>(null)
  const query = useGetAssetModelsQuery(type || undefined)
  const models = query.data?.data ?? []
  const builtIns = BUILT_IN_MODELS.filter((model) => !type || model.type === type)

  return (
    <main className="min-h-full px-4 py-5 sm:px-6 sm:py-6 lg:px-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Box size={19} className="text-[#3155ff]" />
            <h1 className="text-2xl font-bold tracking-tight text-[#111a3b]">3D model library</h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">Makes and models in the catalogue. Devices registered against a model show its 3D view and photo.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-40"><Dropdown value={type} onChange={(value) => setType(value as AssetType | '')} ariaLabel="Device type" options={[{ value: '', label: 'All types' }, ...TYPE_OPTIONS]} /></div>
          {isAdmin && (
            <button type="button" onClick={() => setAdding(true)} className="inline-flex items-center gap-1.5 rounded-full bg-[#3155ff] px-4 py-2.5 text-xs font-semibold text-white">
              <Plus size={14} /> Add model
            </button>
          )}
        </div>
      </div>

      <section className="mt-5">
        {query.isLoading ? (
          <p className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500">Loading the model library…</p>
        ) : query.isError ? (
          <p role="alert" className="rounded-2xl bg-white p-8 text-center text-sm text-red-700">{getApiErrorMessage(query.error, 'The model library could not be loaded.')}</p>
        ) : models.length === 0 ? (
          <p className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500">{type ? `No ${TYPE_LABELS[type].toLowerCase()} models in the catalogue yet.` : 'No makes or models in the catalogue yet.'}{isAdmin ? ' Add one to give its devices a photo and 3D view.' : ''}</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {models.map((model) => (
              <li key={model.id} className="overflow-hidden rounded-2xl border border-[#e9edf6] bg-white">
                <div className="flex h-36 items-center justify-center bg-linear-to-b from-[#f1f4fc] to-[#e8edf9]">
                  {model.imageUrl ? <img src={model.imageUrl} alt="" className="h-full w-full object-contain p-3" /> : <Box size={34} className="text-[#9aa6c8]" aria-hidden="true" />}
                </div>
                <div className="p-3.5">
                  <p className="text-sm font-semibold text-[#202844]">{model.make} {model.model}</p>
                  <CatalogueModelActions model={model} onPreview={setPreviewing} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {builtIns.length > 0 && (
        <section className="mt-6" aria-labelledby="built-in-models">
          <h2 id="built-in-models" className="text-sm font-bold text-[#111a38]">Built-in 3D models</h2>
          <p className="mt-0.5 text-xs text-slate-500">Bundled with ITrack. Devices without an uploaded model use the closest match.</p>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {builtIns.map((model) => (
              <li key={model.url} className="flex items-center justify-between gap-2 rounded-2xl border border-[#e9edf6] bg-white p-3.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#202844]">{model.name}</p>
                  <p className="text-xs text-slate-500">{TYPE_LABELS[model.type]}</p>
                </div>
                <button type="button" onClick={() => setPreviewing({ title: model.name, url: model.url })} className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#dce2ef] px-3 py-1.5 text-xs font-semibold text-[#202844]">
                  <RotateCcw size={13} /> View in 3D
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent className="max-w-xl">{adding && <AddModelForm onDone={() => setAdding(false)} />}</DialogContent>
      </Dialog>
      <Dialog open={Boolean(previewing)} onOpenChange={(open) => !open && setPreviewing(null)}>
        <DialogContent className="max-w-3xl">{previewing && <ModelPreview key={previewing.url} {...previewing} />}</DialogContent>
      </Dialog>
    </main>
  )
}

function ModelPreview({ title, url, note }: { title: string; url: string; note?: string }) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  useEffect(() => {
    import('@google/model-viewer').then(
      () => setStatus('ready'),
      () => setStatus('error'),
    )
  }, [])

  return (
    <div>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{note ? `${note} ` : ''}Drag to rotate, scroll to zoom.</DialogDescription>
      </DialogHeader>
      <div className="mt-4 flex h-[min(60vh,460px)] items-center justify-center overflow-hidden rounded-xl bg-[#f3f5fc]">
        {status === 'ready' ? (
          <model-viewer
            src={url}
            alt={`${title} 3D model`}
            camera-controls
            auto-rotate
            shadow-intensity="1"
            onError={() => setStatus('error')}
            className="h-full w-full"
          />
        ) : (
          <p className={`text-sm ${status === 'error' ? 'text-red-700' : 'text-slate-500'}`}>{status === 'error' ? 'The 3D model could not be displayed.' : 'Loading 3D viewer…'}</p>
        )}
      </div>
    </div>
  )
}

function AddModelForm({ onDone }: { onDone: () => void }) {
  const toast = useToast()
  const [create, state] = useCreateAssetModelMutation()
  const [type, setType] = useState<AssetType>('LAPTOP')
  const [make, setMake] = useState('')
  const [model, setModel] = useState('')
  const [modelFile, setModelFile] = useState<File | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const input = 'mt-1.5 h-10 w-full rounded-xl border border-[#d4daea] px-3 text-sm font-normal outline-none focus:border-[#3155ff] focus:ring-2 focus:ring-blue-100'

  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    if (modelFile && !/\.(glb|gltf)$/i.test(modelFile.name)) return setError('Upload the 3D model as a .glb or .gltf file.')
    if (modelFile && modelFile.size > MAX_MODEL_BYTES) return setError('The 3D model must be 50 MB or smaller.')
    if (imageFile && imageFile.size > MAX_IMAGE_BYTES) return setError('The photo must be 10 MB or smaller.')
    try {
      await create({ type, make: make.trim(), model: model.trim(), modelFile, imageFile }).unwrap()
      toast(`${make.trim()} ${model.trim()} added to the library.`)
      onDone()
    } catch (err) {
      setError(getApiErrorMessage(err, 'The model could not be added.'))
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>Add a model</DialogTitle>
        <DialogDescription>Files are optional; a model without them still appears when registering devices.</DialogDescription>
      </DialogHeader>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-xs font-semibold text-slate-600">Type<div className="mt-1.5"><Dropdown value={type} onChange={(value) => setType(value as AssetType)} ariaLabel="Device type" options={TYPE_OPTIONS} /></div></label>
        <label className="text-xs font-semibold text-slate-600">Make<input required maxLength={120} value={make} onChange={(event) => setMake(event.target.value)} placeholder="Dell" className={input} /></label>
        <label className="text-xs font-semibold text-slate-600">Model<input required maxLength={120} value={model} onChange={(event) => setModel(event.target.value)} placeholder="Latitude 5440" className={input} /></label>
      </div>
      <FilePicker label="3D model" hint=".glb or .gltf, up to 50 MB" accept=".glb,.gltf,model/gltf-binary,model/gltf+json" file={modelFile} onChange={setModelFile} />
      <FilePicker label="Photo" hint="JPG or PNG, up to 10 MB" accept="image/*" file={imageFile} onChange={setImageFile} />
      {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onDone} className="rounded-full border border-[#dce2ef] px-4 py-2.5 text-xs font-semibold text-[#202844]">Cancel</button>
        <button type="submit" disabled={state.isLoading} className="rounded-full bg-[#3155ff] px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50">{state.isLoading ? 'Uploading…' : 'Add model'}</button>
      </div>
    </form>
  )
}

function FilePicker({ label, hint, accept, file, onChange }: { label: string; hint: string; accept: string; file: File | null; onChange: (file: File | null) => void }) {
  return (
    <label className="block text-xs font-semibold text-slate-600">
      {label} <span className="font-normal text-slate-400">(optional)</span>
      <input
        type="file"
        accept={accept}
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
        className="mt-1.5 block w-full text-xs font-normal text-slate-600 file:mr-3 file:rounded-full file:border-0 file:bg-[#eef2ff] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-[#3155ff]"
      />
      <span className="mt-1 block font-normal text-slate-400">{file ? `${file.name} · ${(file.size / 1024 / 1024).toFixed(1)} MB` : hint}</span>
    </label>
  )
}

// Uploaded model when there is one; otherwise the bundled model devices of this kind use.
function CatalogueModelActions({ model, onPreview }: { model: AssetModelRecord; onPreview: (preview: { title: string; url: string; note?: string }) => void }) {
  const fallback = model.modelUrl ? null : localDeviceModelUrl(model.type, null, model.make, model.model)
  const url = model.modelUrl ?? fallback
  return (
    <>
      <p className="mt-0.5 text-xs text-slate-500">
        {TYPE_LABELS[model.type]} · {model.modelUrl ? '3D model uploaded' : fallback ? 'Using the built-in 3D model' : 'No 3D model'}
      </p>
      {url && (
        <button
          type="button"
          onClick={() => onPreview({ title: `${model.make} ${model.model}`, url, note: fallback ? 'Built-in model shown until one is uploaded.' : undefined })}
          className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[#dce2ef] px-3 py-1.5 text-xs font-semibold text-[#202844]"
        >
          <RotateCcw size={13} /> View in 3D
        </button>
      )}
    </>
  )
}
