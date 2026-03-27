import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { StatusBadge } from '@/components/StatusBadge'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { api } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import { HugeiconsIcon } from '@hugeicons/react'
import ArrowLeft01Icon from '@hugeicons/core-free-icons/ArrowLeft01Icon'
import ArrowRight01Icon from '@hugeicons/core-free-icons/ArrowRight01Icon'
import ArrowLeftRightIcon from '@hugeicons/core-free-icons/ArrowLeftRightIcon'
import Search01Icon from '@hugeicons/core-free-icons/Search01Icon'
import Download01Icon from '@hugeicons/core-free-icons/Download01Icon'
import { useModeChange } from '@/components/layout/ModeToggle'

export default function Transactions() {
  const navigate = useNavigate()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [offset, setOffset] = useState(0)
  const [statusFilter, setStatusFilter] = useState('')
  const [total, setTotal] = useState(null)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [dateRange, setDateRange] = useState({ period: '' })
  const limit = 20
  const debounceRef = useRef(null)

  const handleSearchChange = useCallback((e) => {
    const val = e.target.value
    setSearch(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(val)
      setOffset(0)
    }, 300)
  }, [])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      let url = `/dashboard/transactions?limit=${limit}&offset=${offset}`
      if (statusFilter) url += `&status=${statusFilter}`
      if (debouncedSearch) url += `&search=${encodeURIComponent(debouncedSearch)}`
      if (dateRange.period === 'custom' && dateRange.from && dateRange.to) {
        url += `&from=${dateRange.from}&to=${dateRange.to}`
      }
      const res = await api.get(url, { withEnv: true })
      setTransactions(Array.isArray(res.data) ? res.data : res.data)
      if (res.total !== undefined) setTotal(res.total)
    } catch (err) {
      setError(err.message || 'Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [offset, statusFilter, debouncedSearch, dateRange])
  const loadRef = useRef(load)
  loadRef.current = load
  useModeChange(useCallback(() => { setOffset(0); loadRef.current() }, []))

  const hasFilters = debouncedSearch || statusFilter || dateRange.from

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Transactions</h1>
          <p className="text-[13px] text-muted-foreground mt-1">View and manage payment transactions</p>
        </div>
        <a
          href={`${import.meta.env.VITE_API_URL || 'http://localhost:8082'}/dashboard/export?resource=transactions&env=${localStorage.getItem('taprail_mode') || 'test'}`}
          className="inline-flex items-center gap-1.5 rounded-lg border bg-white px-3.5 py-2 text-[12px] font-medium text-muted-foreground shadow-soft hover:text-foreground hover:shadow-card transition-all duration-150"
        >
          <HugeiconsIcon icon={Download01Icon} size={14} strokeWidth={1.5} />
          Export CSV
        </a>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <HugeiconsIcon icon={Search01Icon} size={14} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search by ID or reference..."
            className="h-9 w-64 rounded-lg border border-border bg-white pl-9 pr-3 text-sm shadow-soft placeholder:text-muted-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20 focus-visible:border-primary/30 transition-all duration-150"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setOffset(0) }}
          className="h-9 rounded-lg border border-border bg-white px-3 text-sm text-muted-foreground shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20 transition-all duration-150"
        >
          <option value="">All statuses</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
          <option value="pending">Pending</option>
        </select>
        <DateRangePicker value={dateRange} onChange={(v) => { setDateRange(v); setOffset(0) }} />
        {total !== null && (
          <span className="text-[11px] text-muted-foreground ml-1 tabular-nums">{total} total</span>
        )}
      </div>

      {error ? (
        <div className="rounded-xl border bg-card py-12 text-center shadow-card">
          <p className="text-sm text-destructive">{error}</p>
          <button onClick={load} className="mt-2 text-xs text-muted-foreground hover:text-foreground underline">
            Try again
          </button>
        </div>
      ) : loading ? (
        <div className="space-y-2">
          {[...Array(10)].map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
        </div>
      ) : transactions.length === 0 ? (
        hasFilters ? (
          <div className="rounded-xl border bg-card py-16 text-center shadow-card">
            <p className="text-sm text-muted-foreground">No transactions found</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Try adjusting your filters.</p>
          </div>
        ) : (
          <EmptyState
            icon={ArrowLeftRightIcon}
            title="No transactions yet"
            description="Transactions will appear here once you start processing payments through the API."
            action={() => navigate('/api-keys')}
            actionLabel="Create API Key"
          />
        )
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden shadow-card">
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
                <TableRow
                  key={txn.id}
                  className="hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() => navigate(`/transactions/${txn.id}`)}
                >
                  <TableCell className="font-semibold tabular-nums">{formatCurrency(txn.amount)}</TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">{formatCurrency(txn.net_amount)}</TableCell>
                  <TableCell><StatusBadge status={txn.status} /></TableCell>
                  <TableCell>
                    <span className="font-mono text-[11px] text-muted-foreground/70">
                      {txn.id.substring(0, 8)}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-[11px] text-muted-foreground/70">
                    {txn.merchant_ref || txn.payment_reference || '\u2014'}
                  </TableCell>
                  <TableCell className="text-right text-[11px] text-muted-foreground">{formatDate(txn.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between border-t border-border/50 px-4 py-2.5">
            <span className="text-[11px] text-muted-foreground tabular-nums">
              {offset + 1}\u2013{offset + transactions.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setOffset(Math.max(0, offset - limit))}
                disabled={offset === 0}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40 disabled:opacity-20 transition-all duration-150"
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} size={14} strokeWidth={1.5} />
              </button>
              <button
                onClick={() => setOffset(offset + limit)}
                disabled={transactions.length < limit}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40 disabled:opacity-20 transition-all duration-150"
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
