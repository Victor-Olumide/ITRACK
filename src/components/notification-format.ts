import type { UserRole } from '@/types/types'

export function notificationsPagePath(role: UserRole): string {
  switch (role) {
    case 'Employee':
      return '/employee/notifications'
    case 'Technician':
      return '/technician/notifications'
    case 'Department Head':
      return '/department/notifications'
    case 'Security':
      return '/security/notifications'
    default:
      return '/notifications'
  }
}

export function settingsPath(role: UserRole): string {
  switch (role) {
    case 'Employee':
      return '/employee/settings'
    case 'Technician':
      return '/technician/settings'
    case 'Department Head':
      return '/department/settings'
    case 'Security':
      return '/security/settings'
    default:
      return '/settings'
  }
}

export function timeAgo(iso: string, now = Date.now()): string {
  const seconds = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000))
  if (seconds < 60) return 'Just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} h ago`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days} d ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
