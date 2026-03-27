import { useState } from 'react'
import { Link } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import SecurityCheckIcon from '@hugeicons/core-free-icons/SecurityCheckIcon'
import Key01Icon from '@hugeicons/core-free-icons/Key01Icon'
import WebhookIcon from '@hugeicons/core-free-icons/WebhookIcon'
import NfcIcon from '@hugeicons/core-free-icons/NfcIcon'
import ArrowRight01Icon from '@hugeicons/core-free-icons/ArrowRight01Icon'
import { Modal, ModalHeader, ModalTitle, ModalDescription, ModalBody } from '@/components/ui/modal'

const STORAGE_KEY = 'taprail_welcome_seen'

const quickActions = [
  { icon: SecurityCheckIcon, label: 'Verify business', description: 'Complete KYB verification', to: '/kyb', color: 'bg-emerald-500/8 text-emerald-600' },
  { icon: Key01Icon, label: 'Get API keys', description: 'Generate sandbox credentials', to: '/api-keys', color: 'bg-violet-500/8 text-violet-600' },
  { icon: WebhookIcon, label: 'Set up webhooks', description: 'Receive payment events', to: '/webhooks', color: 'bg-sky-500/8 text-sky-600' },
  { icon: NfcIcon, label: 'Try Beam demo', description: 'Test a payment flow', to: '/demo', color: 'bg-primary/8 text-primary' },
]

export function WelcomeModal() {
  const [open, setOpen] = useState(() => localStorage.getItem(STORAGE_KEY) !== 'true')

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, 'true')
    setOpen(false)
  }

  return (
    <Modal open={open} onOpenChange={(v) => { if (!v) dismiss() }}>
      <ModalHeader>
        <ModalTitle>Welcome to Taprail</ModalTitle>
        <ModalDescription>
          Accept contactless payments powered by Beam. Here's how to get started in a few minutes.
        </ModalDescription>
      </ModalHeader>
      <ModalBody>
        <div className="grid grid-cols-2 gap-2">
          {quickActions.map(({ icon, label, description, to, color }) => (
            <Link
              key={label}
              to={to}
              onClick={dismiss}
              className="flex items-start gap-3 rounded-xl border border-border/40 p-3.5 hover:border-border/80 hover:bg-muted/30 transition-all duration-150"
            >
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${color}`}>
                <HugeiconsIcon icon={icon} size={15} strokeWidth={1.5} />
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-foreground">{label}</p>
                <p className="text-[11px] text-muted-foreground/60 mt-0.5">{description}</p>
              </div>
            </Link>
          ))}
        </div>
        <button
          onClick={dismiss}
          className="w-full mt-4 inline-flex items-center justify-center gap-2 text-[13px] font-semibold text-white bg-primary hover:bg-primary/90 h-10 rounded-lg transition-all duration-150"
        >
          Go to dashboard
          <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
        </button>
      </ModalBody>
    </Modal>
  )
}
