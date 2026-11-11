// src/pages/TicketQueue.jsx — Queue / My tickets (all roles)

export default function TicketQueue() {
  return (
    <div className="p-6 sm:p-8">
      <h1 className="text-2xl font-bold text-gray-900">My tickets</h1>
      <p className="mt-1 text-sm text-gray-500">
        Tickets you created and those assigned to you.
      </p>
      {/* TODO: filterable ticket list */}
    </div>
  )
}
