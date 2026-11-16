import type {
  ApiTicketImpact,
  ApiTicketPriority,
  ApiTicketUrgency,
  UpdateTicketRequest,
} from './types';

/** Priority levels a person can choose. P5_PLANNING is legacy-only. */
export type SelectableTicketPriority = Exclude<ApiTicketPriority, 'P5_PLANNING'>;

export type TicketPriorityLabel = 'Critical' | 'High' | 'Medium' | 'Low' | 'Legacy';

export interface TicketPriorityOption {
  value: SelectableTicketPriority;
  label: Exclude<TicketPriorityLabel, 'Legacy'>;
  description: string;
}

/** Ordered from least to most serious. */
export const TICKET_PRIORITY_OPTIONS: readonly TicketPriorityOption[] = [
  { value: 'P4_LOW', label: 'Low', description: 'Annoying, but I can keep working.' },
  { value: 'P3_MEDIUM', label: 'Medium', description: 'Work is slower or harder.' },
  { value: 'P2_HIGH', label: 'High', description: 'I or my team cannot work.' },
  { value: 'P1_CRITICAL', label: 'Critical', description: 'Many people or a key service are down.' },
];

/**
 * The server derives priority from impact × urgency (src/tickets/ticket-rules.ts)
 * and has no direct priority field. Each selectable priority maps to one
 * impact/urgency pair that the server's matrix resolves to that priority.
 */
const PRIORITY_INPUTS: Record<
  SelectableTicketPriority,
  { impact: ApiTicketImpact; urgency: ApiTicketUrgency }
> = {
  P1_CRITICAL: { impact: 'HIGH', urgency: 'HIGH' },
  P2_HIGH: { impact: 'HIGH', urgency: 'MEDIUM' },
  P3_MEDIUM: { impact: 'MEDIUM', urgency: 'MEDIUM' },
  P4_LOW: { impact: 'MEDIUM', urgency: 'LOW' },
};

export function toPriorityInputs(priority: SelectableTicketPriority): {
  impact: ApiTicketImpact;
  urgency: ApiTicketUrgency;
} {
  return { ...PRIORITY_INPUTS[priority] };
}

/** PATCH body that changes only the fields that drive priority. */
export function toPriorityUpdateRequest(
  priority: SelectableTicketPriority,
): Pick<UpdateTicketRequest, 'impact' | 'urgency'> {
  return toPriorityInputs(priority);
}

const API_PRIORITY_LABELS: Record<ApiTicketPriority, TicketPriorityLabel> = {
  P1_CRITICAL: 'Critical',
  P2_HIGH: 'High',
  P3_MEDIUM: 'Medium',
  P4_LOW: 'Low',
  P5_PLANNING: 'Legacy',
};

export function getPriorityLabel(priority: string): TicketPriorityLabel | string {
  return priority in API_PRIORITY_LABELS
    ? API_PRIORITY_LABELS[priority as ApiTicketPriority]
    : priority;
}

export function toApiPriority(label: string): SelectableTicketPriority | undefined {
  return TICKET_PRIORITY_OPTIONS.find((option) => option.label === label)?.value;
}

/** Text colour per priority label: Low green, Medium blue, High orange, Critical red. */
export const PRIORITY_TEXT_CLASS: Record<TicketPriorityLabel, string> = {
  Critical: 'text-red-600',
  High: 'text-orange-600',
  Medium: 'text-blue-600',
  Low: 'text-green-700',
  Legacy: 'text-slate-500',
};

export function getPriorityTextClass(label: string): string {
  return PRIORITY_TEXT_CLASS[label as TicketPriorityLabel] ?? 'text-slate-500';
}

/** Selected-state styles for priority pickers. */
export const PRIORITY_SELECTED_CLASS: Record<SelectableTicketPriority, string> = {
  P1_CRITICAL: 'border-red-500 bg-red-50 text-red-700',
  P2_HIGH: 'border-orange-500 bg-orange-50 text-orange-700',
  P3_MEDIUM: 'border-blue-500 bg-blue-50 text-blue-700',
  P4_LOW: 'border-green-600 bg-green-50 text-green-700',
};
