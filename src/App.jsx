// src/App.jsx
// App routing. Auth routes render full-screen (no chrome); every other
// route is nested under <Layout />, which renders the sidebar + topbar and
// an <Outlet /> for the active page.

import { BrowserRouter, Routes, Route } from 'react-router'
import Layout from './components/Layout'
import Auth from './pages/Auth'
import Home from './pages/Home'
import Tickets from './pages/Tickets'
import Devices from './pages/Devices'
import RegisterDevice from './pages/RegisterDevice'
import DeviceDetailPage from './pages/DeviceDetailPage'
import Stock from './pages/Stock'
import GatePasses from './pages/GatePasses'
import GateStation from './pages/GateStation'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth — full-screen, no chrome */}
        <Route path="/login" element={<Auth />} />
        <Route path="/signup" element={<Auth />} />

        {/* App shell routes — sidebar + topbar via <Layout /> */}
        <Route element={<Layout />}>
          <Route path="/"                  element={<Home />} />
          <Route path="/tickets"           element={<Tickets />} />
          <Route path="/devices"           element={<Devices />} />
          <Route path="/devices/register"  element={<RegisterDevice />} />
          <Route path="/devices/:tag"      element={<DeviceDetailPage />} />
          <Route path="/stock"             element={<Stock />} />
          <Route path="/passes"            element={<GatePasses />} />
          <Route path="/gate"              element={<GateStation />} />
          <Route path="/reports"           element={<Reports />} />
          <Route path="/settings"         element={<Settings />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
