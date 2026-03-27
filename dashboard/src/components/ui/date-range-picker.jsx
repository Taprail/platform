import { useState } from 'react'
import * as Popover from '@radix-ui/react-popover'
import { HugeiconsIcon } from '@hugeicons/react'
import Calendar03Icon from '@hugeicons/core-free-icons/Calendar03Icon'
import ArrowDown01Icon from '@hugeicons/core-free-icons/ArrowDown01Icon'
import { cn } from '@/lib/utils'

const presets = [
  { label: '7 days', value: '7d' },
  { label: '30 days', value: '30d' },
  { label: '90 days', value: '90d' },
]

function formatLabel(value) {
  if (!value) return '7 days'
  if (value.period === 'custom' && value.from && value.to) {
    const from = new Date(value.from).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })
    const to = new Date(value.to).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })
    return `${from} - ${to}`
  }
  const preset = presets.find((p) => p.value === value.period)
  return preset ? preset.label : '7 days'
}

export function DateRangePicker({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const [customFrom, setCustomFrom] = useState(value?.from || '')
  const [customTo, setCustomTo] = useState(value?.to || '')

  function handlePreset(period) {
    onChange({ period })
    setOpen(false)
  }

  function handleCustomApply() {
    if (customFrom && customTo) {
      onChange({ period: 'custom', from: customFrom, to: customTo })
      setOpen(false)
    }
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          className={cn(
            'inline-flex items-center gap-2 h-9 rounded-lg border border-border/60 bg-white px-3 text-sm shadow-soft',
            'hover:shadow-card transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20'
          )}
        >
          <HugeiconsIcon icon={Calendar03Icon} size={14} className="text-muted-foreground/50" />
          <span className="text-sm text-foreground/80">{formatLabel(value)}</span>
          <HugeiconsIcon icon={ArrowDown01Icon} size={12} className="text-muted-foreground/50" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={6}
          className="z-50 w-64 rounded-xl border bg-white p-3 shadow-lg animate-in fade-in-0 zoom-in-95"
        >
          <div className="space-y-0.5 mb-3">
            {presets.map((p) => (
              <button
                key={p.value}
                onClick={() => handlePreset(p.value)}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-150',
                  value?.period === p.value
                    ? 'bg-primary/5 text-primary font-medium'
                    : 'hover:bg-muted/50 text-muted-foreground'
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="border-t border-border/50 pt-3">
            <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2">Custom range</p>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="flex-1 h-8 rounded-lg border border-input bg-white px-2 text-xs shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20"
              />
              <span className="text-xs text-muted-foreground/50">to</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="flex-1 h-8 rounded-lg border border-input bg-white px-2 text-xs shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20"
              />
            </div>
            <button
              onClick={handleCustomApply}
              disabled={!customFrom || !customTo}
              className="mt-2 w-full h-8 rounded-lg bg-primary text-primary-foreground text-xs font-medium shadow-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
            >
              Apply
            </button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
