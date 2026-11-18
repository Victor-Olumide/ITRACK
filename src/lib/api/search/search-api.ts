import { appApi } from '@/lib/api/app-api';
import type { GlobalSearchResponse } from './types';

export const searchApi = appApi.injectEndpoints({
  endpoints: (builder) => ({
    globalSearch: builder.query<GlobalSearchResponse, string>({
      query: (q) => `/search?q=${encodeURIComponent(q)}`,
    }),
  }),
});

export const { useGlobalSearchQuery } = searchApi;
