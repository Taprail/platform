import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/StatusBadge'
import { Skeleton } from '@/components/ui/skeleton'
import { Modal, ModalHeader, ModalTitle, ModalDescription, ModalBody, ModalFooter } from '@/components/ui/modal'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { EmptyState } from '@/components/ui/empty-state'
import { HugeiconsIcon } from '@hugeicons/react'
import PlusSignIcon from '@hugeicons/core-free-icons/PlusSignIcon'
import Delete01Icon from '@hugeicons/core-free-icons/Delete01Icon'
import WebhookIcon from '@hugeicons/core-free-icons/WebhookIcon'
import SentIcon from '@hugeicons/core-free-icons/SentIcon'
import { webhookPayloads } from '@/lib/code-snippets'

const EVENT_OPTIONS = [
  'session.created',
  'session.verified',
  'session.paid',
  'session.expired',
  'session.cancelled',
  'charge.succeeded',
  'charge.failed',
  'refund.created',
  'refund.completed',
  'dispute.created',
  'dispute.updated',
  'dispute.closed',
  'settlement.completed',
]

export default function Webhooks() {
  const { toast } = useToast()
  const [endpoints, setEndpoints] = useState([])
  const [deliveries, setDeliveries] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('endpoints')
  const [showCreate, setShowCreate] = useState(false)
  const [url, setUrl] = useState('')
  const [selectedEvents, setSelectedEvents] = useState([])
  const [creating, setCreating] = useState(false)
  const [expandedDelivery, setExpandedDelivery] = useState(null)
  const [deliveryDetail, setDeliveryDetail] = useState(null)

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
      setShowCreate(false)
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Webhooks</h1>
          <p className="text-[13px] text-muted-foreground mt-1">Receive event notifications to your server</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <HugeiconsIcon icon={PlusSignIcon} size={14} strokeWidth={1.5} className="mr-1.5" />
          Add endpoint
        </Button>
      </div>

      {/* Add Endpoint Modal */}
      <Modal open={showCreate} onOpenChange={(open) => { setShowCreate(open); if (!open) { setUrl(''); setSelectedEvents([]) } }}>
        <ModalHeader>
          <ModalTitle>Add webhook endpoint</ModalTitle>
          <ModalDescription>Events will be sent as POST requests to this URL.</ModalDescription>
        </ModalHeader>
        <ModalBody className="space-y-4">
          <div className="space-y-2">
            <label className="text-[13px] font-medium text-foreground/80">Endpoint URL</label>
            <Input placeholder="https://your-server.com/webhooks" value={url} onChange={(e) => setUrl(e.target.value)} autoFocus />
          </div>
          <div className="space-y-2">
            <label className="text-[13px] font-medium text-foreground/80">Events to listen for</label>
            <div className="flex flex-wrap gap-1.5">
              {EVENT_OPTIONS.map((event) => (
                <button
                  key={event}
                  onClick={() => toggleEvent(event)}
                  className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-all duration-150 ${
                    selectedEvents.includes(event)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'text-muted-foreground hover:text-foreground hover:border-foreground/30'
                  }`}
                >
                  {event}
                </button>
              ))}
            </div>
            {selectedEvents.length > 0 && (
              <p className="text-[11px] text-muted-foreground">{selectedEvents.length} event{selectedEvents.length !== 1 ? 's' : ''} selected</p>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={creating || !url || selectedEvents.length === 0}>
            {creating ? 'Adding...' : 'Add endpoint'}
          </Button>
        </ModalFooter>
      </Modal>

      <div className="flex gap-4 border-b">
        {[
          { id: 'endpoints', label: 'Endpoints' },
          { id: 'deliveries', label: 'Deliveries' },
          { id: 'payloads', label: 'Payload Examples' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`pb-2.5 text-[13px] font-medium border-b-2 transition-colors -mb-px ${
              tab === t.id ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'payloads' ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Example JSON payloads for each webhook event type.</p>
          {Object.entries(webhookPayloads).map(([event, payload]) => (
            <div key={event} className="rounded-xl border bg-card shadow-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border/50">
                <code className="text-xs font-medium">{event}</code>
              </div>
              <pre className="p-4 text-xs font-mono bg-foreground text-white/80 overflow-x-auto">
                {JSON.stringify(payload, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      ) : loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
      ) : tab === 'endpoints' ? (
        endpoints.length === 0 ? (
          <EmptyState
            icon={WebhookIcon}
            title="No endpoints configured"
            description="Add a webhook endpoint to start receiving event notifications."
            action={() => setShowCreate(true)}
            actionLabel="Add endpoint"
          />
        ) : (
          <div className="rounded-xl border bg-card shadow-card overflow-hidden">
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
                  <TableRow key={ep.id} className="hover:bg-muted/30">
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
                        <HugeiconsIcon icon={Delete01Icon} size={14} strokeWidth={1.5} />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )
      ) : deliveries.length === 0 ? (
        <EmptyState
          icon={SentIcon}
          title="No deliveries yet"
          description="Deliveries will appear here once events are sent."
        />
      ) : (
        <div className="rounded-xl border bg-card shadow-card overflow-hidden">
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
                <React.Fragment key={del.id}>
                  <TableRow
                    className="hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={async () => {
                      if (expandedDelivery === del.id) {
                        setExpandedDelivery(null)
                        setDeliveryDetail(null)
                      } else {
                        setExpandedDelivery(del.id)
                        try {
                          const res = await api.get(`/dashboard/webhooks/deliveries/${del.id}`)
                          setDeliveryDetail(res.data)
                        } catch { setDeliveryDetail(null) }
                      }
                    }}
                  >
                    <TableCell><code className="text-xs">{del.event_type}</code></TableCell>
                    <TableCell><StatusBadge status={del.status} /></TableCell>
                    <TableCell className="text-xs tabular-nums">{del.attempts}</TableCell>
                    <TableCell className="text-xs text-muted-foreground tabular-nums">{del.last_response_code || '-'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(del.created_at)}</TableCell>
                  </TableRow>
                  {expandedDelivery === del.id && deliveryDetail && (
                    <tr>
                      <td colSpan={5} className="p-0">
                        <div className="border-t border-border/50 bg-muted/20 p-4 space-y-3">
                          {deliveryDetail.endpoint_url && (
                            <div>
                              <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider mb-1">Endpoint</p>
                              <code className="text-xs">{deliveryDetail.endpoint_url}</code>
                            </div>
                          )}
                          <div>
                            <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider mb-1">Request payload</p>
                            <pre className="text-xs font-mono bg-foreground text-white/80 rounded-md p-3 overflow-auto max-h-48">
                              {JSON.stringify(deliveryDetail.payload, null, 2)}
                            </pre>
                          </div>
                          {deliveryDetail.last_response_body && (
                            <div>
                              <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider mb-1">
                                Response ({deliveryDetail.last_response_code || '?'})
                              </p>
                              <pre className="text-xs font-mono bg-muted border rounded-md p-3 overflow-auto max-h-48">
                                {deliveryDetail.last_response_body}
                              </pre>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
