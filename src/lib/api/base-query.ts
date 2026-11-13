import {
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query";

import {
  clearAuth,
  markSessionExpired,
} from "../stores/auth-slice.ts";

const API_PREFIX = '/api/v1';
export const API_REQUEST_TIMEOUT_MS = 30_000;

function withApiPrefix(url: string): string {
  const normalized = url.replace(/\/+$/, '');
  return normalized.endsWith(API_PREFIX) ? normalized : `${normalized}${API_PREFIX}`;
}

// VITE_API_BASE_URL may be either a complete API URL or a same-origin proxy
// path. VITE_API_URL is the backend origin. Both forms resolve to /api/v1.
const getBaseUrl = (): string => {
  const configuredBaseUrl = import.meta.env?.VITE_API_BASE_URL;
  const configuredApiOrigin = import.meta.env?.VITE_API_URL;
  return withApiPrefix(configuredBaseUrl || configuredApiOrigin || 'https://itrack-server-lr0h.onrender.com');
};

const rawBaseQuery = fetchBaseQuery({
  baseUrl: getBaseUrl(),
  credentials: "include",
  timeout: API_REQUEST_TIMEOUT_MS,
});

type RefreshResult = Awaited<ReturnType<typeof rawBaseQuery>>;

let refreshPromise: Promise<RefreshResult> | null = null;

const nonRefreshableEndpoints = new Set([
  "login",
  "refresh",
  "logout",
]);

const clearSession = (api: Parameters<typeof rawBaseQuery>[1]) => {
  api.dispatch(clearAuth());
  api.dispatch({ type: "appApi/resetApiState" });
};

const isAuthenticated = (state: unknown): boolean => {
  if (typeof state !== "object" || state === null || !("auth" in state)) {
    return false;
  }
  const authState = state.auth;
  return (
    typeof authState === "object" &&
    authState !== null &&
    "isAuthenticated" in authState &&
    authState.isAuthenticated === true
  );
};

const refreshSession = async (
  api: Parameters<typeof rawBaseQuery>[1],
  extraOptions: Parameters<typeof rawBaseQuery>[2],
): Promise<RefreshResult> => {
  return rawBaseQuery(
    {
      url: "/auth/refresh",
      method: "POST",
      timeout: API_REQUEST_TIMEOUT_MS,
    },
    api,
    extraOptions,
  );

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
    refreshPromise ??= refreshSession(
      api,
      extraOptions,
    ).finally(() => {
      refreshPromise = null;
    });

    const refreshResult = await refreshPromise;
    if ("error" in refreshResult) {
      const refreshError = refreshResult.error;
      if (!refreshError) {
        return result;
      }
      if (refreshError.status !== 401) {
        return refreshResult;
      }
      const sessionWasAuthenticated = isAuthenticated(api.getState());
      if (sessionWasAuthenticated) {
        clearSession(api);
        api.dispatch(markSessionExpired());
      }
      return result;
    }

    if (api.endpoint === "getMe") {
      return { data: refreshResult.data };
    }

    // Retry the original query
    const retriedResult = await rawBaseQuery(
      args,
      api,
      extraOptions,
    );

    if (retriedResult.error?.status === 401) {
      const sessionWasAuthenticated = isAuthenticated(api.getState());
      if (sessionWasAuthenticated) {
        clearSession(api);
        api.dispatch(markSessionExpired());
      }
    }

    return retriedResult;
  }

  return result;
};
