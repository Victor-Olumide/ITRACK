// Create or update a catalogue model (W12) with a .glb and photo, previewing
// both in the browser before anything is uploaded. Used by the 3D model
// library and by Register device.
import { useEffect, useState, type SubmitEvent } from 'react'
import Dropdown from './Dropdown'
import ModelViewer from './ModelViewer'
import { DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { useObjectUrl } from '@/hooks/use-object-url'
import { getApiErrorMessage } from '@/lib/api/error-message'
import { useCreateAssetModelMutation, useUpdateAssetModelMutation } from '@/lib/api/assets/assets-api'
import type { AssetModelRecord, AssetType } from '@/lib/api/assets/types'

const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  LAPTOP: 'Laptop',
  DESKTOP: 'Desktop',
  PRINTER: 'Printer',
  NETWORK: 'Network',
  OTHER: 'Other',
}
const TYPE_OPTIONS = (Object.keys(ASSET_TYPE_LABELS) as AssetType[]).map((value) => ({ value, label: ASSET_TYPE_LABELS[value] }))
const MAX_MODEL_BYTES = 50 * 1024 * 1024
const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const input = 'mt-1.5 h-10 w-full rounded-xl border border-[#d4daea] px-3 text-sm font-normal outline-none focus:border-[#3155ff] focus:ring-2 focus:ring-blue-100'

export default function ModelUploadForm({
  existing,
  defaultType = 'LAPTOP',
  lockType = false,
  onDone,
  onCancel,
}: {
  existing?: AssetModelRecord
  defaultType?: AssetType
  lockType?: boolean
  onDone: (model: AssetModelRecord) => void
  onCancel: () => void
}) {
  const toast = useToast()
  const [create, createState] = useCreateAssetModelMutation()
  const [update, updateState] = useUpdateAssetModelMutation()
  const [type, setType] = useState<AssetType>(existing?.type ?? defaultType)
  const [make, setMake] = useState(existing?.make ?? '')
  const [model, setModel] = useState(existing?.model ?? '')
  const [modelFile, setModelFile] = useState<File | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const busy = createState.isLoading || updateState.isLoading

  // Preview the picked files, or the current ones when editing.
  const pickedModelUrl = useObjectUrl(modelFile)
  const pickedImageUrl = useObjectUrl(imageFile)
  const previewModel = pickedModelUrl ?? existing?.modelUrl ?? null
  const previewImage = pickedImageUrl ?? existing?.imageUrl ?? null
  const [viewerReady, setViewerReady] = useState(false)
  const [modelPreviewFailed, setModelPreviewFailed] = useState(false)

  useEffect(() => {
    if (!previewModel || viewerReady) return
    import('@google/model-viewer').then(() => setViewerReady(true), () => setModelPreviewFailed(true))
  }, [previewModel, viewerReady])

  const pickModel = (file: File | null) => {
    setModelPreviewFailed(false)
    setModelFile(file)
  }

  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    if (modelFile && !/\.glb$/i.test(modelFile.name)) return setError('Upload the 3D model as a .glb file.')
    if (modelFile && modelFile.size > MAX_MODEL_BYTES) return setError('The 3D model must be 50 MB or smaller.')
    if (imageFile && imageFile.size > MAX_IMAGE_BYTES) return setError('The photo must be 10 MB or smaller.')
    if (modelFile && modelPreviewFailed) return setError('This 3D file could not be displayed. Check it is a valid .glb model.')
    try {
      const saved = existing
        ? await update({ id: existing.id, make: make.trim(), model: model.trim(), modelFile, imageFile }).unwrap()
        : await create({ type, make: make.trim(), model: model.trim(), modelFile, imageFile }).unwrap()
      toast(existing ? `${saved.make} ${saved.model} updated.` : `${saved.make} ${saved.model} added to the model library.`)
      onDone(saved)
    } catch (err) {
      setError(getApiErrorMessage(err, existing ? 'The model could not be updated.' : 'The model could not be added.'))
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>{existing ? `Edit ${existing.make} ${existing.model}` : 'Add a new model'}</DialogTitle>
        <DialogDescription>
          {existing
            ? 'Upload a new 3D model or photo to replace the current one. Every device of this model updates.'
            : 'Devices registered against this model show its photo and 3D view. Check both previews before saving.'}
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-xs font-semibold text-slate-600">
          Type
          <div className="mt-1.5">
            <Dropdown value={type} onChange={(value) => setType(value as AssetType)} ariaLabel="Device type" options={TYPE_OPTIONS} disabled={lockType || Boolean(existing)} />
          </div>
        </label>
        <label className="text-xs font-semibold text-slate-600">Make<input required maxLength={120} value={make} onChange={(event) => setMake(event.target.value)} placeholder="HP" className={input} /></label>
        <label className="text-xs font-semibold text-slate-600">Model<input required maxLength={120} value={model} onChange={(event) => setModel(event.target.value)} placeholder="EliteBook 840 G9" className={input} /></label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <FilePicker label="3D model" hint=".glb, up to 50 MB" accept=".glb,model/gltf-binary" file={modelFile} onChange={pickModel} />
          <div className="mt-2 flex h-48 items-center justify-center overflow-hidden rounded-xl border border-[#e9edf6] bg-[#f3f5fc]">
            {previewModel && viewerReady && !modelPreviewFailed ? (
              <ModelViewer key={previewModel} src={previewModel} alt="3D model preview" camera-controls auto-rotate onLoadError={() => setModelPreviewFailed(true)} className="h-full w-full" />
            ) : (
              <p className={`px-3 text-center text-xs ${modelPreviewFailed ? 'text-red-700' : 'text-slate-400'}`}>
                {modelPreviewFailed ? 'This file could not be shown as a 3D model.' : previewModel ? 'Loading 3D preview…' : 'Pick a .glb file to preview it here.'}
              </p>
            )}
          </div>
        </div>
        <div>
          <FilePicker label="Photo" hint="JPG, PNG or WebP, up to 10 MB" accept="image/jpeg,image/png,image/webp" file={imageFile} onChange={setImageFile} />
          <div className="mt-2 flex h-48 items-center justify-center overflow-hidden rounded-xl border border-[#e9edf6] bg-[#f3f5fc]">
            {previewImage ? (
              <img src={previewImage} alt="Photo preview" className="h-full w-full object-contain" />
            ) : (
              <p className="px-3 text-center text-xs text-slate-400">Pick a photo to preview it here.</p>
            )}
          </div>
        </div>
      </div>

      {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-full border border-[#dce2ef] px-4 py-2.5 text-xs font-semibold text-[#202844]">Cancel</button>
        <button type="submit" disabled={busy} className="rounded-full bg-[#3155ff] px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50">
          {busy ? 'Uploading…' : existing ? 'Save changes' : 'Add model'}
        </button>
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
