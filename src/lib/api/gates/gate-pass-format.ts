import type { GatePass } from './types'

// Pass states and colours from the ITrack UI design (D06).
export type PassState =
  | 'Waiting'
  | 'Approved'
  | 'Rejected'
  | 'Ready for gate'
  | 'Out now'
  | 'Overdue'
  | 'Left for good'
  | 'Returned'
  | 'Expired'

export function passState(pass: Pick<GatePass, 'status' | 'overdue' | 'isReturnable'>): PassState {
  switch (pass.status) {
    case 'PENDING':
      return 'Waiting'
    case 'APPROVED':
      return 'Approved'
    case 'REJECTED':
      return 'Rejected'
    case 'ISSUED':
      return 'Ready for gate'
    case 'EXITED':
      return !pass.isReturnable ? 'Left for good' : pass.overdue ? 'Overdue' : 'Out now'
    case 'RETURNED':
      return 'Returned'
    default:
      return 'Expired'
  }
}

export const PASS_STATE_CLASS: Record<PassState, string> = {
  Waiting: 'bg-[#ECE7FF] text-[#4A2DB8]',
  Approved: 'bg-[#E3F6EA] text-[#12733A]',
  Rejected: 'bg-[#FDE7E5] text-[#B42318]',
  'Ready for gate': 'bg-[#E3F6EA] text-[#12733A]',
  'Out now': 'bg-[#E8ECFF] text-[#1C2E9E]',
  Overdue: 'bg-[#FDE7E5] text-[#B42318]',
  'Left for good': 'bg-[#FEF3C7] text-[#8A4B05]',
  Returned: 'bg-[#EEF1F8] text-[#3E4766]',
  Expired: 'bg-[#EEF1F8] text-[#3E4766]',
}

// What the requester should do next, shown on "My gate passes".
export const PASS_STATE_HINT: Record<PassState, string> = {
  Waiting: 'IT checks and signs it, usually within 1 working day.',
  Approved: 'Collect the items at the IT office and sign for each one.',
  Rejected: 'IT rejected this request.',
  'Ready for gate': 'Show this pass at the gate. Security ticks every item.',
  'Out now': 'Bring everything back by the return date.',
  Overdue: 'This pass is overdue. Bring the items back to IT.',
  'Left for good': 'These items left on a non-returnable pass.',
  Returned: 'Everything was checked back in.',
  Expired: 'This pass expired.',
}

export function formatDay(value: string | null | undefined) {
  if (!value) return '—'
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00`) : new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
}

export function formatShortDay(value: string | null | undefined) {
  if (!value) return '—'
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00`) : new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(date)
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

export function formatTime(value: string) {
  return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}

/** "2026-11-20T23:59:59.000Z" -> "2026-11-20" for date inputs. */
export function toDateInput(value: string | null | undefined) {
  return value ? value.slice(0, 10) : ''
}

export function shortHash(sha: string) {
  return `${sha.slice(0, 4)}…${sha.slice(-4)}`
}

export function itemCount(pass: Pick<GatePass, 'items'>) {
  return pass.items.reduce((total, item) => total + item.quantity, 0)
}
