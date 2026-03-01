import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { Plus, Trash2 } from 'lucide-react'

export default function Team() {
  const { toast } = useToast()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [inviting, setInviting] = useState(false)
  const [form, setForm] = useState({ email: '', name: '', password: '', role: 'member' })

  async function load() {
    try {
      const res = await api.get('/dashboard/team')
      setMembers(res.data)
    } catch (err) {
      console.error('Failed to load team:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleInvite = async (e) => {
    e.preventDefault()
    if (!form.email.includes('@')) {
      toast({ title: 'Invalid email', description: 'Please enter a valid email address', variant: 'destructive' })
      return
    }
    setInviting(true)
    try {
      await api.post('/dashboard/team', form)
      setForm({ email: '', name: '', password: '', role: 'member' })
      setShowInvite(false)
      load()
      toast({ title: 'Member invited' })
    } catch (err) {
      toast({ title: 'Failed to invite', description: err.message, variant: 'destructive' })
    } finally {
      setInviting(false)
    }
  }

  const handleRemove = async (id) => {
    if (!confirm('Remove this member?')) return
    try {
      await api.delete(`/dashboard/team/${id}`)
      load()
      toast({ title: 'Member removed' })
    } catch (err) {
      toast({ title: 'Failed to remove', description: err.message, variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Team</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">Manage team members and permissions</p>
        </div>
        <Button onClick={() => setShowInvite(!showInvite)} variant={showInvite ? 'outline' : 'default'}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Add member
        </Button>
      </div>

      {showInvite && (
        <form onSubmit={handleInvite} className="rounded-lg border bg-white p-5 grid gap-3 sm:grid-cols-2">
          <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <Input type="password" placeholder="Temporary password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          <select
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            <option value="admin">Admin</option>
            <option value="member">Member</option>
            <option value="viewer">Viewer</option>
          </select>
          <div className="sm:col-span-2 flex gap-2">
            <Button type="submit" disabled={inviting}>
              {inviting ? 'Inviting...' : 'Invite'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setShowInvite(false)}>Cancel</Button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
      ) : members.length === 0 ? (
        <div className="rounded-lg border bg-white py-12 text-center">
          <p className="text-sm text-muted-foreground">No team members</p>
          <p className="text-xs text-muted-foreground mt-1">Add members to collaborate on your dashboard.</p>
        </div>
      ) : (
        <div className="rounded-lg border bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last login</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((m) => (
                <TableRow key={m.id} className="hover:bg-zinc-50">
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell className="text-muted-foreground">{m.email}</TableCell>
                  <TableCell><Badge variant="secondary">{m.role}</Badge></TableCell>
                  <TableCell>
                    <Badge variant={m.is_active ? 'success' : 'secondary'}>
                      {m.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {m.last_login_at ? formatDate(m.last_login_at) : '-'}
                  </TableCell>
                  <TableCell>
                    {m.role !== 'owner' && (
                      <button onClick={() => handleRemove(m.id)} className="text-muted-foreground hover:text-destructive transition-colors">
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
