import { Link } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import SecurityCheckIcon from '@hugeicons/core-free-icons/SecurityCheckIcon'
import Key01Icon from '@hugeicons/core-free-icons/Key01Icon'
import WebhookIcon from '@hugeicons/core-free-icons/WebhookIcon'
import CreditCardIcon from '@hugeicons/core-free-icons/CreditCardIcon'
import Tick01Icon from '@hugeicons/core-free-icons/Tick01Icon'
import ArrowRight01Icon from '@hugeicons/core-free-icons/ArrowRight01Icon'
import Cancel01Icon from '@hugeicons/core-free-icons/Cancel01Icon'

const ICON_MAP = { ShieldCheck: SecurityCheckIcon, Key: Key01Icon, Webhook: WebhookIcon, CreditCard: CreditCardIcon }

export function GettingStartedChecklist({ steps, onDismiss }) {
  const completedCount = steps.filter((s) => s.complete).length

  return (
    <div className="rounded-xl border bg-card shadow-card animate-fade-in-up">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
        <div>
          <p className="text-sm font-semibold">Get started</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {completedCount} of {steps.length} complete
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="rounded-lg p-1.5 text-muted-foreground/50 hover:text-foreground hover:bg-muted/40 transition-all duration-150"
        >
          <HugeiconsIcon icon={Cancel01Icon} size={16} />
        </button>
      </div>

      {/* Progress bar */}
      <div className="flex gap-1.5 px-6 pt-4 pb-2">
        {steps.map((step, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              step.complete ? 'bg-emerald-500' : 'bg-muted'
            }`}
          />
        ))}
      </div>

      <div className="divide-y divide-border/50">
        {steps.map((step) => {
          const iconData = ICON_MAP[step.icon]
          return (
            <Link
              key={step.label}
              to={step.to}
              className={`flex items-center gap-3.5 px-6 py-3.5 transition-all duration-150 hover:bg-muted/30 ${
                step.complete ? 'bg-emerald-50/40' : ''
              }`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors ${
                  step.complete
                    ? 'border-emerald-500 bg-emerald-500 text-white'
                    : 'border-muted-foreground/20 text-muted-foreground/60'
                }`}
              >
                {step.complete ? (
                  <HugeiconsIcon icon={Tick01Icon} size={14} />
                ) : iconData ? (
                  <HugeiconsIcon icon={iconData} size={14} />
                ) : null}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${step.complete ? 'line-through text-muted-foreground' : ''}`}>
                  {step.label}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
              </div>
              {!step.complete && (
                <HugeiconsIcon icon={ArrowRight01Icon} size={16} className="shrink-0 text-muted-foreground/40" />
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
