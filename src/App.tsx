// src/App.jsx
// App routing. Auth routes render full-screen (no chrome); every other
// route is nested under <Layout />, which renders the sidebar + topbar and
// an <Outlet /> for the active page.

import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { AuthProvider, homePathForRole, useAuth } from './contexts/AuthContext'
import RequireAuth from './components/RequireAuth'
import Layout from './components/Layout'
import Auth from './pages/Auth'
import Home from './pages/Home'
import Tickets from './pages/Tickets'
import TicketQueue from './pages/TicketQueue'
import Devices from './pages/Devices'
import RegisterDevice from './pages/RegisterDevice'
import DeviceDetailPage from './pages/DeviceDetailPage'
import Stock from './pages/Stock'
import GatePasses from './pages/GatePasses'
import GateStation from './pages/GateStation'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Team from './pages/Team'
import NewTicket from './pages/NewTicket'
import AdminWorkspace from './pages/AdminWorkspace'
import EmployeePortal from './pages/EmployeePortal'
import TechnicianHome from './pages/TechnicianHome'
import ResetPassword from './pages/ResetPassword'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

function AppRoutes() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f3f5fc] text-sm text-slate-500">
        Checking your session…
      </main>
    )
  }

  return (
      <Routes>
        {/* Auth — full-screen, no chrome */}
        <Route path="/login" element={user ? <Navigate to={homePathForRole(user.role)} replace /> : <Auth />} />
        <Route path="/forgot-password" element={<ResetPassword />} />

        {/* IT Admin workspace */}
        <Route element={<RequireAuth roles={['IT Admin']}><Layout /></RequireAuth>}>
          <Route path="/"                  element={<Home />} />
          <Route path="/tickets"           element={<Tickets />} />
          <Route path="/tickets/queue"     element={<TicketQueue />} />
          <Route path="/tickets/new"       element={<NewTicket />} />
          <Route path="/devices"           element={<Devices />} />
          <Route path="/devices/register"  element={<RegisterDevice />} />
          <Route path="/devices/:tag"      element={<DeviceDetailPage />} />
          <Route path="/stock"             element={<Stock />} />
          <Route path="/passes"            element={<GatePasses />} />
          <Route path="/gate"              element={<GateStation />} />
          <Route path="/reports"           element={<Reports />} />
          <Route path="/team"              element={<Team />} />
          <Route path="/people"            element={<Team />} />
          <Route path="/signup"            element={<Team showCreateForm />} />
          <Route path="/locations"         element={<AdminWorkspace section="locations" />} />
          <Route path="/categories"        element={<AdminWorkspace section="categories" />} />
          <Route path="/audit"             element={<AdminWorkspace section="audit" />} />
          <Route path="/models"            element={<AdminWorkspace section="models" />} />
          <Route path="/notifications"     element={<AdminWorkspace section="notifications" />} />
          <Route path="/settings"         element={<Settings />} />
        </Route>

        {/* Technician workspace */}
        <Route element={<RequireAuth roles={['Technician']}><Layout /></RequireAuth>}>
          <Route path="/technician" element={<TechnicianHome />} />
          <Route path="/technician/tickets" element={<Tickets technicianView />} />
          <Route path="/technician/tickets/queue" element={<TicketQueue />} />
          <Route path="/technician/notifications" element={<AdminWorkspace section="notifications" />} />
          <Route path="/technician/devices" element={<Devices basePath="/technician/devices" />} />
          <Route path="/technician/devices/register" element={<RegisterDevice basePath="/technician/devices" />} />
          <Route path="/technician/devices/:tag" element={<DeviceDetailPage basePath="/technician/devices" />} />
          <Route path="/technician/passes" element={<GatePasses />} />
        </Route>

        {/* Employee workspace */}
        <Route element={<RequireAuth roles={['Employee']}><Layout /></RequireAuth>}>
          <Route path="/employee" element={<EmployeePortal section="home" />} />
          <Route path="/employee/report" element={<EmployeePortal section="report" />} />
          <Route path="/employee/tickets" element={<EmployeePortal section="tickets" />} />
          <Route path="/employee/tickets/queue" element={<TicketQueue />} />
          <Route path="/employee/passes" element={<EmployeePortal section="passes" />} />
          <Route path="/employee/passes/new" element={<EmployeePortal section="pass-form" />} />
          <Route path="/employee/devices/:tag" element={<DeviceDetailPage basePath="/employee" />} />
        </Route>

        {/* Security kiosk uses the whole screen instead of the workspace shell. */}
        <Route
          path="/security"
          element={(
            <RequireAuth roles={['Security']}>
              <GateStation kiosk />
            </RequireAuth>
          )}
        />

        <Route path="*" element={user ? <NotFound /> : <Navigate to="/login" replace />} />
      </Routes>
  )
}
