import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'

export function TrendChart({ data, loading }) {
  if (loading) {
    return <Skeleton className="h-44 w-full rounded-lg" />
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-44 flex items-center justify-center">
        <p className="text-xs text-muted-foreground">No data for this period</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={176}>
      <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -12 }}>
        <defs>
          <linearGradient id="successGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity={0.15} />
            <stop offset="100%" stopColor="#10b981" stopOpacity={0.01} />
          </linearGradient>
          <linearGradient id="failedGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity={0.15} />
            <stop offset="100%" stopColor="#ef4444" stopOpacity={0.01} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: 'hsl(220, 9%, 60%)' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: 'hsl(220, 9%, 60%)' }}
          axisLine={false}
          tickLine={false}
          width={44}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid hsl(220, 13%, 91%)',
            borderRadius: '8px',
            fontSize: '12px',
            padding: '8px 12px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
          }}
        />
        <Area
          type="monotone"
          dataKey="success_count"
          name="Success"
          stackId="1"
          stroke="#10b981"
          fill="url(#successGradient)"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="failed_count"
          name="Failed"
          stackId="1"
          stroke="#ef4444"
          fill="url(#failedGradient)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
