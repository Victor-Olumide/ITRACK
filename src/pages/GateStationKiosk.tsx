import { useState } from 'react'
import { useNavigate } from 'react-router'
import { LogOut, ScanLine } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function GateStationKiosk() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [logoutError, setLogoutError] = useState('')

  const signOut = async () => {
    setLogoutError('')
    try {
      await logout()
      navigate('/login', { replace: true })
    } catch {
      setLogoutError('Could not sign out. Please try again.')
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-[#101c52] text-white">
      <header className="flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-8">
        <div className="flex items-center gap-2">
          <ScanLine size={19} className="text-[#d2f54a]" />
          <h1 className="text-lg font-bold">Gate station</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-300">{user?.name}</span>
          <button type="button" onClick={() => void signOut()} className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-2 text-xs font-semibold hover:bg-white/10">
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-2xl flex-1 items-center px-5 py-10">
        <section className="w-full rounded-2xl border border-amber-300/30 bg-white/[0.06] p-6 sm:p-8">
          <h2 className="text-lg font-semibold">Gate scanning is unavailable in v1</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            The server does not yet provide persistent gate-pass, item verification, or movement-event endpoints.
            Scanning and recording movements are disabled; no sample activity is shown.
          </p>
          {/* TODO(v2): Restore the gate scanner prototype after the pass and movement APIs are implemented. */}
          {logoutError && <p role="alert" className="mt-4 text-sm text-red-200">{logoutError}</p>}
        </section>
      </div>
    </main>
  )
}
