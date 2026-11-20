import assert from 'node:assert/strict'
import test from 'node:test'
import { notificationPath } from '../src/lib/api/notifications/notification-links.ts'

test('ticket notifications open the ticket in each role workspace', () => {
  assert.equal(notificationPath('ticket:abc', 'IT Admin'), '/tickets?ticket=abc')
  assert.equal(notificationPath('ticket:abc', 'Technician'), '/technician/tickets?ticket=abc')
  assert.equal(notificationPath('ticket:abc', 'Employee'), '/employee/tickets?ticket=abc')
  assert.equal(notificationPath('ticket:abc', 'Department Head'), '/department/tickets?ticket=abc')
})

test('gate-pass approvals and own passes go to different pages', () => {
  assert.equal(notificationPath('gate-pass-review:p1', 'IT Admin'), '/gate-passes')
  assert.equal(notificationPath('gate-pass-review:p1', 'Technician'), '/technician/approvals')
  assert.equal(notificationPath('gate-pass:p1', 'Technician'), '/technician/passes')
  assert.equal(notificationPath('gate-pass:p1', 'Employee'), '/employee/passes')
})

test('targets a role cannot open have no link', () => {
  assert.equal(notificationPath('stock:s1', 'Employee'), null)
  assert.equal(notificationPath('user:u1', 'Technician'), null)
  assert.equal(notificationPath('gate-pass-review:p1', 'Employee'), null)
})

test('missing or malformed targets have no link', () => {
  assert.equal(notificationPath(null, 'IT Admin'), null)
  assert.equal(notificationPath('ticket', 'IT Admin'), null)
  assert.equal(notificationPath('unknown:1', 'IT Admin'), null)
})

test('ids are URL-encoded', () => {
  assert.equal(notificationPath('ticket:a b&c', 'IT Admin'), '/tickets?ticket=a%20b%26c')
})
