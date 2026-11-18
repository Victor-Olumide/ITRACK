import { Link, useNavigate } from 'react-router'
import {
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

interface TicketStatusChartProps {
  categories: Array<{ categoryId: string; category: string; count: number }>
}

export default function TicketStatusChart({
  categories,
}: TicketStatusChartProps) {
  const navigate = useNavigate()

  const data = categories.map((item) => ({ ...item, label: item.category }))

  if (!data.length) {
    return (
      <p className="py-8 text-center text-sm text-slate-500">
        No ticket category data is available.
      </p>
    )
  }

  return (
    <div>
      <p className="mb-2 text-xs text-slate-500">
        Tickets created in the last 30 days.
      </p>

      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 8, bottom: 8, left: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
            />

            <XAxis
              type="category"
              dataKey="label"
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
            />

            <YAxis
              type="number"
              dataKey="count"
              width={30}
              tickLine={false}
              axisLine={false}
              fontSize={11}
            />

            <Tooltip />

            <Bar
              dataKey="count"
              name="Tickets"
              radius={[8, 8, 0, 0]}
              barSize={28}
              cursor="pointer"
              onClick={(_bar, index) => {
                const selected = data[index]

                if (selected) {
                  navigate(`/tickets?category=${encodeURIComponent(selected.categoryId)}`)
                }
              }}
            >
              {data.map((item, index) => <Cell key={item.categoryId} fill={['#3155ff', '#c9f83b', '#ff8a65', '#7c5cff', '#20b6a8', '#f5b942'][index % 6]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Accessible navigation alternative to clicking the chart. */}
      <div className="mt-3 flex flex-wrap gap-2">
        {data.map((item) => (
          <Link
            key={item.categoryId}
            to={`/tickets?category=${encodeURIComponent(item.categoryId)}`}
            className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
          >
            {item.label}: {item.count}
          </Link>
        ))}
      </div>
    </div>
  )
}
