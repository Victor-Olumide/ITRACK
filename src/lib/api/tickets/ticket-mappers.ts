import type { Ticket, TicketHistoryEntry } from '@/types/types';
import type {
  ApiTicketPriority,
  ApiTicketStatus,
  TicketApiRecord,
} from './types';

const statusLabels: Record<ApiTicketStatus, Ticket['status']> = {
  NEW: 'Unassigned',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In progress',
  WAITING_ON_USER: 'Waiting on user',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
};

const priorityLabels: Record<ApiTicketPriority, Ticket['priority']> = {
  P1_CRITICAL: 'Critical',
  P2_HIGH: 'High',
  P3_MEDIUM: 'Medium',
  P4_LOW: 'Low',
  P5_PLANNING: 'Legacy',
};

function toHistory(entries: TicketApiRecord): TicketHistoryEntry[] {
  const events = (entries.events ?? []).map((event) => ({
    at: event.createdAt,
    item: {
      time: new Date(event.createdAt).toLocaleString(),
      text: `${event.actor.fullName} ${event.type.toLowerCase()}${event.toValue ? `: ${event.toValue}` : ''}`,
    },
  }));
  const comments = (entries.comments ?? []).map((comment) => ({
    at: comment.createdAt,
    item: {
      time: new Date(comment.createdAt).toLocaleString(),
      text: `${comment.isInternal ? 'Internal note' : 'Reply'} by ${comment.author.fullName}: ${comment.body}`,
      note: comment.isInternal,
    },
  }));

  return [...events, ...comments]
    .sort((left, right) => left.at.localeCompare(right.at))
    .map(({ item }) => item);
}

export function toClientTicket(ticket: TicketApiRecord): Ticket {
  const status = statusLabels[ticket.status];
  const timeState = ticket.overdue
    ? 'Breached'
    : 'Not overdue';
  const resolvedAt = ticket.resolvedAt ? new Date(ticket.resolvedAt) : null;
  const createdAt = new Date(ticket.createdAt);

  return {
    id: ticket.number,
    serverId: ticket.id,
    title: ticket.title,
    type: ticket.type === 'REQUEST' ? 'Request' : 'Problem',
    category: ticket.category.name,
    priority: priorityLabels[ticket.priority],
    status,
    timeState,
    assigneeId: ticket.assignee?.id ?? null,
    assigneeName: ticket.assignee?.fullName ?? null,
    requesterId: ticket.reporter.id,
    requesterName: ticket.reporter.fullName,
    requesterDepartment: ticket.reporter.department?.name ?? '',
    deviceId: ticket.asset?.id ?? null,
    deviceTag: ticket.asset?.assetTag ?? null,
    deviceName: ticket.asset
      ? `${ticket.asset.make} ${ticket.asset.model}`
      : null,
    description: ticket.description,
    response: 'Not tracked',
    resolution: ticket.resolutionNote ?? (resolvedAt ? 'Resolved' : 'Not tracked'),
    sla: ticket.overdue ? 'Overdue' : 'Not overdue',
    ...(resolvedAt
      ? { resolutionHours: (resolvedAt.getTime() - createdAt.getTime()) / 3_600_000 }
      : {}),
    createdAt: ticket.createdAt,
    history: toHistory(ticket),
  };
}
