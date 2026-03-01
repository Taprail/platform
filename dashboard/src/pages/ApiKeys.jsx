import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { Plus, Copy, Check, Trash2 } from 'lucide-react'

export default function ApiKeys() {
  const { toast } = useToast()
  const [keys, setKeys] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newKeys, setNewKeys] = useState(null)
  const [copied, setCopied] = useState(null)
  const [label, setLabel] = useState('')

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
      <div>
        <h1 className="text-lg font-semibold tracking-tight">API Keys</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">Manage your test and live API keys</p>
      </div>

      <div className="rounded-lg border bg-white p-5 space-y-4">
        <div>
          <p className="text-sm font-medium">Generate new key pair</p>
          <p className="text-xs text-muted-foreground mt-0.5">Creates both a test and live key</p>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Label (optional)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="max-w-xs"
          />
          <Button onClick={handleCreate} disabled={creating}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            {creating ? 'Creating...' : 'Generate'}
          </Button>
        </div>
      </div>

      {newKeys && (
        <div className="rounded-lg border bg-white p-5 space-y-3">
          <div>
            <p className="text-sm font-medium">Keys created</p>
            <p className="text-xs text-muted-foreground">Copy now — these won't be shown again</p>
          </div>
          {[
            { label: 'Test', key: newKeys.test_key, id: 'test' },
            { label: 'Live', key: newKeys.live_key, id: 'live' },
          ].map((item) => (
            <div key={item.id} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-8">{item.label}</span>
              <code className="flex-1 rounded-md bg-zinc-50 border px-3 py-1.5 text-xs font-mono">{item.key}</code>
              <Button variant="ghost" size="sm" onClick={() => copyToClipboard(item.key, item.id)}>
                {copied === item.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>
          ))}
          <button onClick={() => setNewKeys(null)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Dismiss
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
      ) : keys.length === 0 ? (
        <div className="rounded-lg border bg-white py-12 text-center">
          <p className="text-sm text-muted-foreground">No API keys yet</p>
          <p className="text-xs text-muted-foreground mt-1">Generate a pair above to get started.</p>
        </div>
      ) : (
        <div className="rounded-lg border bg-white overflow-hidden">
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
                <TableRow key={key.id} className="hover:bg-zinc-50">
                  <TableCell className="font-medium">{key.label}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
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
                  <TableCell className="text-xs text-muted-foreground">{formatDate(key.created_at)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {key.last_used_at ? formatDate(key.last_used_at) : '-'}
                  </TableCell>
                  <TableCell>
                    {key.is_active && (
                      <button onClick={() => handleRevoke(key.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
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
