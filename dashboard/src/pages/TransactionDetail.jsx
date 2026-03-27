import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { StatusBadge } from '@/components/StatusBadge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal, ModalHeader, ModalTitle, ModalDescription, ModalBody, ModalFooter } from '@/components/ui/modal'
import { api } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { HugeiconsIcon } from '@hugeicons/react'
import ArrowLeft01Icon from '@hugeicons/core-free-icons/ArrowLeft01Icon'
import Copy01Icon from '@hugeicons/core-free-icons/Copy01Icon'
import Tick01Icon from '@hugeicons/core-free-icons/Tick01Icon'
import RotateLeft01Icon from '@hugeicons/core-free-icons/RotateLeft01Icon'
import CreditCardIcon from '@hugeicons/core-free-icons/CreditCardIcon'
import HashtagIcon from '@hugeicons/core-free-icons/HashtagIcon'
import Calendar01Icon from '@hugeicons/core-free-icons/Calendar01Icon'
import PercentCircleIcon from '@hugeicons/core-free-icons/PercentCircleIcon'
import ArrowDownRight01Icon from '@hugeicons/core-free-icons/ArrowDownRight01Icon'
import ArrowUpRight01Icon from '@hugeicons/core-free-icons/ArrowUpRight01Icon'
import LinkSquare01Icon from '@hugeicons/core-free-icons/LinkSquare01Icon'
import RecordIcon from '@hugeicons/core-free-icons/RecordIcon'
import CheckmarkCircle02Icon from '@hugeicons/core-free-icons/CheckmarkCircle02Icon'
import CancelCircleIcon from '@hugeicons/core-free-icons/CancelCircleIcon'
import Clock01Icon from '@hugeicons/core-free-icons/Clock01Icon'
import Alert01Icon from '@hugeicons/core-free-icons/Alert01Icon'
import NfcIcon from '@hugeicons/core-free-icons/NfcIcon'
import Shield01Icon from '@hugeicons/core-free-icons/Shield01Icon'
import SmartPhone01Icon from '@hugeicons/core-free-icons/SmartPhone01Icon'

function CopyButton({ value }) {
  const [copied, setCopied] = useState(false)
  if (!value) return null
  const handleCopy = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={handleCopy}
      className="ml-1.5 inline-flex items-center justify-center h-5 w-5 rounded text-muted-foreground/30 hover:text-muted-foreground hover:bg-muted/60 transition-all duration-150"
      title="Copy"
    >
      {copied ? <HugeiconsIcon icon={Tick01Icon} size={12} strokeWidth={1.5} className="text-emerald-500" /> : <HugeiconsIcon icon={Copy01Icon} size={12} strokeWidth={1.5} />}
    </button>
  )
}

function DetailRow({ icon, label, value, mono, copyable, children }) {
  return (
    <div className="flex items-start gap-3 py-3">
      {icon && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/50 mt-0.5">
          <HugeiconsIcon icon={icon} size={14} strokeWidth={1.5} className="text-muted-foreground/60" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider">{label}</p>
        <div className="flex items-center mt-0.5">
          {children || (
            <span className={cn('text-sm font-medium', mono && 'font-mono text-[12px]')}>
              {value || '\u2014'}
            </span>
          )}
          {copyable && value && <CopyButton value={value} />}
        </div>
      </div>
    </div>
  )
}

const STATUS_TIMELINE = {
  success: [
    { label: 'Session', icon: RecordIcon, done: true },
    { label: 'Verified', icon: Shield01Icon, done: true },
    { label: 'Beam Read', icon: NfcIcon, done: true },
    { label: 'Submitted', icon: SmartPhone01Icon, done: true },
    { label: 'Completed', icon: CheckmarkCircle02Icon, done: true },
  ],
  failed: [
    { label: 'Session', icon: RecordIcon, done: true },
    { label: 'Verified', icon: Shield01Icon, done: true },
    { label: 'Beam Read', icon: NfcIcon, done: true },
    { label: 'Submitted', icon: SmartPhone01Icon, done: true },
    { label: 'Failed', icon: CancelCircleIcon, done: true, error: true },
  ],
  pending: [
    { label: 'Session', icon: RecordIcon, done: true },
    { label: 'Verified', icon: Shield01Icon, done: true },
    { label: 'Beam Read', icon: NfcIcon, done: false, active: true },
    { label: 'Submitted', icon: SmartPhone01Icon, done: false },
    { label: 'Completed', icon: CheckmarkCircle02Icon, done: false },
  ],
  awaiting_otp: [
    { label: 'Session', icon: RecordIcon, done: true },
    { label: 'Verified', icon: Shield01Icon, done: true },
    { label: 'Beam Read', icon: NfcIcon, done: true },
    { label: 'OTP', icon: SmartPhone01Icon, done: false, active: true },
    { label: 'Completed', icon: CheckmarkCircle02Icon, done: false },
  ],
}

function Timeline({ status }) {
  const steps = STATUS_TIMELINE[status] || STATUS_TIMELINE.pending
  return (
    <div className="flex items-center gap-0">
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-center flex-1">
          <div className="flex flex-col items-center gap-1.5">
            <div className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full transition-colors',
              step.error ? 'bg-red-100 text-red-600' :
              step.done ? 'bg-emerald-100 text-emerald-600' :
              step.active ? 'bg-primary/10 text-primary' :
              'bg-muted text-muted-foreground/40'
            )}>
              <HugeiconsIcon icon={step.icon} size={16} strokeWidth={1.8} />
            </div>
            <span className={cn(
              'text-[10px] font-medium',
              step.error ? 'text-red-600' :
              step.done ? 'text-foreground' :
              'text-muted-foreground/50'
            )}>
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={cn(
              'flex-1 h-[2px] mx-2 rounded-full mb-5',
              step.done && steps[i + 1].done ? (steps[i + 1].error ? 'bg-red-200' : 'bg-emerald-200') :
              step.done ? 'bg-gradient-to-r from-emerald-200 to-border' :
              'bg-border'
            )} />
          )}
        </div>
      ))}
    </div>
  )
}

export default function TransactionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [txn, setTxn] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showRefund, setShowRefund] = useState(false)
  const [refundAmount, setRefundAmount] = useState('')
  const [refundReason, setRefundReason] = useState('')
  const [refunding, setRefunding] = useState(false)

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

  const handleRefund = async (e) => {
    e.preventDefault()
    setRefunding(true)
    try {
      const body = {
        transaction_id: txn.id,
        reason: refundReason || undefined,
      }
      if (refundAmount) body.amount = parseFloat(refundAmount)
      await api.post('/dashboard/refunds', body)
      toast({ title: 'Refund processed' })
      setShowRefund(false)
      setRefundAmount('')
      setRefundReason('')
      const res = await api.get(`/dashboard/transactions/${id}`)
      setTxn(res.data)
    } catch (err) {
      toast({ title: 'Refund failed', description: err.message, variant: 'destructive' })
    } finally {
      setRefunding(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-6 w-48" />
        </div>
        <Skeleton className="h-48 w-full rounded-xl" />
        <div className="grid gap-5 lg:grid-cols-3">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  if (!txn) {
    return (
      <div className="rounded-xl border bg-card shadow-card py-16 text-center">
        <p className="text-sm text-muted-foreground">Transaction not found</p>
        <Link to="/transactions" className="text-xs text-primary hover:underline mt-2 inline-block">
          Back to transactions
        </Link>
      </div>
    )
  }

  const isFailed = txn.status === 'failed'
  const isSuccess = txn.status === 'success'
  const canRefund = isSuccess && (txn.refunded_amount || 0) < txn.amount
  const remainingRefundable = txn.amount - (txn.refunded_amount || 0)
  const feePercent = txn.amount > 0 ? ((txn.fee / txn.amount) * 100).toFixed(2) : '0.00'

  return (
    <div className="space-y-6">
      {/* Back + Actions */}
      <div className="flex items-center justify-between">
        <Link to="/transactions" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group">
          <HugeiconsIcon icon={ArrowLeft01Icon} size={16} strokeWidth={1.5} className="group-hover:-translate-x-0.5 transition-transform" />
          Transactions
        </Link>
        <div className="flex items-center gap-2">
          {txn.environment && (
            <span className={cn(
              'text-[10px] font-semibold px-2 py-1 rounded-md border uppercase tracking-wider',
              txn.environment === 'live' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
            )}>
              {txn.environment}
            </span>
          )}
          {canRefund && (
            <Button variant="outline" size="sm" onClick={() => setShowRefund(true)}>
              <HugeiconsIcon icon={RotateLeft01Icon} size={14} strokeWidth={1.5} className="mr-1.5" />
              Refund
            </Button>
          )}
        </div>
      </div>

      {/* Refund Modal */}
      <Modal open={showRefund} onOpenChange={(open) => { setShowRefund(open); if (!open) { setRefundAmount(''); setRefundReason('') } }}>
        <form onSubmit={handleRefund}>
          <ModalHeader>
            <ModalTitle>Issue refund</ModalTitle>
            <ModalDescription>
              Refund up to {formatCurrency(remainingRefundable)} for this transaction.
            </ModalDescription>
          </ModalHeader>
          <ModalBody className="space-y-4">
            <div className="space-y-2">
              <label className="text-[13px] font-medium text-foreground/80">Amount</label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                max={remainingRefundable}
                placeholder={`Leave empty for full refund (${formatCurrency(remainingRefundable)})`}
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <label className="text-[13px] font-medium text-foreground/80">Reason</label>
              <Input
                placeholder="Optional"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="outline" onClick={() => setShowRefund(false)}>Cancel</Button>
            <Button type="submit" disabled={refunding}>
              {refunding ? 'Processing...' : 'Process refund'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Hero Card */}
      <div className="rounded-xl border bg-card shadow-card overflow-hidden">
        <div className="px-8 pt-8 pb-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-2">Transaction amount</p>
              <h1 className="text-[36px] font-semibold tracking-tight tabular-nums leading-none">{formatCurrency(txn.amount)}</h1>
              <div className="flex items-center gap-2 mt-3">
                <StatusBadge status={txn.status} />
                <span className="text-[11px] text-muted-foreground">{formatDate(txn.created_at)}</span>
              </div>
            </div>

            {/* Amount breakdown */}
            <div className="text-right space-y-1.5">
              <div className="flex items-center justify-end gap-2">
                <span className="text-[11px] text-muted-foreground">Fee ({feePercent}%)</span>
                <span className="text-sm font-medium tabular-nums text-muted-foreground flex items-center gap-1">
                  <HugeiconsIcon icon={ArrowUpRight01Icon} size={12} strokeWidth={1.5} className="text-red-400" />
                  {formatCurrency(txn.fee)}
                </span>
              </div>
              <div className="flex items-center justify-end gap-2">
                <span className="text-[11px] text-muted-foreground">Net</span>
                <span className="text-sm font-semibold tabular-nums flex items-center gap-1">
                  <HugeiconsIcon icon={ArrowDownRight01Icon} size={12} strokeWidth={1.5} className="text-emerald-500" />
                  {formatCurrency(txn.net_amount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="border-t border-border/40 bg-muted/20 px-8 py-5">
          <Timeline status={txn.status} />
        </div>
      </div>

      {/* Alerts */}
      {isFailed && txn.failure_reason && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200/60 bg-red-50/60 px-5 py-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100">
            <HugeiconsIcon icon={CancelCircleIcon} size={16} strokeWidth={1.8} className="text-red-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-red-800">Payment failed</p>
            <p className="text-[13px] text-red-600/80 mt-0.5">{txn.failure_reason}</p>
          </div>
        </div>
      )}

      {(txn.refunded_amount || 0) > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200/60 bg-amber-50/60 px-5 py-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100">
            <HugeiconsIcon icon={Alert01Icon} size={16} strokeWidth={1.8} className="text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-amber-800">
              Partially refunded: {formatCurrency(txn.refunded_amount)}
            </p>
            <button
              onClick={() => navigate('/refunds')}
              className="text-[13px] text-amber-600/80 hover:text-amber-800 underline underline-offset-2 mt-0.5"
            >
              View refunds
            </button>
          </div>
        </div>
      )}

      {/* Detail Grid */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Payment Details */}
        <div className="rounded-xl border bg-card shadow-card p-6">
          <p className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-1">Payment details</p>
          <div className="divide-y divide-border/40">
            <DetailRow icon={CreditCardIcon} label="Amount" value={formatCurrency(txn.amount)} />
            <DetailRow icon={PercentCircleIcon} label="Fee" value={formatCurrency(txn.fee)} />
            <DetailRow icon={ArrowDownRight01Icon} label="Net amount" value={formatCurrency(txn.net_amount)} />
            <DetailRow icon={Calendar01Icon} label="Date" value={formatDate(txn.created_at)} />
            <DetailRow label="Currency">
              <span className="text-sm font-medium flex items-center gap-1.5">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-muted text-[10px] font-bold text-muted-foreground">
                  {txn.currency === 'NGN' ? '\u20A6' : '$'}
                </span>
                {txn.currency}
              </span>
            </DetailRow>
          </div>
        </div>

        {/* References */}
        <div className="rounded-xl border bg-card shadow-card p-6">
          <p className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-1">References</p>
          <div className="divide-y divide-border/40">
            <DetailRow icon={HashtagIcon} label="Transaction ID" value={txn.id} mono copyable />
            <DetailRow label="Payment ref" value={txn.payment_reference} mono copyable />
            <DetailRow label="Merchant ref" value={txn.merchant_ref} mono copyable />
            {txn.provider_reference && (
              <DetailRow label="ISW Payment ID" value={txn.provider_reference} mono copyable />
            )}
            {txn.metadata?.isw_rrn && (
              <DetailRow label="ISW RRN" value={txn.metadata.isw_rrn} mono copyable />
            )}
            {txn.metadata?.card_scheme && (
              <DetailRow label="Card network" value={txn.metadata.card_scheme} />
            )}
          </div>
        </div>

        {/* Linked resources */}
        <div className="rounded-xl border bg-card shadow-card p-6">
          <p className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-1">Linked</p>
          <div className="divide-y divide-border/40">
            {txn.session_id ? (
              <DetailRow label="Session">
                <div className="flex items-center gap-1.5">
                  <code className="text-[12px] font-mono font-medium">{txn.session_id.substring(0, 12)}...</code>
                  <CopyButton value={txn.session_id} />
                </div>
              </DetailRow>
            ) : (
              <DetailRow label="Session" value={null} />
            )}
            {txn.customer_id ? (
              <DetailRow label="Customer">
                <Link
                  to={`/customers/${txn.customer_id}`}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline underline-offset-2"
                >
                  {txn.customer_id.substring(0, 12)}...
                  <HugeiconsIcon icon={LinkSquare01Icon} size={12} strokeWidth={1.5} />
                </Link>
              </DetailRow>
            ) : (
              <DetailRow label="Customer" value={null} />
            )}
            <DetailRow label="Status">
              <StatusBadge status={txn.status} />
            </DetailRow>
          </div>
        </div>
      </div>

      {/* Metadata */}
      {txn.metadata && (
        <div className="rounded-xl border bg-card shadow-card overflow-hidden">
          <div className="px-6 py-4 border-b border-border/40">
            <p className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider">Metadata</p>
          </div>
          <pre className="text-[12px] font-mono bg-sidebar text-white/80 p-6 overflow-auto leading-relaxed">
            {JSON.stringify(txn.metadata, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
