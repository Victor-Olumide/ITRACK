import assert from 'node:assert/strict'
import test from 'node:test'
import {
  TICKET_PRIORITY_OPTIONS,
  getPriorityLabel,
  getPriorityTextClass,
  toApiPriority,
  toCreatePriorityFields,
  toPriorityInputs,
} from '../src/lib/api/tickets/ticket-priority.ts'
import {
  toAssignTicketBody,
  toCreateTicketRequest,
} from '../src/lib/api/tickets/ticket-form.ts'
import { toClientTicket } from '../src/lib/api/tickets/ticket-mappers.ts'
import type { TicketApiRecord } from '../src/lib/api/tickets/types.ts'

// Mirror of the server matrix in itrack-server/src/tickets/ticket-rules.ts.
const serverMatrix = {
  HIGH: { HIGH: 'P1_CRITICAL', MEDIUM: 'P2_HIGH', LOW: 'P3_MEDIUM' },
  MEDIUM: { HIGH: 'P2_HIGH', MEDIUM: 'P3_MEDIUM', LOW: 'P4_LOW' },
  LOW: { HIGH: 'P3_MEDIUM', MEDIUM: 'P4_LOW', LOW: 'P5_PLANNING' },
} as const

test('offers exactly Low, Medium, High, Critical in ascending order', () => {
  assert.deepEqual(
    TICKET_PRIORITY_OPTIONS.map((option) => option.label),
    ['Low', 'Medium', 'High', 'Critical'],
  )
})

test('every selectable priority maps to impact/urgency the server resolves to that priority', () => {
  for (const option of TICKET_PRIORITY_OPTIONS) {
    const { impact, urgency } = toPriorityInputs(option.value)
    assert.equal(serverMatrix[impact][urgency], option.value, option.label)
  }
})

test('assign body carries suggestedPriority only when provided', () => {
  assert.deepEqual(toAssignTicketBody({ assigneeId: 'tech-1' }), {
    assigneeId: 'tech-1',
  })
  assert.deepEqual(
    toAssignTicketBody({ assigneeId: 'tech-1', suggestedPriority: 'P1_CRITICAL' }),
    { assigneeId: 'tech-1', suggestedPriority: 'P1_CRITICAL' },
  )
  assert.deepEqual(toAssignTicketBody({}), {})
})

test('ticket creation request sends the backend priority value plus matching impact/urgency', () => {
  const request = toCreateTicketRequest(
    {
      title: 'Printer offline',
      description: 'The third-floor printer is offline.',
      category: 'Printer',
      type: 'PROBLEM',
      ...toCreatePriorityFields('P2_HIGH'),
    },
    '',
  )
  assert.equal(request.priority, 'P2_HIGH')
  assert.equal(serverMatrix[request.impact][request.urgency], request.priority)
  assert.equal('assetId' in request, false)
})

test('labels and colours: Low green, Medium blue, High orange, Critical red', () => {
  assert.equal(getPriorityLabel('P4_LOW'), 'Low')
  assert.equal(getPriorityLabel('P5_PLANNING'), 'Legacy')
  assert.equal(getPriorityLabel('UNKNOWN'), 'UNKNOWN')
  assert.equal(toApiPriority('Critical'), 'P1_CRITICAL')
  assert.equal(toApiPriority('Legacy'), undefined)
  assert.match(getPriorityTextClass('Low'), /green/)
  assert.match(getPriorityTextClass('Medium'), /blue/)
  assert.match(getPriorityTextClass('High'), /orange/)
  assert.match(getPriorityTextClass('Critical'), /red/)
})

test('priority history events read as human labels', () => {
  const actor = { id: 'a', staffId: 'S1', fullName: 'Ada Admin', role: 'IT_ADMIN' }
  const record: TicketApiRecord = {
    id: 'server-id',
    number: 'IT-0001',
    type: 'PROBLEM',
    title: 'Printer offline',
    description: 'The third-floor printer is offline.',
    category: { id: 'c', name: 'Printer' },
    priority: 'P2_HIGH',
    impact: 'HIGH',
    urgency: 'MEDIUM',
    status: 'NEW',
    resolutionNote: null,
    reporter: { id: 'r', staffId: 'S2', fullName: 'Rita', email: 'r@example.com' },
    assignee: null,
    asset: null,
    events: [
      {
        id: 'e',
        type: 'PRIORITY',
        fromValue: 'P3_MEDIUM',
        toValue: 'P2_HIGH',
        createdAt: '2026-11-16T10:00:00.000Z',
        actor,
      },
    ],
    resolvedAt: null,
    closedAt: null,
    createdAt: '2026-11-16T09:00:00.000Z',
    updatedAt: '2026-11-16T10:00:00.000Z',
    overdue: false,
  }
  const ticket = toClientTicket(record)
  assert.equal(ticket.priority, 'High')
  assert.equal(ticket.history[0]?.text, 'Ada Admin changed priority from Medium to High')
})
