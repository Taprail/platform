import { NavLink } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import DashboardSquare01Icon from '@hugeicons/core-free-icons/DashboardSquare01Icon'
import ArrowDataTransferHorizontalIcon from '@hugeicons/core-free-icons/ArrowDataTransferHorizontalIcon'
import ArrowTurnBackwardIcon from '@hugeicons/core-free-icons/ArrowTurnBackwardIcon'
import BankIcon from '@hugeicons/core-free-icons/BankIcon'
import Shield01Icon from '@hugeicons/core-free-icons/Shield01Icon'
import Key01Icon from '@hugeicons/core-free-icons/Key01Icon'
import WebhookIcon from '@hugeicons/core-free-icons/WebhookIcon'
import UserGroupIcon from '@hugeicons/core-free-icons/UserGroupIcon'
import UserCircleIcon from '@hugeicons/core-free-icons/UserCircleIcon'
import ScrollIcon from '@hugeicons/core-free-icons/ScrollIcon'
import Settings01Icon from '@hugeicons/core-free-icons/Settings01Icon'
import CheckmarkBadge01Icon from '@hugeicons/core-free-icons/CheckmarkBadge01Icon'
import BookOpen01Icon from '@hugeicons/core-free-icons/BookOpen01Icon'
import FlashIcon from '@hugeicons/core-free-icons/FlashIcon'
import NfcIcon from '@hugeicons/core-free-icons/NfcIcon'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'

const mainNav = [
  { to: '/dashboard', icon: DashboardSquare01Icon, label: 'Overview' },
  { to: '/kyb', icon: CheckmarkBadge01Icon, label: 'Verification' },
  { to: '/transactions', icon: ArrowDataTransferHorizontalIcon, label: 'Transactions' },
  { to: '/refunds', icon: ArrowTurnBackwardIcon, label: 'Refunds' },
  { to: '/settlements', icon: BankIcon, label: 'Settlements' },
  { to: '/disputes', icon: Shield01Icon, label: 'Disputes' },
  { to: '/customers', icon: UserCircleIcon, label: 'Customers' },
]

const infraNav = [
  { to: '/api-keys', icon: Key01Icon, label: 'API Keys' },
  { to: '/webhooks', icon: WebhookIcon, label: 'Webhooks' },
  { to: '/team', icon: UserGroupIcon, label: 'Team' },
  { to: '/audit-log', icon: ScrollIcon, label: 'Audit Log' },
]

const devNav = [
  { to: '/quickstart', icon: FlashIcon, label: 'Quick Start' },
  { to: '/api-docs', icon: BookOpen01Icon, label: 'API Docs' },
  { to: '/demo', icon: NfcIcon, label: 'Beam Demo' },
]

function NavItem({ to, icon, label, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'group flex items-center gap-2.5 rounded-lg px-3 py-[7px] text-[13px] transition-all duration-150',
          isActive
            ? 'bg-white/[0.12] text-white font-medium shadow-sm'
            : 'text-white/45 hover:text-white/80 hover:bg-white/[0.06]'
        )
      }
    >
      <HugeiconsIcon icon={icon} size={15} strokeWidth={1.6} className="shrink-0" />
      {label}
    </NavLink>
  )
}

export function Sidebar() {
  const { business } = useAuth()

  const kybStatus = business?.kyb_status
  const kybColor = kybStatus === 'approved' ? 'bg-emerald-400' : kybStatus === 'pending_review' ? 'bg-amber-400' : 'bg-white/20'

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-[232px] flex-col bg-sidebar border-r border-white/[0.06]">
      {/* Logo */}
      <div className="flex h-[60px] items-center gap-2.5 px-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white shadow-sm">
          <span className="text-xs font-bold leading-none text-sidebar">T</span>
        </div>
        <span className="text-[15px] font-semibold tracking-tight text-white">Taprail</span>
      </div>

      {/* Business badge */}
      {business?.name && (
        <div className="mx-3 mb-4 rounded-lg bg-white/[0.06] border border-white/[0.06] px-3.5 py-2.5">
          <p className="text-[12px] font-medium text-white/90 truncate">{business.name}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <div className={cn('h-1.5 w-1.5 rounded-full', kybColor)} />
            <span className="text-[10px] text-white/35 capitalize">
              {business.tier || 'infra'}
            </span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-3 pt-1 overflow-y-auto scrollbar-thin">
        {mainNav.map((item) => (
          <NavItem key={item.to} {...item} end={item.to === '/dashboard'} />
        ))}

        <div className="pt-5 pb-2">
          <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/20">
            Infrastructure
          </p>
        </div>
        {infraNav.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}

        <div className="pt-5 pb-2">
          <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/20">
            Developers
          </p>
        </div>
        {devNav.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 pt-2">
        <div className="mb-3 border-t border-white/[0.06]" />
        <NavItem to="/settings" icon={Settings01Icon} label="Settings" />
      </div>
    </aside>
  )
}
