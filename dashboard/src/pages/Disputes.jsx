import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { StatusBadge } from '@/components/StatusBadge'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useModeChange } from '@/components/layout/ModeToggle'
import { HugeiconsIcon } from '@hugeicons/react'
import ArrowLeft01Icon from '@hugeicons/core-free-icons/ArrowLeft01Icon'
import ArrowRight01Icon from '@hugeicons/core-free-icons/ArrowRight01Icon'
import Shield01Icon from '@hugeicons/core-free-icons/Shield01Icon'

export default function Disputes() {
  const navigate = useNavigate()
  const [disputes, setDisputes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [offset, setOffset] = useState(0)
  const [total, setTotal] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')
  const limit = 20

  async function load() {
    setLoading(true)
    setError(null)
    try {
      let url = `/dashboard/disputes?limit=${limit}&offset=${offset}`
      if (statusFilter) url += `&status=${statusFilter}`
      const res = await api.get(url, { withEnv: true })
      setDisputes(Array.isArray(res.data) ? res.data : res.data)
      if (res.total !== undefined) setTotal(res.total)
    } catch (err) {
      setError(err.message || 'Failed to load disputes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [offset, statusFilter])
  const loadRef = useRef(load)
  loadRef.current = load
  useModeChange(useCallback(() => { setOffset(0); loadRef.current() }, []))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Disputes</h1>
        <p className="text-[13px] text-muted-foreground mt-1">Manage chargebacks and payment disputes</p>
      </div>

      <div className="flex items-center gap-2.5">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setOffset(0) }}
          className="h-9 rounded-xl border border-border bg-white shadow-soft px-3 text-sm text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20 transition-all duration-150"
        >
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="under_review">Under Review</option>
          <option value="won">Won</option>
          <option value="lost">Lost</option>
        </select>
        {total !== null && (
          <span className="text-[11px] text-muted-foreground ml-1">{total} total</span>
        )}
      </div>

      {error ? (
        <div className="rounded-lg border py-12 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <button onClick={load} className="mt-2 text-xs text-muted-foreground hover:text-foreground underline">
            Try again
          </button>
        </div>
      ) : loading ? (
        <div className="space-y-1.5">
          {[...Array(10)].map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
        </div>
      ) : disputes.length === 0 ? (
        statusFilter ? (
          <div className="rounded-xl border bg-card shadow-card py-16 text-center">
            <p className="text-sm text-muted-foreground">No disputes found</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Try adjusting your filter.</p>
          </div>
        ) : (
          <EmptyState
            icon={Shield01Icon}
            title="No disputes"
            description="Disputes from chargebacks will appear here."
          />
        )
      ) : (
        <div className="rounded-lg border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Transaction</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {disputes.map((dispute) => (
                <TableRow
                  key={dispute.id}
                  className="hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() => navigate(`/disputes/${dispute.id}`)}
                >
                  <TableCell className="font-medium tabular-nums">{formatCurrency(dispute.amount)}</TableCell>
                  <TableCell><StatusBadge status={dispute.status} /></TableCell>
                  <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                    {dispute.reason || '\u2014'}
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {dispute.transaction_id?.substring(0, 8)}
                    </span>
                  </TableCell>
                  <TableCell className="text-[11px] text-muted-foreground">
                    {dispute.due_date ? formatDate(dispute.due_date) : '\u2014'}
                  </TableCell>
                  <TableCell className="text-right text-[11px] text-muted-foreground">{formatDate(dispute.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between border-t border-border/50 px-4 py-2">
            <span className="text-[11px] text-muted-foreground tabular-nums">
              {offset + 1}&ndash;{offset + disputes.length}
            </span>
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => setOffset(Math.max(0, offset - limit))}
                disabled={offset === 0}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/30 disabled:opacity-20 transition-colors"
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
              </button>
              <button
                onClick={() => setOffset(offset + limit)}
                disabled={disputes.length < limit}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/30 disabled:opacity-20 transition-colors"
              >
                <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
