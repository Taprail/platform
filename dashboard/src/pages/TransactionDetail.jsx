import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { StatusBadge } from '@/components/StatusBadge'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ArrowLeft } from 'lucide-react'

function Row({ label, children }) {
  return (
    <div className="flex justify-between py-2.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{children || '-'}</span>
    </div>
  )
}

export default function TransactionDetail() {
  const { id } = useParams()
  const [txn, setTxn] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get(`/dashboard/transactions/${id}`)
        setTxn(res.data)
      } catch (err) {
        console.error('Failed to load transaction:', err)
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
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (!txn) {
    return <p className="text-sm text-muted-foreground">Transaction not found</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/transactions" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Transaction</h1>
          <p className="font-mono text-xs text-muted-foreground">{txn.id}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-white p-5">
          <p className="text-sm font-medium mb-3">Payment</p>
          <div className="divide-y">
            <Row label="Amount">{formatCurrency(txn.amount)}</Row>
            <Row label="Fee">{formatCurrency(txn.fee)}</Row>
            <Row label="Net">{formatCurrency(txn.net_amount)}</Row>
            <Row label="Currency">{txn.currency}</Row>
            <Row label="Status"><StatusBadge status={txn.status} /></Row>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-5">
          <p className="text-sm font-medium mb-3">References</p>
          <div className="divide-y">
            <Row label="Payment ref">
              {txn.payment_reference && <code className="text-xs font-mono">{txn.payment_reference}</code>}
            </Row>
            <Row label="Merchant ref">
              {txn.merchant_ref && <code className="text-xs font-mono">{txn.merchant_ref}</code>}
            </Row>
            <Row label="Session">
              {txn.session_id && <code className="text-xs font-mono">{txn.session_id}</code>}
            </Row>
            <Row label="Created">{formatDate(txn.created_at)}</Row>
          </div>
        </div>

        {txn.metadata && (
          <div className="rounded-lg border bg-white p-5 lg:col-span-2">
            <p className="text-sm font-medium mb-3">Metadata</p>
            <pre className="text-xs font-mono bg-zinc-50 rounded-md p-4 overflow-auto">
              {JSON.stringify(txn.metadata, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
