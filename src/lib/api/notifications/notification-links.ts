import type { UserRole } from '../../../types/types'

// Maps a server target reference to the page that shows it for this role.
export function notificationPath(link: string | null, role: UserRole): string | null {
  if (!link) return null
  const [kind, id] = link.split(':')
  if (!kind || !id) return null
  const encoded = encodeURIComponent(id)
  switch (kind) {
    case 'ticket': {
      const base =
        role === 'Employee' ? '/employee/tickets'
          : role === 'Department Head' ? '/department/tickets'
            : role === 'Technician' ? '/technician/tickets'
              : '/tickets'
      return `${base}?ticket=${encoded}`
    }
    // Passes waiting for this user's approval.
    case 'gate-pass-review':
      return role === 'IT Admin' ? '/gate-passes' : role === 'Technician' ? '/technician/approvals' : null
    // The user's own pass.
    case 'gate-pass':
      return role === 'IT Admin' ? '/passes'
        : role === 'Technician' ? '/technician/passes'
          : role === 'Department Head' ? '/department/passes'
            : role === 'Security' ? '/security'
              : '/employee/passes'
    case 'asset-request':
      return role === 'IT Admin' ? '/asset-requests'
        : role === 'Department Head' ? '/department/asset-requests'
          : '/employee/asset-requests'
    case 'stock':
      return role === 'IT Admin' ? '/stock' : role === 'Technician' ? '/technician/stock' : null
    case 'user':
      return role === 'IT Admin' ? '/people' : null
    default:
      return null
  }
}
