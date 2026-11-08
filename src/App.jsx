import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router'
import Sidebar   from './components/Sidebar'
import Topbar    from './components/Topbar'
import Auth      from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Projects  from './pages/Projects'
import Issues    from './pages/Issues'
import Team      from './pages/Team'
import Settings  from './pages/Settings'
import NotFound  from './pages/NotFound'

// Shell: sidebar + topbar + scrollable content area
function AppShell({ children }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth — full-screen, no chrome */}
        <Route path="/login"  element={<Auth />} />
        <Route path="/signup" element={<Auth />} />

        {/* App shell routes */}
        <Route path="/"         element={<AppShell><Dashboard /></AppShell>} />
        <Route path="/issues"   element={<AppShell><Issues /></AppShell>}    />
        <Route path="/projects" element={<AppShell><Projects /></AppShell>}  />
        <Route path="/team"     element={<AppShell><Team /></AppShell>}      />
        <Route path="/settings" element={<AppShell><Settings /></AppShell>}  />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
