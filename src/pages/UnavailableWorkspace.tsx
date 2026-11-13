import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../contexts/AuthContext'

export default function UnavailableWorkspace() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')

  const handleLogout = async () => {
    setError('')
    try {
      await logout()
      navigate('/login', { replace: true })
    } catch {
      setError('Unable to sign out. Please try again.')
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0c194d] p-5">
      <section className="w-full max-w-lg rounded-[28px] bg-[#f4f6fc] p-8 text-center sm:p-10">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#3155ff]">ITrack · v1</p>
        <h1 className="mt-3 text-2xl font-bold text-[#101a3b]">This workspace is not available yet</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          The v1 application supports Employee, Technician, and IT Admin workspaces. Contact your IT administrator for help.
        </p>
        {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <button type="button" onClick={() => void handleLogout()} className="mt-6 rounded-full bg-[#3155ff] px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700">
          Sign out
        </button>
      </section>
    </main>
  )
}
