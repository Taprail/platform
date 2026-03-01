import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  ArrowLeftRight,
  Key,
  Webhook,
  Users,
  ScrollText,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Overview' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { to: '/api-keys', icon: Key, label: 'API Keys' },
  { to: '/webhooks', icon: Webhook, label: 'Webhooks' },
  { to: '/team', icon: Users, label: 'Team' },
  { to: '/audit-log', icon: ScrollText, label: 'Audit Log' },
]

function NavItem({ to, icon: Icon, label, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors',
          isActive
            ? 'bg-zinc-100 text-foreground font-medium'
            : 'text-muted-foreground hover:text-foreground hover:bg-zinc-50'
        )
      }
    >
      <Icon className="h-4 w-4" strokeWidth={1.75} />
      {label}
    </NavLink>
  )
}

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-56 flex-col border-r bg-white">
      <div className="flex h-12 items-center gap-2.5 px-5">
        <div className="flex h-[22px] w-[22px] items-center justify-center rounded-[5px] bg-foreground">
          <span className="text-[11px] font-semibold leading-none text-white">T</span>
        </div>
        <span className="text-[14px] font-semibold tracking-tight">Taprail</span>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 pt-2">
        {navItems.map((item) => (
          <NavItem key={item.to} {...item} end={item.to === '/'} />
        ))}
      </nav>

      <div className="px-3 pb-3">
        <NavItem to="/settings" icon={Settings} label="Settings" />
      </div>
    </aside>
  )
}
