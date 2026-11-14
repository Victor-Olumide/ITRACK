import { resolveApiBaseUrl } from './api-config.ts'

interface ApiErrorOptions {
  status?: number
  code?: string
  details?: unknown
  requestId?: string | null
}

interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  body?: BodyInit | Record<string, unknown> | null
}

const API_BASE_URL = resolveApiBaseUrl({
  VITE_API_BASE_URL: import.meta.env?.VITE_API_BASE_URL,
  VITE_API_URL: import.meta.env?.VITE_API_URL,
})

export class ApiError extends Error {
  status?: number
  code?: string
  details?: unknown
  requestId?: string | null

  constructor(message: string, { status, code, details, requestId }: ApiErrorOptions = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
    this.requestId = requestId
  }
}

async function readResponse(response: Response): Promise<unknown> {
  if (response.status === 204) return null

  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    try {
      return await response.json()
    } catch (error) {
      throw new ApiError('The server returned invalid JSON.', {
        status: response.status,
        details: error,
        requestId: response.headers.get('x-request-id'),
      })
    }
  }
  return response.text()
}

function isApiErrorBody(value: unknown): value is {
  message?: string
  code?: string
  details?: unknown
  requestId?: string
} {
  return value !== null && typeof value === 'object'
}

export async function apiRequest<T = unknown>(path: string, options: ApiRequestOptions = {}): Promise<T | null> {
  if (typeof path !== 'string' || !path.startsWith('/')) {
    throw new TypeError('API paths must be relative to the configured API base and start with "/".')
  }

  const { body, headers: requestHeaders, ...fetchOptions } = options
  const headers = new Headers(requestHeaders)
  headers.set('Accept', 'application/json')
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData
  if (body !== undefined && !isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...fetchOptions,
      headers,
      credentials: 'include',
      body: body === undefined || isFormData ? body : JSON.stringify(body),
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError('Unable to reach the server. Check your connection and try again.', {
      details: error,
    })
  }

  const data = await readResponse(response)
  if (!response.ok) {
    const errorBody = isApiErrorBody(data) ? data : {}
    throw new ApiError(errorBody.message ?? `Request failed with status ${response.status}.`, {
      status: response.status,
      code: errorBody.code,
      details: errorBody.details ?? data,
      requestId: errorBody.requestId ?? response.headers.get('x-request-id'),
    })
  }
  return data as T
}

export { API_BASE_URL }
