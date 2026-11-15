
export interface ApiEnvironmentConfig {
  VITE_API_BASE_URL?: string;
  VITE_API_URL?: string;
}

export function resolveApiBaseUrl(
  config: ApiEnvironmentConfig,
  defaultUrl = '/api',
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

// True when API requests leave the current page origin.
export function isCrossOriginApiBase(
  baseUrl: string,
  pageOrigin: string,
): boolean {
  if (!/^https?:\/\//i.test(baseUrl)) {
    return false;
  }

  try {
    return new URL(baseUrl).origin !== pageOrigin;
  } catch {
    return true;
  }
}
