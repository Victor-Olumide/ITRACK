// App shell: full-width topbar, sidebar navigation, and the active route.

import { useState } from 'react'
import { Outlet } from 'react-router'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { useAuth } from '../contexts/AuthContext'

export default function Layout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const { user } = useAuth()

  return (
    <div className="flex min-h-screen flex-col bg-[#101c52]">
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
        <div className="min-w-0 flex-1 bg-[#101c52] p-0 md:p-3 lg:p-4">
          <main className="min-h-[calc(100vh-4rem)] overflow-hidden bg-[#f3f5fc] md:min-h-[calc(100vh-5.5rem)] md:rounded-2xl">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
