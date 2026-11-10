// Public password-reset request screen.

import { useState } from 'react'
import { Link } from 'react-router'
import { ArrowLeft, Mail } from 'lucide-react'

export default function ResetPassword() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f3f5fc] px-4 py-8">
      <section className="w-full max-w-md rounded-3xl border border-[#e9edf6] bg-white p-6 shadow-sm sm:p-8">
        <Link to="/login" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-[#3155ff]">
          <ArrowLeft size={15} /> Back to sign in
        </Link>
        <div className="mt-7 flex h-11 w-11 items-center justify-center rounded-xl bg-[#edf1ff] text-[#3155ff]">
          <Mail size={21} />
        </div>
        <h1 className="mt-5 text-2xl font-bold text-[#111a3b]">Reset your password</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Enter your university email and we’ll help you get back into ITrack.
        </p>
        {submitted ? (
          <p role="status" className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-800">
            Password reset email delivery is not connected in this demo. Contact the IT desk for help.
          </p>
        ) : (
          <form
            className="mt-6 space-y-4"
            onSubmit={(event) => {
              event.preventDefault()
              setSubmitted(true)
            }}
          >
            <label className="block text-xs font-semibold text-slate-600">
              University email
              <input
                autoComplete="email"
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[#e3e8f2] px-3 py-3 text-sm font-normal text-[#202844] outline-none focus:border-blue-400"
              />
            </label>
            <button type="submit" className="w-full rounded-full bg-[#3155ff] px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700">
              Send reset instructions
            </button>
          </form>
        )}
      </section>
    </main>
  )
}
