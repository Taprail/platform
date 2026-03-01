import { useAuth } from '@/hooks/use-auth'
import { LogOut } from 'lucide-react'

export function Header() {
  const { user, business, logout } = useAuth()

  return (
    <header className="sticky top-0 z-20 flex h-12 items-center justify-between border-b bg-white px-8">
      <p className="text-[13px] text-muted-foreground">{business?.name}</p>
      <div className="flex items-center gap-3">
        <span className="text-[13px] text-muted-foreground">{user?.name}</span>
        <button
          onClick={logout}
          className="text-muted-foreground hover:text-foreground transition-colors"
          title="Sign out"
        >
          <LogOut className="h-3.5 w-3.5" strokeWidth={1.75} />
        </button>
      </div>
    </header>
  )
}
