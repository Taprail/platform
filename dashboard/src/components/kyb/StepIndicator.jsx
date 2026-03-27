import { HugeiconsIcon } from '@hugeicons/react'
import Tick01Icon from '@hugeicons/core-free-icons/Tick01Icon'
import BankIcon from '@hugeicons/core-free-icons/BankIcon'
import UserCircleIcon from '@hugeicons/core-free-icons/UserCircleIcon'
import File01Icon from '@hugeicons/core-free-icons/File01Icon'
import CheckmarkCircle02Icon from '@hugeicons/core-free-icons/CheckmarkCircle02Icon'
import { cn } from '@/lib/utils'

const steps = [
  { label: 'Business', icon: BankIcon },
  { label: 'Director', icon: UserCircleIcon },
  { label: 'Documents', icon: File01Icon },
  { label: 'Review', icon: CheckmarkCircle02Icon },
]

export function StepIndicator({ currentStep, completedSteps }) {
  return (
    <div className="rounded-xl border bg-card shadow-card px-6 py-4">
      <div className="flex items-center w-full">
        {steps.map((step, index) => {
          const isCompleted = completedSteps[index]
          const isCurrent = currentStep === index
          const isFuture = !isCompleted && !isCurrent

          return (
            <div key={step.label} className="flex items-center flex-1 last:flex-none">
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-300',
                    isCompleted && 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20',
                    isCurrent && 'bg-primary text-primary-foreground shadow-sm ring-[3px] ring-primary/15',
                    isFuture && 'bg-muted text-muted-foreground/40'
                  )}
                >
                  {isCompleted ? (
                    <HugeiconsIcon icon={Tick01Icon} size={14} strokeWidth={2.5} />
                  ) : (
                    <HugeiconsIcon icon={step.icon} size={14} strokeWidth={1.5} />
                  )}
                </div>
                <span
                  className={cn(
                    'text-[12px] font-medium hidden sm:block',
                    isCurrent && 'text-foreground font-semibold',
                    isCompleted && 'text-emerald-600',
                    isFuture && 'text-muted-foreground/40'
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'h-[2px] flex-1 mx-4 rounded-full transition-all duration-300',
                    isCompleted ? 'bg-emerald-400' : 'bg-border/40'
                  )}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
