// Browser-session records for self-service forms in the frontend-only demo.

import type { GateLogEntry, GatePass, GatePassStatus, Ticket } from './types'

const TICKET_KEY = 'itrack.employee.tickets'
const PASS_KEY = 'itrack.employee.passes'
const PASS_UPDATES_KEY = 'itrack.gatePass.statusUpdates'
const GATE_LOG_KEY = 'itrack.gateLog.events'

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isTicket(value: unknown): value is Ticket {
  return isObjectRecord(value)
    && typeof value.id === 'string'
    && typeof value.title === 'string'
    && typeof value.status === 'string'
    && Array.isArray(value.history)
}

function isGatePass(value: unknown): value is GatePass {
  return isObjectRecord(value)
    && typeof value.id === 'string'
    && typeof value.requesterId === 'string'
    && typeof value.status === 'string'
    && Array.isArray(value.items)
}

function isGateLogEntry(value: unknown): value is GateLogEntry {
  return isObjectRecord(value)
    && typeof value.id === 'string'
    && typeof value.time === 'string'
    && ['Out', 'Back', 'Stopped'].includes(String(value.event))
}

function readRecords<T>(key: string, isRecord: (value: unknown) => value is T): T[] {
  const raw = window.sessionStorage.getItem(key)
  if (raw === null) return []

  const records: unknown = JSON.parse(raw)
  if (!Array.isArray(records) || !records.every(isRecord)) {
    throw new Error(`Invalid session data stored for ${key}.`)
  }
  return records
}

function appendRecord<T>(key: string, record: T, isRecord: (value: unknown) => value is T) {
  const records = readRecords(key, isRecord)
  window.sessionStorage.setItem(key, JSON.stringify([...records, record]))
}

export const getSubmittedTickets = () => readRecords(TICKET_KEY, isTicket)
export const saveSubmittedTicket = (ticket: Ticket) => appendRecord(TICKET_KEY, ticket, isTicket)

export const getSubmittedPasses = () => readRecords(PASS_KEY, isGatePass)
export const saveSubmittedPass = (pass: GatePass) => appendRecord(PASS_KEY, pass, isGatePass)

export function getGatePassStatusUpdates(): Record<string, GatePassStatus> {
  const raw = window.sessionStorage.getItem(PASS_UPDATES_KEY)
  if (raw === null) return {}
  const updates: unknown = JSON.parse(raw)
  if (!isObjectRecord(updates) || !Object.values(updates).every(isGatePassStatus)) {
    throw new Error('Invalid gate-pass status updates in browser session storage.')
  }
  const typedUpdates: Record<string, GatePassStatus> = {}
  for (const [id, status] of Object.entries(updates)) {
    if (!isGatePassStatus(status)) throw new Error('Invalid gate-pass status updates in browser session storage.')
    typedUpdates[id] = status
  }
  return typedUpdates
}

function isGatePassStatus(value: unknown): value is GatePassStatus {
  return value === 'Waiting' || value === 'Approved' || value === 'Rejected' || value === 'Overdue'
}

export function saveGatePassStatus(passId: string, status: GatePassStatus) {
  const updates = getGatePassStatusUpdates()
  window.sessionStorage.setItem(PASS_UPDATES_KEY, JSON.stringify({ ...updates, [passId]: status }))
}

export const getSubmittedGateEvents = () => readRecords(GATE_LOG_KEY, isGateLogEntry)
export const saveGateEvent = (event: GateLogEntry) => appendRecord(GATE_LOG_KEY, event, isGateLogEntry)
