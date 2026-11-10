// src/components/Layout.jsx
// App shell: navy sidebar + topbar + scrollable content area.
// Uses <Outlet /> so nested routes render here.

import { Outlet } from 'react-router'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-[#f4f6fc]">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
