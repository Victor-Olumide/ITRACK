// Public password-reset request screen.

import { Link } from 'react-router'
import { ArrowLeft, Mail } from 'lucide-react'

export default function ResetPassword() {
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
          Password recovery is not available in the server API yet.
        </p>
        <p role="status" className="mt-5 rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          Contact your IT administrator to reset your password. This page will support self-service recovery when the server provides a password-reset endpoint.
        </p>
      </section>
    </main>
  )
}
