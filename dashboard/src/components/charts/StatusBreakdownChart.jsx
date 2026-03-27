import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

const COLORS = {
  success: '#10b981',
  failed: '#ef4444',
  pending: '#f59e0b',
}

export function StatusBreakdownChart({ success = 0, failed = 0, pending = 0 }) {
  const total = success + failed + pending

  if (total === 0) {
    return (
      <div className="h-48 flex items-center justify-center">
        <p className="text-xs text-muted-foreground">No transactions</p>
      </div>
    )
  }

  const data = [
    { name: 'Success', value: success, color: COLORS.success },
    { name: 'Failed', value: failed, color: COLORS.failed },
    { name: 'Pending', value: pending, color: COLORS.pending },
  ].filter((d) => d.value > 0)

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={192}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={56}
            outerRadius={76}
            paddingAngle={3}
            dataKey="value"
            strokeWidth={0}
            cornerRadius={3}
          >
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-[26px] font-semibold tabular-nums tracking-tight">{total.toLocaleString()}</span>
        <span className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-wider">total</span>
      </div>
      <div className="flex items-center justify-center gap-5 -mt-1">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="text-[11px] text-muted-foreground font-medium">
              {d.name} <span className="text-muted-foreground/50">({d.value})</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
