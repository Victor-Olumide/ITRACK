
import { useEffect, useRef, useState, type MouseEvent } from 'react';
import {
  Plus,
  Search,
  Grid2X2,
  List,
  Monitor,
  Laptop,
  Printer,
  Box,
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
import { categoryDeviceImage } from '@/utils/device-images';
import { localDeviceModelUrl } from '@/utils/device-models';
import Dropdown from '@/components/Dropdown';
import DeviceViewToggle from '@/components/DeviceViewToggle';

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
  has3D: boolean;
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
    modelUrl: asset.modelUrl ?? localDeviceModelUrl(asset.type, asset.customType, asset.make, asset.model),
    has3D: Boolean(asset.modelUrl ?? localDeviceModelUrl(asset.type, asset.customType, asset.make, asset.model)),
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
  showModel,
  onViewChange,
}: {
  device: DeviceCardData;
  showModel: boolean;
  onViewChange: (view: '2D' | '3D') => void;
}) {
  const [imageFailed, setImageFailed] = useState(false);
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
    if (!showModel || !device.modelUrl || modelViewerStatus === 'ready') return;
    import('@google/model-viewer').then(
      () => setModelViewerStatus('ready'),
      () => setModelViewerStatus('error'),
    );
  }, [device.modelUrl, modelViewerStatus, showModel]);

  const canShowModel = Boolean(showModel && device.modelUrl && modelViewerStatus === 'ready');

  return (
    <div className="device-image relative flex h-[174px] items-center justify-center overflow-hidden bg-linear-to-b from-[#f1f4fc] to-[#e8edf9]">
      {showModel ? (
        // Clicks here rotate/pan the model; they must not open the device.
        <div className="absolute inset-0 flex items-center justify-center bg-white" onClick={(event) => event.stopPropagation()}>
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
              onError={() => setModelViewerStatus('error')}
              className="h-full w-full bg-white"
            />
          )}
        </div>
      ) : hasImage ? (
        <img
          src={device.imageUrl!}
          alt={`${device.name} device`}
          loading="lazy"
          onError={() => setImageFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400">
          <Icon size={60} strokeWidth={1} />
          <span className="text-xs">{device.category}</span>
        </div>
      )}

      {showModel && modelViewerStatus !== 'ready' && <span className="absolute bottom-3 right-3 z-20 rounded-full bg-white/90 px-2 py-1 text-[10px] text-slate-500 shadow-sm">Loading 3D preview...</span>}

      {showModel && modelViewerStatus === 'ready' && <button type="button" onClick={(event) => { event.stopPropagation(); onViewChange('2D'); setModelViewerStatus('idle') }} className="absolute bottom-3 right-3 z-20 rounded-full bg-white/95 px-2.5 py-1.5 text-[10px] font-semibold text-[#3155ff] shadow-sm">Back to image</button>}
      {showModel && modelViewerStatus === 'error' && <button type="button" onClick={(event) => { event.stopPropagation(); onViewChange('2D'); setModelViewerStatus('idle') }} className="absolute bottom-3 right-3 z-20 rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold text-slate-600 shadow-sm">Back to image</button>}

      <span
        className={`absolute left-3 top-3 z-20 rounded-full px-2.5 py-1 text-[10px] font-semibold ${conditionStyles[device.condition]}`}
      >
        {device.condition}
      </span>
    </div>
  );
}

// A pointer that travels further than this between press and release was a
// drag (e.g. rotating a 3D model), not a click.
const DRAG_THRESHOLD_PX = 6;

function DeviceCard({
  device,
  onClick,
  initialView = '2D',
}: {
  device: DeviceCardData;
  onClick: (device: DeviceCardData) => void;
  initialView?: '2D' | '3D';
}) {
  const [showModel, setShowModel] = useState(initialView === '3D' && device.has3D);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    const start = pointerStart.current;
    pointerStart.current = null;
    // Ctrl/Shift/Alt/Cmd-clicks are 3D pan gestures or selections, not "open".
    if (event.ctrlKey || event.shiftKey || event.altKey || event.metaKey) return;
    if (start && Math.hypot(event.clientX - start.x, event.clientY - start.y) > DRAG_THRESHOLD_PX) return;
    onClick(device);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onPointerDown={(event) => {
        pointerStart.current = { x: event.clientX, y: event.clientY };
      }}
      onClick={handleClick}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick(device);
        }
      }}
      className="group min-w-0 overflow-hidden rounded-xl border border-slate-100 bg-white text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3155ff]"
    >
      <DeviceImage
        key={device.tag}
        device={device}
        showModel={showModel}
        onViewChange={(view) => setShowModel(view === '3D')}
      />

      <div className="p-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="min-w-0 flex-1 text-[13px] font-semibold leading-5 text-[#111a38]">
            {device.name}
          </h3>

          <div className="flex shrink-0 items-center gap-1.5">
            {device.has3D && (
              <span onClick={(event) => event.stopPropagation()}>
                <DeviceViewToggle
                  value={showModel ? '3D' : '2D'}
                  onChange={(view) => setShowModel(view === '3D')}
                  has3D
                />
              </span>
            )}

            <span className="rounded-md bg-lime-300 px-2 py-1 font-mono text-[9px] font-bold text-slate-900">
              {device.tag}
            </span>
          </div>
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
    </div>
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
  const [allIn3D, setAllIn3D] = useState(false);
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
  const devicesWith3D = devices.filter((device) => device.has3D).length;


  return (
    <div className="min-h-full bg-[#f3f5fc] p-4 sm:p-5 lg:p-6">
      <section className="mb-5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#101a3b]">
              Devices
            </h1>

            <p className="mt-1 text-xs text-slate-500">
              Live asset records.
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

            {view === 'Grid' && (
              <button
                type="button"
                onClick={() => setAllIn3D((value) => !value)}
                aria-pressed={allIn3D}
                disabled={devicesWith3D === 0}
                title={devicesWith3D === 0 ? 'No device on this page has a 3D model' : allIn3D ? 'Show photos on every card' : `Show ${devicesWith3D} device${devicesWith3D === 1 ? '' : 's'} in 3D`}
                className={`inline-flex h-7 items-center gap-1 rounded-lg border px-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                  allIn3D
                    ? 'border-[#101a50] bg-[#101a50] text-white shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Box size={14} />
                {allIn3D ? 'Show photos' : 'Show all in 3D'}
              </button>
            )}

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

          <Dropdown
            value={type}
            onChange={(value) => {
              setType(value as AssetType | '');
              setPage(1);
            }}
            placeholder="All types"
            ariaLabel="Filter by type"
            options={[{ value: 'LAPTOP', label: 'Laptop' }, { value: 'DESKTOP', label: 'Desktop' }, { value: 'PRINTER', label: 'Printer' }, { value: 'NETWORK', label: 'Network' }, { value: 'OTHER', label: 'Other' }]}
          />
        </label>

        <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
          Condition

          <Dropdown
            value={condition}
            onChange={(value) => {
              setCondition(value as AssetCondition | '');
              setPage(1);
            }}
            placeholder="All conditions"
            ariaLabel="Filter by condition"
            options={[{ value: 'NEW', label: 'New' }, { value: 'GOOD', label: 'Good' }, { value: 'FAIR', label: 'Fair' }, { value: 'FAULTY', label: 'Faulty' }, { value: 'RETIRED', label: 'Retired' }]}
          />
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
                // Re-keyed so every card adopts the page-wide view when it changes;
                // each card's own 2D/3D switch still works afterwards.
                key={`${device.id}-${allIn3D ? '3D' : '2D'}`}
                device={device}
                initialView={allIn3D ? '3D' : '2D'}
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
