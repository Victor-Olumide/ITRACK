// src/components/Badge.jsx
// Reusable pills for statuses, priorities, ticket types and time states.
//
// The tone is auto-detected from the label, or pass `tone` explicitly:
//   red | orange | amber | blue | slate | green | violet
//
// Design tokens:
//   Breached / Critical          -> red text on light red
//   At risk / High               -> orange/amber text on light orange
//   Medium / On track / Assigned -> blue text on light blue
//   Low / In store                -> slate text on light gray

const TONES = {
  red:    'bg-red-100 text-red-700',
  orange: 'bg-orange-100 text-orange-700',
  amber:  'bg-amber-100 text-amber-700',
  blue:   'bg-blue-100 text-blue-700',
  slate:  'bg-slate-100 text-slate-600',
  green:  'bg-green-100 text-green-700',
  violet: 'bg-violet-100 text-violet-700',
}

// Maps known status / priority / type / time-state strings to a tone.
const VALUE_TONE = {
  // Priorities
  Critical: 'red', High: 'orange', Medium: 'blue', Low: 'slate',
  // Ticket types
  Problem: 'red', Request: 'blue',
  // Ticket statuses
  Unassigned: 'slate', 'In progress': 'blue', 'Waiting on user': 'amber', Resolved: 'green', Closed: 'slate',
  // Ticket time states
  Breached: 'red', 'At risk': 'orange', 'On track': 'blue', Paused: 'slate',
  // Device statuses
  Assigned: 'blue', 'In store': 'slate', 'Off-site': 'violet', 'In repair': 'amber', Retired: 'slate',
  // Gate pass statuses
  Waiting: 'amber', Approved: 'green', Rejected: 'red', Overdue: 'red',
}

export default function Badge({ label, tone, className = '' }) {
  const resolved = tone ?? VALUE_TONE[label] ?? 'slate'
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${TONES[resolved]} ${className}`}
    >
      {label}
    </span>
  )
}
