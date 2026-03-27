import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { Link } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import PencilEdit01Icon from '@hugeicons/core-free-icons/PencilEdit01Icon'
import Cancel01Icon from '@hugeicons/core-free-icons/Cancel01Icon'
import Notification01Icon from '@hugeicons/core-free-icons/Notification01Icon'

export default function Settings() {
  const { business, refreshBusiness } = useAuth()
  const { toast } = useToast()
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '' })

  const [changingPassword, setChangingPassword] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' })

  async function load() {
    setLoading(true)
    try {
      const res = await api.get('/dashboard/settings')
      setSettings(res.data)
      setForm({ name: res.data.business.name, phone: res.data.business.phone || '' })
    } catch (err) {
      toast({ title: 'Failed to load settings', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    if (form.name.trim().length < 2) {
      toast({ title: 'Business name is too short', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const res = await api.put('/dashboard/settings', {
        name: form.name.trim(),
        phone: form.phone.trim() || null,
      })
      setSettings((prev) => ({ ...prev, business: res.data }))
      setEditing(false)
      if (refreshBusiness) refreshBusiness(res.data)
      toast({ title: 'Settings updated' })
    } catch (err) {
      toast({ title: 'Failed to update', description: err.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (pwForm.new_password.length < 8) {
      toast({ title: 'New password must be at least 8 characters', variant: 'destructive' })
      return
    }
    if (pwForm.new_password !== pwForm.confirm_password) {
      toast({ title: 'Passwords do not match', variant: 'destructive' })
      return
    }
    setSavingPassword(true)
    try {
      await api.put('/dashboard/settings/password', {
        current_password: pwForm.current_password,
        new_password: pwForm.new_password,
      })
      setPwForm({ current_password: '', new_password: '', confirm_password: '' })
      setChangingPassword(false)
      toast({ title: 'Password changed successfully' })
    } catch (err) {
      toast({ title: 'Failed to change password', description: err.message, variant: 'destructive' })
    } finally {
      setSavingPassword(false)
    }
  }

  const biz = settings?.business || business

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
        <p className="text-[13px] text-muted-foreground mt-1">Your business and integration details</p>
      </div>

      {loading ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-44 w-full rounded-xl" />)}
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Business Info */}
          <div className="rounded-xl border bg-card p-6 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">Business</p>
              {!editing ? (
                <button onClick={() => setEditing(true)} className="text-muted-foreground/40 hover:text-foreground transition-colors">
                  <HugeiconsIcon icon={PencilEdit01Icon} size={14} strokeWidth={1.5} />
                </button>
              ) : (
                <button onClick={() => { setEditing(false); setForm({ name: biz?.name || '', phone: biz?.phone || '' }) }} className="text-muted-foreground/40 hover:text-foreground transition-colors">
                  <HugeiconsIcon icon={Cancel01Icon} size={14} strokeWidth={1.5} />
                </button>
              )}
            </div>
            {editing ? (
              <form onSubmit={handleSave} className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[13px] text-muted-foreground">Name</label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[13px] text-muted-foreground">Phone</label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Optional" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[13px] text-muted-foreground">Email</label>
                  <Input value={biz?.email || ''} disabled className="opacity-50" />
                </div>
                <Button type="submit" disabled={saving} className="w-full">
                  {saving ? 'Saving...' : 'Save changes'}
                </Button>
              </form>
            ) : (
              <div className="divide-y divide-border/50">
                <Field label="Name">{biz?.name}</Field>
                <Field label="Email">{biz?.email}</Field>
                <Field label="Phone">{biz?.phone || '-'}</Field>
              </div>
            )}
          </div>

          {/* Integration */}
          <div className="rounded-xl border bg-card p-6 shadow-card">
            <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider mb-4">Integration</p>
            <div className="divide-y divide-border/50">
              <Field label="Tier">
                <Badge variant="secondary">
                  {biz?.tier === 'platform' ? 'Platform' : 'Infra'}
                </Badge>
              </Field>
              <Field label="Status">
                <Badge variant="success">{biz?.status || 'active'}</Badge>
              </Field>
              <Field label="Webhook secret">
                <span className="font-mono text-[11px]">{settings?.webhook_secret || '********'}</span>
              </Field>
            </div>
          </div>

          {/* Fees */}
          <div className="rounded-xl border bg-card p-6 shadow-card">
            <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider mb-4">Fees</p>
            <div className="divide-y divide-border/50">
              <Field label="Percentage">{biz?.fee_percent || 1.5}%</Field>
              <Field label="Cap">NGN {(biz?.fee_cap || 2000).toLocaleString()}</Field>
            </div>
          </div>

          {/* Change Password */}
          <div className="rounded-xl border bg-card p-6 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">Security</p>
              {!changingPassword && (
                <Button variant="outline" size="sm" onClick={() => setChangingPassword(true)}>
                  Change password
                </Button>
              )}
            </div>
            {changingPassword ? (
              <form onSubmit={handlePasswordChange} className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[13px] text-muted-foreground">Current password</label>
                  <Input
                    type="password"
                    value={pwForm.current_password}
                    onChange={(e) => setPwForm({ ...pwForm, current_password: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[13px] text-muted-foreground">New password</label>
                  <Input
                    type="password"
                    placeholder="Min 8 characters"
                    value={pwForm.new_password}
                    onChange={(e) => setPwForm({ ...pwForm, new_password: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[13px] text-muted-foreground">Confirm new password</label>
                  <Input
                    type="password"
                    value={pwForm.confirm_password}
                    onChange={(e) => setPwForm({ ...pwForm, confirm_password: e.target.value })}
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={savingPassword}>
                    {savingPassword ? 'Changing...' : 'Change password'}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => { setChangingPassword(false); setPwForm({ current_password: '', new_password: '', confirm_password: '' }) }}>
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <p className="text-[13px] text-muted-foreground">Update your password to keep your account secure.</p>
            )}
          </div>

          {/* Notification Preferences Link */}
          <div className="rounded-xl border bg-card p-6 shadow-card lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider mb-1.5">Notifications</p>
                <p className="text-[13px] text-muted-foreground">Configure which email notifications you receive.</p>
              </div>
              <Link to="/settings/notifications">
                <Button variant="outline" size="sm">
                  <HugeiconsIcon icon={Notification01Icon} size={14} strokeWidth={1.5} className="mr-1.5" />
                  Manage
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div className="flex justify-between py-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{children}</span>
    </div>
  )
}
