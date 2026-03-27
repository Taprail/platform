import { useState, useEffect } from 'react'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { StatusBadge } from '@/components/StatusBadge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { HugeiconsIcon } from '@hugeicons/react'
import Notification01Icon from '@hugeicons/core-free-icons/Notification01Icon'

const PREFERENCE_OPTIONS = [
  { key: 'payment_success', label: 'Payment success', description: 'When a payment is completed successfully' },
  { key: 'payment_failed', label: 'Payment failed', description: 'When a payment attempt fails' },
  { key: 'refund', label: 'Refund', description: 'When a refund is processed' },
  { key: 'dispute', label: 'Dispute', description: 'When a new dispute or chargeback is opened' },
  { key: 'settlement', label: 'Settlement', description: 'When a settlement payout is initiated' },
  { key: 'kyb_update', label: 'KYB update', description: 'When your verification status changes' },
  { key: 'weekly_summary', label: 'Weekly summary', description: 'A weekly overview of your transactions' },
]

export default function NotificationSettings() {
  const { toast } = useToast()
  const [preferences, setPreferences] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [emails, setEmails] = useState([])
  const [emailsLoading, setEmailsLoading] = useState(true)

  async function loadPreferences() {
    setLoading(true)
    try {
      const res = await api.get('/dashboard/notifications/preferences')
      setPreferences(res.data || {})
    } catch (err) {
      toast({ title: 'Failed to load preferences', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  async function loadEmails() {
    setEmailsLoading(true)
    try {
      const res = await api.get('/dashboard/notifications/emails?limit=20')
      setEmails(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      // Email log may not be available
      setEmails([])
    } finally {
      setEmailsLoading(false)
    }
  }

  useEffect(() => {
    loadPreferences()
    loadEmails()
  }, [])

  const togglePreference = (key) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put('/dashboard/notifications/preferences', preferences)
      toast({ title: 'Notification preferences saved' })
    } catch (err) {
      toast({ title: 'Failed to save preferences', description: err.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Notification Preferences</h1>
        <p className="text-[13px] text-muted-foreground mt-1">Choose which email notifications to receive</p>
      </div>

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <div className="rounded-xl border bg-card shadow-card p-6">
          <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider mb-3">Email Notifications</p>
          <div className="divide-y divide-border/50">
            {PREFERENCE_OPTIONS.map((opt) => (
              <label
                key={opt.key}
                className="flex items-center justify-between py-3 cursor-pointer group"
              >
                <div>
                  <p className="text-sm font-medium">{opt.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
                </div>
                <input
                  type="checkbox"
                  checked={!!preferences[opt.key]}
                  onChange={() => togglePreference(opt.key)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-ring/20 cursor-pointer"
                />
              </label>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-border/50">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save preferences'}
            </Button>
          </div>
        </div>
      )}

      {/* Email Log */}
      <div>
        <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider mb-3">Email Log</p>
      </div>

      {emailsLoading ? (
        <div className="space-y-1.5">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
        </div>
      ) : emails.length === 0 ? (
        <div className="rounded-xl border bg-card shadow-card py-12 text-center">
          <HugeiconsIcon icon={Notification01Icon} size={20} className="text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No emails sent yet</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Recent notification emails will appear here.</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card shadow-card bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Subject</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {emails.map((email) => (
                <TableRow key={email.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="text-sm font-medium">{email.subject}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{email.recipient}</TableCell>
                  <TableCell><StatusBadge status={email.status} /></TableCell>
                  <TableCell className="text-right text-[11px] text-muted-foreground">{formatDate(email.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
