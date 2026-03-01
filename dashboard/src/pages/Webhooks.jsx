import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/StatusBadge'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { Plus, Trash2 } from 'lucide-react'

const EVENT_OPTIONS = [
  'session.created',
  'session.verified',
  'session.paid',
  'session.expired',
  'session.cancelled',
  'charge.succeeded',
  'charge.failed',
]

export default function Webhooks() {
  const { toast } = useToast()
  const [endpoints, setEndpoints] = useState([])
  const [deliveries, setDeliveries] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('endpoints')
  const [url, setUrl] = useState('')
  const [selectedEvents, setSelectedEvents] = useState([])
  const [creating, setCreating] = useState(false)

  async function load() {
    try {
      const [epRes, delRes] = await Promise.all([
        api.get('/dashboard/webhooks'),
        api.get('/dashboard/webhooks/deliveries?limit=50'),
      ])
      setEndpoints(epRes.data)
      setDeliveries(delRes.data)
    } catch (err) {
      console.error('Failed to load webhooks:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    if (!url || selectedEvents.length === 0) return
    try {
      new URL(url)
    } catch {
      toast({ title: 'Invalid URL', description: 'Please enter a valid webhook URL', variant: 'destructive' })
      return
    }
    if (!url.startsWith('https://') && !url.startsWith('http://localhost')) {
      toast({ title: 'HTTPS required', description: 'Webhook URLs must use HTTPS', variant: 'destructive' })
      return
    }
    setCreating(true)
    try {
      await api.post('/dashboard/webhooks', { url, events: selectedEvents })
      setUrl('')
      setSelectedEvents([])
      load()
      toast({ title: 'Endpoint added' })
    } catch (err) {
      toast({ title: 'Failed to create webhook', description: err.message, variant: 'destructive' })
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Remove this endpoint?')) return
    try {
      await api.delete(`/dashboard/webhooks/${id}`)
      load()
      toast({ title: 'Endpoint removed' })
    } catch (err) {
      toast({ title: 'Failed to delete webhook', description: err.message, variant: 'destructive' })
    }
  }

  const toggleEvent = (event) => {
    setSelectedEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Webhooks</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">Receive event notifications to your server</p>
      </div>

      <div className="rounded-lg border bg-white p-5 space-y-4">
        <p className="text-sm font-medium">Add endpoint</p>
        <Input placeholder="https://your-server.com/webhooks" value={url} onChange={(e) => setUrl(e.target.value)} />
        <div>
          <p className="text-xs text-muted-foreground mb-2">Events</p>
          <div className="flex flex-wrap gap-1.5">
            {EVENT_OPTIONS.map((event) => (
              <button
                key={event}
                onClick={() => toggleEvent(event)}
                className={`rounded-md border px-2 py-1 text-xs font-medium transition-colors ${
                  selectedEvents.includes(event)
                    ? 'bg-foreground text-background border-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:border-foreground/30'
                }`}
              >
                {event}
              </button>
            ))}
          </div>
        </div>
        <Button onClick={handleCreate} disabled={creating || !url || selectedEvents.length === 0}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          {creating ? 'Adding...' : 'Add endpoint'}
        </Button>
      </div>

      <div className="flex gap-4 border-b">
        {['endpoints', 'deliveries'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-2 text-[13px] font-medium border-b-2 transition-colors -mb-px ${
              tab === t ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t === 'endpoints' ? 'Endpoints' : 'Deliveries'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
      ) : tab === 'endpoints' ? (
        endpoints.length === 0 ? (
          <div className="rounded-lg border bg-white py-12 text-center">
            <p className="text-sm text-muted-foreground">No endpoints configured</p>
            <p className="text-xs text-muted-foreground mt-1">Add one above to start receiving events.</p>
          </div>
        ) : (
          <div className="rounded-lg border bg-white overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>URL</TableHead>
                  <TableHead>Events</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {endpoints.map((ep) => (
                  <TableRow key={ep.id} className="hover:bg-zinc-50">
                    <TableCell className="font-mono text-xs">{ep.url}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {ep.events.map((e) => (
                          <Badge key={e} variant="secondary" className="text-[10px]">{e}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={ep.is_active ? 'success' : 'secondary'}>
                        {ep.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(ep.created_at)}</TableCell>
                    <TableCell>
                      <button onClick={() => handleDelete(ep.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )
      ) : deliveries.length === 0 ? (
        <div className="rounded-lg border bg-white py-12 text-center">
          <p className="text-sm text-muted-foreground">No deliveries yet</p>
          <p className="text-xs text-muted-foreground mt-1">Deliveries will appear here once events are sent.</p>
        </div>
      ) : (
        <div className="rounded-lg border bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Event</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Attempts</TableHead>
                <TableHead>Response</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deliveries.map((del) => (
                <TableRow key={del.id} className="hover:bg-zinc-50">
                  <TableCell><code className="text-xs">{del.event_type}</code></TableCell>
                  <TableCell><StatusBadge status={del.status} /></TableCell>
                  <TableCell className="text-xs tabular-nums">{del.attempts}</TableCell>
                  <TableCell className="text-xs text-muted-foreground tabular-nums">{del.last_response_code || '-'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDate(del.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
