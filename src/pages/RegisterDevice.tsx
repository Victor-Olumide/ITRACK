
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ChevronLeft,
  X,
  ImagePlus,
} from 'lucide-react';
import Dropdown from '../components/Dropdown';
import DatePicker from '../components/DatePicker';
import DeviceViewToggle from '../components/DeviceViewToggle';
import { useAuth } from '../contexts/AuthContext';
import { useGetUsersQuery } from '../lib/api/users/users-api';

import {
  useCreateAssetMutation,
  useAllocateAssetTagMutation,
  useGetAssetModelsQuery,
} from '../lib/api/assets/assets-api';

import type {
  AssetCondition,
  AssetModelRecord,
  AssetType,
  CreateAssetRequest,
} from '../lib/api/assets/types';
import ModelViewer from '../components/ModelViewer';

interface RegisterDevicePageProps {
  basePath?: string;
}

interface AssetForm {
  assetTag: string;
  type: AssetType;
  customType: string;
  make: string;
  model: string;
  serialNumber: string;
  purchaseDate: string;
  warrantyExpiry: string;
  condition: AssetCondition;
  assignedToId: string;
  notes: string;
}

const inputClass =
  'mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#3155ff] focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50';

const labelClass = 'block text-xs font-semibold text-slate-600';

const assetTypes: { value: AssetType; label: string }[] = [
  { value: 'LAPTOP', label: 'Laptop' },
  { value: 'DESKTOP', label: 'Desktop' },
  { value: 'PRINTER', label: 'Printer' },
  { value: 'NETWORK', label: 'Network' },
  { value: 'OTHER', label: 'Other' },
];

function messageFromError(error: unknown): string {
  if (error && typeof error === 'object' && 'data' in error) {
    const data = error.data;

    if (data && typeof data === 'object' && 'message' in data) {
      const message = data.message;

      if (typeof message === 'string') return message;
      if (Array.isArray(message)) return message.join(', ');
    }
  }

  return 'Unable to register the device. Check the details and try again.';
}

export default function RegisterDevicePage({
  basePath = '/devices',
}: RegisterDevicePageProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [createAsset, { isLoading: isSaving }] =
    useCreateAssetMutation();
  const [allocateAssetTag, { isLoading: isAllocatingTag, isError: tagAllocationError }] =
    useAllocateAssetTagMutation();

  const [form, setForm] = useState<AssetForm>({
    assetTag: '',
    type: 'LAPTOP',
    customType: '',
    make: '',
    model: '',
    serialNumber: '',
    purchaseDate: '',
    warrantyExpiry: '',
    condition: 'GOOD',
    assignedToId: '',
    notes: '',
  });

  const [selectedModel, setSelectedModel] =
    useState<AssetModelRecord | null>(null);

  const [registrationMode, setRegistrationMode] =
    useState<'catalogue' | 'manual'>('catalogue');

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [showModelPreview, setShowModelPreview] = useState(false);
  const [modelViewerStatus, setModelViewerStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [modelPreviewFailed, setModelPreviewFailed] = useState(false);

  const [saveError, setSaveError] = useState('');
  const customTypeRef = useRef<HTMLInputElement>(null);

  const {
    data: modelResponse,
    isLoading: isLoadingModels,
    isError: modelsError,
  } = useGetAssetModelsQuery(form.type);

  const usersQuery = useGetUsersQuery(undefined, {
    skip: user?.role !== 'IT Admin',
  });
  const assignableUsers = (usersQuery.data?.users ?? []).filter(
    (candidate) => candidate.isActive && candidate.role !== 'SECURITY',
  );

  useEffect(() => {
    if (form.type === 'OTHER') customTypeRef.current?.focus();
  }, [form.type]);

  useEffect(() => {
    let active = true;
    void allocateAssetTag(form.type)
      .unwrap()
      .then((allocated) => {
        if (active) setForm((current) => ({ ...current, assetTag: allocated.tag }));
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, [allocateAssetTag, form.type]);

  useEffect(() => {
    if (!showModelPreview || !selectedModel?.modelUrl || modelViewerStatus !== 'loading') return;

    import('@google/model-viewer').then(
      () => setModelViewerStatus('ready'),
      () => setModelViewerStatus('error'),
    );
  }, [modelViewerStatus, selectedModel?.modelUrl, showModelPreview]);

  const updateForm = <K extends keyof AssetForm>(
    key: K,
    value: AssetForm[K],
  ) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleTypeChange = (type: AssetType) => {
    setForm((current) => ({
      ...current,
      type,
      customType: '',
      assetTag: '',
      make: '',
      model: '',
    }));

    setSelectedModel(null);
    setSaveError('');
  };

  const selectCatalogueModel = (model: AssetModelRecord) => {
    setSelectedModel(model);
    setShowModelPreview(false);
    setModelPreviewFailed(false);
    setModelViewerStatus('idle');

    setForm((current) => ({
      ...current,
      make: model.make,
      model: model.model,
    }));

    setSaveError('');
  };

  const switchToManual = () => {
    setRegistrationMode('manual');
    setSelectedModel(null);
  };

  const switchToCatalogue = () => {
    setRegistrationMode('catalogue');
    setSelectedModel(null);
  };

  const handleImageChange = (file?: File) => {
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      setSaveError('Choose a JPEG, PNG, or WebP image.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setSaveError('The device image must not exceed 10 MB.');
      return;
    }

    setSaveError('');
    setImageFile(file);

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImagePreview(reader.result);
      }
    };

    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview('');
  };

  const saveAsset = async (
    event: React.SubmitEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setSaveError('');

    const make = form.make.trim();
    const model = form.model.trim();
    const customType = form.customType.trim();

    if (!make || !model) {
      setSaveError(
        "Manufacturer's name and manufacturer's model are required.",
      );
      return;
    }

    if (form.type === 'OTHER' && !customType) {
      setSaveError('Specify the device type.');
      return;
    }

    const payload: CreateAssetRequest = {
      serialNumber: form.serialNumber.trim(),
      assetTag: form.assetTag,
      type: form.type,
      make,
      model,
      condition: form.condition,
      purchaseDate: form.purchaseDate || null,
      warrantyExpiry: form.warrantyExpiry || null,
      ...(form.type === 'OTHER' ? { customType } : {}),
      ...(form.notes.trim() ? { notes: form.notes.trim() } : {}),
      ...(selectedModel ? { modelId: selectedModel.id } : {}),
      ...(form.assignedToId ? { assignedToId: form.assignedToId } : {}),
    };

    try {
      const asset = await createAsset({
        data: payload,
        imageFile,
      }).unwrap();

      navigate(`${basePath}/${asset.id}`);
    } catch (error) {
      setSaveError(messageFromError(error));
    }
  };

  return (
    <main className="min-h-full bg-[#f4f6fc] px-4 py-4 sm:px-5 sm:py-5 lg:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-3 flex items-center text-xs font-medium text-slate-500">
          <ChevronLeft size={15} className="mr-1" />

          <button
            type="button"
            onClick={() => navigate(basePath)}
            className="transition hover:text-[#3155ff]"
          >
            Devices
          </button>

          <span className="mx-2">/</span>
          <span className="text-[#202844]">Register a device</span>
        </div>

        <header className="mb-4">
          <h1 className="text-xl font-bold tracking-tight text-[#111a3b]">
            Register a device
          </h1>

          <p className="mt-1 text-xs text-slate-500">
            Add a device to your organization's asset records.
          </p>
        </header>

        <form onSubmit={saveAsset} className="space-y-3">
          {saveError && (
            <div
              role="alert"
              className="rounded-md border border-red-100 bg-red-50 px-3 py-2.5 text-xs text-red-700"
            >
              {saveError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.86fr)] lg:items-start">
            <div className="space-y-3">
          <section className="rounded-lg border border-[#e9edf6] bg-white p-4">
            <div className="mb-3">
              <h2 className="text-sm font-bold text-[#111a38]">
                Asset details
              </h2>

              <p className="mt-0.5 text-xs text-slate-500">
                Select the asset type and an available asset tag.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className={labelClass}>
                Device type

                <Dropdown
                  value={form.type}
                  onChange={(value) => handleTypeChange(value as AssetType)}
                  ariaLabel="Device type"
                  options={assetTypes}
                />
              </label>

              <label className={labelClass}>
                Asset tag

                <div className="mt-1">
                  <div className="flex h-10 items-center rounded-xl border border-[#cbe86b] bg-[#f1ffc7] px-3 font-mono text-sm font-semibold text-[#344500]">
                    {isAllocatingTag ? 'Allocating tag…' : form.assetTag || 'Tag unavailable'}
                  </div>
                </div>
                <span className={`mt-1 block text-xs font-normal ${tagAllocationError ? 'text-red-600' : 'text-slate-500'}`}>
                  {tagAllocationError ? 'Could not allocate a tag. Try selecting the device type again.' : 'Allocated by ITrack and locked for this registration.'}
                </span>
              </label>

              {form.type === 'OTHER' && (
                <label className={labelClass}>
                  Specify device type

                  <input
                    ref={customTypeRef}
                    required
                    maxLength={120}
                    value={form.customType}
                    onChange={(event) =>
                      updateForm('customType', event.target.value)
                    }
                    placeholder="e.g. Projector, Scanner"
                    className={inputClass}
                  />
                </label>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-[#e9edf6] bg-white p-4">
            <h2 className="mb-1 text-sm font-bold text-[#111a38]">Device image</h2>
            <p className="mb-3 text-xs text-slate-500">
              Upload an image of this particular device. The catalogue image remains available when no image is uploaded.
            </p>

            {imagePreview ? (
              <div className="relative w-fit">
                <img src={imagePreview} alt="Device preview" className="h-36 w-48 rounded-lg border border-slate-200 bg-slate-50 object-contain" />
                <button type="button" onClick={clearImage} aria-label="Remove selected image" className="absolute -right-2 -top-2 rounded-full bg-red-600 p-1.5 text-white shadow">
                  <X size={13} />
                </button>
              </div>
            ) : (
              <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center transition hover:border-blue-400 hover:bg-blue-50/40">
                <ImagePlus size={24} className="mb-2 text-slate-400" />
                <span className="text-xs font-semibold text-slate-700">Choose device image</span>
                <span className="mt-1 text-[11px] text-slate-500">JPEG, PNG or WebP. Maximum 10 MB.</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => handleImageChange(event.target.files?.[0])} />
              </label>
            )}
          </section>

          <section className="rounded-lg border border-[#e9edf6] bg-white p-4">
            <div className="mb-3">
              <h2 className="text-sm font-bold text-[#111a38]">
                Manufacturer and model
              </h2>

              <p className="mt-0.5 text-xs text-slate-500">
                Catalogue selection is optional. You can enter a model
                manually if it is not listed.
              </p>
            </div>

            <div className="mb-3 flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={switchToCatalogue}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  registrationMode === 'catalogue'
                    ? 'bg-[#101a50] text-white'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                Select catalogue model
              </button>

              <button
                type="button"
                onClick={switchToManual}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  registrationMode === 'manual'
                    ? 'bg-[#101a50] text-white'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                Enter manually
              </button>
            </div>

            {registrationMode === 'catalogue' && (
              <div>
                <Dropdown
                  value={selectedModel?.id ?? ''}
                  onChange={(value) => {
                    const model = (modelResponse?.data ?? []).find((item) => item.id === value)
                    if (model) selectCatalogueModel(model)
                  }}
                  placeholder={isLoadingModels ? 'Loading catalogue models…' : modelsError ? 'Catalogue unavailable' : 'Select catalogue model (optional)'}
                  ariaLabel="Catalogue model"
                  searchable
                  searchPlaceholder="Search manufacturer or model"
                  disabled={isLoadingModels || modelsError === true}
                  options={(modelResponse?.data ?? []).map((item) => ({ value: item.id, label: `${item.make} ${item.model}` }))}
                />

                {selectedModel && (
                  <div className="mt-2 flex items-center gap-3 rounded-md border border-blue-100 bg-blue-50/60 px-3 py-2">
                    {selectedModel.imageUrl && (
                      <img
                        src={selectedModel.imageUrl}
                        alt=""
                        className="size-12 rounded-md object-contain"
                      />
                    )}

                    <div>
                      <p className="text-[11px] font-semibold text-blue-900">
                        Selected catalogue model
                      </p>

                      <p className="mt-0.5 text-xs font-medium text-blue-800">
                        {selectedModel.make} {selectedModel.model}
                      </p>
                    </div>
                  </div>
                )}

                <p className="mt-2 text-[11px] text-slate-500">
                  Catalogue selection is optional. Switch to manual
                  entry if the model is not available.
                </p>
              </div>
            )}

            {registrationMode === 'manual' && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className={labelClass}>
                  Manufacturer's name

                  <input
                    required
                    maxLength={120}
                    value={form.make}
                    onChange={(event) =>
                      updateForm('make', event.target.value)
                    }
                    placeholder="e.g. Dell"
                    className={inputClass}
                  />
                </label>

                <label className={labelClass}>
                  Manufacturer's model

                  <input
                    required
                    maxLength={120}
                    value={form.model}
                    onChange={(event) =>
                      updateForm('model', event.target.value)
                    }
                    placeholder="e.g. Latitude 5440"
                    className={inputClass}
                  />
                </label>
              </div>
            )}
          </section>

          <section className="rounded-lg border border-[#e9edf6] bg-white p-4">
            <h2 className="mb-3 text-sm font-bold text-[#111a38]">
              Additional information
            </h2>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className={labelClass}>
                Serial number

                <input
                  required
                  maxLength={128}
                  value={form.serialNumber}
                  onChange={(event) =>
                    updateForm('serialNumber', event.target.value)
                  }
                  placeholder="Enter serial number"
                  className={inputClass}
                />
              </label>

              <label className={labelClass}>
                Condition

                <div className="mt-1">
                  <Dropdown
                    value={form.condition}
                    onChange={(value) => updateForm('condition', value as AssetCondition)}
                    options={[
                      { value: 'NEW', label: 'New' },
                      { value: 'GOOD', label: 'Good' },
                      { value: 'FAIR', label: 'Fair' },
                      { value: 'FAULTY', label: 'Faulty' },
                    ]}
                    ariaLabel="Condition"
                  />
                </div>
              </label>

              {user?.role === 'IT Admin' && (
              <label className={labelClass}>
                Assigned to <span className="font-normal text-slate-400">(optional)</span>
                <div className="mt-1">
                  <Dropdown
                    value={form.assignedToId}
                    onChange={(value) => updateForm('assignedToId', value)}
                    placeholder={usersQuery.isLoading ? 'Loading employees...' : 'Leave unassigned'}
                    ariaLabel="Assign device to an employee"
                    disabled={usersQuery.isLoading || usersQuery.isError}
                    searchable
                    searchPlaceholder="Search people"
                    options={[
                      { value: '', label: 'Leave unassigned' },
                      ...assignableUsers.map((candidate) => ({
                        value: candidate.id,
                        label: `${candidate.fullName} · ${candidate.staffId}`,
                      })),
                    ]}
                  />
                </div>
                {usersQuery.isError && <span className="mt-1 block text-xs font-normal text-red-600">People could not be loaded.</span>}
              </label>
              )}

              <label className={labelClass}>
                Purchase date

                <DatePicker value={form.purchaseDate} onChange={(value) => updateForm('purchaseDate', value)} />
              </label>

              <label className={labelClass}>
                Warranty expiry

                <DatePicker value={form.warrantyExpiry} onChange={(value) => updateForm('warrantyExpiry', value)} />
              </label>

              <label className={`${labelClass} sm:col-span-2`}>
                Notes

                <textarea
                  rows={3}
                  maxLength={5000}
                  value={form.notes}
                  onChange={(event) =>
                    updateForm('notes', event.target.value)
                  }
                  placeholder="Additional information about this device..."
                  className={`${inputClass} resize-y`}
                />
              </label>
            </div>
          </section>
            </div>

            <section className="rounded-lg border border-[#e9edf6] bg-white p-4 lg:sticky lg:top-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-[#111a38]">3D model</h2>
                  <p className="mt-0.5 text-xs text-slate-500">Choose an existing model from the ITrack catalogue.</p>
                </div>
                <span className="rounded-full bg-[#101a50] px-2 py-1 text-[10px] font-semibold text-white">Existing models</span>
              </div>

              <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-b from-[#f8f9fd] to-[#e8edf9]">
                <div className="flex items-center justify-between px-3 pt-3">
                  <span className="rounded-full bg-[#101a50] px-2 py-1 text-[10px] font-semibold text-white">Live preview</span>
                  <DeviceViewToggle
                    value={showModelPreview ? '3D' : '2D'}
                    onChange={(view) => {
                      if (view === '2D') {
                        setShowModelPreview(false); setModelViewerStatus('idle')
                      } else {
                        setModelPreviewFailed(false); setModelViewerStatus('loading'); setShowModelPreview(true)
                      }
                    }}
                    has3D={Boolean(selectedModel?.modelUrl)}
                  />
                </div>
                <div className="relative flex h-64 items-center justify-center p-4">
                  {showModelPreview && selectedModel?.modelUrl && modelViewerStatus === 'ready' && !modelPreviewFailed ? (
                    <ModelViewer key={selectedModel.modelUrl} src={selectedModel.modelUrl} alt={`${selectedModel.make} ${selectedModel.model} 3D model`} loading="lazy" camera-controls onLoadError={() => setModelPreviewFailed(true)} className="h-full w-full bg-transparent" />
                  ) : selectedModel?.imageUrl ? (
                    <img src={selectedModel.imageUrl} alt={`${selectedModel.make} ${selectedModel.model}`} className="h-full w-full object-contain" />
                  ) : (
                    <div className="text-center text-xs text-slate-400">Select a catalogue model to preview it here.</div>
                  )}
                  {showModelPreview && modelViewerStatus === 'loading' && <span className="absolute bottom-3 rounded-full bg-white/90 px-2.5 py-1.5 text-[10px] text-slate-500 shadow-sm">Loading 3D preview…</span>}
                  {showModelPreview && (modelViewerStatus === 'error' || modelPreviewFailed) && <span className="absolute bottom-3 rounded-full bg-white/90 px-2.5 py-1.5 text-[10px] text-red-600 shadow-sm">3D preview unavailable</span>}
                </div>
              </div>

              <div className="mt-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[11px] font-semibold text-slate-600">Models already in ITrack</p>
                  <span className="text-[10px] text-slate-400">{modelResponse?.total ?? 0} available</span>
                </div>
                {isLoadingModels ? (
                  <p className="rounded-lg bg-slate-50 px-3 py-4 text-center text-xs text-slate-500">Loading catalogue models…</p>
                ) : modelsError ? (
                  <p className="rounded-lg bg-red-50 px-3 py-4 text-center text-xs text-red-600">Catalogue models could not be loaded.</p>
                ) : modelResponse?.data.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {modelResponse.data.map((model) => (
                      <button type="button" key={model.id} onClick={() => selectCatalogueModel(model)} className={`rounded-lg border px-2.5 py-2 text-left transition ${selectedModel?.id === model.id ? 'border-[#3155ff] bg-[#3155ff] text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300'}`}>
                        <span className="block max-w-32 truncate text-[11px] font-semibold">{model.make} {model.model}</span>
                        <span className={`mt-0.5 block text-[10px] ${selectedModel?.id === model.id ? 'text-blue-100' : 'text-slate-400'}`}>{model.modelUrl ? '3D model available' : 'Image only'}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-lg bg-slate-50 px-3 py-4 text-center text-xs text-slate-500">No models are available for this device type.</p>
                )}
              </div>
            </section>
          </div>

          <div className="flex justify-end gap-2 pb-3">
            <button
              type="button"
              onClick={() => navigate(basePath)}
              disabled={isSaving}
              className="rounded-md border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                isSaving ||
                isSaving || isAllocatingTag || !form.assetTag
              }
              className="rounded-md bg-[#3155ff] px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? 'Registering device...' : 'Register device'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
