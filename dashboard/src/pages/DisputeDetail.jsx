import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { StatusBadge } from '@/components/StatusBadge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { HugeiconsIcon } from '@hugeicons/react'
import ArrowLeft01Icon from '@hugeicons/core-free-icons/ArrowLeft01Icon'

function Row({ label, children, mono }) {
  return (
    <div className="flex justify-between py-2.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium text-right max-w-[60%] break-all ${mono ? 'font-mono text-[11px]' : ''}`}>
        {children || '\u2014'}
      </span>
    </div>
  )
}

export default function DisputeDetail() {
  const { id } = useParams()
  const { toast } = useToast()
  const [dispute, setDispute] = useState(null)
  const [loading, setLoading] = useState(true)
  const [evidence, setEvidence] = useState('')
  const [status, setStatus] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get(`/dashboard/disputes/${id}`)
        setDispute(res.data)
        setStatus(res.data.status || '')
      } catch (err) {
        console.error('Failed to load dispute:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const isClosed = dispute && ['won', 'lost'].includes(dispute.status)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const body = {}
      if (evidence.trim()) body.evidence = evidence.trim()
      if (status && status !== dispute.status) body.status = status
      const res = await api.put(`/dashboard/disputes/${id}`, body)
      setDispute(res.data)
      setEvidence('')
      toast({ title: 'Dispute updated' })
    } catch (err) {
      toast({ title: 'Failed to update dispute', description: err.message, variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  if (!dispute) {
    return (
      <div className="rounded-xl border bg-card shadow-card py-16 text-center">
        <p className="text-sm text-muted-foreground">Dispute not found</p>
        <Link to="/disputes" className="text-xs text-muted-foreground hover:text-foreground underline mt-2 inline-block">
          Back to disputes
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/disputes" className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold tracking-tight tabular-nums">{formatCurrency(dispute.amount)}</h1>
            <StatusBadge status={dispute.status} />
          </div>
          <p className="font-mono text-[11px] text-muted-foreground mt-1">{dispute.id}</p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-xl border bg-card shadow-card p-6">
          <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider mb-3">Dispute Details</p>
          <div className="divide-y divide-border/50">
            <Row label="Amount">{formatCurrency(dispute.amount)}</Row>
            <Row label="Status"><StatusBadge status={dispute.status} /></Row>
            <Row label="Reason">{dispute.reason}</Row>
            <Row label="Transaction" mono>{dispute.transaction_id}</Row>
            <Row label="Provider ID" mono>{dispute.provider_dispute_id}</Row>
            <Row label="Due date">{dispute.due_date ? formatDate(dispute.due_date) : null}</Row>
            <Row label="Created">{formatDate(dispute.created_at)}</Row>
            <Row label="Resolved">{dispute.resolved_at ? formatDate(dispute.resolved_at) : null}</Row>
          </div>
        </div>

        <div className="rounded-xl border bg-card shadow-card p-6">
          <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider mb-3">Evidence & Response</p>
          {isClosed ? (
            <div className="py-4 text-center">
              <p className="text-sm text-muted-foreground">
                This dispute has been {dispute.status}. No further action is needed.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[13px] text-muted-foreground">Submit evidence</label>
                <textarea
                  value={evidence}
                  onChange={(e) => setEvidence(e.target.value)}
                  placeholder="Provide evidence to support your case..."
                  rows={5}
                  className="w-full rounded-xl border border-border bg-white shadow-soft px-3 py-2.5 text-sm placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20 resize-none transition-all duration-150"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] text-muted-foreground">Update status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="h-9 w-full rounded-xl border border-border bg-white shadow-soft px-3 text-sm text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20 transition-all duration-150"
                >
                  <option value="open">Open</option>
                  <option value="under_review">Under Review</option>
                  <option value="won">Won</option>
                  <option value="lost">Lost</option>
                </select>
              </div>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Update dispute'}
              </Button>
            </form>
          )}

          {dispute.evidence && (
            <div className="mt-4 pt-4 border-t border-border/50">
              <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2">Previous Evidence</p>
              <pre className="text-xs font-mono bg-muted/50 border rounded-md p-4 overflow-auto text-foreground/70 whitespace-pre-wrap">
                {dispute.evidence}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
