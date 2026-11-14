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

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (isRecord(error) && 'data' in error && isRecord(error.data)) {
    const body = error.data
    const nestedMessage = isRecord(body.error) ? messageFrom(body.error.message) : undefined
    const serverMessage = nestedMessage ?? messageFrom(body.message)
    if (serverMessage) return serverMessage
  }

  if (error instanceof Error) return error.message
  return fallback
}
