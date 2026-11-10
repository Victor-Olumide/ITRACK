const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL || '/api').replace(/\/+$/, '')

export class ApiError extends Error {
  constructor(message, { status, code, details, requestId } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
    this.requestId = requestId
  }
}

async function readResponse(response) {
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

export async function apiRequest(path, options = {}) {
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
    if (error.name === 'AbortError') throw error
    throw new ApiError('Unable to reach the server. Check your connection and try again.', {
      details: error,
    })
  }

  const data = await readResponse(response)
  if (!response.ok) {
    throw new ApiError(data?.message ?? `Request failed with status ${response.status}.`, {
      status: response.status,
      code: data?.code,
      details: data?.details ?? data,
      requestId: data?.requestId ?? response.headers.get('x-request-id'),
    })
  }
  return data
}

export { API_BASE_URL }
