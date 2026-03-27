import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { HugeiconsIcon } from '@hugeicons/react'
import NfcIcon from '@hugeicons/core-free-icons/NfcIcon'
import SmartPhone01Icon from '@hugeicons/core-free-icons/SmartPhone01Icon'
import CreditCardPosIcon from '@hugeicons/core-free-icons/CreditCardPosIcon'

export function AuthLayout() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
      </div>
    )
  }

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[540px] flex-col justify-between bg-sidebar p-12 relative overflow-hidden">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }} />

        <div className="relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm">
              <span className="text-sm font-bold leading-none text-sidebar">T</span>
            </div>
            <span className="text-base font-semibold tracking-tight text-white">Taprail</span>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <h1 className="text-[34px] font-semibold leading-[1.1] tracking-tight text-white">
            NFC payment
            <br />
            infrastructure
          </h1>
          <p className="text-[15px] text-white/40 leading-relaxed max-w-[320px]">
            Accept contactless payments from any NFC-enabled device. POS-to-phone, phone-to-phone, and card-present.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2.5 pt-2">
            {[
              { icon: NfcIcon, label: 'NFC Tap-to-Pay' },
              { icon: SmartPhone01Icon, label: 'Phone-to-Phone' },
              { icon: CreditCardPosIcon, label: 'Card-Present' },
            ].map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-2 rounded-lg bg-white/[0.08] border border-white/[0.06] px-3 py-2">
                <HugeiconsIcon icon={icon} size={14} className="text-white/50" strokeWidth={1.5} />
                <span className="text-[12px] font-medium text-white/60">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-[11px] text-white/20">
          Taprail &mdash; Contactless payments for developers
        </p>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 items-center justify-center p-8 bg-background">
        <div className="w-full max-w-[400px]">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sidebar shadow-sm">
                <span className="text-xs font-bold leading-none text-white">T</span>
              </div>
              <span className="text-[15px] font-semibold tracking-tight">Taprail</span>
            </div>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
