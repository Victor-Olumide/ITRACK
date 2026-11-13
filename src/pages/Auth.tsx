import { useState } from 'react'
import type { ChangeEvent, FormEvent, ReactNode } from 'react'
import { useNavigate } from 'react-router'
import Logo from '../components/Logo'
import { homePathForRole, useAuth } from '../contexts/AuthContext'
import { getLoginErrorMessage } from '../lib/api/auth/login-errors'

// ── reusable input ─────────────────────────────────────────────
interface FieldProps {
  label: string
  id: string
  type?: string
  placeholder?: string
  value: string
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  right?: ReactNode
}

function Field({ label, id, type = 'text', placeholder, value, onChange, right }: FieldProps) {
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
          autoComplete={type === 'password' ? 'current-password' : 'username'}
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
  const { login, sessionExpired } = useAuth()
  const navigate = useNavigate()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [show,     setShow]     = useState(false)
  const [error,    setError]    = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      const user = await login(email, password)
      navigate(homePathForRole(user.role), { replace: true })
    } catch (loginError) {
      setError(getLoginErrorMessage(loginError))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Sign in</h2>
        <p className="text-sm text-gray-500 mt-0.5">
            Sign in with an account provided by your IT Admin.
        </p>
      </div>

      {sessionExpired && (
        <p role="status" className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
          Your session expired. Please sign in again.
        </p>
      )}

        <Field
          label="Work email"
          id="email"
          type="email"
          placeholder="you@abuad.edu.ng"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <Field
        label="Password"
        id="password"
        type={show ? 'text' : 'password'}
        placeholder="••••••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
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

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-95
                   text-white font-semibold text-sm tracking-wide transition-all disabled:cursor-wait disabled:opacity-60"
      >
        {isSubmitting ? 'Signing in…' : 'Sign in'}
      </button>
      {error && (
        <p role="alert" className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs leading-5 text-red-700">
          {error}
        </p>
      )}

    </form>
  )
}

// ── Main Auth page ────────────────────────────────────────────
export default function Auth() {
  return (
    <div className="min-h-screen flex">

      {/* ── Left panel ── */}
      <div className="hidden md:flex md:w-5/12 lg:w-2/5 bg-linear-to-br from-[#0B184C] to-[#0A174B] flex-col gap-5 px-10 py-35 relative overflow-hidden">
        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <Logo size={42} />
          <span className="text-white text-xl font-bold tracking-wide">ITrack</span>
        </div>

        {/* Hero copy */}
        <div className="relative z-10">
          <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight">
            Report it.<br />
            Track it.<br />
            <span className="text-[#CCF326]">Get it fixed.</span>
          </h1>
          <p className="mt-4 text-md text-gray-400 leading-relaxed max-w-xs">
            One place to report IT problems, track devices, and follow support requests.
          </p>
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
