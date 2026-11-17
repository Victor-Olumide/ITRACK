
import type { Ticket, TicketHistoryEntry } from "@/types/types";
import type {
  ApiTicketPriority,
  ApiTicketStatus,
  TicketApiEvent,
  TicketApiRecord,
} from "./types";
import { getPriorityLabel } from "./ticket-priority.ts";

const statusLabels: Record<ApiTicketStatus, Ticket["status"]> = {
  NEW: "Unassigned",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In progress",
  WAITING_ON_USER: "Waiting on user",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

const priorityLabels: Record<ApiTicketPriority, Ticket["priority"]> = {
  P1_CRITICAL: "Critical",
  P2_HIGH: "High",
  P3_MEDIUM: "Medium",
  P4_LOW: "Low",
  P5_PLANNING: "Legacy",
};

function formatEnum(value: string): string {
  return value
    .trim()
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatStatus(value: string | null): string {
  if (!value) return "Unknown status";

  const normalized = value.trim().toUpperCase() as ApiTicketStatus;

  return statusLabels[normalized] ?? formatEnum(value);
}

function formatEvent(event: TicketApiEvent): string {
  const actor = event.actor?.fullName || "System";

  switch (event.type) {
    case "STATUS": {
      const previousStatus = event.fromValue
        ? formatStatus(event.fromValue)
        : null;

      const nextStatus = formatStatus(event.toValue);

      return previousStatus
        ? `${actor} changed status from ${previousStatus} to ${nextStatus}`
        : `${actor} changed status to ${nextStatus}`;
    }

    case "ASSIGN": {
      const previousAssignee = event.previousAssignee?.fullName;
      const nextAssignee = event.assignee?.fullName;

      if (!nextAssignee) {
        return previousAssignee
          ? `${actor} unassigned ${previousAssignee}`
          : `${actor} unassigned the ticket`;
      }

      if (previousAssignee) {
        if (event.previousAssignee?.id === event.assignee?.id) {
          return `${actor} confirmed the assignment to ${nextAssignee}`;
        }

        return `${actor} reassigned the ticket from ${previousAssignee} to ${nextAssignee}`;
      }

      return `${actor} assigned the ticket to ${nextAssignee}`;
    }

    case "PRIORITY": {
      const previousPriority = event.fromValue
        ? getPriorityLabel(event.fromValue)
        : null;

      const nextPriority = event.toValue
        ? getPriorityLabel(event.toValue)
        : null;

      if (previousPriority && nextPriority) {
        return `${actor} changed priority from ${previousPriority} to ${nextPriority}`;
      }

      if (nextPriority) {
        return `${actor} set priority to ${nextPriority}`;
      }

      return `${actor} updated the ticket priority`;
    }

    case "DELETE":
      return `${actor} deleted the ticket`;

    default:
      return `${actor} updated the ticket`;
  }
}

function toHistory(ticket: TicketApiRecord): TicketHistoryEntry[] {
  const events = (ticket.events ?? []).map((event) => ({
    at: event.createdAt,
    item: {
      time: new Date(event.createdAt).toLocaleString(),
      text: formatEvent(event),
    },
  }));

  const comments = (ticket.comments ?? []).map((comment) => ({
    at: comment.createdAt,
    item: {
      time: new Date(comment.createdAt).toLocaleString(),
      text: `${comment.isInternal ? "Internal note" : "Reply"} by ${comment.author.fullName}: ${comment.body}`,
      note: comment.isInternal,
    },
  }));

  return [...events, ...comments]
    .sort((left, right) => left.at.localeCompare(right.at))
    .map(({ item }) => item);
}

export function toClientTicket(ticket: TicketApiRecord): Ticket {
  const resolvedAt = ticket.resolvedAt
    ? new Date(ticket.resolvedAt)
    : null;

  const createdAt = new Date(ticket.createdAt);

  return {
    id: ticket.number,
    serverId: ticket.id,
    title: ticket.title,

    type: ticket.type === "REQUEST" ? "Request" : "Problem",
    category: ticket.category?.name ?? "Uncategorized",

    priority: priorityLabels[ticket.priority] ?? "Medium",
    status: statusLabels[ticket.status] ?? "Unassigned",

    timeState: ticket.overdue ? "Breached" : "Not overdue",

    assigneeId: ticket.assignee?.id ?? null,
    assigneeName: ticket.assignee?.fullName ?? null,

    requesterId: ticket.reporter.id,
    requesterName: ticket.reporter.fullName,
    requesterDepartment: ticket.reporter.department?.name ?? "",

    deviceId: ticket.asset?.id ?? null,
    deviceTag: ticket.asset?.assetTag ?? null,
    deviceName: ticket.asset
      ? `${ticket.asset.make} ${ticket.asset.model}`
      : null,

    description: ticket.description,
    response: "Not tracked",

    resolution:
      ticket.resolutionNote ?? (resolvedAt ? "Resolved" : "Not tracked"),

    sla: ticket.overdue ? "Overdue" : "Not overdue",

    ...(resolvedAt
      ? {
          resolutionHours:
            (resolvedAt.getTime() - createdAt.getTime()) / 3_600_000,
        }
      : {}),

    createdAt: ticket.createdAt,
    history: toHistory(ticket),
  };
}
