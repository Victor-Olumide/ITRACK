// src/pages/Devices.jsx
// Grid and list views of assets. Devices are sourced from mockData and
// resolved into a card shape here — no inline dummy data lives in this file.

import { useMemo, useState } from "react";
import {
  Plus, Search, Grid2X2, List, Monitor, Laptop,
  Smartphone, Rotate3D
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";
import { devices as mockDevices, userById } from "../lib/mockData";

const initials = (name = "") =>
  name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

// Format an ISO warranty date into the short strings the cards expect.
function formatWarranty(warrantyEnds) {
  const end = new Date(warrantyEnds);
  if (Number.isNaN(end.getTime())) return "—";
  const diffDays = Math.round((end - new Date()) / 86400000);
  if (diffDays < 0) return "Expired";
  if (diffDays <= 30) {
    return `Ends ${end.getDate()} ${end.toLocaleDateString("en-GB", { month: "short" })}`;
  }
  return end.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

// Resolve a relational mockData device into the shape the cards consume.
function toCard(d) {
  const owner = userById(d.assigneeId);
  return {
    id: d.id,
    name: `${d.make} ${d.model}`,
    tag: d.tag,
    category: d.category,
    specs: "",
    status: d.status,
    assignedTo: owner ? owner.name : "Not assigned",
    initials: owner ? initials(owner.name) : "—",
    location: d.location,
    warranty: formatWarranty(d.warrantyEnds),
    image: "",
    ready: d.status === "In store",
  };
}

const initialDevices = mockDevices.map(toCard);

const statusStyles = {
  Assigned: "bg-blue-100 text-blue-800",
  "In store": "bg-lime-100 text-lime-800",
  "Off-site": "bg-purple-100 text-purple-700",
  "In repair": "bg-orange-100 text-orange-800",
  Retired: "bg-slate-200 text-slate-600"
};

const statusColors = {
  Assigned: "#3155ff",
  "In store": "#a8d900",
  "Off-site": "#8055ff",
  "In repair": "#ff713b",
  Retired: "#94a3b8"
};

const tabs = ["All", "Assigned", "In store", "Off-site", "In repair"];

function DeviceImage({ device }) {
  const [failed, setFailed] = useState(false);

  const Icon = {
    Laptops: Laptop,
    Desktops: Monitor,
    Phones: Smartphone,
    Monitors: Monitor,
  }[device.category] || Monitor;

  return (
    <div className="device-image relative flex h-[174px] items-center justify-center overflow-hidden bg-gradient-to-b from-[#f1f4fc] to-[#e8edf9]">
      {failed || !device.image ? (
        <div className="flex flex-col items-center gap-2 text-slate-400">
          <Icon size={65} strokeWidth={1} />
          <span className="text-xs">{device.category}</span>
        </div>
      ) : (
        <img
          src={device.image}
          alt={device.name}
          onError={() => setFailed(true)}
          className="h-[88%] w-[88%] object-contain transition-transform duration-500 ease-out"
        />
      )}

      <span className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-bold ${statusStyles[device.status]}`}>
        {device.status}
      </span>

      <span className="absolute right-3 top-3 flex items-center gap-1 rounded-md bg-[#34416e] px-2 py-1 text-[11px] font-bold text-white">
        <Rotate3D size={12} /> 3D
      </span>
    </div>
  );
}

function DeviceCard({ device, onClick }) {
  return (
    <button
      onClick={() => onClick(device)}
      className="group min-w-0 overflow-hidden rounded-[22px] border border-transparent bg-white text-left transition-all duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
    >
      <DeviceImage key={device.image || device.tag} device={device} />

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
          {device.category}{device.specs ? ` · ${device.specs}` : ""}
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
              {device.location}
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
  const [devices] = useState(initialDevices);
  const [activeTab, setActiveTab] = useState(
    tabs.includes(requestedStatus) ? requestedStatus : "All"
  );
  const [view, setView] = useState("Grid");
  const [readyOnly, setReadyOnly] = useState(false);
  const [search, setSearch] = useState("");

  const total = devices.length;

  const counts = {
    Assigned: devices.filter(d => d.status === "Assigned").length,
    "In store": devices.filter(d => d.status === "In store").length,
    "Off-site": devices.filter(d => d.status === "Off-site").length,
    "In repair": devices.filter(d => d.status === "In repair").length,
    Retired: devices.filter(d => d.status === "Retired").length
  };

  const filteredDevices = useMemo(() => {
    return devices.filter(device => {
      const matchesTab = activeTab === "All" || device.status === activeTab;
      const matchesReady = !readyOnly || device.status === "In store";

      const matchesSearch = [
        device.name,
        device.tag,
        device.assignedTo || "",
        device.category
      ].join(" ").toLowerCase().includes(search.toLowerCase());

      return matchesTab && matchesReady && matchesSearch;
    });
  }, [devices, activeTab, readyOnly, search]);

  return (
    <main className="min-h-screen bg-[#0c194d]">
      <div className="mx-auto min-h-[calc(100vh-40px)] max-w-[1800px] rounded-[28px] bg-[#f4f6fc] p-5 sm:p-7 lg:p-8">

        {/* DEVICE BREAKDOWN */}
        <section className="rounded-[24px] bg-white p-5 sm:p-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-bold text-[#111a38]">
              Device breakdown
            </h2>
            <span className="text-sm text-slate-500">
              {total} devices in total
            </span>
          </div>

          <div className="flex h-3.5 w-full gap-[3px] overflow-hidden rounded-full bg-slate-100">
            {Object.entries(counts).map(([status, count]) => {
              if (count === 0) return null;
              return (
                <div
                  key={status}
                  title={`${count} ${status}`}
                  style={{
                    flex: count,
                    backgroundColor: statusColors[status]
                  }}
                  className="h-full min-w-0 transition-all"
                />
              );
            })}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
            {Object.entries(counts).map(([status, count]) => (
              <div key={status} className="flex items-center gap-1.5 text-sm">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: statusColors[status] }}
                />
                <strong className="text-slate-800">{count}</strong>
                <span className="text-slate-500">{status}</span>
              </div>
            ))}
          </div>
        </section>

        {/* PAGE HEADER */}
        <section className="mb-5 mt-6">
          <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[#101a3b]">
                Devices
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Hover over a device and move across it to turn it. Open one to inspect it in 3D.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-600">
                <input
                  type="checkbox"
                  checked={readyOnly}
                  onChange={e => setReadyOnly(e.target.checked)}
                  className="h-5 w-5 accent-blue-600"
                />
                Ready to assign only
              </label>

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
              const count = tab === "All" ? total : counts[tab];

              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-full border px-4 py-2.5 text-sm font-semibold transition ${
                    activeTab === tab
                      ? "border-[#101a50] bg-[#101a50] text-white"
                      : "border-slate-200 bg-white text-slate-800 hover:border-blue-400"
                  }`}
                >
                  {tab} <span className="opacity-60">{count}</span>
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-64">
            <Search size={17} className="absolute left-3 top-3 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search devices..."
              className="w-full rounded-full border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-400"
            />
          </div>
        </section>

        {/* DEVICE CARDS */}
        {view === "Grid" ? (
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filteredDevices.map(device => (
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
                    {["Device", "Asset tag", "Status", "Assigned to", "Location", "Warranty"].map(h => (
                      <th key={h} className="px-5 py-4 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredDevices.map(device => (
                    <tr
                      key={device.id}
                      onClick={() => navigate(`${basePath}/${device.tag}`, { state: { device } })}
                      className="cursor-pointer border-t border-slate-100 hover:bg-blue-50/50"
                    >
                      <td className="px-5 py-4 font-bold">{device.name}</td>
                      <td className="px-5 py-4 font-mono text-xs">{device.tag}</td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-3 py-1 ${statusStyles[device.status]}`}>{device.status}</span>
                      </td>
                      <td className="px-5 py-4">{device.assignedTo}</td>
                      <td className="px-5 py-4 text-slate-500">{device.location}</td>
                      <td className="px-5 py-4">{device.warranty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {filteredDevices.length === 0 && (
          <div className="rounded-2xl bg-white p-12 text-center">
            <Monitor className="mx-auto mb-3 text-slate-300" size={40} />
            <p className="font-semibold text-slate-700">No devices found</p>
            <p className="mt-1 text-sm text-slate-500">
              Try changing your filters or search term.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
