
import { useState } from 'react'
import { Navigate, Outlet } from 'react-router'

import Sidebar from './Sidebar'
import Topbar from './Topbar'
import Toaster from './Toaster'
import OfflineBanner from './OfflineBanner'
import { useAuth } from '../contexts/AuthContext'

export default function Layout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const { user } = useAuth()

  if (!user) return <Navigate to="/login" replace />

  return (
    <div className="flex min-h-screen flex-col bg-[#101c52]">
      <OfflineBanner />
      <Topbar
        user={user}
        role={user.role}
        onMenuClick={() => setMobileSidebarOpen((open) => !open)}
      />

      <div className="flex min-h-0 flex-1">
        <Sidebar
          role={user.role}
          mobileOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
        />

        <div className="min-w-0 flex-1 bg-[#101c52] p-0 md:p-2 lg:p-3">
          <main className="min-h-[calc(100vh-4rem)] overflow-hidden bg-[#f3f5fc] md:min-h-[calc(100vh-4.5rem)] md:rounded-xl">
            <Outlet />
          </main>
        </div>
      </div>
      <Toaster />
    </div>
  )
}
