import type { UserRole } from '../types/types'

// Where each role's screens live; must match the routes in src/router.tsx.
interface RolePaths {
  home: string
  passes: string | null
  approvals: string | null
  gate: string | null
  settings: string
}

const ROLE_PATHS: Record<UserRole, RolePaths> = {
  'IT Admin': { home: '/', passes: '/passes', approvals: '/gate-passes', gate: '/gate', settings: '/settings' },
  Technician: { home: '/technician', passes: '/technician/passes', approvals: '/technician/approvals', gate: null, settings: '/technician/settings' },
  'Department Head': { home: '/department', passes: '/department/passes', approvals: null, gate: null, settings: '/department/settings' },
  Employee: { home: '/employee', passes: '/employee/passes', approvals: null, gate: null, settings: '/employee/settings' },
  Security: { home: '/security', passes: null, approvals: null, gate: '/security', settings: '/security/settings' },
}

export function pathsForRole(role: UserRole | undefined): RolePaths {
  return ROLE_PATHS[role ?? 'Employee']
}

export function slipPath(passId: string) {
  return `/gate-pass-slips/${passId}`
}
