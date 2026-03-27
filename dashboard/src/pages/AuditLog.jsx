import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { HugeiconsIcon } from '@hugeicons/react'
import ArrowLeft01Icon from '@hugeicons/core-free-icons/ArrowLeft01Icon'
import ArrowRight01Icon from '@hugeicons/core-free-icons/ArrowRight01Icon'
import Audit01Icon from '@hugeicons/core-free-icons/Audit01Icon'

export default function AuditLog() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [offset, setOffset] = useState(0)
  const [dateRange, setDateRange] = useState({ period: '' })
  const limit = 30

  async function load() {
    setLoading(true)
    setError(null)
    try {
      let url = `/dashboard/audit-log?limit=${limit}&offset=${offset}`
      if (dateRange.period === 'custom' && dateRange.from && dateRange.to) {
        url += `&from=${dateRange.from}&to=${dateRange.to}`
      }
      const res = await api.get(url)
      setEntries(res.data)
    } catch (err) {
      setError(err.message || 'Failed to load audit log')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [offset, dateRange])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Audit Log</h1>
          <p className="text-[13px] text-muted-foreground mt-1">Track all actions performed in your account</p>
        </div>
        <DateRangePicker value={dateRange} onChange={(v) => { setDateRange(v); setOffset(0) }} />
      </div>

      {error ? (
        <div className="rounded-xl border bg-card shadow-card py-12 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <button onClick={load} className="mt-2 text-xs text-muted-foreground hover:text-foreground underline">
            Try again
          </button>
        </div>
      ) : loading ? (
        <div className="space-y-3">
          {[...Array(10)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
      ) : entries.length === 0 ? (
        <EmptyState
          icon={Audit01Icon}
          title="No audit events yet"
          description="Actions will be logged here as you use the platform."
        />
      ) : (
        <div className="rounded-xl border bg-card shadow-card overflow-hidden">
          <div className="divide-y divide-border/50">
            {entries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">{entry.action}</span>
                  <Badge variant="outline" className="text-[10px]">{entry.resource_type}</Badge>
                  <span className="text-xs text-muted-foreground">{entry.actor_email || 'system'}</span>
                </div>
                <span className="text-xs text-muted-foreground">{formatDate(entry.created_at)}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-border/50 px-4 py-2">
            <span className="text-xs text-muted-foreground tabular-nums">
              {offset + 1}\u2013{offset + entries.length}
            </span>
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => setOffset(Math.max(0, offset - limit))}
                disabled={offset === 0}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/30 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} size={14} strokeWidth={1.5} />
              </button>
              <button
                onClick={() => setOffset(offset + limit)}
                disabled={entries.length < limit}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/30 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <HugeiconsIcon icon={ArrowRight01Icon} size={14} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
