import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function Register() {
  const { register } = useAuth()
  const [form, setForm] = useState({
    business_name: '',
    email: '',
    password: '',
    user_name: '',
    tier: 'platform',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (form.business_name.trim().length < 2) {
      setError('Business name is too short')
      return
    }
    if (!form.email.includes('@') || !form.email.includes('.')) {
      setError('Please enter a valid email address')
      return
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    try {
      await register(form)
    } catch (err) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-sm font-medium">Create your account</h2>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      <div className="space-y-1.5">
        <label className="text-[13px] text-muted-foreground">Business name</label>
        <Input placeholder="Acme Corp" value={form.business_name} onChange={update('business_name')} required />
      </div>
      <div className="space-y-1.5">
        <label className="text-[13px] text-muted-foreground">Your name</label>
        <Input placeholder="Jane Smith" value={form.user_name} onChange={update('user_name')} required />
      </div>
      <div className="space-y-1.5">
        <label className="text-[13px] text-muted-foreground">Email</label>
        <Input type="email" placeholder="you@company.com" value={form.email} onChange={update('email')} required />
      </div>
      <div className="space-y-1.5">
        <label className="text-[13px] text-muted-foreground">Password</label>
        <Input type="password" placeholder="Min 8 characters" value={form.password} onChange={update('password')} required />
      </div>
      <div className="space-y-1.5">
        <label className="text-[13px] text-muted-foreground">Integration tier</label>
        <select
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          value={form.tier}
          onChange={update('tier')}
        >
          <option value="platform">Platform</option>
          <option value="infra">Infra</option>
        </select>
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Creating account...' : 'Create account'}
      </Button>
      <p className="text-[13px] text-muted-foreground">
        Have an account?{' '}
        <Link to="/login" className="text-foreground underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </form>
  )
}
