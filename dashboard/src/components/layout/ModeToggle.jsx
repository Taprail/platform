import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'taprail_mode'

export function ModeToggle() {
  const [mode, setMode] = useState(() => localStorage.getItem(STORAGE_KEY) || 'test')

  function switchMode(newMode) {
    setMode(newMode)
    localStorage.setItem(STORAGE_KEY, newMode)
    window.dispatchEvent(new Event('taprail_mode_change'))
  }

  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-border/60 bg-white p-0.5 shadow-soft">
      <button
        onClick={() => switchMode('test')}
        className={cn(
          'rounded-md px-2.5 py-1 text-[11px] font-medium transition-all duration-150',
          mode === 'test' ? 'bg-amber-50 text-amber-700 shadow-sm' : 'text-muted-foreground hover:text-foreground'
        )}
      >
        Test
      </button>
      <button
        onClick={() => switchMode('live')}
        className={cn(
          'rounded-md px-2.5 py-1 text-[11px] font-medium transition-all duration-150',
          mode === 'live' ? 'bg-emerald-50 text-emerald-700 shadow-sm' : 'text-muted-foreground hover:text-foreground'
        )}
      >
        Live
      </button>
    </div>
  )
}

export function useModeChange(callback) {
  useEffect(() => {
    window.addEventListener('taprail_mode_change', callback)
    return () => window.removeEventListener('taprail_mode_change', callback)
  }, [callback])
}
