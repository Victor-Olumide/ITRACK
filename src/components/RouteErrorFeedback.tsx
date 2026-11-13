import { AlertTriangle, ArrowLeft, ArrowRight, CircleHelp, Home } from 'lucide-react'
import { Link, isRouteErrorResponse, useNavigate, useRouteError } from 'react-router'
import { homePathForRole, useAuth } from '../contexts/AuthContext'

const feedbackByStatus: Record<number, { title: string; message: string }> = {
  400: { title: 'That request could not be completed.', message: 'Check the information and try again.' },
  401: { title: 'Your session needs attention.', message: 'Sign in again to continue.' },
  403: { title: 'You do not have access to this page.', message: 'Return to your workspace or contact your IT administrator.' },
  404: { title: 'This page went missing.', message: 'We could not find the page you requested.' },
  429: { title: 'Please slow down for a moment.', message: 'Too many requests were made. Try again shortly.' },
  500: { title: 'Something went wrong.', message: 'The page could not be displayed. Please try again.' },
}

export default function RouteErrorFeedback({ status: statusProp }: { status?: number }) {
  const error = useRouteError()
  const navigate = useNavigate()
  const { user } = useAuth()
  const status = statusProp ?? (isRouteErrorResponse(error) ? error.status : 500)
  const feedback = feedbackByStatus[status] ?? {
    title: status >= 500 ? 'The service is temporarily unavailable.' : 'The request could not be completed.',
    message: 'Please try again or return to your workspace.',
  }
  const homePath = user ? homePathForRole(user.role) : '/login'
  const isAuthError = status === 401

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0c194d] p-5">
      <div aria-hidden="true" className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />
      <div aria-hidden="true" className="absolute -bottom-40 -right-20 h-96 w-96 rounded-full bg-lime-400/10 blur-3xl" />
      <section className="relative w-full max-w-2xl rounded-[30px] bg-[#f4f6fc] px-6 py-12 text-center shadow-2xl sm:px-12">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-[#3155ff]">
          {status === 404 ? <CircleHelp size={28} /> : <AlertTriangle size={28} />}
        </div>
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-[#3155ff]">ITrack · Error {status}</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[#101a3b] sm:text-4xl">{feedback.title}</h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-600">{feedback.message}</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link to={isAuthError ? '/login' : homePath} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#3155ff] px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700">
            <Home size={16} />
            {isAuthError || !user ? 'Sign in' : 'Back to workspace'}
            <ArrowRight size={15} />
          </Link>
          <button type="button" onClick={() => navigate(-1)} className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-[#101a3b] transition hover:bg-slate-50">
            <ArrowLeft size={16} /> Go back
          </button>
        </div>
      </section>
    </main>
  )
}
