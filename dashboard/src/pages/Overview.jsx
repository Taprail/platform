import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import DollarCircleIcon from '@hugeicons/core-free-icons/DollarCircleIcon'
import ArrowRight01Icon from '@hugeicons/core-free-icons/ArrowRight01Icon'
import AnalyticsUpIcon from '@hugeicons/core-free-icons/AnalyticsUpIcon'
import AnalyticsDownIcon from '@hugeicons/core-free-icons/AnalyticsDownIcon'
import Invoice01Icon from '@hugeicons/core-free-icons/Invoice01Icon'
import MoneyReceiveCircleIcon from '@hugeicons/core-free-icons/MoneyReceiveCircleIcon'
import CheckmarkCircle02Icon from '@hugeicons/core-free-icons/CheckmarkCircle02Icon'
import Activity01Icon from '@hugeicons/core-free-icons/Activity01Icon'
import ChartBarIncreasingIcon from '@hugeicons/core-free-icons/ChartBarIncreasingIcon'
import { StatusBadge } from '@/components/StatusBadge'
import { GettingStartedChecklist } from '@/components/onboarding/GettingStartedChecklist'
import { WelcomeModal } from '@/components/onboarding/WelcomeModal'
import { useOnboarding } from '@/hooks/use-onboarding'
import { api } from '@/lib/api'
import { formatCurrency, formatDateShort } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { useModeChange } from '@/components/layout/ModeToggle'
import { VolumeChart } from '@/components/charts/VolumeChart'
import { StatusBreakdownChart } from '@/components/charts/StatusBreakdownChart'
import { TrendChart } from '@/components/charts/TrendChart'
import { cn } from '@/lib/utils'

const METRICS_CONFIG = [
  {
    key: 'volume',
    label: 'Total volume',
    format: 'currency',
    field: 'total_volume',
    changeField: 'volume_change_pct',
    icon: DollarCircleIcon,
    color: 'bg-primary/8 text-primary',
  },
  {
    key: 'count',
    label: 'Transactions',
    format: 'number',
    field: 'total_transactions',
    changeField: 'txn_count_change_pct',
    icon: Invoice01Icon,
    color: 'bg-violet-500/8 text-violet-600',
  },
  {
    key: 'revenue',
    label: 'Revenue (fees)',
    format: 'currency',
    field: 'revenue',
    icon: MoneyReceiveCircleIcon,
    color: 'bg-emerald-500/8 text-emerald-600',
  },
  {
    key: 'rate',
    label: 'Success rate',
    format: 'percent',
    field: 'success_rate',
    icon: CheckmarkCircle02Icon,
    color: 'bg-sky-500/8 text-sky-600',
  },
  {
    key: 'active',
    label: 'Active sessions',
    format: 'number',
    field: 'active_sessions',
    icon: Activity01Icon,
    color: 'bg-amber-500/8 text-amber-600',
  },
]

function formatMetricValue(value, format) {
  if (value === undefined || value === null) return '-'
  switch (format) {
    case 'currency': return formatCurrency(value)
    case 'percent': return `${value.toFixed(1)}%`
    case 'number': return value.toLocaleString()
    default: return String(value)
  }
}

function MetricCard({ config, value, change, loading }) {
  return (
    <div className="group relative rounded-xl border bg-card p-5 shadow-card transition-all duration-200 hover:shadow-card-hover">
      {loading ? (
        <>
          <Skeleton className="h-8 w-8 rounded-lg mb-4" />
          <Skeleton className="h-3 w-16 mb-2" />
          <Skeleton className="h-7 w-24" />
        </>
      ) : (
        <>
          <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg mb-4', config.color)}>
            <HugeiconsIcon icon={config.icon} size={18} strokeWidth={1.5} />
          </div>
          <p className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider mb-1">{config.label}</p>
          <p className="text-[22px] font-semibold tabular-nums tracking-tight leading-none">{formatMetricValue(value, config.format)}</p>
          {change !== undefined && (
            <div className={cn(
              'inline-flex items-center gap-1 mt-3 px-2 py-0.5 rounded-md text-[11px] tabular-nums font-medium',
              change >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
            )}>
              <HugeiconsIcon icon={change >= 0 ? AnalyticsUpIcon : AnalyticsDownIcon} size={13} />
              {Math.abs(change).toFixed(1)}%
              <span className="text-muted-foreground/50 font-normal">vs prev</span>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function Overview() {
  const [stats, setStats] = useState(null)
  const [chart, setChart] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dateRange, setDateRange] = useState({ period: '7d' })

  const buildChartParams = useCallback((range) => {
    if (range.period === 'custom' && range.from && range.to) {
      return `from=${range.from}&to=${range.to}`
    }
    return `period=${range.period || '7d'}`
  }, [])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const chartParams = buildChartParams(dateRange)
      const [statsRes, chartRes, txnRes] = await Promise.all([
        api.get('/dashboard/overview', { withEnv: true }),
        api.get(`/dashboard/overview/chart?${chartParams}`, { withEnv: true }),
        api.get('/dashboard/transactions?limit=5', { withEnv: true }),
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

  useEffect(() => { load() }, [dateRange])
  const loadRef = useRef(load)
  loadRef.current = load
  useModeChange(useCallback(() => loadRef.current(), []))

  const onboarding = useOnboarding(stats)

  const periodLabel = dateRange.period === 'custom'
    ? 'Custom range'
    : dateRange.period === '30d' ? '30 days' : dateRange.period === '90d' ? '90 days' : '7 days'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Overview</h1>
          <p className="text-[13px] text-muted-foreground mt-1">Your payment activity at a glance</p>
        </div>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      {error && (
        <div className="rounded-xl border bg-card py-12 text-center shadow-card">
          <p className="text-sm text-destructive">{error}</p>
          <button onClick={load} className="mt-2 text-xs text-muted-foreground hover:text-foreground underline">
            Try again
          </button>
        </div>
      )}

      {!error && !onboarding.isComplete && !onboarding.isDismissed && (
        <div className={cn(
          onboarding.steps.filter(s => s.complete).length === 0 && 'border-l-4 border-l-primary rounded-l-none'
        )}>
          <GettingStartedChecklist steps={onboarding.steps} onDismiss={onboarding.dismiss} />
        </div>
      )}

      <WelcomeModal />

      {!error && (
        <>
          {/* Metrics */}
          <div className="grid grid-cols-5 gap-4">
            {METRICS_CONFIG.map((config) => (
              <MetricCard
                key={config.key}
                config={config}
                value={stats?.[config.field]}
                change={config.changeField ? stats?.[config.changeField] : undefined}
                loading={loading}
              />
            ))}
          </div>

          {/* Volume Chart + Recent Transactions */}
          <div className="grid gap-5 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-xl border bg-card shadow-card overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border/40">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/8 text-primary">
                    <HugeiconsIcon icon={ChartBarIncreasingIcon} size={15} strokeWidth={1.5} />
                  </div>
                  <p className="text-[13px] font-semibold text-foreground">Volume</p>
                  <span className="text-[11px] text-muted-foreground/50 font-medium">{periodLabel}</span>
                </div>
              </div>
              <div className="p-6">
                <VolumeChart data={chart} loading={loading} />
              </div>
            </div>

            <div className="rounded-xl border bg-card flex flex-col shadow-card overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
                <p className="text-[13px] font-semibold text-foreground">Recent transactions</p>
                <Link to="/transactions" className="flex items-center gap-1 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors">
                  View all
                  <HugeiconsIcon icon={ArrowRight01Icon} size={13} />
                </Link>
              </div>
              <div className="flex-1">
                {loading ? (
                  <div className="p-4 space-y-2">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-11 w-full rounded-lg" />)}
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="flex items-center justify-center h-full py-8">
                    <p className="text-xs text-muted-foreground">No transactions yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/40">
                    {transactions.map((txn) => (
                      <Link
                        key={txn.id}
                        to={`/transactions/${txn.id}`}
                        className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50">
                            <HugeiconsIcon icon={Invoice01Icon} size={14} className="text-muted-foreground/50" strokeWidth={1.5} />
                          </div>
                          <div>
                            <span className="text-sm font-semibold tabular-nums block">{formatCurrency(txn.amount)}</span>
                            <span className="text-[10px] text-muted-foreground/60">{formatDateShort(txn.created_at)}</span>
                          </div>
                        </div>
                        <StatusBadge status={txn.status} />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Status Breakdown + Trend */}
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-xl border bg-card shadow-card overflow-hidden">
              <div className="px-6 py-4 border-b border-border/40">
                <p className="text-[13px] font-semibold text-foreground">Status breakdown</p>
                <p className="text-[11px] text-muted-foreground/50 mt-0.5">Last 30 days</p>
              </div>
              <div className="p-6">
                {loading ? (
                  <Skeleton className="h-48 w-full" />
                ) : (
                  <StatusBreakdownChart
                    success={stats?.success_count || 0}
                    failed={stats?.failed_count || 0}
                    pending={stats?.pending_count || 0}
                  />
                )}
              </div>
            </div>
            <div className="rounded-xl border bg-card shadow-card overflow-hidden">
              <div className="px-6 py-4 border-b border-border/40">
                <p className="text-[13px] font-semibold text-foreground">Success vs Failed</p>
                <p className="text-[11px] text-muted-foreground/50 mt-0.5">{periodLabel}</p>
              </div>
              <div className="p-6">
                <TrendChart data={chart} loading={loading} />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
