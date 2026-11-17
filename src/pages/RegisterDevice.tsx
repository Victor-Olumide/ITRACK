
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ChevronLeft,
  Search,
  X,
  Check,
  ImagePlus,
} from 'lucide-react';

import {
  useCreateAssetMutation,
  useGetAvailableAssetTagsQuery,
  useGetAssetModelsQuery,
} from '../lib/api/assets/assets-api';

import type {
  AssetCondition,
  AssetModelRecord,
  AssetType,
  CreateAssetRequest,
} from '../lib/api/assets/types';

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

function modelLabel(model: AssetModelRecord) {
  return `${model.make} ${model.model}`;
}

export default function RegisterDevicePage({
  basePath = '/devices',
}: RegisterDevicePageProps) {
  const navigate = useNavigate();

  const [createAsset, { isLoading: isSaving }] =
    useCreateAssetMutation();

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
    notes: '',
  });

  const [selectedModel, setSelectedModel] =
    useState<AssetModelRecord | null>(null);

  const [modelSearch, setModelSearch] = useState('');
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [registrationMode, setRegistrationMode] =
    useState<'catalogue' | 'manual'>('catalogue');

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');

  const [saveError, setSaveError] = useState('');

  const {
    data: tagResponse,
    isLoading: isLoadingTags,
    isError: tagsError,
  } = useGetAvailableAssetTagsQuery(form.type);

  const {
    data: modelResponse,
    isLoading: isLoadingModels,
    isError: modelsError,
  } = useGetAssetModelsQuery(form.type);

  const availableTags = tagResponse?.data ?? [];
  const catalogueModels = modelResponse?.data ?? [];

  const filteredModels = useMemo(() => {
    const query = modelSearch.trim().toLowerCase();

    if (!query) return catalogueModels.slice(0, 8);

    return catalogueModels
      .filter((item) =>
        `${item.make} ${item.model}`.toLowerCase().includes(query),
      )
      .slice(0, 8);
  }, [catalogueModels, modelSearch]);

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
    setModelSearch('');
    setModelDropdownOpen(false);
    setSaveError('');
  };

  const selectCatalogueModel = (model: AssetModelRecord) => {
    setSelectedModel(model);

    setForm((current) => ({
      ...current,
      make: model.make,
      model: model.model,
    }));

    setModelSearch(modelLabel(model));
    setModelDropdownOpen(false);
    setSaveError('');
  };

  const switchToManual = () => {
    setRegistrationMode('manual');
    setSelectedModel(null);
    setModelSearch('');
    setModelDropdownOpen(false);
  };

  const switchToCatalogue = () => {
    setRegistrationMode('catalogue');
    setSelectedModel(null);
    setModelSearch('');
    setModelDropdownOpen(false);

    setForm((current) => ({
      ...current,
      make: '',
      model: '',
    }));
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
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setSaveError('');

    if (!form.assetTag) {
      setSaveError('Select an available asset tag.');
      return;
    }

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
      assetTag: form.assetTag,
      serialNumber: form.serialNumber.trim(),
      type: form.type,
      make,
      model,
      condition: form.condition,
      purchaseDate: form.purchaseDate || null,
      warrantyExpiry: form.warrantyExpiry || null,
      ...(form.type === 'OTHER' ? { customType } : {}),
      ...(form.notes.trim() ? { notes: form.notes.trim() } : {}),
      ...(selectedModel ? { modelId: selectedModel.id } : {}),
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

                <select
                  value={form.type}
                  onChange={(event) =>
                    handleTypeChange(event.target.value as AssetType)
                  }
                  className={inputClass}
                >
                  {assetTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className={labelClass}>
                Available asset tag

                <select
                  required
                  value={form.assetTag}
                  onChange={(event) =>
                    updateForm('assetTag', event.target.value)
                  }
                  disabled={isLoadingTags || availableTags.length === 0}
                  className={inputClass}
                >
                  <option value="">
                    {isLoadingTags
                      ? 'Loading available tags...'
                      : availableTags.length === 0
                        ? 'No available tags'
                        : 'Select an asset tag'}
                  </option>

                  {availableTags.map((tag) => (
                    <option key={tag.id} value={tag.tag}>
                      {tag.tag}
                    </option>
                  ))}
                </select>

                {tagsError && (
                  <span className="mt-1 block text-xs font-normal text-red-600">
                    Could not retrieve available asset tags.
                  </span>
                )}

                {!isLoadingTags &&
                  !tagsError &&
                  availableTags.length === 0 && (
                    <span className="mt-1 block text-xs font-normal text-amber-700">
                      No available tags exist for this device type.
                      Ask an IT administrator to generate asset tags.
                    </span>
                  )}
              </label>

              {form.type === 'OTHER' && (
                <label className={labelClass}>
                  Specify device type

                  <input
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
                <label className={labelClass}>
                  Search model catalogue

                  <div className="relative mt-1">
                    <Search
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      value={modelSearch}
                      onChange={(event) => {
                        setModelSearch(event.target.value);
                        setModelDropdownOpen(true);
                        setSelectedModel(null);

                        setForm((current) => ({
                          ...current,
                          make: '',
                          model: '',
                        }));
                      }}
                      onFocus={() => setModelDropdownOpen(true)}
                      placeholder="Search manufacturer or model..."
                      className="w-full rounded-md border border-slate-200 bg-white py-2 pl-9 pr-9 text-sm font-normal text-slate-800 outline-none focus:border-[#3155ff] focus:ring-2 focus:ring-blue-100"
                    />

                    {modelSearch && (
                      <button
                        type="button"
                        onClick={() => {
                          setModelSearch('');
                          setSelectedModel(null);
                          setModelDropdownOpen(false);

                          setForm((current) => ({
                            ...current,
                            make: '',
                            model: '',
                          }));
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                        aria-label="Clear model search"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </label>

                {modelDropdownOpen && (
                  <div className="mt-1 max-h-64 overflow-y-auto rounded-md border border-slate-200 bg-white p-1 shadow-lg">
                    {isLoadingModels && (
                      <p className="px-3 py-2.5 text-xs text-slate-500">
                        Loading catalogue models...
                      </p>
                    )}

                    {modelsError && (
                      <p className="px-3 py-2.5 text-xs text-red-600">
                        Could not retrieve catalogue models. You can
                        still register manually.
                      </p>
                    )}

                    {!isLoadingModels &&
                      !modelsError &&
                      filteredModels.length === 0 && (
                        <p className="px-3 py-2.5 text-xs text-slate-500">
                          No matching catalogue model found.
                          You can enter the details manually.
                        </p>
                      )}

                    {filteredModels.map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => selectCatalogueModel(item)}
                        className="flex w-full items-center gap-3 rounded px-3 py-2 text-left text-sm transition hover:bg-blue-50"
                      >
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt=""
                            className="size-10 rounded-md border border-slate-100 object-contain"
                          />
                        ) : (
                          <div className="flex size-10 items-center justify-center rounded-md bg-slate-100">
                            <ImagePlus size={16} className="text-slate-400" />
                          </div>
                        )}

                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold text-slate-800">
                            {item.make} {item.model}
                          </span>

                          <span className="mt-0.5 block text-[11px] text-slate-500">
                            {item.type}
                          </span>
                        </span>

                        {selectedModel?.id === item.id && (
                          <Check size={15} className="text-[#3155ff]" />
                        )}
                      </button>
                    ))}
                  </div>
                )}

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
              Device image
            </h2>

            <p className="mb-3 text-xs text-slate-500">
              Upload an image of this particular device. If you do
              not upload one, the catalogue image will be used when
              available.
            </p>

            {imagePreview ? (
              <div className="relative w-fit">
                <img
                  src={imagePreview}
                  alt="Device preview"
                  className="h-36 w-48 rounded-lg border border-slate-200 bg-slate-50 object-contain"
                />

                <button
                  type="button"
                  onClick={clearImage}
                  aria-label="Remove selected image"
                  className="absolute -right-2 -top-2 rounded-full bg-red-600 p-1.5 text-white shadow"
                >
                  <X size={13} />
                </button>
              </div>
            ) : (
              <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center transition hover:border-blue-400 hover:bg-blue-50/40">
                <ImagePlus size={24} className="mb-2 text-slate-400" />

                <span className="text-xs font-semibold text-slate-700">
                  Choose device image
                </span>

                <span className="mt-1 text-[11px] text-slate-500">
                  JPEG, PNG or WebP. Maximum 10 MB.
                </span>

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(event) =>
                    handleImageChange(event.target.files?.[0])
                  }
                />
              </label>
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

                <select
                  value={form.condition}
                  onChange={(event) =>
                    updateForm(
                      'condition',
                      event.target.value as AssetCondition,
                    )
                  }
                  className={inputClass}
                >
                  <option value="NEW">New</option>
                  <option value="GOOD">Good</option>
                  <option value="FAIR">Fair</option>
                  <option value="FAULTY">Faulty</option>
                </select>
              </label>

              <label className={labelClass}>
                Purchase date

                <input
                  type="date"
                  value={form.purchaseDate}
                  onChange={(event) =>
                    updateForm('purchaseDate', event.target.value)
                  }
                  className={inputClass}
                />
              </label>

              <label className={labelClass}>
                Warranty expiry

                <input
                  type="date"
                  value={form.warrantyExpiry}
                  onChange={(event) =>
                    updateForm('warrantyExpiry', event.target.value)
                  }
                  className={inputClass}
                />
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
                isLoadingTags ||
                availableTags.length === 0
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
