function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function messageFrom(value: unknown): string | undefined {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) {
    const messages = value.filter((item): item is string => typeof item === 'string')
    return messages.length ? messages.join('; ') : undefined
  }
  return undefined
}

function statusOf(error: unknown): string | number | undefined {
  if (!isRecord(error) || !('status' in error)) return undefined
  const status = error.status
  return typeof status === 'number' || typeof status === 'string' ? status : undefined
}

function serverCode(error: unknown): string | undefined {
  if (!isRecord(error) || !isRecord(error.data)) return undefined
  const body = error.data
  return isRecord(body.error) && typeof body.error.code === 'string'
    ? body.error.code
    : undefined
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  const status = statusOf(error)
  const code = serverCode(error)

  if (status === 'FETCH_ERROR') return 'Unable to connect. Please check your internet connection and try again.'
  if (status === 'TIMEOUT_ERROR') return 'The request took too long. Please try again.'
  if (status === 503 || code === 'DATABASE_UNAVAILABLE') return 'The service is temporarily unavailable. Please try again shortly.'
  if (typeof status === 'number' && status >= 500) return 'Something went wrong on our server. Please try again shortly.'
  if (code === 'INVALID_TRANSITION') return 'That ticket action is no longer available because its status has changed. Refresh the ticket and try again.'
  if (status === 403) return 'You do not have permission to perform that action.'
  if (status === 404) return 'The requested ticket could not be found. Refresh the page and try again.'

  if (isRecord(error) && 'data' in error && isRecord(error.data)) {
    const body = error.data
    const nestedMessage = isRecord(body.error) ? messageFrom(body.error.message) : undefined
    const serverMessage = nestedMessage ?? messageFrom(body.message)
    if (serverMessage) {
      if (/cannot move|can't move|invalid transition/i.test(serverMessage)) {
        return 'That ticket action is no longer available because its status has changed. Refresh the ticket and try again.'
      }
      return serverMessage
    }
  }

  if (error instanceof Error && !/cannot move|can't move|invalid transition/i.test(error.message)) return error.message
  return fallback
}
