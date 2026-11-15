
export interface ApiEnvironmentConfig {
  VITE_API_BASE_URL?: string;
  VITE_API_URL?: string;
}

export function resolveApiBaseUrl(
  config: ApiEnvironmentConfig,
  defaultUrl = 'https://itrack-server-lr0h.onrender.com',
): string {
  const baseUrl = (
    config.VITE_API_BASE_URL?.trim() ||
    config.VITE_API_URL?.trim() ||
    defaultUrl
  ).replace(/\/+$/, '');

  if (baseUrl.endsWith('/api/v1')) {
    return baseUrl;
  }

  if (baseUrl.endsWith('/api')) {
    return `${baseUrl}/v1`;
  }

  return `${baseUrl}/api/v1`;
}
