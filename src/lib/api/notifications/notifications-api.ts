import { appApi } from '../app-api'

export type NotificationType = 'TICKET' | 'GATE_PASS' | 'ASSET_REQUEST' | 'STOCK' | 'ACCOUNT'

export interface AppNotification {
  id: string
  type: NotificationType
  title: string
  body: string | null
  // Target reference such as `ticket:<id>`; see notificationPath().
  link: string | null
  readAt: string | null
  createdAt: string
}

export interface NotificationsResponse {
  items: AppNotification[]
  unreadCount: number
}

export interface NotificationPreferences {
  ticketUpdates: boolean
  gatePassUpdates: boolean
  assetRequestUpdates: boolean
  stockAlerts: boolean
}

// The bell refreshes on this interval so new alerts appear without a reload.
export const NOTIFICATION_POLL_MS = 60_000

export const notificationsApi = appApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<NotificationsResponse, { unread?: boolean; limit?: number } | void>({
      query: (params) => {
        const search = new URLSearchParams()
        if (params?.unread) search.set('unread', 'true')
        if (params?.limit) search.set('limit', String(params.limit))
        const qs = search.toString()
        return `/notifications${qs ? `?${qs}` : ''}`
      },
      providesTags: ['Notification'],
    }),
    markNotificationRead: builder.mutation<{ id: string; read: true }, string>({
      query: (id) => ({ url: `/notifications/${id}/read`, method: 'PATCH' }),
      invalidatesTags: ['Notification'],
    }),
    markAllNotificationsRead: builder.mutation<{ updated: number }, void>({
      query: () => ({ url: '/notifications/read-all', method: 'POST' }),
      invalidatesTags: ['Notification'],
    }),
    getNotificationPreferences: builder.query<NotificationPreferences, void>({
      query: () => '/notifications/preferences',
      providesTags: [{ type: 'Notification', id: 'PREFERENCES' }],
    }),
    updateNotificationPreferences: builder.mutation<NotificationPreferences, Partial<NotificationPreferences>>({
      query: (body) => ({ url: '/notifications/preferences', method: 'PATCH', body }),
      invalidatesTags: [{ type: 'Notification', id: 'PREFERENCES' }],
    }),
  }),
})

export const {
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useGetNotificationPreferencesQuery,
  useUpdateNotificationPreferencesMutation,
} = notificationsApi
