import { Bell, Shield, UserRound } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Settings() {
  const { user } = useAuth()

  return (
    <main className="min-h-full px-4 py-5 sm:px-6 sm:py-6 lg:px-7">
      <header>
        <div className="flex items-center gap-2">
          <UserRound size={19} className="text-[#3155ff]" />
          <h1 className="text-2xl font-bold tracking-tight text-[#111a3b]">Settings</h1>
        </div>
        <p className="mt-1 text-sm text-slate-500">Account details from your authenticated server session.</p>
      </header>

      <section className="mt-5 max-w-3xl rounded-2xl border border-[#e9edf6] bg-white p-5 sm:p-6">
        <h2 className="text-base font-bold text-[#111a38]">Profile</h2>
        <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium text-slate-500">Full name</dt>
            <dd className="mt-1 text-sm font-semibold text-[#202844]">{user?.name ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500">Email</dt>
            <dd className="mt-1 text-sm font-semibold text-[#202844]">{user?.email ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500">Role</dt>
            <dd className="mt-1 text-sm font-semibold text-[#202844]">{user?.role ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500">Department</dt>
            <dd className="mt-1 text-sm font-semibold text-[#202844]">{user?.department ?? '—'}</dd>
          </div>
        </dl>
      </section>

      <section className="mt-4 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2">
        {[
          { title: 'Security settings', Icon: Shield },
          { title: 'Notification preferences', Icon: Bell },
        ].map(({ title, Icon }) => (
          <article key={title} className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950">
            <div className="flex items-center gap-2">
              <Icon size={17} />
              <h2 className="text-sm font-semibold">{title}</h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-amber-900">
              This feature is unavailable until a persistent v1 API is provided.
            </p>
          </article>
        ))}
      </section>
      {/* TODO(v2): Restore profile editing, security controls, and notification UI when their APIs are ready. */}
    </main>
  )
}
