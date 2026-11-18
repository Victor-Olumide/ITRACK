
import {
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query';

import {
  clearAuth,
  markSessionExpired,
} from '../stores/auth-slice.ts';

import {
  isCrossOriginApiBase,
  resolveApiBaseUrl,
} from './api-config.ts';

export const API_REQUEST_TIMEOUT_MS = 180_000;

const getBaseUrl = (): string => {
  return resolveApiBaseUrl({
    VITE_API_BASE_URL: import.meta.env?.VITE_API_BASE_URL,
    VITE_API_URL: import.meta.env?.VITE_API_URL,
  });
};

const apiBaseUrl = getBaseUrl();

if (
  import.meta.env?.PROD &&
  typeof window !== 'undefined' &&
  isCrossOriginApiBase(apiBaseUrl, window.location.origin)
) {
  console.error(
    `API base URL ${apiBaseUrl} is cross-origin. ` +
    'Use the same-origin /api/v1 Vercel proxy to avoid cross-site cookie restrictions.',
  );
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl: apiBaseUrl,
  credentials: 'include',
  timeout: API_REQUEST_TIMEOUT_MS,
});

type RefreshResult = Awaited<ReturnType<typeof rawBaseQuery>>;

let refreshPromise: Promise<RefreshResult> | null = null;

const nonRefreshableEndpoints = new Set([
  'login',
  'refresh',
  'logout',
]);

const clearSession = (
  api: Parameters<typeof rawBaseQuery>[1],
) => {
  api.dispatch(clearAuth());
  api.dispatch({ type: 'appApi/resetApiState' });
};

const isAuthenticated = (state: unknown): boolean => {
  if (
    typeof state !== 'object' ||
    state === null ||
    !('auth' in state)
  ) {
    return false;
  }

  const authState = state.auth;

  return (
    typeof authState === 'object' &&
    authState !== null &&
    'isAuthenticated' in authState &&
    authState.isAuthenticated === true
  );
};

const refreshSession = async (
  api: Parameters<typeof rawBaseQuery>[1],
  extraOptions: Parameters<typeof rawBaseQuery>[2],
): Promise<RefreshResult> => {
  return rawBaseQuery(
    {
      url: '/auth/refresh',
      method: 'POST',
      timeout: API_REQUEST_TIMEOUT_MS,
    },
    api,
    extraOptions,
  );
};

const waitForRefreshCookie = () =>
  new Promise<void>((resolve) => window.setTimeout(resolve, 100));

const refreshSessionWithRecovery = async (
  api: Parameters<typeof rawBaseQuery>[1],
  extraOptions: Parameters<typeof rawBaseQuery>[2],
): Promise<RefreshResult> => {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const result = await refreshSession(api, extraOptions);

    // Another tab may have rotated the refresh cookie moments earlier. The
    // server intentionally reports that race as 409; wait for the winning
    // Set-Cookie response, then retry with the new cookie.
    if (result.error?.status !== 409 || attempt === 1) return result;
    await waitForRefreshCookie();
  }

  return refreshSession(api, extraOptions);
};

export const appBaseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);

  const isRefreshable401 =
    result.error?.status === 401 &&
    !nonRefreshableEndpoints.has(api.endpoint);

  if (isRefreshable401) {
    refreshPromise ??= refreshSessionWithRecovery(
      api,
      extraOptions,
    ).finally(() => {
      refreshPromise = null;
    });

    const refreshResult = await refreshPromise;

    if ('error' in refreshResult) {
      const refreshError = refreshResult.error;

      if (!refreshError) {
        return result;
      }

      if (refreshError.status !== 401) {
        return refreshResult;
      }

      const sessionWasAuthenticated = isAuthenticated(
        api.getState(),
      );

      if (sessionWasAuthenticated) {
        clearSession(api);
        api.dispatch(markSessionExpired());
      }

      return result;
    }

    if (api.endpoint === 'getMe') {
      return { data: refreshResult.data };
    }

    const retriedResult = await rawBaseQuery(
      args,
      api,
      extraOptions,
    );

    if (retriedResult.error?.status === 401) {
      const sessionWasAuthenticated = isAuthenticated(
        api.getState(),
      );

      if (sessionWasAuthenticated) {
        clearSession(api);
        api.dispatch(markSessionExpired());
      }
    }

    return retriedResult;
  }

  return result;
};
