// src/pages/Tickets.jsx
// Split-pane view: ticket queue on the left, ticket detail on the right.
// Tickets are sourced from mockData and resolved into a view shape here —
// no inline dummy data lives in this file.

import { useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import {
  Search, Check, Circle, Send
} from "lucide-react";
import { tickets as mockTickets, userById, deviceById } from "../lib/mockData";
import { getSubmittedTickets } from "../lib/sessionData";
import { useAuth } from "../contexts/AuthContext";

// Resolve relational mockData into the shape this view consumes.
function toView(t, users) {
  const requester = users.find((user) => user.id === t.requesterId) ?? userById(t.requesterId);
  const assignee = users.find((user) => user.id === t.assigneeId) ?? userById(t.assigneeId);
  const device = deviceById(t.deviceId);
  return {
    ...t,
    department: requester?.department ?? "—",
    requester: requester ? requester.name : "Unknown",
    assignee: assignee ? assignee.name : "Unassigned",
    assigneeId: t.assigneeId,
    device: device?.tag ?? "—",
    deviceName: device ? `${device.make} ${device.model}` : "—",
    group: t.timeState,
  };
}

const groupStyles = {
  Breached: { dot: "bg-red-600", color: "text-red-600" },
  "At risk": { dot: "bg-amber-500", color: "text-amber-700" },
  "On track": { dot: "bg-emerald-500", color: "text-emerald-600" },
  Paused: { dot: "bg-slate-400", color: "text-slate-500" }
};

const priorityStyles = {
  Critical: "text-red-600",
  High: "text-orange-600",
  Medium: "text-blue-600",
  Low: "text-slate-500"
};

const slaStyles = {
  Breached: "bg-red-100 text-red-700",
  "At risk": "bg-amber-100 text-amber-800",
  "On track": "bg-emerald-100 text-emerald-700",
  Paused: "bg-slate-100 text-slate-600"
};

const initials = (name = "") =>
  name.split(" ").map(part => part[0]).join("").slice(0, 2).toUpperCase();

function Filter({ label, value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium outline-none hover:border-blue-400 focus:ring-2 focus:ring-blue-100"
    >
      <option value="">{label}</option>
      {options.map(option => (
        <option key={option} value={option}>{option}</option>
      ))}
    </select>
  );
}

function TicketRow({ ticket, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-[20px] border p-4 text-left transition-all
        ${selected
          ? "border-blue-500 bg-white shadow-[0_0_0_3px_rgba(59,130,246,0.13)]"
          : "border-transparent bg-white hover:border-blue-200 hover:shadow-sm"
        }`}
    >
      <div className="flex items-center gap-3">
        <Circle
          size={25}
          className="shrink-0 text-blue-600"
          strokeWidth={2}
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-[15px] font-semibold text-slate-900">
              {ticket.title}
            </p>
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-mono font-semibold text-slate-800">
              {ticket.id}
            </span>
            <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-500">
              {ticket.type} · {ticket.category}
            </span>
            <span className="text-slate-500">
              {ticket.requester} · {ticket.department}
            </span>
          </div>
        </div>

        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          <span className={`text-xs font-bold ${priorityStyles[ticket.priority]}`}>
            ▪ {ticket.priority}
          </span>
          <span className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${slaStyles[ticket.group]}`}>
            {ticket.sla}
          </span>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">
            {ticket.assignee === "Unassigned" ? "—" : initials(ticket.assignee)}
          </span>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2 pl-9 sm:hidden">
        <span className={`text-xs font-semibold ${priorityStyles[ticket.priority]}`}>
          {ticket.priority}
        </span>
        <span className={`rounded-full px-2 py-1 text-xs ${slaStyles[ticket.group]}`}>
          {ticket.sla}
        </span>
      </div>
    </button>
  );
}

function TicketDetails({ ticket, onUpdate }) {
  const [mode, setMode] = useState("reply");
  const [message, setMessage] = useState("");

  if (!ticket) return null;

  const addMessage = () => {
    if (!message.trim()) return;

    onUpdate(ticket.id, {
      history: [
        ...ticket.history,
        {
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
          }),
          text: `${mode === "note" ? "Internal note" : "Reply"}: ${message}`,
          note: mode === "note"
        }
      ]
    });

    setMessage("");
  };

  return (
    <section className="flex h-full min-h-[750px] flex-col rounded-[24px] bg-white p-5 sm:p-7">
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <span className="font-mono text-sm font-semibold text-slate-500">
          {ticket.id}
        </span>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          {ticket.status}
        </span>
        <span className="text-xs font-semibold text-orange-600">
          {ticket.priority} priority
        </span>
      </div>

      <h2 className="text-2xl font-bold tracking-tight text-slate-950">
        {ticket.title}
      </h2>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Response</p>
          <p className="mt-1 font-bold text-emerald-600">{ticket.response}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Resolution</p>
          <p className={`mt-1 font-bold ${ticket.group === "Breached" ? "text-red-600" : "text-slate-800"}`}>
            {ticket.resolution}
          </p>
          <div className="mt-2 h-1.5 rounded-full bg-slate-100">
            <div className={`h-full rounded-full ${ticket.group === "Breached" ? "w-full bg-red-600" : "w-2/3 bg-emerald-500"}`} />
          </div>
        </div>
      </div>

      <div className="my-5 grid grid-cols-[105px_1fr] gap-y-3 text-sm sm:grid-cols-[125px_1fr]">
        <span className="text-slate-500">Requested by</span>
        <strong>{ticket.requester} · {ticket.department}</strong>

        <span className="text-slate-500">Assignee</span>
        <strong>{ticket.assignee}</strong>

        <span className="text-slate-500">Type</span>
        <strong>{ticket.type} · {ticket.category}</strong>

        <span className="text-slate-500">Device</span>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-lime-300 px-2 py-1 font-mono text-xs font-semibold text-slate-900">
            {ticket.device}
          </span>
          <span className="font-medium text-blue-600">{ticket.deviceName}</span>
        </div>
      </div>

      <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
        {ticket.description}
      </div>

      <div className="mt-5">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">
          History
        </h3>

        <div className="space-y-3">
          {ticket.history.map((item, index) => (
            <div key={index} className="flex items-start gap-3 text-sm">
              <span className="shrink-0 font-mono text-slate-500">
                {item.time}
              </span>
              <p className={`leading-5 ${item.note ? "rounded-md bg-amber-100 px-2 py-1 text-amber-900" : "text-slate-700"}`}>
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <div className="inline-flex rounded-xl bg-slate-100 p-1">
          <button
            onClick={() => setMode("reply")}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${mode === "reply" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
          >
            Reply to requester
          </button>
          <button
            onClick={() => setMode("note")}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${mode === "note" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
          >
            Internal note
          </button>
        </div>

        <p className="mb-2 mt-2 text-xs text-slate-500">
          {mode === "note" ? "Only IT staff will see this note" : "Your response will be visible to the requester"}
        </p>

        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder={mode === "note" ? "Write a note for the IT team" : "Write a reply to the requester"}
          rows={3}
          className="w-full resize-y rounded-2xl border border-slate-200 bg-amber-50/60 p-4 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />

        <button
          onClick={addMessage}
          disabled={!message.trim()}
          className="mt-2 flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send size={15} />
          Send {mode === "note" ? "note" : "reply"}
        </button>
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-slate-100 pt-6">
        <button
          onClick={() => onUpdate(ticket.id, { status: "Resolved", group: "On track" })}
          className="flex items-center gap-2 rounded-full bg-lime-400 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-lime-500"
        >
          <Check size={17} /> Resolve
        </button>

        <button
          onClick={() => onUpdate(ticket.id, { status: "Waiting on user", group: "Paused", sla: "Paused · waiting on user" })}
          className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold hover:bg-slate-50"
        >
          Waiting on user
        </button>

        <button
          onClick={() => onUpdate(ticket.id, { assignee: "Unassigned", assigneeId: null })}
          className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold hover:bg-slate-50"
        >
          Reassign
        </button>
      </div>
    </section>
  );
}

export default function TicketPage({ technicianView = false }) {
  const { user, users } = useAuth()
  const assigneeId = user.id
  const availableTickets = useMemo(
    () => [...mockTickets, ...getSubmittedTickets()].map((ticket) => toView(ticket, users)),
    [users]
  );
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTicketId = searchParams.get("ticket");
  const [tickets, setTickets] = useState(availableTickets);
  const [selectedId, setSelectedId] = useState(() => (
    requestedTicketId ?? availableTickets.find(ticket => ticket.assigneeId === assigneeId)?.id ?? availableTickets[0]?.id ?? ''
  ));
  const [tab, setTab] = useState(technicianView ? "Mine" : "All open");
  const [department, setDepartment] = useState(technicianView ? "" : "Finance");
  const [priority, setPriority] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState("");
  const [search, setSearch] = useState("");

  const scopedTickets = technicianView
    ? tickets.filter((ticket) => ticket.assigneeId === assigneeId)
    : tickets
  const selectedTicket = scopedTickets.find(t => t.id === requestedTicketId)
    ?? scopedTickets.find(t => t.id === selectedId);

  const updateTicket = (id, changes) => {
    setTickets(prev =>
      prev.map(t => t.id === id ? { ...t, ...changes } : t)
    );
  };

  const filteredTickets = useMemo(() => {
    return scopedTickets.filter(ticket => {
      const isOpen = ticket.status !== "Resolved";

      return (
        (tab === "All open" ? isOpen :
          tab === "Mine" ? ticket.assigneeId === assigneeId && isOpen :
          tab === "Unassigned" ? !ticket.assigneeId && isOpen :
          true) &&
        (!department || ticket.department === department) &&
        (!priority || ticket.priority === priority) &&
        (!category || ticket.category === category) &&
        (!type || ticket.type === type) &&
        (`${ticket.title} ${ticket.id} ${ticket.requester}`
          .toLowerCase().includes(search.toLowerCase()))
      );
    });
  }, [scopedTickets, tab, department, priority, category, type, search, assigneeId]);

  const groups = ["Breached", "At risk", "On track", "Paused"];

  return (
    <main className="min-h-screen bg-[#0c194d] ">
      <div className="mx-auto grid max-w-[1800px] grid-cols-1 items-stretch gap-3 lg:grid-cols-[1.3fr_1fr]">

        {/* LEFT: TICKET LIST */}
        <section className="min-w-0 rounded-[26px] bg-[#f4f6fc] p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[#101a3b]">
                {technicianView ? "My tickets" : "Tickets"}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {tickets.filter(t => t.status !== "Resolved").length} open · {tickets.filter(t => !t.assigneeId).length} unassigned · sorted by time left
              </p>
            </div>

            <div className="flex rounded-full bg-white p-1">
              {["Unassigned", "Mine", "All open"].map((item) => (
                <button
                  key={item}
                  onClick={() => setTab(item)}
                  className={`rounded-full px-3 py-2 text-xs font-semibold sm:px-4 ${
                    tab === item
                      ? "bg-[#101a50] text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {item}
                  <span className="ml-1 opacity-70">
                    {item === "Unassigned"
                      ? tickets.filter(t => !t.assigneeId).length
                      : item === "Mine"
                      ? tickets.filter(t => t.assigneeId === assigneeId).length
                      : tickets.filter(t => t.status !== "Resolved").length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <select
              value={department}
              onChange={e => setDepartment(e.target.value)}
              className="rounded-full border border-blue-100 bg-blue-100 px-4 py-2.5 text-sm text-blue-800 outline-none"
            >
              <option value="">All departments</option>
              {["Finance", "Admin", "Operations", "HR", "Security", "IT"].map(d => (
                <option key={d}>{d}</option>
              ))}
            </select>

            <Filter label="Priority" value={priority} onChange={setPriority}
              options={["Critical", "High", "Medium", "Low"]} />

            <Filter label="Category" value={category} onChange={setCategory}
              options={["PC hardware", "Network", "Accessories", "Printer", "Accounts"]} />

            <Filter label="Type" value={type} onChange={setType}
              options={["Problem", "Request"]} />

            <div className="relative w-full sm:ml-auto sm:w-48">
              <Search size={16} className="absolute left-3 top-3 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search tickets..."
                className="w-full rounded-full border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-400"
              />
            </div>
          </div>

          <div className="mt-6 space-y-6">
            {groups.map(group => {
              const groupTickets = filteredTickets.filter(t => t.group === group);
              if (!groupTickets.length) return null;

              return (
                <div key={group}>
                  <div className="mb-2 flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${groupStyles[group].dot}`} />
                    <h3 className="text-sm font-bold text-slate-800">{group}</h3>
                    <span className="text-sm text-slate-500">{groupTickets.length}</span>
                  </div>

                  <div className="space-y-2.5">
                    {groupTickets.map(ticket => (
                      <TicketRow
                        key={ticket.id}
                        ticket={ticket}
                        selected={selectedId === ticket.id}
                        onClick={() => {
                          setSelectedId(ticket.id);
                          setSearchParams({ ticket: ticket.id });
                        }}
                      />
                    ))}
                  </div>
                </div>
              );
            })}

            {!filteredTickets.length && (
              <div className="rounded-2xl bg-white p-10 text-center text-sm text-slate-500">
                No tickets match your filters.
              </div>
            )}
          </div>
        </section>

        {/* RIGHT: TICKET DETAILS */}
        <div className="min-w-0">
          {selectedTicket ? (
            <TicketDetails
              key={selectedTicket.id}
              ticket={selectedTicket}
              onUpdate={updateTicket}
            />
          ) : (
            <div className="flex h-full min-h-96 items-center justify-center rounded-3xl bg-white text-slate-500">
              Select a ticket to view its details.
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
