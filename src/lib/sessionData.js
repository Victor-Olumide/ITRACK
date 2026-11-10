// Browser-session records for self-service forms in the frontend-only demo.

const TICKET_KEY = 'itrack.employee.tickets'
const PASS_KEY = 'itrack.employee.passes'
const PASS_UPDATES_KEY = 'itrack.gatePass.statusUpdates'
const GATE_LOG_KEY = 'itrack.gateLog.events'

function readRecords(key) {
  const raw = window.sessionStorage.getItem(key)
  if (raw === null) return []

  const records = JSON.parse(raw)
  if (!Array.isArray(records)) {
    throw new Error(`Invalid session data stored for ${key}.`)
  }
  return records
}

function appendRecord(key, record) {
  const records = readRecords(key)
  window.sessionStorage.setItem(key, JSON.stringify([...records, record]))
}

export const getSubmittedTickets = () => readRecords(TICKET_KEY)
export const saveSubmittedTicket = (ticket) => appendRecord(TICKET_KEY, ticket)

export const getSubmittedPasses = () => readRecords(PASS_KEY)
export const saveSubmittedPass = (pass) => appendRecord(PASS_KEY, pass)

export function getGatePassStatusUpdates() {
  const raw = window.sessionStorage.getItem(PASS_UPDATES_KEY)
  if (raw === null) return {}
  const updates = JSON.parse(raw)
  if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
    throw new Error('Invalid gate-pass status updates in browser session storage.')
  }
  return updates
}

export function saveGatePassStatus(passId, status) {
  const updates = getGatePassStatusUpdates()
  window.sessionStorage.setItem(PASS_UPDATES_KEY, JSON.stringify({ ...updates, [passId]: status }))
}

export const getSubmittedGateEvents = () => readRecords(GATE_LOG_KEY)
export const saveGateEvent = (event) => appendRecord(GATE_LOG_KEY, event)
