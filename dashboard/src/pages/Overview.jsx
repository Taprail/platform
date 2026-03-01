import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { StatusBadge } from '@/components/StatusBadge'
import { api } from '@/lib/api'
import { formatCurrency, formatDateShort } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowRight } from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export default function Overview() {
  const [stats, setStats] = useState(null)
  const [chart, setChart] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [statsRes, chartRes, txnRes] = await Promise.all([
        api.get('/dashboard/overview'),
        api.get('/dashboard/overview/chart?period=7d'),
        api.get('/dashboard/transactions?limit=5'),
      ])
      setStats(statsRes.data)
      setChart(chartRes.data)
      setTransactions(txnRes.data)
    } catch (err) {
      setError(err.message || 'Failed to load overview')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Overview</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">Your payment activity at a glance</p>
      </div>

      {error && (
        <div className="rounded-lg border bg-white py-12 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <button onClick={load} className="mt-2 text-xs text-muted-foreground hover:text-foreground underline">
            Try again
          </button>
        </div>
      )}

      {/* Metrics */}
      {!error && <><div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total volume', value: stats ? formatCurrency(stats.total_volume) : '-', change: stats?.volume_change_pct },
          { label: 'Transactions', value: stats?.total_transactions?.toLocaleString() || '-', change: stats?.txn_count_change_pct },
          { label: 'Success rate', value: stats ? `${stats.success_rate.toFixed(1)}%` : '-' },
          { label: 'Active sessions', value: stats?.active_sessions?.toString() || '-' },
        ].map((m) => (
          <div key={m.label} className="rounded-lg border bg-white px-5 py-4">
            {loading ? (
              <>
                <Skeleton className="h-3 w-16 mb-2" />
                <Skeleton className="h-7 w-24" />
              </>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">{m.label}</p>
                <p className="text-2xl font-semibold tabular-nums mt-1">{m.value}</p>
                {m.change !== undefined && (
                  <p className={`text-xs mt-0.5 tabular-nums ${m.change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {m.change >= 0 ? '+' : ''}{m.change.toFixed(1)}%
                  </p>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {/* Chart + Recent */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-lg border bg-white p-5">
          <p className="text-xs text-muted-foreground mb-4">Volume — 7 days</p>
          {loading ? (
            <Skeleton className="h-44 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={176}>
              <AreaChart data={chart} margin={{ top: 0, right: 0, bottom: 0, left: -12 }}>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  width={44}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                    fontSize: '11px',
                    padding: '6px 10px',
                    boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="volume"
                  stroke="hsl(var(--foreground))"
                  fill="hsl(var(--foreground) / 0.04)"
                  strokeWidth={1.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-lg border bg-white">
          <div className="flex items-center justify-between px-5 py-3.5 border-b">
            <p className="text-xs text-muted-foreground">Recent transactions</p>
            <Link to="/transactions" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              View all
            </Link>
          </div>
          {loading ? (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
            </div>
          ) : transactions.length === 0 ? (
            <p className="text-xs text-muted-foreground px-5 py-8 text-center">No transactions yet</p>
          ) : (
            <div className="divide-y">
              {transactions.map((txn) => (
                <Link
                  key={txn.id}
                  to={`/transactions/${txn.id}`}
                  className="flex items-center justify-between px-5 py-2.5 hover:bg-zinc-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium tabular-nums">{formatCurrency(txn.amount)}</span>
                    <StatusBadge status={txn.status} />
                  </div>
                  <span className="text-xs text-muted-foreground">{formatDateShort(txn.created_at)}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div></>}
    </div>
  )
}
