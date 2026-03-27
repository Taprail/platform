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
import BankIcon from '@hugeicons/core-free-icons/BankIcon'
import PencilEdit01Icon from '@hugeicons/core-free-icons/PencilEdit01Icon'

export default function Settlements() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [settlements, setSettlements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [offset, setOffset] = useState(0)
  const [total, setTotal] = useState(null)
  const limit = 20

  const [bankAccount, setBankAccount] = useState(null)
  const [bankLoading, setBankLoading] = useState(true)
  const [editingBank, setEditingBank] = useState(false)
  const [savingBank, setSavingBank] = useState(false)
  const [bankForm, setBankForm] = useState({ bank_name: '', account_number: '', account_name: '' })

  async function loadBankAccount() {
    setBankLoading(true)
    try {
      const res = await api.get('/dashboard/settlements/bank-account')
      setBankAccount(res.data)
      if (res.data) {
        setBankForm({
          bank_name: res.data.bank_name || '',
          account_number: res.data.account_number || '',
          account_name: res.data.account_name || '',
        })
      }
    } catch (err) {
      setBankAccount(null)
    } finally {
      setBankLoading(false)
    }
  }

  async function loadSettlements() {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get(`/dashboard/settlements?limit=${limit}&offset=${offset}`, { withEnv: true })
      setSettlements(Array.isArray(res.data) ? res.data : res.data)
      if (res.total !== undefined) setTotal(res.total)
    } catch (err) {
      setError(err.message || 'Failed to load settlements')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadBankAccount() }, [])
  useEffect(() => { loadSettlements() }, [offset])
  const loadRef = useRef(loadSettlements)
  loadRef.current = loadSettlements
  useModeChange(useCallback(() => { setOffset(0); loadRef.current() }, []))

  const openBankEdit = () => {
    if (bankAccount) {
      setBankForm({
        bank_name: bankAccount.bank_name || '',
        account_number: bankAccount.account_number || '',
        account_name: bankAccount.account_name || '',
      })
    } else {
      setBankForm({ bank_name: '', account_number: '', account_name: '' })
    }
    setEditingBank(true)
  }

  const handleSaveBank = async (e) => {
    e.preventDefault()
    if (!bankForm.bank_name.trim() || !bankForm.account_number.trim() || !bankForm.account_name.trim()) {
      toast({ title: 'All fields are required', variant: 'destructive' })
      return
    }
    setSavingBank(true)
    try {
      const res = await api.put('/dashboard/settlements/bank-account', {
        bank_name: bankForm.bank_name.trim(),
        account_number: bankForm.account_number.trim(),
        account_name: bankForm.account_name.trim(),
      })
      setBankAccount(res.data)
      setEditingBank(false)
      toast({ title: 'Bank account updated' })
    } catch (err) {
      toast({ title: 'Failed to update bank account', description: err.message, variant: 'destructive' })
    } finally {
      setSavingBank(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Settlements</h1>
        <p className="text-[13px] text-muted-foreground mt-1">Track your payouts and settlement history</p>
      </div>

      {/* Bank Account Modal */}
      <Modal open={editingBank} onOpenChange={setEditingBank}>
        <form onSubmit={handleSaveBank}>
          <ModalHeader>
            <ModalTitle>{bankAccount ? 'Edit bank account' : 'Add bank account'}</ModalTitle>
            <ModalDescription>Settlements will be paid out to this account.</ModalDescription>
          </ModalHeader>
          <ModalBody className="space-y-4">
            <div className="space-y-2">
              <label className="text-[13px] font-medium text-foreground/80">Bank name</label>
              <Input
                value={bankForm.bank_name}
                onChange={(e) => setBankForm({ ...bankForm, bank_name: e.target.value })}
                placeholder="e.g. Access Bank"
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <label className="text-[13px] font-medium text-foreground/80">Account number</label>
              <Input
                value={bankForm.account_number}
                onChange={(e) => setBankForm({ ...bankForm, account_number: e.target.value })}
                placeholder="0123456789"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[13px] font-medium text-foreground/80">Account name</label>
              <Input
                value={bankForm.account_name}
                onChange={(e) => setBankForm({ ...bankForm, account_name: e.target.value })}
                placeholder="Account holder name"
                required
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="outline" onClick={() => setEditingBank(false)}>Cancel</Button>
            <Button type="submit" disabled={savingBank}>
              {savingBank ? 'Saving...' : 'Save'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Bank Account Section */}
      {bankLoading ? (
        <Skeleton className="h-44 w-full rounded-xl" />
      ) : (
        <div className="rounded-xl border bg-card shadow-card p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">Bank Account</p>
            {bankAccount && (
              <button onClick={openBankEdit} className="text-muted-foreground/40 hover:text-foreground transition-colors">
                <HugeiconsIcon icon={PencilEdit01Icon} size={14} strokeWidth={1.5} />
              </button>
            )}
          </div>

          {!bankAccount ? (
            <div className="text-center py-4">
              <p className="text-[13px] text-muted-foreground mb-3">No bank account configured for settlements.</p>
              <Button size="sm" onClick={openBankEdit}>
                Add bank account
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              <div className="flex justify-between py-3 text-sm">
                <span className="text-muted-foreground">Bank</span>
                <span className="font-medium">{bankAccount.bank_name}</span>
              </div>
              <div className="flex justify-between py-3 text-sm">
                <span className="text-muted-foreground">Account number</span>
                <span className="font-medium font-mono text-[11px]">{bankAccount.account_number}</span>
              </div>
              <div className="flex justify-between py-3 text-sm">
                <span className="text-muted-foreground">Account name</span>
                <span className="font-medium">{bankAccount.account_name}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Settlements Table */}
      {total !== null && (
        <span className="text-[11px] text-muted-foreground tabular-nums">{total} total</span>
      )}

      {error ? (
        <div className="rounded-xl border bg-card shadow-card py-12 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <button onClick={loadSettlements} className="mt-2 text-xs text-muted-foreground hover:text-foreground underline">
            Try again
          </button>
        </div>
      ) : loading ? (
        <div className="space-y-2">
          {[...Array(10)].map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
        </div>
      ) : settlements.length === 0 ? (
        <EmptyState
          icon={BankIcon}
          title="No settlements yet"
          description="Settlements are processed automatically on a regular schedule."
        />
      ) : (
        <div className="rounded-xl border bg-card shadow-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Amount</TableHead>
                <TableHead>Fee</TableHead>
                <TableHead>Net</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Transactions</TableHead>
                <TableHead className="text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {settlements.map((s) => (
                <TableRow
                  key={s.id}
                  className="hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() => navigate(`/settlements/${s.id}`)}
                >
                  <TableCell className="font-medium tabular-nums">{formatCurrency(s.amount)}</TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">{formatCurrency(s.fee)}</TableCell>
                  <TableCell className="tabular-nums">{formatCurrency(s.net)}</TableCell>
                  <TableCell><StatusBadge status={s.status} /></TableCell>
                  <TableCell className="text-[11px] text-muted-foreground">
                    {s.period_start && s.period_end
                      ? `${formatDate(s.period_start)} \u2013 ${formatDate(s.period_end)}`
                      : '\u2014'}
                  </TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">{s.transaction_count ?? '\u2014'}</TableCell>
                  <TableCell className="text-right text-[11px] text-muted-foreground">{formatDate(s.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between border-t border-border/50 px-4 py-2.5">
            <span className="text-[11px] text-muted-foreground tabular-nums">
              {offset + 1}&ndash;{offset + settlements.length}
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
                disabled={settlements.length < limit}
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
