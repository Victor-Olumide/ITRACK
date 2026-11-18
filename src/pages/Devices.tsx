
import { useEffect, useState } from 'react';
import {
  Plus,
  Search,
  Grid2X2,
  List,
  Monitor,
  Laptop,
  Printer,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router';
import type { LucideIcon } from 'lucide-react';

import { useGetAssetsQuery } from '@/lib/api/assets/assets-api';

import type {
  AssetApiRecord,
  AssetCondition,
  AssetListArgs,
  AssetType,
} from '@/lib/api/assets/types';
import { categoryDeviceImage } from '@/lib/device-images';

type AssetListStatus = 'Assigned' | 'Unassigned' | 'Retired';

interface DeviceCardData {
  id: string;
  name: string;
  tag: string;
  category: string;
  condition: AssetCondition;
  assignedTo: string;
  initials: string;
  notes: string;
  warranty: string;
  imageUrl: string;
  modelUrl: string | null;
}

const initials = (name = '') =>
  name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

function formatWarranty(warrantyEnds: string) {
  const end = new Date(warrantyEnds);

  if (Number.isNaN(end.getTime())) return '—';

  const diffDays = Math.round(
    (end.getTime() - Date.now()) / 86400000,
  );

  if (diffDays < 0) return 'Expired';

  if (diffDays <= 30) {
    return `Ends ${end.getDate()} ${end.toLocaleDateString('en-GB', {
      month: 'short',
    })}`;
  }

  return end.toLocaleDateString('en-GB', {
    month: 'short',
    year: 'numeric',
  });
}

function toCard(asset: AssetApiRecord): DeviceCardData {
  const categoryByType: Record<AssetType, string> = {
    LAPTOP: 'Laptops',
    DESKTOP: 'Desktops',
    PRINTER: 'Printers',
    NETWORK: 'Network',
    OTHER: asset.customType || 'Other',
  };

  const owner = asset.assignedTo;

  return {
    id: asset.id,
    name: `${asset.make} ${asset.model}`,
    tag: asset.assetTag,
    category: categoryByType[asset.type],
    condition: asset.condition,
    assignedTo: owner?.fullName ?? 'Not assigned',
    initials: owner ? initials(owner.fullName) : '—',
    notes: asset.notes ?? 'No notes recorded',
    warranty: asset.warrantyExpiry
      ? formatWarranty(asset.warrantyExpiry)
      : '—',
    imageUrl: asset.imageUrl ?? categoryDeviceImage(asset.type, asset.customType, asset.make),
    modelUrl: asset.modelUrl ?? null,
  };
}

const conditionStyles: Record<AssetCondition, string> = {
  NEW: 'bg-blue-100 text-blue-800',
  GOOD: 'bg-emerald-100 text-emerald-800',
  FAIR: 'bg-amber-100 text-amber-800',
  FAULTY: 'bg-red-100 text-red-800',
  RETIRED: 'bg-slate-200 text-slate-600',
};

const tabs: Array<'All' | AssetListStatus> = [
  'All',
  'Assigned',
  'Unassigned',
  'Retired',
];

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function DeviceImage({
  device,
}: {
  device: DeviceCardData;
}) {
  const [modelFailed, setModelFailed] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [showModel, setShowModel] = useState(false);
  const [modelViewerStatus, setModelViewerStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');

  const Icon =
    ({
      Laptops: Laptop,
      Desktops: Monitor,
      Printers: Printer,
      Network: Monitor,
    } as Record<string, LucideIcon>)[device.category] ?? Monitor;

  const hasImage = Boolean(device.imageUrl && !imageFailed);
  useEffect(() => {
    if (!showModel || !device.modelUrl || modelViewerStatus !== 'loading') return;
    import('@google/model-viewer').then(
      () => setModelViewerStatus('ready'),
      () => setModelViewerStatus('error'),
    );
  }, [device.modelUrl, modelViewerStatus, showModel]);

  const canShowModel = Boolean(showModel && device.modelUrl && !modelFailed && modelViewerStatus === 'ready');

  return (
    <div className="device-image relative flex h-43.5 items-center justify-center overflow-hidden bg-linear-to-b from-[#f1f4fc] to-[#e8edf9]">
      {hasImage ? (
        <img
          src={device.imageUrl!}
          alt={`${device.name} device`}
          loading="lazy"
          onError={() => setImageFailed(true)}
          className="absolute inset-0 h-full w-full object-contain"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400">
          <Icon size={60} strokeWidth={1} />
          <span className="text-xs">{device.category}</span>
        </div>
      )}

      {canShowModel && (
        <model-viewer
          key={device.modelUrl}
          src={device.modelUrl!}
          alt={`${device.name} 3D model`}
          loading="lazy"
          camera-controls
          auto-rotate
          rotation-per-second="20deg"
          shadow-intensity="1"
          onError={() => setModelFailed(true)}
          className="relative z-10 h-full w-full bg-transparent"
        />
      )}

      {device.modelUrl && <div className="absolute bottom-3 right-3 z-20 flex overflow-hidden rounded-full border border-white/70 bg-white/90 text-[10px] font-bold shadow-[0_4px_14px_rgba(16,28,82,.14)] backdrop-blur-sm">
        <button type="button" onClick={(event) => { event.stopPropagation(); setShowModel(false); setModelFailed(false); setModelViewerStatus('idle') }} className={`px-3 py-1.5 ${!showModel ? 'bg-[#d2f54a] text-[#344500]' : 'text-slate-500 hover:bg-slate-50'}`}>2D</button>
        <button type="button" onClick={(event) => { event.stopPropagation(); if (!showModel) { setModelViewerStatus('loading'); setShowModel(true) } }} className={`px-3 py-1.5 ${showModel ? 'bg-[#d2f54a] text-[#344500]' : 'text-slate-500 hover:bg-slate-50'}`}>3D</button>
      </div>}

      {showModel && modelViewerStatus === 'loading' && <span className="absolute bottom-3 right-3 z-20 rounded-full bg-white/90 px-2 py-1 text-[10px] text-slate-500 shadow-sm">Loading 3D preview...</span>}

      {showModel && modelViewerStatus === 'ready' && <button type="button" onClick={(event) => { event.stopPropagation(); setShowModel(false); setModelFailed(false); setModelViewerStatus('idle') }} className="absolute bottom-3 right-3 z-20 rounded-full bg-white/95 px-2.5 py-1.5 text-[10px] font-semibold text-[#3155ff] shadow-sm">Back to image</button>}
      {showModel && (modelFailed || modelViewerStatus === 'error') && <button type="button" onClick={(event) => { event.stopPropagation(); setShowModel(false); setModelFailed(false); setModelViewerStatus('idle') }} className="absolute bottom-3 right-3 z-20 rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold text-slate-600 shadow-sm">Back to image</button>}

      <span
        className={`absolute left-3 top-3 z-20 rounded-full px-2.5 py-1 text-[10px] font-semibold ${conditionStyles[device.condition]}`}
      >
        {device.condition}
      </span>
    </div>
  );
}

function DeviceCard({
  device,
  onClick,
}: {
  device: DeviceCardData;
  onClick: (device: DeviceCardData) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(device)}
      className="group min-w-0 overflow-hidden rounded-xl border border-slate-100 bg-white text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3155ff]"
    >
      <DeviceImage
        key={device.tag}
        device={device}
      />

      <div className="p-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="min-w-0 flex-1 text-[13px] font-semibold leading-5 text-[#111a38]">
            {device.name}
          </h3>

          <span className="shrink-0 rounded-md bg-lime-300 px-2 py-1 font-mono text-[9px] font-bold text-slate-900">
            {device.tag}
          </span>
        </div>

        <p className="mt-0.5 text-[11px] text-slate-500">
          {device.category}
        </p>

        <div className="mt-3 flex min-w-0 items-center gap-2">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#edf1fa] text-[9px] font-bold text-slate-600">
            {device.initials}
          </span>

          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-[#111a38]">
              {device.assignedTo}
            </p>

            <p className="truncate text-[11px] text-slate-500">
              {device.notes}
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px]">
          <span className="text-slate-500">Warranty</span>

          <span
            className={`font-semibold ${
              device.warranty.startsWith('Ends')
                ? 'text-orange-700'
                : 'text-slate-800'
            }`}
          >
            {device.warranty}
          </span>
        </div>
      </div>
    </button>
  );
}

export default function DevicesPage({
  basePath = '/devices',
}: {
  basePath?: string;
}) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const requestedStatus = searchParams.get('status');

  const activeTab =
    tabs.find((status) => status === requestedStatus) ?? 'All';

  const [view, setView] = useState<'Grid' | 'List'>('Grid');
  const [search, setSearch] = useState('');
  const [type, setType] = useState<AssetType | ''>('');
  const [condition, setCondition] = useState<AssetCondition | ''>('');
  const [assigneeId, setAssigneeId] = useState('');
  const [warrantyExpiring, setWarrantyExpiring] = useState(false);
  const [page, setPage] = useState(1);


  const pageSize = 20;

  const isAssigneeIdValid =
    !assigneeId.trim() || uuidPattern.test(assigneeId.trim());

  const args: AssetListArgs = {
    page,
    pageSize,
    ...(search.trim() ? { q: search.trim() } : {}),
    ...(type ? { type } : {}),
    ...(condition && activeTab !== 'Retired' ? { condition } : {}),
    ...(activeTab === 'Retired'
      ? { condition: 'RETIRED' as const, includeRetired: true }
      : {}),
    ...(activeTab === 'Assigned'
      ? { assignedToId: 'assigned' as const }
      : {}),
    ...(activeTab === 'Unassigned'
      ? { assignedToId: 'unassigned' as const }
      : {}),
    ...(assigneeId.trim()
      ? { assignedToId: assigneeId.trim() }
      : {}),
    ...(warrantyExpiring
      ? { warrantyExpiringWithinDays: 30 }
      : {}),
  };

  const {
    data: assets,
    isLoading,
    isError,
  } = useGetAssetsQuery(args, {
    skip: !isAssigneeIdValid,
  });

  const devices = (assets?.data ?? []).map(toCard);
  const total = assets?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));


  return (
    <div className="min-h-full bg-[#f3f5fc] p-4 sm:p-5 lg:p-6">
      <section className="mb-5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#101a3b]">
              Devices
            </h1>

            <p className="mt-1 text-xs text-slate-500">
              Live asset records filtered and paginated by the server.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div
              className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5"
              aria-label="Device view"
            >
              <button
                type="button"
                onClick={() => setView('Grid')}
                aria-pressed={view === 'Grid'}
                className={`inline-flex h-6 items-center gap-1 rounded-md px-2 text-xs font-semibold transition ${
                  view === 'Grid'
                    ? 'bg-[#101a50] text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Grid2X2 size={14} />
                Grid
              </button>

              <button
                type="button"
                onClick={() => setView('List')}
                aria-pressed={view === 'List'}
                className={`inline-flex h-6 items-center gap-1.5 rounded-md px-2 text-xs font-semibold transition ${
                  view === 'List'
                    ? 'bg-[#101a50] text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <List size={14} />
                List
              </button>
            </div>

            <button
              type="button"
              onClick={() => navigate(`${basePath}/register`)}
              className="inline-flex h-6 items-center gap-1 rounded-lg bg-[#3155ff] px-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <Plus size={16} />
              Register device
            </button>
          </div>
        </div>
      </section>

      <section className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-wrap gap-1.5">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                const nextParams = new URLSearchParams(searchParams);

                if (tab === 'All') {
                  nextParams.delete('status');
                } else {
                  nextParams.set('status', tab);
                }

                navigate(
                  nextParams.size
                    ? `${window.location.pathname}?${nextParams.toString()}`
                    : window.location.pathname,
                  { replace: true },
                );

                setPage(1);
              }}
              aria-pressed={activeTab === tab}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                activeTab === tab
                  ? 'border-[#101a50] bg-[#101a50] text-white'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:text-[#3155ff]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-60">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search devices..."
            aria-label="Search devices"
            className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </section>

      <section
        aria-label="Asset filters"
        className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2.5 rounded-xl border border-slate-200/80 bg-white p-3"
      >
        <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
          Type

          <select
            value={type}
            onChange={(event) => {
              setType(event.target.value as AssetType | '');
              setPage(1);
            }}
            className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-blue-400"
          >
            <option value="">All types</option>
            <option value="LAPTOP">Laptop</option>
            <option value="DESKTOP">Desktop</option>
            <option value="PRINTER">Printer</option>
            <option value="NETWORK">Network</option>
            <option value="OTHER">Other</option>
          </select>
        </label>

        <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
          Condition

          <select
            value={condition}
            onChange={(event) => {
              setCondition(event.target.value as AssetCondition | '');
              setPage(1);
            }}
            className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-blue-400"
          >
            <option value="">All conditions</option>
            <option value="NEW">New</option>
            <option value="GOOD">Good</option>
            <option value="FAIR">Fair</option>
            <option value="FAULTY">Faulty</option>
            <option value="RETIRED">Retired</option>
          </select>
        </label>

        <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
          Assignee ID

          <input
            value={assigneeId}
            onChange={(event) => {
              setAssigneeId(event.target.value);
              setPage(1);
            }}
            placeholder="Filter by user ID"
            className="h-8 w-40 rounded-md border border-slate-200 bg-white px-2 text-xs outline-none focus:border-blue-400"
          />
        </label>

        <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
          <input
            type="checkbox"
            checked={warrantyExpiring}
            onChange={(event) => {
              setWarrantyExpiring(event.target.checked);
              setPage(1);
            }}
            className="size-3.5 rounded border-slate-300 accent-[#3155ff]"
          />
          Warranty expires within 30 days
        </label>

        <span className="ml-auto text-xs font-medium tabular-nums text-slate-500">
          {total} assets
        </span>
      </section>

      {!isAssigneeIdValid && (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900"
        >
          Enter a valid user ID to filter by assignee.
        </p>
      )}

      {isLoading && (
        <div className="rounded-xl border border-slate-100 bg-white p-10 text-center text-sm text-slate-500">
          Loading devices...
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-red-100 bg-white p-10 text-center text-sm text-red-700">
          Unable to load devices from the server.
        </div>
      )}

      {!isLoading &&
        !isError &&
        (view === 'Grid' ? (
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {devices.map((device) => (
              <DeviceCard
                key={device.id}
                device={device}
                onClick={(selected) =>
                  navigate(`${basePath}/${selected.tag}`, {
                    state: { device: selected },
                  })
                }
              />
            ))}
          </section>
        ) : (
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    {[
                      'Device',
                      'Asset tag',
                      'Condition',
                      'Assigned to',
                      'Notes',
                      'Warranty',
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="px-4 py-3 text-xs font-semibold"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {devices.map((device) => (
                    <tr
                      key={device.id}
                      onClick={() =>
                        navigate(`${basePath}/${device.tag}`, {
                          state: { device },
                        })
                      }
                      onKeyDown={(event) => {
                        if (
                          event.key === 'Enter' ||
                          event.key === ' '
                        ) {
                          event.preventDefault();

                          navigate(`${basePath}/${device.tag}`, {
                            state: { device },
                          });
                        }
                      }}
                      tabIndex={0}
                      role="link"
                      aria-label={`View ${device.name}`}
                      className="cursor-pointer border-t border-slate-100 outline-none transition hover:bg-blue-50/50 focus-visible:bg-blue-50"
                    >
                      <td className="px-4 py-3 font-semibold text-[#111a38]">
                        <div className="flex items-center gap-3">
                          {device.imageUrl && (
                            <img
                              src={device.imageUrl}
                              alt=""
                              className="size-10 rounded-md object-contain"
                            />
                          )}
                          {device.name}
                        </div>
                      </td>

                      <td className="px-4 py-3 font-mono text-xs text-slate-600">
                        {device.tag}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${conditionStyles[device.condition]}`}
                        >
                          {device.condition}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-xs text-slate-700">
                        {device.assignedTo}
                      </td>

                      <td className="max-w-56 truncate px-4 py-3 text-xs text-slate-500">
                        {device.notes}
                      </td>

                      <td className="px-4 py-3 text-xs text-slate-700">
                        {device.warranty}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}

      {!isLoading &&
        !isError &&
        isAssigneeIdValid &&
        devices.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
            <Monitor
              className="mx-auto mb-3 text-slate-300"
              size={36}
            />

            <p className="text-sm font-semibold text-slate-700">
              No devices found
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Try changing your filters or search term.
            </p>
          </div>
        )}

      {!isLoading &&
        !isError &&
        isAssigneeIdValid &&
        total > 0 && (
          <nav
            aria-label="Asset pages"
            className="mt-5 flex items-center justify-center gap-3"
          >
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((current) => current - 1)}
              className="h-8 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>

            <span className="text-xs tabular-nums text-slate-600">
              Page {page} of {totalPages}
            </span>

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((current) => current + 1)}
              className="h-8 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </nav>
        )}
    </div>
  );
}
