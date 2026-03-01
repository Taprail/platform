import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { StatusBadge } from '@/components/StatusBadge'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Transactions() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [offset, setOffset] = useState(0)
  const [statusFilter, setStatusFilter] = useState('')
  const [total, setTotal] = useState(null)
  const limit = 20

  async function load() {
    setLoading(true)
    setError(null)
    try {
      let url = `/dashboard/transactions?limit=${limit}&offset=${offset}`
      if (statusFilter) url += `&status=${statusFilter}`
      const res = await api.get(url)
      setTransactions(Array.isArray(res.data) ? res.data : res.data)
      if (res.total !== undefined) setTotal(res.total)
    } catch (err) {
      setError(err.message || 'Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [offset, statusFilter])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Transactions</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">View and manage payment transactions</p>
      </div>

      <div className="flex items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setOffset(0) }}
          className="h-9 rounded-md border border-input bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">All statuses</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
          <option value="pending">Pending</option>
        </select>
        {total !== null && (
          <span className="text-xs text-muted-foreground">{total} total</span>
        )}
      </div>

      {error ? (
        <div className="rounded-lg border bg-white py-12 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <button onClick={load} className="mt-2 text-xs text-muted-foreground hover:text-foreground underline">
            Try again
          </button>
        </div>
      ) : loading ? (
        <div className="space-y-2">
          {[...Array(10)].map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
        </div>
      ) : transactions.length === 0 ? (
        <div className="rounded-lg border bg-white py-16 text-center">
          <p className="text-sm text-muted-foreground">No transactions yet</p>
          <p className="text-xs text-muted-foreground mt-1">They'll appear here once you start processing payments.</p>
        </div>
      ) : (
        <div className="rounded-lg border bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Amount</TableHead>
                <TableHead>Net</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead className="text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((txn) => (
                <TableRow key={txn.id} className="hover:bg-zinc-50">
                  <TableCell className="font-medium tabular-nums">{formatCurrency(txn.amount)}</TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">{formatCurrency(txn.net_amount)}</TableCell>
                  <TableCell><StatusBadge status={txn.status} /></TableCell>
                  <TableCell>
                    <Link to={`/transactions/${txn.id}`} className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors">
                      {txn.id.substring(0, 8)}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {txn.merchant_ref || txn.payment_reference || '—'}
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">{formatDate(txn.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between border-t px-4 py-2">
            <span className="text-xs text-muted-foreground tabular-nums">
              {offset + 1}–{offset + transactions.length}
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
                disabled={transactions.length < limit}
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
