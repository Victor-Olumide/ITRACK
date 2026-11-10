import { useState } from 'react'
import { Link } from 'react-router'
import { Monitor } from 'lucide-react'

// ── tiny SVG logo ─────────────────────────────────────────────
function Logo({ size = 40 }) {
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-xl bg-[#275AF2] flex items-center justify-center shrink-0"
    >
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="9" stroke="white" strokeWidth="2" />
        <circle cx="11" cy="7"  r="1.5" fill="#CCFF00" />
        <rect   x="10" y="10" width="2" height="6" rx="1" fill="white" />
      </svg>
    </div>
  )
}

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
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [show,     setShow]     = useState(false)
  const [remember, setRemember] = useState(true)

  const handleSubmit = e => {
    e.preventDefault()
    // TODO: wire up auth
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Sign in</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Use your work email. IT staff and Security only.
        </p>
      </div>

      <Field
        label="Work email"
        id="email"
        type="email"
        placeholder="you@company.ng"
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

      {/* Workstation hint */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-gray-50 border border-gray-100">
        <Monitor className="mt-0.5 text-gray-400 shrink-0" size={18} />
        <p className="text-xs text-gray-500">
          This computer: <span className="font-semibold text-gray-700">IT-DESK-PC03</span> · IT office.
          Gate PCs open the gate station after sign-in.
        </p>
      </div>
    </form>
  )
}

// ── Sign-up form ──────────────────────────────────────────────
function SignupForm() {
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [show,     setShow]     = useState(false)

  const handleSubmit = e => {
    e.preventDefault()
    // TODO: wire up registration
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Create account</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          IT staff and Security personnel only.
        </p>
      </div>

      <Field
        label="Full name"
        id="name"
        placeholder="Ngozi Emeka"
        value={name}
        onChange={e => setName(e.target.value)}
      />

      <Field
        label="Work email"
        id="signup-email"
        type="email"
        placeholder="you@company.ng"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />

      <Field
        label="Password"
        id="signup-password"
        type={show ? 'text' : 'password'}
        placeholder="Min. 8 characters"
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

      <Field
        label="Confirm password"
        id="confirm-password"
        type={show ? 'text' : 'password'}
        placeholder="Repeat password"
        value={confirm}
        onChange={e => setConfirm(e.target.value)}
      />

      <button
        type="submit"
        className="w-full py-3 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-95
                   text-white font-semibold text-sm tracking-wide transition-all"
      >
        Create account
      </button>
    </form>
  )
}

// ── Main Auth page ────────────────────────────────────────────
export default function Auth() {
  const [tab, setTab] = useState('login') // 'login' | 'signup'

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
            Every ticket.<br />
            Every device.<br />
            <span className="text-[#CCF326]">One desk.</span>
          </h1>
          <p className="mt-4 text-sm text-gray-400 leading-relaxed max-w-xs">
            The IT team's desktop app. It keeps running in the tray,
            so SLA alerts and gate checks reach you even when the window is closed.
          </p>
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

          {/* Tab switcher */}
          <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
            {['login', 'signup'].map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-all ${
                  tab === t
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t === 'login' ? 'Sign in' : 'Sign up'}
              </button>
            ))}
          </div>

          {tab === 'login' ? <LoginForm /> : <SignupForm />}
        </div>

        {/* <p className="mt-4 text-xs text-gray-400">Version 1.0.0</p> */}
      </div>
    </div>
  )
}
