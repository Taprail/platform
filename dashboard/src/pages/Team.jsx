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
import Delete01Icon from '@hugeicons/core-free-icons/Delete01Icon'
import UserGroupIcon from '@hugeicons/core-free-icons/UserGroupIcon'

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

  const resetForm = () => setForm({ email: '', name: '', password: '', role: 'member' })

  const handleInvite = async (e) => {
    e.preventDefault()
    if (!form.email.includes('@')) {
      toast({ title: 'Invalid email', description: 'Please enter a valid email address', variant: 'destructive' })
      return
    }
    setInviting(true)
    try {
      await api.post('/dashboard/team', form)
      resetForm()
      setShowInvite(false)
      load()
      toast({ title: 'Member added' })
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
          <h1 className="text-xl font-semibold tracking-tight">Team</h1>
          <p className="text-[13px] text-muted-foreground mt-1">Manage team members and permissions</p>
        </div>
        <Button onClick={() => setShowInvite(true)}>
          <HugeiconsIcon icon={PlusSignIcon} size={14} strokeWidth={1.5} className="mr-1.5" />
          Add member
        </Button>
      </div>

      {/* Add Member Modal */}
      <Modal open={showInvite} onOpenChange={(open) => { setShowInvite(open); if (!open) resetForm() }}>
        <form onSubmit={handleInvite}>
          <ModalHeader>
            <ModalTitle>Add team member</ModalTitle>
            <ModalDescription>They'll be able to access the dashboard with their credentials.</ModalDescription>
          </ModalHeader>
          <ModalBody className="space-y-4">
            <div className="space-y-2">
              <label className="text-[13px] font-medium text-foreground/80">Name</label>
              <Input placeholder="Jane Smith" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required autoFocus />
            </div>
            <div className="space-y-2">
              <label className="text-[13px] font-medium text-foreground/80">Email</label>
              <Input type="email" placeholder="jane@company.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <label className="text-[13px] font-medium text-foreground/80">Temporary password</label>
              <Input type="password" placeholder="Min 8 characters" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <label className="text-[13px] font-medium text-foreground/80">Role</label>
              <select
                className="flex h-9 w-full rounded-lg border border-input bg-white px-3 py-1 text-sm shadow-soft transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="admin">Admin</option>
                <option value="member">Member</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="outline" onClick={() => setShowInvite(false)}>Cancel</Button>
            <Button type="submit" disabled={inviting}>
              {inviting ? 'Adding...' : 'Add member'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
      ) : members.length === 0 ? (
        <EmptyState
          icon={UserGroupIcon}
          title="Just you for now"
          description="Invite team members to collaborate on your integration."
          action={() => setShowInvite(true)}
          actionLabel="Add member"
        />
      ) : (
        <div className="rounded-xl border bg-card shadow-card overflow-hidden">
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
                <TableRow key={m.id} className="hover:bg-muted/30">
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
