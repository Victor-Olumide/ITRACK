const API_PREFIX = '/api/v1'

export interface ApiEnvironmentConfig {
  VITE_API_BASE_URL?: string
  VITE_API_URL?: string
}

function withApiPrefix(baseUrl: string): string {
  const normalized = baseUrl.trim().replace(/\/+$/, '')
  if (!normalized) return API_PREFIX
  if (normalized.endsWith(API_PREFIX)) return normalized
  if (normalized.endsWith('/api')) return `${normalized}/v1`
  return `${normalized}${API_PREFIX}`
}

export function resolveApiBaseUrl(
  config: ApiEnvironmentConfig,
  defaultUrl = 'https://itrack-server-lr0h.onrender.com',
): string {
  return withApiPrefix(
    config.VITE_API_BASE_URL || config.VITE_API_URL || defaultUrl,
  )
}
