// src/pages/TicketDetail.jsx — Ticket detail view

import { useParams } from 'react-router'

export default function TicketDetail() {
  const { id } = useParams()
  return (
    <div className="p-6 sm:p-8">
      <h1 className="text-2xl font-bold text-gray-900">Ticket {id ?? 'detail'}</h1>
      <p className="mt-1 text-sm text-gray-500">
        Conversation, SLA timers and assignment.
      </p>
      {/* TODO: ticket detail view */}
    </div>
  )
}
