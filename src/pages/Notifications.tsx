// W18 notification centre: every alert for the signed-in user, newest first.
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '@/contexts/AuthContext'
import {
  useGetNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  type NotificationType,
} from '@/lib/api/notifications/notifications-api'
import { notificationPath } from '@/lib/api/notifications/notification-links'
import { settingsPath, timeAgo } from '@/components/notification-format'
import { useToast } from '@/hooks/use-toast'
import { getApiErrorMessage } from '@/lib/api/error-message'

const TYPE_LABELS: Record<NotificationType, string> = {
  TICKET: 'Ticket',
  GATE_PASS: 'Gate pass',
  ASSET_REQUEST: 'Equipment',
  STOCK: 'Stock',
  ACCOUNT: 'Account',
}

export default function Notifications() {
  const { user } = useAuth()
  const role = user?.role ?? 'Employee'
  const navigate = useNavigate()
  const toast = useToast()
  const [unreadOnly, setUnreadOnly] = useState(false)
  const query = useGetNotificationsQuery({ unread: unreadOnly, limit: 100 })
  const [markRead] = useMarkNotificationReadMutation()
  const [markAllRead, markAllState] = useMarkAllNotificationsReadMutation()
  const items = query.data?.items ?? []
  const unread = query.data?.unreadCount ?? 0

  const readAll = async () => {
    try {
      const result = await markAllRead().unwrap()
      toast(result.updated === 1 ? '1 notification marked as read.' : `${result.updated} notifications marked as read.`)
    } catch (error) {
      toast(getApiErrorMessage(error, 'Notifications could not be updated.'), 'error')
    }
  }

  return (
    <main className="min-h-full px-4 py-5 sm:px-6 sm:py-6 lg:px-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#111a3b]">Notifications</h1>
          <p className="mt-1 text-sm text-slate-500">
            {unread ? `${unread} unread` : 'You are all caught up.'} Choose what you hear about in{' '}
            <Link to={settingsPath(role)} className="font-semibold text-[#3155ff]">Settings</Link>.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div role="group" aria-label="Filter notifications" className="flex rounded-full border border-[#dce2ef] bg-white p-0.5 text-xs font-semibold">
            {[false, true].map((value) => (
              <button
                key={String(value)}
                type="button"
                aria-pressed={unreadOnly === value}
                onClick={() => setUnreadOnly(value)}
                className={`rounded-full px-3 py-1.5 ${unreadOnly === value ? 'bg-[#101c52] text-white' : 'text-slate-600'}`}
              >
                {value ? 'Unread' : 'All'}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => void readAll()}
            disabled={!unread || markAllState.isLoading}
            className="rounded-full bg-[#3155ff] px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"
          >
            Mark all read
          </button>
        </div>
      </div>

      <section className="mt-5 overflow-hidden rounded-2xl border border-[#e9edf6] bg-white">
        {query.isLoading ? (
          <p className="p-8 text-center text-sm text-slate-500">Loading notifications…</p>
        ) : query.isError ? (
          <p role="alert" className="p-8 text-center text-sm text-red-700">{getApiErrorMessage(query.error, 'Notifications could not be loaded.')}</p>
        ) : items.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">{unreadOnly ? 'No unread notifications.' : 'Nothing here yet. Updates on your tickets, passes and requests will appear here.'}</p>
        ) : (
          <ul className="divide-y divide-[#eef1f7]">
            {items.map((item) => {
              const path = notificationPath(item.link, role)
              return (
                <li key={item.id} className="flex flex-wrap items-start gap-3 px-4 py-3.5 sm:flex-nowrap">
                  <span className={`mt-1.5 size-2 shrink-0 rounded-full ${item.readAt ? 'bg-slate-200' : 'bg-[#3155ff]'}`} aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#eef2ff] px-2 py-0.5 text-[10px] font-semibold text-[#3155ff]">{TYPE_LABELS[item.type]}</span>
                      <span className="text-[11px] text-slate-400">{timeAgo(item.createdAt)}</span>
                      {!item.readAt && <span className="sr-only">Unread</span>}
                    </div>
                    <p className={`mt-1 text-sm ${item.readAt ? 'text-slate-600' : 'font-semibold text-[#18203e]'}`}>{item.title}</p>
                    {item.body && <p className="mt-0.5 text-xs text-slate-500">{item.body}</p>}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {!item.readAt && (
                      <button type="button" onClick={() => void markRead(item.id)} className="rounded-full border border-[#dce2ef] px-3 py-1.5 text-xs font-semibold text-[#202844]">
                        Mark read
                      </button>
                    )}
                    {path && (
                      <button
                        type="button"
                        onClick={() => {
                          if (!item.readAt) void markRead(item.id)
                          navigate(path)
                        }}
                        className="rounded-full bg-[#101c52] px-3 py-1.5 text-xs font-semibold text-white"
                      >
                        Open
                      </button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </main>
  )
}
