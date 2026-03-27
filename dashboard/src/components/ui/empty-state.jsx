import { HugeiconsIcon } from '@hugeicons/react'
import { cn } from '@/lib/utils'

export function EmptyState({ icon, title, description, action, actionLabel, className }) {
  return (
    <div className={cn('rounded-xl border bg-card py-20 text-center animate-fade-in-up shadow-card', className)}>
      {icon && (
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted/60">
          <HugeiconsIcon icon={icon} size={20} strokeWidth={1.5} className="text-muted-foreground/50" />
        </div>
      )}
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && <p className="text-[13px] text-muted-foreground mt-1.5 max-w-sm mx-auto leading-relaxed">{description}</p>}
      {action && actionLabel && (
        <button onClick={action} className="mt-5 inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-all duration-150 active:scale-[0.98]">
          {actionLabel}
        </button>
      )}
    </div>
  )
}
