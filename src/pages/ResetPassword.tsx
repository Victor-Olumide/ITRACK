// W02 reset password. Without a token: ask the IT desk for a reset link (there
// is no email provider, so the request alerts the IT admins). With a token from
// that link: choose a new password.
import { useState, type SubmitEvent } from 'react'
import { Link, useSearchParams } from 'react-router'
import { ArrowLeft, CheckCircle2, KeyRound, Mail } from 'lucide-react'
import { getApiErrorMessage } from '../lib/api/error-message'
import { useConfirmPasswordResetMutation, useRequestPasswordResetMutation } from '../lib/api/auth/password-reset-api'

const MIN_PASSWORD = 8
const input = 'mt-1.5 h-11 w-full rounded-xl border border-[#d4daea] px-3 text-sm outline-none focus:border-[#3155ff] focus:ring-2 focus:ring-blue-100'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f3f5fc] px-4 py-8">
      <section className="w-full max-w-md rounded-3xl border border-[#e9edf6] bg-white p-6 shadow-sm sm:p-8">
        <Link to="/login" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-[#3155ff]">
          <ArrowLeft size={15} /> Back to sign in
        </Link>
        {token ? <ChooseNewPassword token={token} /> : <RequestReset />}
      </section>
    </main>
  )
}

function RequestReset() {
  const [email, setEmail] = useState('')
  const [request, state] = useRequestPasswordResetMutation()
  const [sentMessage, setSentMessage] = useState('')
  const [error, setError] = useState('')

  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    try {
      const result = await request({ email: email.trim() }).unwrap()
      setSentMessage(result.message)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Your request could not be sent. Try again in a minute.'))
    }
  }

  return (
    <>
      <div className="mt-7 flex h-11 w-11 items-center justify-center rounded-xl bg-[#edf1ff] text-[#3155ff]">
        <Mail size={21} />
      </div>
      <h1 className="mt-5 text-2xl font-bold text-[#111a3b]">Reset your password</h1>
      {sentMessage ? (
        <div role="status" className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
          <p>{sentMessage}</p>
          <p className="mt-2">The link they send you works once and expires after an hour. If you need it sooner, contact the IT desk.</p>
        </div>
      ) : (
        <>
          <p className="mt-2 text-sm leading-6 text-slate-500">Enter your work email and the IT desk will send you a link to choose a new password.</p>
          <form onSubmit={submit} className="mt-5 space-y-4">
            <label className="block text-xs font-semibold text-slate-600">
              Work email
              <input type="email" required autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@abuad.edu.ng" className={input} />
            </label>
            {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
            <button type="submit" disabled={state.isLoading} className="w-full rounded-full bg-[#3155ff] py-3 text-sm font-semibold text-white disabled:opacity-60">
              {state.isLoading ? 'Sending…' : 'Ask for a reset link'}
            </button>
          </form>
        </>
      )}
    </>
  )
}

function ChooseNewPassword({ token }: { token: string }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirmValue] = useState('')
  const [show, setShow] = useState(false)
  const [confirmReset, state] = useConfirmPasswordResetMutation()
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const mismatch = confirm.length > 0 && confirm !== password

  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    if (password.length < MIN_PASSWORD) return setError(`Use at least ${MIN_PASSWORD} characters.`)
    if (password !== confirm) return setError('The two passwords do not match.')
    try {
      await confirmReset({ token, newPassword: password }).unwrap()
      setDone(true)
    } catch (err) {
      setError(getApiErrorMessage(err, 'This reset link is invalid or has expired. Ask the IT desk for a new one.'))
    }
  }

  if (done) {
    return (
      <div className="mt-7">
        <CheckCircle2 size={36} className="text-emerald-600" />
        <h1 className="mt-4 text-2xl font-bold text-[#111a3b]">Password updated</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">You've been signed out on every device. Sign in with your new password.</p>
        <Link to="/login" className="mt-5 block w-full rounded-full bg-[#3155ff] py-3 text-center text-sm font-semibold text-white">Sign in</Link>
      </div>
    )
  }

  return (
    <>
      <div className="mt-7 flex h-11 w-11 items-center justify-center rounded-xl bg-[#edf1ff] text-[#3155ff]">
        <KeyRound size={21} />
      </div>
      <h1 className="mt-5 text-2xl font-bold text-[#111a3b]">Choose a new password</h1>
      <p className="mt-2 text-sm leading-6 text-slate-500">This link works once. Using it signs you out everywhere else.</p>
      <form onSubmit={submit} className="mt-5 space-y-4">
        <label className="block text-xs font-semibold text-slate-600">
          New password
          <input type={show ? 'text' : 'password'} required minLength={MIN_PASSWORD} maxLength={128} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className={input} />
          <span className="mt-1 block font-normal text-slate-400">At least {MIN_PASSWORD} characters.</span>
        </label>
        <label className="block text-xs font-semibold text-slate-600">
          Confirm new password
          <input type={show ? 'text' : 'password'} required autoComplete="new-password" value={confirm} onChange={(event) => setConfirmValue(event.target.value)} aria-invalid={mismatch} className={input} />
          {mismatch && <span className="mt-1 block font-normal text-red-600">Passwords do not match.</span>}
        </label>
        <label className="flex items-center gap-2 text-xs text-slate-600">
          <input type="checkbox" checked={show} onChange={(event) => setShow(event.target.checked)} className="size-4 accent-[#3155ff]" /> Show passwords
        </label>
        {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
        <button type="submit" disabled={state.isLoading} className="w-full rounded-full bg-[#3155ff] py-3 text-sm font-semibold text-white disabled:opacity-60">
          {state.isLoading ? 'Saving…' : 'Set new password'}
        </button>
      </form>
    </>
  )
}
