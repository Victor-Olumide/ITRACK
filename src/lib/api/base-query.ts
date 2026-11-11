import {
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query";

import { clearAuth } from "@/lib/stores/auth-slice";

// Base URL targeting the API prefix
const getBaseUrl = (): string => {
  const url = import.meta.env.VITE_API_BASE_URL || `${import.meta.env.VITE_API_URL || "https://itrack-server-lr0h.onrender.com"}/api/v1`;
  return url.replace(/\/+$/, "");
};

const rawBaseQuery = fetchBaseQuery({
  baseUrl: getBaseUrl(),
  credentials: "include", // Ensures fixflow_session and fixflow_refresh cookies are sent
});

let refreshPromise: Promise<boolean> | null = null;

const nonRefreshableEndpoints = new Set([
  "login",
  "refresh",
  "logout",
]);

const clearSession = (api: Parameters<typeof rawBaseQuery>[1]) => {
  api.dispatch(clearAuth());
  api.dispatch({ type: "appApi/resetApiState" });
};

const refreshSession = async (
  api: Parameters<typeof rawBaseQuery>[1],
  extraOptions: Parameters<typeof rawBaseQuery>[2],
): Promise<boolean> => {
  const refreshResult = await rawBaseQuery(
    {
      url: "/auth/refresh",
      method: "POST",
    },
    api,
    extraOptions,
  );

  return !refreshResult.error;
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

    const success = await refreshPromise;
    if (!success) {
      clearSession(api);
      return result;
    }

    // Retry the original query
    const retriedResult = await rawBaseQuery(
      args,
      api,
      extraOptions,
    );

    if (retriedResult.error?.status === 401) {
      clearSession(api);
    }

    return retriedResult;
  }

  return result;
};
