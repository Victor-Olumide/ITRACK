import { Activity, Bell, Clock3, Cpu, MapPin } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useGetDashboardSummaryQuery } from '../lib/api/dashboard/dashboard-api'
import type { PublicUser } from '../types/types'

interface AdminWorkspaceProps {
  section: string
  viewer?: PublicUser | null
}

function PageHeading({ icon: Icon, title, description }: {
  icon: LucideIcon
  title: string
  description: string
}) {
  return (
    <header>
      <div className="flex items-center gap-2">
        <Icon size={19} className="text-[#3155ff]" />
        <h1 className="text-2xl font-bold tracking-tight text-[#111a3b]">{title}</h1>
      </div>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </header>
  )
}

function NotAvailable({ section, icon: Icon, title, description }: {
  section: string
  icon: LucideIcon
  title: string
  description: string
}) {
  return (
    <main className="min-h-full px-4 py-5 sm:px-6 sm:py-6 lg:px-7">
      <PageHeading icon={Icon} title={title} description={description} />
      {/* TODO(v2): Restore the prototype UI for this section when its persistent API is available. */}
      <section role="status" className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950">
        <h2 className="text-sm font-semibold">Unavailable in v1</h2>
        <p className="mt-1 text-sm leading-6 text-amber-900">
          This {section} workflow has no supported v1 API. Its prototype UI is disabled; no local or sample data is shown.
        </p>
      </section>
    </main>
  )
}

function Categories() {
  const summaryQuery = useGetDashboardSummaryQuery()
  const categories = summaryQuery.data?.categoryBreakdown ?? []

  return (
    <main className="min-h-full px-4 py-5 sm:px-6 sm:py-6 lg:px-7">
      <PageHeading
        icon={Clock3}
        title="Categories and SLA"
        description="Read-only ticket category counts from the v1 dashboard API."
      />
      {summaryQuery.isError && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">Category data could not be loaded.</p>}
      <section className="mt-5 overflow-hidden rounded-2xl border border-[#e9edf6] bg-white">
        {summaryQuery.isLoading ? (
          <p className="p-8 text-center text-sm text-slate-500">Loading category counts…</p>
        ) : categories.length ? (
          <div className="divide-y divide-[#edf0f7]">
            {categories.map(({ categoryId, category, count }) => (
              <div key={categoryId} className="flex items-center justify-between gap-3 px-5 py-4">
                <span className="text-sm font-semibold text-[#202844]">{category}</span>
                <span className="rounded-full bg-[#f0f2f8] px-2.5 py-1 text-xs font-semibold text-slate-600">{count} tickets</span>
              </div>
            ))}
          </div>
        ) : !summaryQuery.isError ? (
          <p className="p-8 text-center text-sm text-slate-500">No ticket category data is available.</p>
        ) : null}
      </section>
      {/* TODO(v2): Re-enable category management and SLA policy controls after those APIs are implemented. */}
      <p role="status" className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
        Category editing and SLA policies are not available in the current v1 API.
      </p>
    </main>
  )
}

export default function AdminWorkspace({ section }: AdminWorkspaceProps) {
  if (section === 'categories') return <Categories />
  if (section === 'locations') {
    return <NotAvailable section="location management" icon={MapPin} title="Locations" description="Manage physical locations for assets." />
  }
  if (section === 'audit') {
    return <NotAvailable section="audit trail" icon={Activity} title="Audit trail" description="Review administrative and security activity." />
  }
  if (section === 'models') {
    return <NotAvailable section="3D model library" icon={Cpu} title="3D model library" description="Manage reusable device models." />
  }
  if (section === 'notifications') {
    return <NotAvailable section="notifications" icon={Bell} title="Notifications" description="Review alerts and notification history." />
  }
  return null
}
