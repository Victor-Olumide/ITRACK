import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'

export function getLoginErrorMessage(error: unknown): string {
  if (!error || typeof error !== 'object' || !('status' in error)) {
    return 'Sign-in failed. Please try again.'
  }

  const apiError = error as FetchBaseQueryError
  if (apiError.status === 'FETCH_ERROR') {
    return 'The sign-in service could not be reached. Check the API URL, server availability, and CORS configuration.'
  }
  if (apiError.status === 'TIMEOUT_ERROR') {
    return 'The sign-in request timed out. Please try again.'
  }
  if (apiError.status === 'PARSING_ERROR') {
    return 'The sign-in service returned an unreadable response. Please try again later.'
  }
  if (apiError.status === 'CUSTOM_ERROR') {
    return 'Sign-in failed. Please try again.'
  }

  const data = apiError.data
  let serverMessage: string | null = null
  if (data && typeof data === 'object') {
    if (
      'error' in data &&
      data.error &&
      typeof data.error === 'object' &&
      'message' in data.error &&
      typeof data.error.message === 'string'
    ) {
      serverMessage = data.error.message
    } else if ('message' in data && typeof data.message === 'string') {
      serverMessage = data.message
    }
  }

  if (apiError.status === 401) {
    return serverMessage
      ? `Incorrect password. ${serverMessage}`
      : 'Incorrect password. Check your email and try again.'
  }
  if (serverMessage) return serverMessage
  if (apiError.status === 403) return 'Your account is not allowed to sign in.'
  if (typeof apiError.status === 'number' && apiError.status >= 500) {
    return 'The sign-in service is temporarily unavailable. Please try again later.'
  }
  return 'Sign-in failed. Check your details and try again.'
}
