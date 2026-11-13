import { createBrowserRouter, Navigate, Outlet, RouterProvider } from 'react-router'
import { AuthProvider, homePathForRole, useAuth } from './contexts/AuthContext'
import RequireAuth from './components/RequireAuth'
import RouteErrorFeedback from './components/RouteErrorFeedback'
import Layout from './components/Layout'
import Auth from './pages/Auth'
import Home from './pages/Home'
import Tickets from './pages/Tickets'
import TicketQueue from './pages/TicketQueue'
import Devices from './pages/Devices'
import RegisterDevice from './pages/RegisterDevice'
import DeviceDetailPage from './pages/DeviceDetailPage'
import Reports from './pages/Reports'
import Team from './pages/Team'
import NewTicket from './pages/NewTicket'
import AdminWorkspace from './pages/AdminWorkspace'
import EmployeePortal from './pages/EmployeePortal'
import TechnicianHome from './pages/TechnicianHome'
import UnavailableWorkspace from './pages/UnavailableWorkspace'

function AuthRouteGate() {
  const { isLoading } = useAuth()

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f3f5fc]" aria-busy="true">
        <span
          className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#3155ff]"
          aria-hidden="true"
        />
      </main>
    )
  }
  return <Outlet />
}

function LoginRoute() {
  const { user } = useAuth()
  return user ? <Navigate to={homePathForRole(user.role)} replace /> : <Auth />
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <AuthProvider><AuthRouteGate /></AuthProvider>,
    errorElement: <AuthProvider><RouteErrorFeedback /></AuthProvider>,
    children: [
      { path: 'login', element: <LoginRoute /> },
      {
        element: <RequireAuth roles={['IT Admin']}><Layout /></RequireAuth>,
        children: [
          { index: true, element: <Home /> },
          { path: 'tickets', element: <Tickets /> },
          { path: 'tickets/queue', element: <TicketQueue /> },
          { path: 'tickets/new', element: <NewTicket /> },
          { path: 'devices', element: <Devices /> },
          { path: 'devices/register', element: <RegisterDevice /> },
          { path: 'devices/:tag', element: <DeviceDetailPage /> },
          { path: 'reports', element: <Reports /> },
          { path: 'team', element: <Team /> },
          { path: 'people', element: <Team /> },
          { path: 'signup', element: <Team showCreateForm /> },
          { path: 'categories', element: <AdminWorkspace section="categories" /> },
          // TODO(v2): Re-enable /stock, /passes, /gate, /locations, /audit, /models, and /notifications when their persistent APIs are available.
          // TODO(v2): Re-enable /settings profile preferences and /security after their v1 APIs are implemented.
        ],
      },
      {
        element: <RequireAuth roles={['Technician']}><Layout /></RequireAuth>,
        children: [
          { path: 'technician', element: <TechnicianHome /> },
          { path: 'technician/tickets', element: <Tickets technicianView /> },
          { path: 'technician/tickets/queue', element: <TicketQueue /> },
          { path: 'technician/devices', element: <Devices basePath="/technician/devices" /> },
          { path: 'technician/devices/register', element: <RegisterDevice basePath="/technician/devices" /> },
          { path: 'technician/devices/:tag', element: <DeviceDetailPage basePath="/technician/devices" /> },
          // TODO(v2): Re-enable /technician/passes after the gate-pass API is ready.
        ],
      },
      {
        element: <RequireAuth roles={['Employee']}><Layout /></RequireAuth>,
        children: [
          { path: 'employee', element: <EmployeePortal section="home" /> },
          { path: 'employee/report', element: <EmployeePortal section="report" /> },
          { path: 'employee/tickets', element: <EmployeePortal section="tickets" /> },
          { path: 'employee/tickets/queue', element: <TicketQueue /> },
          { path: 'employee/devices/:tag', element: <DeviceDetailPage basePath="/employee" /> },
          // TODO(v2): Re-enable /employee/passes and /employee/passes/new after the gate-pass API is ready.
        ],
      },
      {
        path: 'workspace-unavailable',
        element: <RequireAuth roles={['Security']}><UnavailableWorkspace /></RequireAuth>,
      },
      // TODO(v2): Re-enable the /security kiosk only when its workflows have persistent API support.
      { path: '*', element: <RouteErrorFeedback status={404} /> },
    ],
  },
])

export default function AppRouter() {
  return <RouterProvider router={router} />
}
