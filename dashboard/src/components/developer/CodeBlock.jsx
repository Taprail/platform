import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import Tick01Icon from '@hugeicons/core-free-icons/Tick01Icon'
import Copy01Icon from '@hugeicons/core-free-icons/Copy01Icon'
import { cn } from '@/lib/utils'

export function CodeBlock({ snippets }) {
  const [lang, setLang] = useState('curl')
  const [copied, setCopied] = useState(false)

  const languages = [
    { id: 'curl', label: 'cURL' },
    { id: 'nodejs', label: 'Node.js' },
    { id: 'python', label: 'Python' },
  ]

  const copy = () => {
    navigator.clipboard.writeText(snippets[lang])
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-lg border bg-slate-900 overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-700 px-4 py-2">
        <div className="flex gap-1">
          {languages.map((l) => (
            <button
              key={l.id}
              onClick={() => setLang(l.id)}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                lang === l.id ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              )}
            >
              {l.label}
            </button>
          ))}
        </div>
        <button onClick={copy} className="text-slate-400 hover:text-white transition-colors">
          {copied ? <HugeiconsIcon icon={Tick01Icon} size={14} /> : <HugeiconsIcon icon={Copy01Icon} size={14} />}
        </button>
      </div>
      <pre className="p-4 text-[13px] leading-relaxed text-slate-100 overflow-x-auto">
        <code>{snippets[lang]}</code>
      </pre>
    </div>
  )
}
