import assert from 'node:assert/strict'
import test from 'node:test'
import { API_BASE_URL, ApiError, apiRequest } from '../src/lib/api/apiClient.ts'
import { appBaseQuery } from '../src/lib/api/base-query.ts'
import { getLoginErrorMessage } from '../src/lib/api/auth/login-errors.ts'

test('sends same-origin JSON requests with session credentials', async () => {
  const originalFetch = globalThis.fetch
  let request: { url: RequestInfo | URL; options: RequestInit } | undefined
  globalThis.fetch = async (url, options = {}) => {
    request = { url, options }
    return new Response(JSON.stringify({ id: 'ticket-1' }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const result = await apiRequest('/tickets', {
      method: 'POST',
      body: { title: 'Cannot sign in' },
    })

    assert.deepEqual(result, { id: 'ticket-1' })
    assert.ok(request)
    assert.equal(request.url, `${API_BASE_URL}/tickets`)
    assert.equal(request.options.method, 'POST')
    assert.equal(request.options.credentials, 'include')
    const requestHeaders = new Headers(request.options.headers)
    assert.equal(requestHeaders.get('Accept'), 'application/json')
    assert.equal(requestHeaders.get('Content-Type'), 'application/json')
    assert.equal(request.options.body, JSON.stringify({ title: 'Cannot sign in' }))
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('returns null for no-content responses', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => new Response(null, { status: 204 })

  try {
    assert.equal(await apiRequest('/auth/logout', { method: 'POST' }), null)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('preserves server error details and request IDs', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => new Response(JSON.stringify({
    code: 'VALIDATION_ERROR',
    message: 'Invalid ticket.',
    details: { title: 'Required' },
  }), {
    status: 422,
    headers: {
      'Content-Type': 'application/json',
      'X-Request-Id': 'request-123',
    },
  })

  try {
    await assert.rejects(apiRequest('/tickets'), (error) => (
      error instanceof ApiError
      && error.status === 422
      && error.code === 'VALIDATION_ERROR'
      && typeof error.details === 'object'
      && error.details !== null
      && 'title' in error.details
      && error.details.title === 'Required'
      && error.requestId === 'request-123'
    ))
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('wraps network failures in ApiError', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => {
    throw new TypeError('Network unavailable')
  }

  try {
    await assert.rejects(apiRequest('/tickets'), (error) => (
      error instanceof ApiError && error.message.includes('Unable to reach the server')
    ))
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('requires API paths to start with a slash', async () => {
  await assert.rejects(apiRequest('tickets'), TypeError)
})

test('does not refresh an absent session after getMe returns 401', async () => {
  const originalFetch = globalThis.fetch
  let requestCount = 0
  globalThis.fetch = async () => {
    requestCount += 1
    return new Response(JSON.stringify({ message: 'No active session' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })

    test('adds incorrect-password guidance to 401 login errors without losing server details', () => {
      assert.equal(
        getLoginErrorMessage({ status: 401, data: { message: 'Invalid credentials.' } }),
        'Incorrect password. Invalid credentials.',
      )
      assert.equal(
        getLoginErrorMessage({ status: 401, data: { error: { message: 'Account disabled.' } } }),
        'Incorrect password. Account disabled.',
      )
    })
  }

  try {
    const api = {
      endpoint: 'getMe',
      signal: new AbortController().signal,
      abort: () => undefined,
      dispatch: () => undefined,
      getState: () => ({}),
      extra: undefined,
      type: 'query',
      forced: false,
      queryCacheKey: 'authApi|getMe(undefined)',
    } as never
    const result = await appBaseQuery(
      { url: '/auth/me', method: 'GET' },
      api,
      {},
    )

    assert.deepEqual(result.error, { status: 401, data: { message: 'No active session' } })
    assert.equal(requestCount, 1)
  } finally {
    globalThis.fetch = originalFetch
  }
})
