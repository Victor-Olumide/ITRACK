
export interface ApiEnvironmentConfig {
  VITE_API_BASE_URL?: string;
  VITE_API_URL?: string;
}

export function resolveApiBaseUrl(
  config: ApiEnvironmentConfig,
  defaultUrl = 'https://itrack-server-lr0h.onrender.com',
): string {
  return (
    config.VITE_API_BASE_URL?.trim().replace(/\/+$/, '') ||
    config.VITE_API_URL?.trim().replace(/\/+$/, '') ||
    defaultUrl
  );
}
