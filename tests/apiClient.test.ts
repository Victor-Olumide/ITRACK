import assert from 'node:assert/strict'
import test from 'node:test'
import { API_BASE_URL, ApiError, apiRequest } from '../src/lib/api/apiClient.ts'
import { resolveApiBaseUrl } from '../src/lib/api/api-config.ts'
import { appBaseQuery } from '../src/lib/api/base-query.ts'
import { getLoginErrorMessage } from '../src/lib/api/auth/login-errors.ts'
import { toCreateUserRequest } from '../src/lib/api/users/create-user-form.ts'
import { toCreateTicketRequest } from '../src/lib/api/tickets/ticket-form.ts'
import { getApiErrorMessage } from '../src/lib/api/error-message.ts'

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

test('resolves every supported API base URL configuration to the versioned API path', () => {
  assert.equal(
    resolveApiBaseUrl({ VITE_API_BASE_URL: 'https://api.example.com/api/v1/' }),
    'https://api.example.com/api/v1',
  )
  assert.equal(
    resolveApiBaseUrl({ VITE_API_BASE_URL: 'https://api.example.com/api' }),
    'https://api.example.com/api/v1',
  )
  assert.equal(
    resolveApiBaseUrl({ VITE_API_BASE_URL: 'https://api.example.com' }),
    'https://api.example.com/api/v1',
  )
  assert.equal(
    resolveApiBaseUrl({ VITE_API_BASE_URL: '/api' }),
    '/api/v1',
  )
  assert.equal(
    resolveApiBaseUrl({ VITE_API_URL: 'https://api.example.com' }),
    'https://api.example.com/api/v1',
  )
  assert.equal(
    resolveApiBaseUrl({}),
    'https://itrack-server-lr0h.onrender.com/api/v1',
  )
})

test('omits a blank optional staff ID from the create-user request', () => {
  assert.deepEqual(
    toCreateUserRequest({
      fullName: '  Test Employee  ',
      email: '  employee@example.com ',
      departmentId: 'c0a80101-0000-4000-8000-000000000002',
      staffId: '   ',
      password: 'valid-password',
      role: 'EMPLOYEE',
    }),
    {
      fullName: 'Test Employee',
      email: 'employee@example.com',
      departmentId: 'c0a80101-0000-4000-8000-000000000002',
      password: 'valid-password',
      role: 'EMPLOYEE',
    },
  )
})

test('links a selected asset to a report ticket and omits the link when none is selected', () => {
  const fields = {
    title: 'Printer is offline',
    description: 'The printer in my office is not responding.',
    category: 'Printer',
    type: 'PROBLEM' as const,
    impact: 'LOW' as const,
    urgency: 'LOW' as const,
  }

  const assetId = 'c0a80101-0000-4000-8000-000000000003'
  assert.deepEqual(toCreateTicketRequest(fields, assetId), {
    ...fields,
    assetId,
  })
  assert.deepEqual(toCreateTicketRequest(fields, ''), fields)
})

test('displays sanitized server errors and uses a fallback for transport errors', () => {
  assert.equal(
    getApiErrorMessage(
      { status: 503, data: { error: { code: 'DATABASE_UNAVAILABLE', message: 'The service is temporarily unavailable. Please try again shortly.' } } },
      'Tickets could not be loaded.',
    ),
    'The service is temporarily unavailable. Please try again shortly.',
  )
  assert.equal(
    getApiErrorMessage(
      { status: 'FETCH_ERROR', error: 'Failed to fetch' },
      'Tickets could not be loaded.',
    ),
    'Tickets could not be loaded.',
  )
})

test('restores an expired access session using the refresh cookie', async () => {
  const originalFetch = globalThis.fetch
  let requestCount = 0
  globalThis.fetch = async () => {
    requestCount += 1
    return requestCount === 1
      ? new Response(JSON.stringify({ message: 'Access token expired' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        })
      : new Response(JSON.stringify({ user: { id: 'user-1' } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
  }

  try {
    const api = {
      endpoint: 'getMe',
      signal: new AbortController().signal,
      abort: () => undefined,
      dispatch: () => undefined,
      getState: () => ({ auth: { isAuthenticated: false } }),
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

    assert.deepEqual(result.data, { user: { id: 'user-1' } })
    assert.equal(requestCount, 2)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('attempts refresh once when session restoration receives 401', async () => {
  const originalFetch = globalThis.fetch
  let requestCount = 0
  globalThis.fetch = async () => {
    requestCount += 1
    return new Response(JSON.stringify({ message: 'No active session' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
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
    assert.equal(requestCount, 2)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('marks an authenticated session expired when refresh is rejected', async () => {
  const originalFetch = globalThis.fetch
  const dispatchedActions: { type: string }[] = []
  globalThis.fetch = async () => new Response(
    JSON.stringify({ message: 'Session expired' }),
    {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    },
  )

  try {
    const api = {
      endpoint: 'getTickets',
      signal: new AbortController().signal,
      abort: () => undefined,
      dispatch: (action: { type: string }) => {
        dispatchedActions.push(action)
      },
      getState: () => ({ auth: { isAuthenticated: true } }),
      extra: undefined,
      type: 'query',
      forced: false,
      queryCacheKey: 'ticketsApi|getTickets(undefined)',
    } as never
    const result = await appBaseQuery(
      { url: '/tickets', method: 'GET' },
      api,
      {},
    )

    assert.deepEqual(result.error, { status: 401, data: { message: 'Session expired' } })
    assert.deepEqual(
      dispatchedActions.map(({ type }) => type),
      ['auth/clearAuth', 'appApi/resetApiState', 'auth/markSessionExpired'],
    )
  } finally {
    globalThis.fetch = originalFetch
  }
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

test('keeps network sign-in errors understandable without exposing developer settings', () => {
  const message = getLoginErrorMessage({
    status: 'FETCH_ERROR',
    error: 'Failed to fetch',
  })

  assert.equal(
    message,
    'We couldn’t sign you in right now. Please try again shortly. If this continues, contact your IT support team.',
  )
  assert.doesNotMatch(message, /API URL|CORS|server availability/i)
  assert.equal(
    getLoginErrorMessage({
      status: 503,
      data: {
        error: {
          code: 'DATABASE_UNAVAILABLE',
          message: 'The service is temporarily unavailable. Please try again shortly.',
        },
      },
    }),
    'The service is temporarily unavailable. Please try again shortly.',
  )
})
