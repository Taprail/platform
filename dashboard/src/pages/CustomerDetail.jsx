import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { StatusBadge } from '@/components/StatusBadge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { api } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import { HugeiconsIcon } from '@hugeicons/react'
import ArrowLeft01Icon from '@hugeicons/core-free-icons/ArrowLeft01Icon'

export default function CustomerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [customer, setCustomer] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get(`/dashboard/customers/${id}`)
        setCustomer(res.data)
        // Load customer transactions
        const txnRes = await api.get(`/dashboard/transactions?customer_id=${id}&limit=50`, { withEnv: true })
        setTransactions(Array.isArray(txnRes.data) ? txnRes.data : [])
      } catch (err) {
        console.error('Failed to load customer:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="rounded-xl border bg-card shadow-card py-16 text-center">
        <p className="text-sm text-muted-foreground">Customer not found</p>
        <Link to="/customers" className="text-xs text-muted-foreground hover:text-foreground underline mt-2 inline-block">
          Back to customers
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/customers" className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{customer.name || customer.email || 'Customer'}</h1>
          <p className="font-mono text-[11px] text-muted-foreground mt-1">{customer.id}</p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="rounded-xl border bg-card shadow-card px-6 py-4">
          <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2">Email</p>
          <p className="text-sm font-medium">{customer.email || '\u2014'}</p>
        </div>
        <div className="rounded-xl border bg-card shadow-card px-6 py-4">
          <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2">Phone</p>
          <p className="text-sm font-medium">{customer.phone || '\u2014'}</p>
        </div>
        <div className="rounded-xl border bg-card shadow-card px-6 py-4">
          <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2">Created</p>
          <p className="text-sm font-medium">{formatDate(customer.created_at)}</p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-xl border bg-card shadow-card px-6 py-4">
          <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2">Total transactions</p>
          <p className="text-xl font-semibold tabular-nums">{customer.transaction_count ?? 0}</p>
        </div>
        <div className="rounded-xl border bg-card shadow-card px-6 py-4">
          <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2">Total volume</p>
          <p className="text-xl font-semibold tabular-nums">{formatCurrency(customer.total_volume ?? 0)}</p>
        </div>
      </div>

      {transactions.length > 0 && (
        <div className="rounded-xl border bg-card shadow-card overflow-hidden">
          <div className="px-6 py-3.5 border-b border-border/50">
            <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">Transaction history</p>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
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
                  <TableCell className="font-medium tabular-nums">{formatCurrency(txn.amount)}</TableCell>
                  <TableCell><StatusBadge status={txn.status} /></TableCell>
                  <TableCell className="font-mono text-[11px] text-muted-foreground">
                    {txn.merchant_ref || txn.payment_reference || '\u2014'}
                  </TableCell>
                  <TableCell className="text-right text-[11px] text-muted-foreground">{formatDate(txn.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
