import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { StatusBadge } from '@/components/StatusBadge'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal, ModalHeader, ModalTitle, ModalDescription, ModalBody, ModalFooter } from '@/components/ui/modal'
import { api } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { useModeChange } from '@/components/layout/ModeToggle'
import { HugeiconsIcon } from '@hugeicons/react'
import ArrowLeft01Icon from '@hugeicons/core-free-icons/ArrowLeft01Icon'
import ArrowRight01Icon from '@hugeicons/core-free-icons/ArrowRight01Icon'
import RotateLeft01Icon from '@hugeicons/core-free-icons/RotateLeft01Icon'
import PlusSignIcon from '@hugeicons/core-free-icons/PlusSignIcon'

export default function Refunds() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [refunds, setRefunds] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [offset, setOffset] = useState(0)
  const [total, setTotal] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ transaction_id: '', amount: '', reason: '' })
  const limit = 20

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get(`/dashboard/refunds?limit=${limit}&offset=${offset}`, { withEnv: true })
      setRefunds(Array.isArray(res.data) ? res.data : res.data)
      if (res.total !== undefined) setTotal(res.total)
    } catch (err) {
      setError(err.message || 'Failed to load refunds')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [offset])
  const loadRef = useRef(load)
  loadRef.current = load
  useModeChange(useCallback(() => { setOffset(0); loadRef.current() }, []))

  const resetForm = () => setForm({ transaction_id: '', amount: '', reason: '' })

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.transaction_id.trim()) {
      toast({ title: 'Transaction ID is required', variant: 'destructive' })
      return
    }
    setCreating(true)
    try {
      const body = {
        transaction_id: form.transaction_id.trim(),
        reason: form.reason.trim() || undefined,
      }
      if (form.amount.trim()) {
        body.amount = parseFloat(form.amount)
      }
      await api.post('/dashboard/refunds', body)
      toast({ title: 'Refund created' })
      resetForm()
      setShowCreate(false)
      setOffset(0)
      load()
    } catch (err) {
      toast({ title: 'Failed to create refund', description: err.message, variant: 'destructive' })
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Refunds</h1>
          <p className="text-[13px] text-muted-foreground mt-1">View and manage refunds</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <HugeiconsIcon icon={PlusSignIcon} size={14} strokeWidth={1.5} className="mr-1.5" />
          New refund
        </Button>
      </div>

      {/* Create Refund Modal */}
      <Modal open={showCreate} onOpenChange={(open) => { setShowCreate(open); if (!open) resetForm() }}>
        <form onSubmit={handleCreate}>
          <ModalHeader>
            <ModalTitle>Create refund</ModalTitle>
            <ModalDescription>Issue a full or partial refund for a transaction.</ModalDescription>
          </ModalHeader>
          <ModalBody className="space-y-4">
            <div className="space-y-2">
              <label className="text-[13px] font-medium text-foreground/80">Transaction ID</label>
              <Input
                value={form.transaction_id}
                onChange={(e) => setForm({ ...form, transaction_id: e.target.value })}
                placeholder="Transaction ID to refund"
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <label className="text-[13px] font-medium text-foreground/80">Amount</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="Leave empty for full refund"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[13px] font-medium text-foreground/80">Reason</label>
              <Input
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                placeholder="Optional"
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button type="submit" disabled={creating}>
              {creating ? 'Creating...' : 'Create refund'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {total !== null && (
        <span className="text-[11px] text-muted-foreground tabular-nums">{total} total</span>
      )}

      {error ? (
        <div className="rounded-xl border bg-card shadow-card py-12 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <button onClick={load} className="mt-2 text-xs text-muted-foreground hover:text-foreground underline">
            Try again
          </button>
        </div>
      ) : loading ? (
        <div className="space-y-2">
          {[...Array(10)].map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
        </div>
      ) : refunds.length === 0 ? (
        <EmptyState
          icon={RotateLeft01Icon}
          title="No refunds yet"
          description="Refunds will appear here when you process them."
          action={() => setShowCreate(true)}
          actionLabel="New refund"
        />
      ) : (
        <div className="rounded-xl border bg-card shadow-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead className="text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {refunds.map((refund) => (
                <TableRow
                  key={refund.id}
                  className="hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() => navigate(`/refunds/${refund.id}`)}
                >
                  <TableCell className="font-medium tabular-nums">{formatCurrency(refund.amount)}</TableCell>
                  <TableCell><StatusBadge status={refund.status} /></TableCell>
                  <TableCell>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {refund.transaction_id?.substring(0, 8)}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                    {refund.reason || '\u2014'}
                  </TableCell>
                  <TableCell className="text-right text-[11px] text-muted-foreground">{formatDate(refund.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between border-t border-border/50 px-4 py-2.5">
            <span className="text-[11px] text-muted-foreground tabular-nums">
              {offset + 1}&ndash;{offset + refunds.length}
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
                disabled={refunds.length < limit}
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
