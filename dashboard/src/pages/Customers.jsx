import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { Modal, ModalHeader, ModalTitle, ModalDescription, ModalBody, ModalFooter } from '@/components/ui/modal'
import { api } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { HugeiconsIcon } from '@hugeicons/react'
import PlusSignIcon from '@hugeicons/core-free-icons/PlusSignIcon'
import Search01Icon from '@hugeicons/core-free-icons/Search01Icon'
import UserCircleIcon from '@hugeicons/core-free-icons/UserCircleIcon'
import ArrowLeft01Icon from '@hugeicons/core-free-icons/ArrowLeft01Icon'
import ArrowRight01Icon from '@hugeicons/core-free-icons/ArrowRight01Icon'

export default function Customers() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ email: '', name: '', phone: '' })
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [offset, setOffset] = useState(0)
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
      let url = `/dashboard/customers?limit=${limit}&offset=${offset}`
      if (debouncedSearch) url += `&search=${encodeURIComponent(debouncedSearch)}`
      const res = await api.get(url)
      setCustomers(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      setError(err.message || 'Failed to load customers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [offset, debouncedSearch])

  const resetForm = () => setForm({ email: '', name: '', phone: '' })

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.email && !form.phone) {
      toast({ title: 'Email or phone required', variant: 'destructive' })
      return
    }
    setCreating(true)
    try {
      await api.post('/dashboard/customers', form)
      resetForm()
      setShowCreate(false)
      load()
      toast({ title: 'Customer created' })
    } catch (err) {
      toast({ title: 'Failed to create customer', description: err.message, variant: 'destructive' })
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Customers</h1>
          <p className="text-[13px] text-muted-foreground mt-1">Manage your customers and view their activity</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <HugeiconsIcon icon={PlusSignIcon} size={14} strokeWidth={1.5} className="mr-1.5" />
          Add customer
        </Button>
      </div>

      {/* Create Customer Modal */}
      <Modal open={showCreate} onOpenChange={(open) => { setShowCreate(open); if (!open) resetForm() }}>
        <form onSubmit={handleCreate}>
          <ModalHeader>
            <ModalTitle>Add customer</ModalTitle>
            <ModalDescription>Create a new customer record. Email or phone is required.</ModalDescription>
          </ModalHeader>
          <ModalBody className="space-y-4">
            <div className="space-y-2">
              <label className="text-[13px] font-medium text-foreground/80">Name</label>
              <Input placeholder="Jane Smith" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
            </div>
            <div className="space-y-2">
              <label className="text-[13px] font-medium text-foreground/80">Email</label>
              <Input type="email" placeholder="jane@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-[13px] font-medium text-foreground/80">Phone</label>
              <Input placeholder="+234..." value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button type="submit" disabled={creating}>
              {creating ? 'Creating...' : 'Add customer'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      <div className="flex items-center gap-2.5">
        <div className="relative">
          <HugeiconsIcon icon={Search01Icon} size={14} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search by name, email, or phone..."
            className="h-9 w-64 rounded-lg border border-border bg-white shadow-soft pl-9 pr-3 text-sm placeholder:text-muted-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20 focus-visible:border-primary/30 transition-all duration-150"
          />
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border bg-card shadow-card py-12 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <button onClick={load} className="mt-2 text-xs text-muted-foreground hover:text-foreground underline">
            Try again
          </button>
        </div>
      ) : loading ? (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
        </div>
      ) : customers.length === 0 ? (
        debouncedSearch ? (
          <div className="rounded-xl border bg-card shadow-card py-16 text-center">
            <p className="text-sm text-muted-foreground">No customers found</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Try adjusting your search.</p>
          </div>
        ) : (
          <EmptyState
            icon={UserCircleIcon}
            title="No customers yet"
            description="Customers are created when you process payments or add them manually."
            action={() => setShowCreate(true)}
            actionLabel="Add customer"
          />
        )
      ) : (
        <div className="rounded-xl border bg-card shadow-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="text-right">Transactions</TableHead>
                <TableHead className="text-right">Volume</TableHead>
                <TableHead className="text-right">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((c) => (
                <TableRow
                  key={c.id}
                  className="hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() => navigate(`/customers/${c.id}`)}
                >
                  <TableCell className="font-medium">{c.name || '\u2014'}</TableCell>
                  <TableCell className="text-muted-foreground">{c.email || '\u2014'}</TableCell>
                  <TableCell className="text-muted-foreground">{c.phone || '\u2014'}</TableCell>
                  <TableCell className="text-right tabular-nums">{c.transaction_count ?? 0}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(c.total_volume ?? 0)}</TableCell>
                  <TableCell className="text-right text-[11px] text-muted-foreground">{formatDate(c.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between border-t border-border/50 px-4 py-2.5">
            <span className="text-[11px] text-muted-foreground tabular-nums">
              {offset + 1}&ndash;{offset + customers.length}
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
                disabled={customers.length < limit}
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
