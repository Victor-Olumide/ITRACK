import { appApi } from '../app-api'

export interface PasswordResetLink {
  // Site-relative path; prefix window.location.origin to share it.
  path: string
  expiresAt: string
}

export const passwordResetApi = appApi.injectEndpoints({
  endpoints: (builder) => ({
    requestPasswordReset: builder.mutation<{ message: string }, { email: string }>({
      query: (body) => ({ url: '/auth/password-reset/request', method: 'POST', body }),
    }),
    confirmPasswordReset: builder.mutation<{ message: string }, { token: string; newPassword: string }>({
      query: (body) => ({ url: '/auth/password-reset/confirm', method: 'POST', body }),
    }),
    issuePasswordResetLink: builder.mutation<PasswordResetLink, string>({
      query: (userId) => ({ url: `/auth/users/${userId}/password-reset-link`, method: 'POST' }),
      invalidatesTags: ['Audit'],
    }),
  }),
})

export const {
  useRequestPasswordResetMutation,
  useConfirmPasswordResetMutation,
  useIssuePasswordResetLinkMutation,
} = passwordResetApi
