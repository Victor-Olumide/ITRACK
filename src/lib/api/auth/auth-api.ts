import { appApi } from '@/lib/api/app-api';
import { API_REQUEST_TIMEOUT_MS } from '@/lib/api/base-query';
import type {
  LoginPayload,
  LoginResponse,
  RefreshResponse,
  LogoutResponse,
  MeResponse,
  DepartmentListResponse,
} from './types';

export const authApi = appApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginPayload>({
      query: (body) => ({
        url: '/auth/login',
        method: 'POST',
        body,
        timeout: API_REQUEST_TIMEOUT_MS,
      }),
      invalidatesTags: ['Auth'],
    }),

    refresh: builder.mutation<RefreshResponse, void>({
      query: () => ({
        url: '/auth/refresh',
        method: 'POST',
      }),
      invalidatesTags: ['Auth'],
    }),

    logout: builder.mutation<LogoutResponse, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      invalidatesTags: ['Auth'],
    }),

    getMe: builder.query<MeResponse, void>({
      query: () => ({
        url: '/auth/me',
        method: 'GET',
        timeout: API_REQUEST_TIMEOUT_MS,
      }),
      providesTags: ['Auth'],
    }),
    getDepartments: builder.query<DepartmentListResponse, void>({
      query: () => ({ url: '/auth/departments', method: 'GET' }),
      providesTags: ['User'],
    }),
  }),
});

export const {
  useLoginMutation,
  useRefreshMutation,
  useLogoutMutation,
  useGetMeQuery,
  useGetDepartmentsQuery,
} = authApi;
