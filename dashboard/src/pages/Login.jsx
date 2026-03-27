import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { HugeiconsIcon } from '@hugeicons/react'
import Alert01Icon from '@hugeicons/core-free-icons/Alert01Icon'
import Mail01Icon from '@hugeicons/core-free-icons/Mail01Icon'
import SquareLock01Icon from '@hugeicons/core-free-icons/SquareLock01Icon'

export default function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-[26px] font-semibold tracking-tight">Welcome back</h2>
        <p className="text-[14px] text-muted-foreground mt-2">Sign in to your Taprail dashboard</p>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl bg-destructive/5 border border-destructive/10 px-4 py-3.5 mb-6">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-destructive/10 mt-0.5">
            <HugeiconsIcon icon={Alert01Icon} size={13} className="text-destructive" strokeWidth={1.8} />
          </div>
          <p className="text-[13px] text-destructive leading-relaxed pt-0.5">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="text-[13px] font-medium text-foreground/80">Email</label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/30">
              <HugeiconsIcon icon={Mail01Icon} size={16} strokeWidth={1.5} />
            </div>
            <Input
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              autoComplete="email"
              className="h-11 pl-10"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-[13px] font-medium text-foreground/80">Password</label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/30">
              <HugeiconsIcon icon={SquareLock01Icon} size={16} strokeWidth={1.5} />
            </div>
            <Input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="h-11 pl-10"
            />
          </div>
        </div>
        <Button type="submit" className="w-full h-11 text-[13px] font-medium" disabled={loading}>
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Signing in...
            </span>
          ) : 'Sign in'}
        </Button>
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
        Don't have an account?{' '}
        <Link to="/register" className="text-primary font-medium hover:underline underline-offset-4">
          Create one
        </Link>
      </p>
    </div>
  )
}
