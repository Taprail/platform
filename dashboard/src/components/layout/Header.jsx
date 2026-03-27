import { useState, useCallback } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useLocation } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import Logout01Icon from '@hugeicons/core-free-icons/Logout01Icon'
import AlertCircleIcon from '@hugeicons/core-free-icons/AlertCircleIcon'
import { ModeToggle, useModeChange } from './ModeToggle'

const pageTitles = {
  '/dashboard': 'Overview',
  '/transactions': 'Transactions',
  '/refunds': 'Refunds',
  '/settlements': 'Settlements',
  '/disputes': 'Disputes',
  '/customers': 'Customers',
  '/api-keys': 'API Keys',
  '/webhooks': 'Webhooks',
  '/team': 'Team',
  '/audit-log': 'Audit Log',
  '/settings': 'Settings',
  '/kyb': 'Verification',
  '/kyb/status': 'Verification Status',
  '/api-docs': 'API Documentation',
  '/demo': 'Beam Demo',
  '/quickstart': 'Quick Start',
  '/notifications': 'Notifications',
}

function getPageTitle(pathname) {
  if (pageTitles[pathname]) return pageTitles[pathname]
  if (pathname.startsWith('/transactions/')) return 'Transaction Detail'
  if (pathname.startsWith('/disputes/')) return 'Dispute Detail'
  if (pathname.startsWith('/customers/')) return 'Customer Detail'
  return ''
}

export function Header() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const title = getPageTitle(location.pathname)
  const [mode, setMode] = useState(() => localStorage.getItem('taprail_mode') || 'test')

  useModeChange(useCallback(() => {
    setMode(localStorage.getItem('taprail_mode') || 'test')
  }, []))

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  return (
    <div className="sticky top-0 z-20">
      {mode === 'test' && (
        <div className="flex items-center justify-center gap-2 h-7 bg-amber-50 border-b border-amber-200 text-amber-700">
          <HugeiconsIcon icon={AlertCircleIcon} size={12} strokeWidth={2} />
          <span className="text-[11px] font-medium">Test mode &mdash; transactions use sandbox credentials</span>
        </div>
      )}
      <header className="flex h-[60px] items-center justify-between border-b border-border/50 bg-background/80 backdrop-blur-xl px-8">
        <div className="flex items-center gap-4">
          <h2 className="text-[15px] font-semibold text-foreground tracking-tight">{title}</h2>
          <ModeToggle />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2.5 rounded-full border border-border/50 bg-white pl-1 pr-3.5 py-1 shadow-soft">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-white">
              {initials}
            </div>
            <span className="text-[13px] font-medium text-foreground/80">{user?.name}</span>
          </div>
          <button
            onClick={logout}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-muted/60 transition-all duration-150"
            title="Sign out"
          >
            <HugeiconsIcon icon={Logout01Icon} size={14} strokeWidth={1.5} />
          </button>
        </div>
      </header>
    </div>
  )
}
