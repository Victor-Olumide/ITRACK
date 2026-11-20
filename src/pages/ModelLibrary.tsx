// W12 3D model library: catalogue makes and models with an optional .glb model
// and photo, which every device of that model then shows in its 3D viewer.
import { useEffect, useState } from 'react'
import { Box, Pencil, Plus, RotateCcw } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import Dropdown from '../components/Dropdown'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { getApiErrorMessage } from '../lib/api/error-message'
import { useGetAssetModelsQuery } from '../lib/api/assets/assets-api'
import ModelUploadForm from '../components/ModelUploadForm'
import type { AssetModelRecord, AssetType } from '../lib/api/assets/types'
import { BUILT_IN_MODELS, localDeviceModelUrl } from '../utils/device-models'
import ModelViewer from '../components/ModelViewer'

const TYPE_LABELS: Record<AssetType, string> = {
  LAPTOP: 'Laptop',
  DESKTOP: 'Desktop',
  PRINTER: 'Printer',
  NETWORK: 'Network',
  OTHER: 'Other',
}
const TYPE_OPTIONS = (Object.keys(TYPE_LABELS) as AssetType[]).map((value) => ({ value, label: TYPE_LABELS[value] }))

export default function ModelLibrary() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'IT Admin'
  const [type, setType] = useState<AssetType | ''>('')
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<AssetModelRecord | null>(null)
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
                  <CatalogueModelActions model={model} onPreview={setPreviewing} onEdit={setEditing} />
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
        <DialogContent className="max-w-3xl">{adding && <ModelUploadForm defaultType={type || 'LAPTOP'} onDone={() => setAdding(false)} onCancel={() => setAdding(false)} />}</DialogContent>
      </Dialog>
      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-3xl">{editing && <ModelUploadForm key={editing.id} existing={editing} onDone={() => setEditing(null)} onCancel={() => setEditing(null)} />}</DialogContent>
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
          <ModelViewer
            src={url}
            alt={`${title} 3D model`}
            camera-controls
            auto-rotate
            shadow-intensity="1"
            onLoadError={() => setStatus('error')}
            className="h-full w-full"
          />
        ) : (
          <p className={`text-sm ${status === 'error' ? 'text-red-700' : 'text-slate-500'}`}>{status === 'error' ? 'The 3D model could not be displayed.' : 'Loading 3D viewer…'}</p>
        )}
      </div>
    </div>
  )
}

// Uploaded model when there is one; otherwise the bundled model devices of this kind use.
function CatalogueModelActions({ model, onPreview, onEdit }: { model: AssetModelRecord; onPreview: (preview: { title: string; url: string; note?: string }) => void; onEdit: (model: AssetModelRecord) => void }) {
  const fallback = model.modelUrl ? null : localDeviceModelUrl(model.type, null, model.make, model.model)
  const url = model.modelUrl ?? fallback
  return (
    <>
      <p className="mt-0.5 text-xs text-slate-500">
        {TYPE_LABELS[model.type]} · {model.modelUrl ? '3D model uploaded' : fallback ? 'Using the built-in 3D model' : 'No 3D model'}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
      {url && (
        <button
          type="button"
          onClick={() => onPreview({ title: `${model.make} ${model.model}`, url, note: fallback ? 'Built-in model shown until one is uploaded.' : undefined })}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#dce2ef] px-3 py-1.5 text-xs font-semibold text-[#202844]"
        >
          <RotateCcw size={13} /> View in 3D
        </button>
      )}
        <button type="button" onClick={() => onEdit(model)} className="inline-flex items-center gap-1.5 rounded-full border border-[#dce2ef] px-3 py-1.5 text-xs font-semibold text-[#202844]">
          <Pencil size={13} /> Edit / upload files
        </button>
      </div>
    </>
  )
}
