// Grid and list views of server-backed assets.

import { useState } from "react";
import {
  Plus, Search, Grid2X2, List, Monitor, Laptop,
  Printer
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";
import type { LucideIcon } from "lucide-react";
import { useGetAssetsQuery } from '@/lib/api/assets/assets-api';
import type { AssetApiRecord, AssetCondition, AssetListArgs, AssetType } from '@/lib/api/assets/types';

type AssetListStatus = 'Assigned' | 'Unassigned' | 'Retired'

const initials = (name = "") =>
  name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

// Format an ISO warranty date into the short strings the cards expect.
interface DeviceCardData {
  id: string
  name: string
  tag: string
  category: string
  condition: AssetCondition
  assignedTo: string
  initials: string
  notes: string
  warranty: string
}

function formatWarranty(warrantyEnds: string) {
  const end = new Date(warrantyEnds);
  if (Number.isNaN(end.getTime())) return "—";
  const diffDays = Math.round((end.getTime() - Date.now()) / 86400000);
  if (diffDays < 0) return "Expired";
  if (diffDays <= 30) {
    return `Ends ${end.getDate()} ${end.toLocaleDateString("en-GB", { month: "short" })}`;
  }
  return end.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

function toCard(d: AssetApiRecord): DeviceCardData {
  const categoryByType: Record<AssetApiRecord['type'], string> = {
    LAPTOP: 'Laptops', DESKTOP: 'Desktops', PRINTER: 'Printers', NETWORK: 'Network', OTHER: 'Other',
  };
  const owner = d.assignedTo;
  return {
    id: d.id,
    name: `${d.make} ${d.model}`,
    tag: d.assetTag,
    category: categoryByType[d.type],
    condition: d.condition,
    assignedTo: owner?.fullName ?? "Not assigned",
    initials: owner ? initials(owner.fullName) : "—",
    notes: d.notes ?? 'No notes recorded',
    warranty: d.warrantyExpiry ? formatWarranty(d.warrantyExpiry) : '—',
  };
}

const conditionStyles: Record<AssetCondition, string> = {
  NEW: "bg-blue-100 text-blue-800",
  GOOD: "bg-emerald-100 text-emerald-800",
  FAIR: "bg-amber-100 text-amber-800",
  FAULTY: "bg-red-100 text-red-800",
  RETIRED: "bg-slate-200 text-slate-600"
};

const tabs: Array<'All' | AssetListStatus> = ["All", "Assigned", "Unassigned", "Retired"];
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function DeviceImage({ device }: { device: DeviceCardData }) {
  const Icon = ({
    Laptops: Laptop,
    Desktops: Monitor,
    Printers: Printer,
    Network: Monitor,
    Other: Monitor,
  } as Record<string, LucideIcon>)[device.category] || Monitor;

  return (
    <div className="device-image relative flex h-[174px] items-center justify-center overflow-hidden bg-gradient-to-b from-[#f1f4fc] to-[#e8edf9]">
      <div className="flex flex-col items-center gap-2 text-slate-400">
        <Icon size={65} strokeWidth={1} />
        <span className="text-xs">{device.category}</span>
      </div>

      <span className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-bold ${conditionStyles[device.condition]}`}>
        {device.condition}
      </span>

    </div>
  );
}

function DeviceCard({ device, onClick }: { device: DeviceCardData; onClick: (device: DeviceCardData) => void }) {
  return (
    <button
      onClick={() => onClick(device)}
      className="group min-w-0 overflow-hidden rounded-[22px] border border-transparent bg-white text-left transition-all duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
    >
      <DeviceImage key={device.tag} device={device} />

      <div className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="min-w-0 flex-1 text-[15px] font-bold leading-5 text-[#111a38]">
            {device.name}
          </h3>

          <span className="shrink-0 rounded-md bg-lime-300 px-2 py-1 font-mono text-[10px] font-bold text-slate-900">
            {device.tag}
          </span>
        </div>

        <p className="mt-1 text-xs text-slate-500">
          {device.category}
        </p>

        <div className="mt-3 flex min-w-0 items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#edf1fa] text-[10px] font-bold text-slate-600">
            {device.initials}
          </span>

          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#111a38]">
              {device.assignedTo}
            </p>
            <p className="truncate text-xs text-slate-500">
              {device.notes}
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
          <span className="text-slate-500">Warranty</span>
          <span className={`font-bold ${device.warranty.startsWith("Ends") ? "text-orange-700" : "text-slate-800"}`}>
            {device.warranty}
          </span>
        </div>
      </div>
    </button>
  );
}

export default function DevicesPage({ basePath = "/devices" }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedStatus = searchParams.get("status");
  const [activeTab, setActiveTab] = useState(
    tabs.find((status) => status === requestedStatus) ?? "All"
  );
  const [view, setView] = useState<"Grid" | "List">("Grid");
  const [search, setSearch] = useState("");
  const [type, setType] = useState<AssetType | "">("");
  const [condition, setCondition] = useState<AssetCondition | "">("");
  const [assigneeId, setAssigneeId] = useState("");
  const [warrantyExpiring, setWarrantyExpiring] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const isAssigneeIdValid = !assigneeId.trim() || uuidPattern.test(assigneeId.trim());
  const args: AssetListArgs = {
    page,
    pageSize,
    ...(search.trim() ? { q: search.trim() } : {}),
    ...(type ? { type } : {}),
    ...(condition && activeTab !== "Retired" ? { condition } : {}),
    ...(activeTab === "Retired" ? { condition: "RETIRED" as const, includeRetired: true } : {}),
    ...(activeTab === "Assigned" ? { assignedToId: "assigned" as const } : {}),
    ...(activeTab === "Unassigned" ? { assignedToId: "unassigned" as const } : {}),
    ...(assigneeId.trim() ? { assignedToId: assigneeId.trim() } : {}),
    ...(warrantyExpiring ? { warrantyExpiringWithinDays: 30 } : {}),
  };
  const { data: assets, isLoading, isError } = useGetAssetsQuery(args, { skip: !isAssigneeIdValid });
  const devices = (assets?.data ?? []).map(toCard);
  const total = assets?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <main className="min-h-screen bg-[#0c194d]">
      <div className="mx-auto min-h-[calc(100vh-40px)] max-w-[1800px] rounded-[28px] bg-[#f4f6fc] p-5 sm:p-7 lg:p-8">

        {/* PAGE HEADER */}
        <section className="mb-5 mt-6">
          <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[#101a3b]">
                Devices
              </h1>
              <p className="mt-1 text-sm text-slate-500">Live asset records filtered and paginated by the server.</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex rounded-full bg-white p-1">
                <button
                  onClick={() => setView("Grid")}
                  className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold ${
                    view === "Grid" ? "bg-[#101a50] text-white" : "text-slate-600"
                  }`}
                >
                  <Grid2X2 size={15} /> Grid
                </button>
                <button
                  onClick={() => setView("List")}
                  className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold ${
                    view === "List" ? "bg-[#101a50] text-white" : "text-slate-600"
                  }`}
                >
                  <List size={15} /> List
                </button>
              </div>

              <button
                onClick={() => navigate(`${basePath}/register`)}
                className="flex items-center gap-2 rounded-full bg-[#3155ff] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
              >
                <Plus size={19} /> Register device
              </button>
            </div>
          </div>
        </section>

        {/* FILTERS AND SEARCH */}
        <section className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {tabs.map(tab => {
              return (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setPage(1); }}
                  className={`rounded-full border px-4 py-2.5 text-sm font-semibold transition ${
                    activeTab === tab
                      ? "border-[#101a50] bg-[#101a50] text-white"
                      : "border-slate-200 bg-white text-slate-800 hover:border-blue-400"
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-64">
            <Search size={17} className="absolute left-3 top-3 text-slate-400" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search devices..."
              className="w-full rounded-full border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-400"
            />
          </div>
        </section>

        <section aria-label="Asset filters" className="mb-5 flex flex-wrap items-center gap-3">
          <label className="text-xs font-medium text-slate-600">
            Type
            <select value={type} onChange={(event) => { setType(event.target.value as AssetType | ""); setPage(1); }} className="ml-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
              <option value="">All types</option>
              <option value="LAPTOP">Laptop</option>
              <option value="DESKTOP">Desktop</option>
              <option value="PRINTER">Printer</option>
              <option value="NETWORK">Network</option>
              <option value="OTHER">Other</option>
            </select>
          </label>
          <label className="text-xs font-medium text-slate-600">
            Condition
            <select value={condition} onChange={(event) => { setCondition(event.target.value as AssetCondition | ""); setPage(1); }} className="ml-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
              <option value="">All conditions</option>
              <option value="NEW">New</option>
              <option value="GOOD">Good</option>
              <option value="FAIR">Fair</option>
              <option value="FAULTY">Faulty</option>
              <option value="RETIRED">Retired</option>
            </select>
          </label>
          <label className="text-xs font-medium text-slate-600">
            Assignee ID
            <input value={assigneeId} onChange={(event) => { setAssigneeId(event.target.value); setPage(1); }} placeholder="Filter by user ID" className="ml-2 w-44 rounded-lg border border-slate-200 bg-white px-3 py-2" />
          </label>
          <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <input type="checkbox" checked={warrantyExpiring} onChange={(event) => { setWarrantyExpiring(event.target.checked); setPage(1); }} />
            Warranty expires within 30 days
          </label>
          <span className="ml-auto text-xs text-slate-500">{total} assets</span>
        </section>
        {!isAssigneeIdValid && <p role="alert" className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Enter a valid user ID to filter by assignee.</p>}

        {isLoading && <div className="rounded-2xl bg-white p-12 text-center text-sm text-slate-500">Loading devices…</div>}
        {isError && <div className="rounded-2xl bg-white p-12 text-center text-sm text-red-700">Unable to load devices from the server.</div>}

        {/* DEVICE CARDS */}
        {!isLoading && !isError && (view === "Grid" ? (
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {devices.map(device => (
              <DeviceCard
                key={device.id}
                device={device}
                onClick={d => navigate(`${basePath}/${d.tag}`, { state: { device: d } })}
              />
            ))}
          </section>
        ) : (
          <section className="overflow-hidden rounded-2xl bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    {["Device", "Asset tag", "Condition", "Assigned to", "Notes", "Warranty"].map(h => (
                      <th key={h} className="px-5 py-4 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {devices.map(device => (
                    <tr
                      key={device.id}
                      onClick={() => navigate(`${basePath}/${device.tag}`, { state: { device } })}
                      className="cursor-pointer border-t border-slate-100 hover:bg-blue-50/50"
                    >
                      <td className="px-5 py-4 font-bold">{device.name}</td>
                      <td className="px-5 py-4 font-mono text-xs">{device.tag}</td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-3 py-1 ${conditionStyles[device.condition]}`}>{device.condition}</span>
                      </td>
                      <td className="px-5 py-4">{device.assignedTo}</td>
                      <td className="px-5 py-4 text-slate-500">{device.notes}</td>
                      <td className="px-5 py-4">{device.warranty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}

        {!isLoading && !isError && isAssigneeIdValid && devices.length === 0 && (
          <div className="rounded-2xl bg-white p-12 text-center">
            <Monitor className="mx-auto mb-3 text-slate-300" size={40} />
            <p className="font-semibold text-slate-700">No devices found</p>
            <p className="mt-1 text-sm text-slate-500">
              Try changing your filters or search term.
            </p>
          </div>
        )}
        {!isLoading && !isError && isAssigneeIdValid && total > 0 && (
          <nav aria-label="Asset pages" className="mt-5 flex items-center justify-center gap-4">
            <button disabled={page <= 1} onClick={() => setPage((current) => current - 1)} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm disabled:opacity-50">Previous</button>
            <span className="text-sm text-slate-600">Page {page} of {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm disabled:opacity-50">Next</button>
          </nav>
        )}
      </div>
    </main>
  );
}
