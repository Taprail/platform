import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function AuditLog() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [offset, setOffset] = useState(0)
  const limit = 30

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get(`/dashboard/audit-log?limit=${limit}&offset=${offset}`)
      setEntries(res.data)
    } catch (err) {
      setError(err.message || 'Failed to load audit log')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [offset])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Audit Log</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">Track all actions performed in your account</p>
      </div>

      {error ? (
        <div className="rounded-lg border bg-white py-12 text-center">
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
        <div className="rounded-lg border bg-white py-12 text-center">
          <p className="text-sm text-muted-foreground">No audit events yet</p>
          <p className="text-xs text-muted-foreground mt-1">Actions will be logged here as you use the platform.</p>
        </div>
      ) : (
        <div className="rounded-lg border bg-white overflow-hidden">
          <div className="divide-y">
            {entries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">{entry.action}</span>
                  <Badge variant="outline" className="text-[10px]">{entry.resource_type}</Badge>
                  <span className="text-xs text-muted-foreground">{entry.actor_email || 'system'}</span>
                </div>
                <span className="text-xs text-muted-foreground">{formatDate(entry.created_at)}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between border-t px-4 py-2">
            <span className="text-xs text-muted-foreground tabular-nums">
              {offset + 1}–{offset + entries.length}
            </span>
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => setOffset(Math.max(0, offset - limit))}
                disabled={offset === 0}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-zinc-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setOffset(offset + limit)}
                disabled={entries.length < limit}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-zinc-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
