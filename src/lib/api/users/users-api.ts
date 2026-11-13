import { appApi } from '@/lib/api/app-api';
import type { CreateUserRequest, ListUsersResponse, UpdateUserRequest, UserResponse } from './types';

export const usersApi = appApi.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query<ListUsersResponse, void>({
      query: () => '/auth/users',
      providesTags: (result) => [
        { type: 'User', id: 'LIST' },
        ...(result?.users.map((user) => ({ type: 'User' as const, id: user.id })) ?? []),
      ],
    }),
    createUser: builder.mutation<UserResponse, CreateUserRequest>({
      query: (body) => ({ url: '/auth/users', method: 'POST', body }),
      invalidatesTags: [{ type: 'User', id: 'LIST' }],
    }),
    updateUser: builder.mutation<UserResponse, { id: string; body: UpdateUserRequest }>({
      query: ({ id, body }) => ({
        url: `/users/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'User', id },
        { type: 'User', id: 'LIST' },
      ],
    }),
  }),
});

export const { useGetUsersQuery, useCreateUserMutation, useUpdateUserMutation } = usersApi;
