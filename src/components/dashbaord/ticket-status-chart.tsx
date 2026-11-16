import { Link, useNavigate } from 'react-router'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const STATUS_LABELS: Record<string, string> = {
  NEW: 'New',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In progress',
  WAITING_ON_USER: 'Waiting on user',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
}

interface TicketStatusChartProps {
  byStatus: Record<string, number>
}

export default function TicketStatusChart({
  byStatus,
}: TicketStatusChartProps) {
  const navigate = useNavigate()

  const data = Object.entries(byStatus).map(([status, count]) => ({
    status,
    label: STATUS_LABELS[status] ?? status,
    count,
  }))

  if (!data.length) {
    return (
      <p className="py-8 text-center text-sm text-slate-500">
        No ticket status data is available.
      </p>
    )
  }

  return (
    <div>
      <p className="mb-2 text-xs text-slate-500">
        Select a bar to view tickets with that status.
      </p>

      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 8, right: 16, bottom: 8, left: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={false}
            />

            <XAxis
              type="number"
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
            />

            <YAxis
              type="category"
              dataKey="label"
              width={105}
              tickLine={false}
              axisLine={false}
              fontSize={11}
            />

            <Tooltip />

            <Bar
              dataKey="count"
              name="Tickets"
              fill="#3155ff"
              radius={[0, 8, 8, 0]}
              barSize={20}
              cursor="pointer"
              onClick={(_bar, index) => {
                const selected = data[index]

                if (selected) {
                  navigate(
                    `/tickets?status=${encodeURIComponent(selected.status)}`,
                  )
                }
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Accessible navigation alternative to clicking the chart. */}
      <div className="mt-3 flex flex-wrap gap-2">
        {data.map((item) => (
          <Link
            key={item.status}
            to={`/tickets?status=${encodeURIComponent(item.status)}`}
            className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
          >
            {item.label}: {item.count}
          </Link>
        ))}
      </div>
    </div>
  )
}