
import {
  createBrowserRouter,
  Navigate,
  Outlet,
  RouterProvider,
} from 'react-router'
import { lazy, Suspense } from 'react'
import type { ComponentType } from 'react'

import {
  AuthProvider,
  homePathForRole,
  useAuth,
} from './contexts/AuthContext'

import RequireAuth, {
  SessionSplash,
} from './components/RequireAuth'

import RouteErrorFeedback from './components/RouteErrorFeedback'
import Layout from './components/Layout'


const Auth = lazy(() => import('./pages/Auth'))

function lazyPage<P extends object = Record<string, never>>(
  load: () => Promise<{ default: ComponentType<P> }>,
  props?: P,
) {
  return {
    lazy: async () => {
      const { default: Page } = await load()
      return {
        Component: () => <Page {...(props ?? ({} as P))} />,
      }
    },
  }
}

function LoginRoute() {
  const {
    user,
    isRestoringSession,
  } = useAuth()

  // Do not render the login page until session restoration finishes.
  if (isRestoringSession) {
    return <SessionSplash />
  }

  return user
    ? <Navigate to={homePathForRole(user.role)} replace />
    : <Suspense fallback={<SessionSplash />}><Auth /></Suspense>
}

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <AuthProvider>
        <Outlet />
      </AuthProvider>
    ),
    errorElement: (
      <AuthProvider>
        <RouteErrorFeedback />
      </AuthProvider>
    ),
    children: [
      { path: 'login', element: <LoginRoute /> },

      {
        element: (
          <RequireAuth roles={['Department Head']}>
            <Layout />
          </RequireAuth>
        ),
        children: [
          { path: 'department', ...lazyPage(() => import('./pages/DepartmentWorkspace'), { section: 'overview' as const }) },
          { path: 'department/employees', ...lazyPage(() => import('./pages/DepartmentWorkspace'), { section: 'employees' as const }) },
          { path: 'department/assets', ...lazyPage(() => import('./pages/DepartmentWorkspace'), { section: 'assets' as const }) },
          { path: 'department/assets/:tag', ...lazyPage(() => import('./pages/DeviceDetailPage'), { basePath: '/department/assets' }) },
          { path: 'department/tickets', ...lazyPage(() => import('./pages/EmployeePortal'), { section: 'tickets' as const }) },
          { path: 'department/tickets/new', ...lazyPage(() => import('./pages/EmployeePortal'), { section: 'report' as const }) },
        ],
      },

      {
        element: (
          <RequireAuth roles={['IT Admin']}>
            <Layout />
          </RequireAuth>
        ),
        children: [
          { index: true, ...lazyPage(() => import('./pages/Home')) },
          { path: 'tickets', ...lazyPage(() => import('./pages/Tickets')) },
          { path: 'tickets/queue', ...lazyPage(() => import('./pages/TicketQueue')) },
          { path: 'tickets/new', ...lazyPage(() => import('./pages/EmployeePortal'), { section: 'report' as const }) },
          { path: 'devices', ...lazyPage(() => import('./pages/Devices')) },
          { path: 'devices/register', ...lazyPage(() => import('./pages/RegisterDevice')) },
          { path: 'devices/:tag', ...lazyPage(() => import('./pages/DeviceDetailPage')) },
          { path: 'reports', ...lazyPage(() => import('./pages/Reports')) },
          { path: 'gate-passes', ...lazyPage(() => import('./pages/GateStation')) },
          { path: 'team', ...lazyPage(() => import('./pages/Team')) },
          { path: 'people', ...lazyPage(() => import('./pages/Team')) },
          { path: 'signup', ...lazyPage(() => import('./pages/Team'), { showCreateForm: true }) },

          // TODO(v2): Re-enable /stock, /passes, /gate, /locations,
          // /audit, /models, and /notifications when their persistent APIs are available.
          // TODO(v2): Re-enable /settings profile preferences and
          // /security after their v1 APIs are implemented.
        ],
      },

      {
        element: (
          <RequireAuth roles={['Technician']}>
            <Layout />
          </RequireAuth>
        ),
        children: [
          { path: 'technician', ...lazyPage(() => import('./pages/TechnicianHome')) },
          {
            path: 'technician/tickets',
            ...lazyPage(() => import('./pages/Tickets'), { technicianView: true }),
          },
          {
            path: 'technician/tickets/queue',
            ...lazyPage(() => import('./pages/TicketQueue')),
          },
          {
            path: 'technician/devices',
            ...lazyPage(() => import('./pages/Devices'), { basePath: '/technician/devices' }),
          },
          {
            path: 'technician/devices/register',
            ...lazyPage(() => import('./pages/RegisterDevice'), { basePath: '/technician/devices' }),
          },
          {
            path: 'technician/devices/:tag',
            ...lazyPage(() => import('./pages/DeviceDetailPage'), { basePath: '/technician/devices' }),
          },

          // TODO(v2): Re-enable /technician/passes after the gate-pass API is ready.
        ],
      },

      {
        element: (
          <RequireAuth roles={['Employee']}>
            <Layout />
          </RequireAuth>
        ),
        children: [
          {
            path: 'employee',
            ...lazyPage(() => import('./pages/EmployeePortal'), { section: 'home' as const }),
          },
          {
            path: 'employee/report',
            ...lazyPage(() => import('./pages/EmployeePortal'), { section: 'report' as const }),
          },
          {
            path: 'employee/tickets',
            ...lazyPage(() => import('./pages/EmployeePortal'), { section: 'tickets' as const }),
          },
          {
            path: 'employee/tickets/queue',
            ...lazyPage(() => import('./pages/TicketQueue')),
          },
          {
            path: 'employee/devices/:tag',
            ...lazyPage(() => import('./pages/DeviceDetailPage'), { basePath: '/employee' }),
          },

          // TODO(v2): Re-enable /employee/passes and /employee/passes/new
          // after the gate-pass API is ready.
        ],
      },

      { path: 'security', element: <RequireAuth roles={['Security']}><Layout /></RequireAuth>, children: [{ index: true, ...lazyPage(() => import('./pages/GateStation')) }] },

      // TODO(v2): Re-enable the /security kiosk only when its workflows
      // have persistent API support.
      { path: '*', element: <RouteErrorFeedback status={404} /> },
    ],
  },
])

export default function AppRouter() {
  return <RouterProvider router={router} />
}
