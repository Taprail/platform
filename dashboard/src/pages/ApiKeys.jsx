import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Modal, ModalHeader, ModalTitle, ModalDescription, ModalBody, ModalFooter } from '@/components/ui/modal'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { EmptyState } from '@/components/ui/empty-state'
import { HugeiconsIcon } from '@hugeicons/react'
import PlusSignIcon from '@hugeicons/core-free-icons/PlusSignIcon'
import Copy01Icon from '@hugeicons/core-free-icons/Copy01Icon'
import Tick01Icon from '@hugeicons/core-free-icons/Tick01Icon'
import Delete01Icon from '@hugeicons/core-free-icons/Delete01Icon'
import Key01Icon from '@hugeicons/core-free-icons/Key01Icon'
import ArrowDown01Icon from '@hugeicons/core-free-icons/ArrowDown01Icon'
import ArrowRight01Icon from '@hugeicons/core-free-icons/ArrowRight01Icon'
import Book01Icon from '@hugeicons/core-free-icons/Book01Icon'
import { Link } from 'react-router-dom'

export default function ApiKeys() {
  const { toast } = useToast()
  const [keys, setKeys] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newKeys, setNewKeys] = useState(null)
  const [copied, setCopied] = useState(null)
  const [label, setLabel] = useState('')
  const [quickStartOpen, setQuickStartOpen] = useState(false)

  async function loadKeys() {
    try {
      const res = await api.get('/dashboard/api-keys')
      setKeys(res.data)
    } catch (err) {
      console.error('Failed to load keys:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadKeys() }, [])

  const handleCreate = async () => {
    setCreating(true)
    try {
      const res = await api.post('/dashboard/api-keys', { label: label || undefined })
      setNewKeys(res.data)
      setLabel('')
      setShowCreate(false)
      loadKeys()
      toast({ title: 'API keys created', description: "Copy them now — they won't be shown again." })
    } catch (err) {
      toast({ title: 'Failed to create keys', description: err.message, variant: 'destructive' })
    } finally {
      setCreating(false)
    }
  }

  const handleRevoke = async (id) => {
    if (!confirm('Revoke this key?')) return
    try {
      await api.delete(`/dashboard/api-keys/${id}`)
      loadKeys()
      toast({ title: 'API key revoked' })
    } catch (err) {
      toast({ title: 'Failed to revoke key', description: err.message, variant: 'destructive' })
    }
  }

  const copyToClipboard = (key, id) => {
    navigator.clipboard.writeText(key)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">API Keys</h1>
          <p className="text-[13px] text-muted-foreground mt-1">Manage your test and live API keys</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <HugeiconsIcon icon={PlusSignIcon} size={14} strokeWidth={1.5} className="mr-1.5" />
          Generate keys
        </Button>
      </div>

      {/* Generate Key Modal */}
      <Modal open={showCreate} onOpenChange={setShowCreate}>
        <ModalHeader>
          <ModalTitle>Generate new key pair</ModalTitle>
          <ModalDescription>Creates both a test and live key for your integration.</ModalDescription>
        </ModalHeader>
        <ModalBody>
          <Input
            placeholder="Label (optional)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            autoFocus
          />
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={creating}>
            {creating ? 'Creating...' : 'Generate'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Keys Created Modal */}
      <Modal open={!!newKeys} onOpenChange={(open) => { if (!open) setNewKeys(null) }}>
        <ModalHeader>
          <ModalTitle>Keys created</ModalTitle>
          <ModalDescription>Copy now &mdash; these won't be shown again.</ModalDescription>
        </ModalHeader>
        <ModalBody className="space-y-3">
          {newKeys && [
            { label: 'Test', key: newKeys.test_key, id: 'test' },
            { label: 'Live', key: newKeys.live_key, id: 'live' },
          ].map((item) => (
            <div key={item.id} className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground w-8 shrink-0">{item.label}</span>
              <code className="flex-1 rounded-lg bg-muted/50 border px-3 py-2 text-[11px] font-mono truncate">{item.key}</code>
              <Button variant="ghost" size="sm" onClick={() => copyToClipboard(item.key, item.id)}>
                {copied === item.id ? <HugeiconsIcon icon={Tick01Icon} size={14} strokeWidth={1.5} className="text-emerald-500" /> : <HugeiconsIcon icon={Copy01Icon} size={14} strokeWidth={1.5} />}
              </Button>
            </div>
          ))}
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setNewKeys(null)}>Done</Button>
        </ModalFooter>
      </Modal>

      <div className="rounded-xl border bg-card shadow-card overflow-hidden">
        <button
          onClick={() => setQuickStartOpen(!quickStartOpen)}
          className="flex w-full items-center justify-between p-6 text-left hover:bg-muted/20 transition-colors"
        >
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={Book01Icon} size={16} strokeWidth={1.5} className="text-muted-foreground/60" />
            <span className="text-sm font-medium">Quick Start</span>
          </div>
          {quickStartOpen ? (
            <HugeiconsIcon icon={ArrowDown01Icon} size={14} strokeWidth={1.5} className="text-muted-foreground/50" />
          ) : (
            <HugeiconsIcon icon={ArrowRight01Icon} size={14} strokeWidth={1.5} className="text-muted-foreground/50" />
          )}
        </button>
        {quickStartOpen && (
          <div className="border-t border-border/50 px-6 pb-6 pt-4 space-y-4">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">Using your API key</p>
              <p className="text-sm text-muted-foreground">
                Include your key in the <code className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-mono">Authorization</code> header:
              </p>
              <div className="rounded-md border bg-foreground overflow-hidden">
                <pre className="p-4 text-[12px] leading-relaxed text-white/80 overflow-x-auto">
                  <code>Authorization: Bearer sk_test_your_api_key</code>
                </pre>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">Create a payment session</p>
              <div className="rounded-md border bg-foreground overflow-hidden">
                <pre className="p-4 text-[12px] leading-relaxed text-white/80 overflow-x-auto">
                  <code>{`curl -X POST https://api.taprail.co/v1/payments/sessions \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"amount": 5000, "merchant_ref": "order_123"}'`}</code>
                </pre>
              </div>
            </div>
            <Link
              to="/docs"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline underline-offset-4"
            >
              <HugeiconsIcon icon={Book01Icon} size={14} strokeWidth={1.5} />
              View full API documentation
            </Link>
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
      ) : keys.length === 0 ? (
        <EmptyState
          icon={Key01Icon}
          title="No API keys yet"
          description="Generate a key pair to start integrating Taprail into your application."
          action={() => setShowCreate(true)}
          actionLabel="Generate keys"
        />
      ) : (
        <div className="rounded-xl border bg-card shadow-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Label</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Env</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last used</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys.map((key) => (
                <TableRow key={key.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium">{key.label}</TableCell>
                  <TableCell className="font-mono text-[11px] text-muted-foreground">
                    {key.key_prefix}_...{key.last4}
                  </TableCell>
                  <TableCell>
                    <Badge variant={key.environment === 'live' ? 'default' : 'secondary'}>
                      {key.environment}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={key.is_active ? 'success' : 'secondary'}>
                      {key.is_active ? 'Active' : 'Revoked'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[11px] text-muted-foreground">{formatDate(key.created_at)}</TableCell>
                  <TableCell className="text-[11px] text-muted-foreground">
                    {key.last_used_at ? formatDate(key.last_used_at) : '-'}
                  </TableCell>
                  <TableCell>
                    {key.is_active && (
                      <button onClick={() => handleRevoke(key.id)} className="text-muted-foreground/40 hover:text-destructive transition-colors">
                        <HugeiconsIcon icon={Delete01Icon} size={14} strokeWidth={1.5} />
                      </button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
