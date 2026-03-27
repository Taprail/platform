import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { HugeiconsIcon } from '@hugeicons/react'
import Alert01Icon from '@hugeicons/core-free-icons/Alert01Icon'
import Building03Icon from '@hugeicons/core-free-icons/Building03Icon'
import CpuIcon from '@hugeicons/core-free-icons/CpuIcon'
import Mail01Icon from '@hugeicons/core-free-icons/Mail01Icon'
import SquareLock01Icon from '@hugeicons/core-free-icons/SquareLock01Icon'
import UserIcon from '@hugeicons/core-free-icons/UserIcon'
import { cn } from '@/lib/utils'

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
    <div>
      <div className="mb-8">
        <h2 className="text-[26px] font-semibold tracking-tight">Get started</h2>
        <p className="text-[14px] text-muted-foreground mt-2">Create your Taprail account</p>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl bg-destructive/5 border border-destructive/10 px-4 py-3.5 mb-6">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-destructive/10 mt-0.5">
            <HugeiconsIcon icon={Alert01Icon} size={13} className="text-destructive" strokeWidth={1.8} />
          </div>
          <p className="text-[13px] text-destructive leading-relaxed pt-0.5">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-[13px] font-medium text-foreground/80">Business name</label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/30">
              <HugeiconsIcon icon={Building03Icon} size={16} strokeWidth={1.5} />
            </div>
            <Input placeholder="Acme Corp" value={form.business_name} onChange={update('business_name')} required autoFocus className="h-11 pl-10" />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-[13px] font-medium text-foreground/80">Your name</label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/30">
              <HugeiconsIcon icon={UserIcon} size={16} strokeWidth={1.5} />
            </div>
            <Input placeholder="Jane Smith" value={form.user_name} onChange={update('user_name')} required className="h-11 pl-10" />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-[13px] font-medium text-foreground/80">Email</label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/30">
              <HugeiconsIcon icon={Mail01Icon} size={16} strokeWidth={1.5} />
            </div>
            <Input type="email" placeholder="you@company.com" value={form.email} onChange={update('email')} required autoComplete="email" className="h-11 pl-10" />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-[13px] font-medium text-foreground/80">Password</label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/30">
              <HugeiconsIcon icon={SquareLock01Icon} size={16} strokeWidth={1.5} />
            </div>
            <Input type="password" placeholder="Min 8 characters" value={form.password} onChange={update('password')} required autoComplete="new-password" className="h-11 pl-10" />
          </div>
        </div>

        {/* Tier selector */}
        <div className="space-y-2.5">
          <label className="text-[13px] font-medium text-foreground/80">Integration type</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'platform', icon: Building03Icon, label: 'Platform', desc: 'Token-based payments', color: 'bg-primary/8 text-primary' },
              { value: 'infra', icon: CpuIcon, label: 'Infra', desc: 'NFC card-present', color: 'bg-violet-500/8 text-violet-600' },
            ].map(({ value, icon, label, desc, color }) => (
              <button
                key={value}
                type="button"
                onClick={() => setForm({ ...form, tier: value })}
                className={cn(
                  'flex flex-col items-start gap-2.5 rounded-xl border px-4 py-4 text-left transition-all duration-200',
                  form.tier === value
                    ? 'border-primary/40 bg-primary/[0.03] ring-2 ring-primary/10 shadow-sm'
                    : 'border-border/60 hover:border-border hover:bg-muted/20'
                )}
              >
                <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', form.tier === value ? color : 'bg-muted text-muted-foreground/50')}>
                  <HugeiconsIcon icon={icon} size={15} strokeWidth={1.5} />
                </div>
                <div>
                  <span className="text-[13px] font-medium block">{label}</span>
                  <span className="text-[11px] text-muted-foreground/60 leading-tight">{desc}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="pt-1">
          <Button type="submit" className="w-full h-11 text-[13px] font-medium" disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Creating account...
              </span>
            ) : 'Create account'}
          </Button>
        </div>
      </form>

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border/50" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-background px-3 text-muted-foreground/40">or</span>
        </div>
      </div>

      <p className="text-[13px] text-muted-foreground text-center">
        Already have an account?{' '}
        <Link to="/login" className="text-primary font-medium hover:underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </div>
  )
}
