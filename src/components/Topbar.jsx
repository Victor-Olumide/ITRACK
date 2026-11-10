// src/components/Topbar.jsx
// Top bar: new-ticket action, search, notifications and the signed-in user.
// User details come from mockData (currentUser) — nothing hard-coded inline.

import { Plus, Search, Bell } from 'lucide-react'
import { currentUser } from '../lib/mockData'

const initials = (name = '') =>
  name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()

export default function Topbar() {
  return (
    <header className="h-14 bg-[#0A174B] flex items-center gap-3 px-5 shrink-0">
      {/* New ticket FAB */}
      <button className="w-8 h-8 rounded-full bg-[#CDF22F] text-[#0a1628] flex items-center justify-center hover:opacity-90 shrink-0">
        <Plus size={20} />
      </button>

      {/* Search */}
      <div className="flex-1 flex items-center gap-2 bg-blue-900/35 rounded-full px-3 py-2 max-w-xl">
        <Search size={17} className="text-gray-400 shrink-0" />
        <input
          type="text"
          placeholder="Search tickets, devices, people"
          className="flex-1 bg-transparent text-sm text-gray-300 placeholder:text-gray-400 focus:outline-none"
        />
        <span className="text-xs text-gray-400 border border-gray-600 rounded px-1">/</span>
      </div>

      <div className="flex-1" />

      {/* Bell */}
      <button className="relative w-9 h-9 bg-blue-900/35 rounded-full flex items-center justify-center hover:bg-blue-900/60 text-gray-300">
        <Bell size={20} />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
      </button>

      {/* Avatar */}
      <div className="flex items-center gap-2 cursor-pointer">
        <div className="w-9 h-9 rounded-full bg-[#CDF22F] text-black text-sm font-bold flex items-center justify-center">
          {initials(currentUser.name)}
        </div>
        <div className="hidden sm:block leading-tight">
          <p className="text-sm font-semibold text-white">{currentUser.name}</p>
          <p className="text-xs text-gray-400">{currentUser.role}</p>
        </div>
      </div>
    </header>
  )
}
