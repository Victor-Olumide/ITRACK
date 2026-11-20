// W18 notifications: bell with unread count and the latest alerts.
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Bell } from 'lucide-react'
import type { UserRole } from '@/types/types'
import {
  NOTIFICATION_POLL_MS,
  useGetNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  type AppNotification,
} from '@/lib/api/notifications/notifications-api'
import { notificationPath } from '@/lib/api/notifications/notification-links'
import { notificationsPagePath, timeAgo } from './notification-format'

export default function NotificationBell({ role }: { role: UserRole }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const query = useGetNotificationsQuery({ limit: 8 }, { pollingInterval: NOTIFICATION_POLL_MS, skipPollingIfUnfocused: true })
  const [markRead] = useMarkNotificationReadMutation()
  const [markAllRead, markAllState] = useMarkAllNotificationsReadMutation()
  const unread = query.data?.unreadCount ?? 0
  const items = query.data?.items ?? []

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const openItem = (item: AppNotification) => {
    if (!item.readAt) void markRead(item.id)
    const path = notificationPath(item.link, role)
    setOpen(false)
    if (path) navigate(path)
  }

  return (
    <div className="relative shrink-0" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative inline-flex size-9 items-center justify-center rounded-lg text-slate-300 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d2f54a]"
        aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
        aria-expanded={open}
        aria-controls="notification-panel"
        title="Notifications"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#d2f54a] px-1 text-[9px] font-bold text-[#101c52]">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          id="notification-panel"
          className="absolute right-0 top-full z-50 mt-2 w-[min(92vw,360px)] overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl shadow-slate-950/20"
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-bold">Notifications</p>
            <button
              type="button"
              disabled={!unread || markAllState.isLoading}
              onClick={() => void markAllRead()}
              className="text-xs font-semibold text-[#3155ff] disabled:text-slate-300"
            >
              Mark all read
            </button>
          </div>
          <div className="max-h-[min(60vh,26rem)] overflow-y-auto p-1.5">
            {query.isLoading ? (
              <p className="px-3 py-6 text-center text-xs text-slate-500">Loading…</p>
            ) : query.isError ? (
              <p className="px-3 py-6 text-center text-xs text-red-600">Notifications could not be loaded.</p>
            ) : items.length === 0 ? (
              <p className="px-3 py-6 text-center text-xs text-slate-500">You're all caught up.</p>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openItem(item)}
                  className="flex w-full gap-2.5 rounded-xl px-2.5 py-2.5 text-left hover:bg-slate-50"
                >
                  <span className={`mt-1.5 size-2 shrink-0 rounded-full ${item.readAt ? 'bg-transparent' : 'bg-[#3155ff]'}`} aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className={`block text-xs ${item.readAt ? 'text-slate-600' : 'font-semibold text-[#18203e]'}`}>{item.title}</span>
                    {item.body && <span className="mt-0.5 block truncate text-[11px] text-slate-500">{item.body}</span>}
                    <span className="mt-0.5 block text-[10px] text-slate-400">{timeAgo(item.createdAt)}</span>
                  </span>
                </button>
              ))
            )}
          </div>
          <Link
            to={notificationsPagePath(role)}
            onClick={() => setOpen(false)}
            className="block border-t border-slate-100 px-4 py-2.5 text-center text-xs font-semibold text-[#3155ff] hover:bg-slate-50"
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  )
}
