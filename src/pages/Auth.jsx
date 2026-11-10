import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Monitor } from 'lucide-react'
import Logo from '../components/Logo'
import { DEMO_PASSWORD, homePathForRole, useAuth } from '../contexts/AuthContext'
import { metrics } from '../lib/mockData'

// ── reusable input ─────────────────────────────────────────────
function Field({ label, id, type = 'text', placeholder, value, onChange, right }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete="off"
          className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-sm
                     text-gray-800 placeholder:text-gray-400
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     transition"
        />
        {right && (
          <div className="absolute inset-y-0 right-3 flex items-center">{right}</div>
        )}
      </div>
    </div>
  )
}

// ── Login form ────────────────────────────────────────────────
function LoginForm() {
  const { users, login } = useAuth()
  const navigate = useNavigate()
  const [email,    setEmail]    = useState(users[0]?.email ?? '')
  const [password, setPassword] = useState('')
  const [show,     setShow]     = useState(false)
  const [remember, setRemember] = useState(true)
  const [error,    setError]    = useState('')

  const handleSubmit = e => {
    e.preventDefault()
    if (!login(email, password)) {
      setError('Email or password is incorrect.')
      return
    }
    const user = users.find((item) => item.email.toLowerCase() === email.trim().toLowerCase())
    navigate(homePathForRole(user.role), { replace: true })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Sign in</h2>
        <p className="text-sm text-gray-500 mt-0.5">
            Sign in with an account provided by your IT Admin.
        </p>
      </div>

        <label htmlFor="demo-user" className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Demo account
          <select
            id="demo-user"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800"
          >
            {users.map((user) => (
              <option key={user.id} value={user.email}>{user.name} · {user.role}</option>
            ))}
          </select>
        </label>

        <Field
          label="Work email"
          id="email"
          type="email"
          placeholder="you@abuad.edu.ng"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />

      <Field
        label="Password"
        id="password"
        type={show ? 'text' : 'password'}
        placeholder="••••••••••••"
        value={password}
        onChange={e => setPassword(e.target.value)}
        right={
          <button
            type="button"
            onClick={() => setShow(p => !p)}
            className="text-xs text-gray-500 hover:text-gray-800 font-medium"
          >
            {show ? 'Hide' : 'Show'}
          </button>
        }
      />

      {/* Remember + Forgot */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={remember}
            onChange={e => setRemember(e.target.checked)}
            className="w-4 h-4 rounded accent-blue-600"
          />
          Remember this workstation
        </label>
        <Link to="/forgot-password" className="text-sm text-blue-600 hover:underline">
          Forgot password?
        </Link>
      </div>

      <button
        type="submit"
        className="w-full py-3 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-95
                   text-white font-semibold text-sm tracking-wide transition-all"
      >
        Sign in
      </button>
      {error && (
        <p role="alert" className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs leading-5 text-red-700">
          {error}
        </p>
      )}

      <div className="flex items-start gap-2 p-3 rounded-lg bg-gray-50 border border-gray-100">
        <Monitor className="mt-0.5 text-gray-400 shrink-0" size={18} />
        <p className="text-xs text-gray-500">
          Demo mode only: seeded accounts use <span className="font-semibold text-gray-700">{DEMO_PASSWORD}</span>.
          Created accounts use the password set by the admin.
        </p>
      </div>
    </form>
  )
}

// ── Main Auth page ────────────────────────────────────────────
export default function Auth() {
  return (
    <div className="min-h-screen flex">

      {/* ── Left panel ── */}
      <div className="hidden md:flex md:w-5/12 lg:w-2/5 bg-linear-to-br from-[#0B184C] to-[#0A174B] flex-col justify-between p-10 relative overflow-hidden">
        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <Logo size={42} />
          <span className="text-white text-xl font-bold tracking-wide">ITrack</span>
        </div>

        {/* Hero copy */}
        <div className="relative z-10">
          <h1 className="text-4xl lg:text-5xl font-extrabold text-white leading-tight">
            Report it.<br />
            Track it.<br />
            <span className="text-[#CCF326]">Get it fixed.</span>
          </h1>
          <p className="mt-4 text-sm text-gray-400 leading-relaxed max-w-xs">
            One place for IT problems, every device the university owns, and the passes that let them leave the gate.
          </p>
          <div className="mt-8 grid max-w-sm grid-cols-3 gap-3">
            {[
              [String(metrics.devicesTotal), 'devices tracked'],
              [`${metrics.avgResolutionHours ?? '—'} h`, 'average fix time'],
              [`${metrics.slaMetPercentage}%`, 'on time this month'],
            ].map(([value, label]) => (
              <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-xl font-bold text-white">{value}</p>
                <p className="mt-1 text-[10px] leading-4 text-gray-400">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex items-center gap-2 text-xs text-gray-500">
          <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
          Connected to itrack.company.ng
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 bg-gray-100 flex flex-col items-center justify-center p-6">

        {/* Mobile logo */}
        <div className="flex md:hidden items-center gap-2 mb-8">
          <Logo size={36} />
          <span className="text-[#0a1628] text-lg font-bold">ITrack</span>
        </div>

        {/* Card */}
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

          <LoginForm />
        </div>

        {/* <p className="mt-4 text-xs text-gray-400">Version 1.0.0</p> */}
      </div>
    </div>
  )
}
