import { useState, useEffect, useRef } from 'react'
import { cn, formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { Link } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import NfcIcon from '@hugeicons/core-free-icons/NfcIcon'
import ArrowRight01Icon from '@hugeicons/core-free-icons/ArrowRight01Icon'
import CheckmarkCircle02Icon from '@hugeicons/core-free-icons/CheckmarkCircle02Icon'
import Key01Icon from '@hugeicons/core-free-icons/Key01Icon'
import Shield01Icon from '@hugeicons/core-free-icons/Shield01Icon'
import SmartPhone01Icon from '@hugeicons/core-free-icons/SmartPhone01Icon'
import CreditCardPosIcon from '@hugeicons/core-free-icons/CreditCardPosIcon'
import LockIcon from '@hugeicons/core-free-icons/LockIcon'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8082'

const TEST_CARD = {
  customer_id: 'demo@taprail.co',
  pan: '5060990580000217499',
  pin: '1111',
  expiry_date: '5003',
  cvv: '111',
}

const TEST_OTP = '123456'

const FLOW_STEPS = [
  { id: 'create', label: 'Create', icon: Key01Icon, description: 'Initialize a payment session' },
  { id: 'verify', label: 'Verify', icon: Shield01Icon, description: 'Lock session with nonce + signature' },
  { id: 'nfc', label: 'Beam Read', icon: NfcIcon, description: 'Read card via NFC' },
  { id: 'complete', label: 'Complete', icon: SmartPhone01Icon, description: 'Submit card data to ISW' },
  { id: 'otp', label: 'OTP', icon: LockIcon, description: 'Verify one-time password', optional: true },
  { id: 'done', label: 'Done', icon: CheckmarkCircle02Icon, description: 'Payment successful' },
]

// --- Subcomponents ---

function StepProgress({ steps, currentStep, completedSteps }) {
  return (
    <div className="flex items-center w-full">
      {steps.map((step, i) => {
        const done = completedSteps.has(step.id)
        const active = step.id === currentStep
        return (
          <div key={step.id} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center transition-all duration-500 shrink-0',
                done && 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20',
                active && 'bg-primary text-white ring-[3px] ring-primary/20 shadow-lg shadow-primary/20',
                !done && !active && 'bg-muted/80 text-muted-foreground',
                step.optional && !done && !active && 'border-2 border-dashed border-muted-foreground/20 bg-transparent'
              )}>
                {done ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                ) : (
                  <HugeiconsIcon icon={step.icon} size={14} strokeWidth={1.8} />
                )}
              </div>
              <span className={cn(
                'text-[10px] font-medium text-center w-14 leading-tight transition-colors',
                active ? 'text-primary' : done ? 'text-emerald-600' : 'text-muted-foreground/60'
              )}>
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn(
                'h-[2px] flex-1 mx-1.5 mt-[-16px] rounded-full transition-all duration-500',
                done ? 'bg-emerald-500' : 'bg-muted/80'
              )} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function NfcAnimation({ onComplete }) {
  const [phase, setPhase] = useState(0)
  const phases = [
    { label: 'Initializing Beam NFC...', status: 'loading' },
    { label: 'PPSE selected: 2PAY.SYS.DDF01', status: 'done' },
    { label: 'AID: A0000000041010 (Mastercard)', status: 'done' },
    { label: 'GET PROCESSING OPTIONS complete', status: 'done' },
    { label: 'Reading EMV records...', status: 'done' },
    { label: 'Card data extracted', status: 'success' },
  ]

  useEffect(() => {
    if (phase < phases.length - 1) {
      const t = setTimeout(() => setPhase(p => p + 1), 700)
      return () => clearTimeout(t)
    }
  }, [phase])

  return (
    <div className="flex flex-col items-center gap-6">
      {/* NFC visual */}
      <div className="relative w-28 h-28">
        <div className="absolute inset-0 rounded-2xl bg-primary/5 border border-primary/20 flex items-center justify-center">
          <HugeiconsIcon icon={NfcIcon} size={32} className="text-primary" strokeWidth={1.3} />
        </div>
        {phase < phases.length - 1 && [0, 1, 2].map(i => (
          <div
            key={i}
            className="absolute inset-0 rounded-2xl border border-primary/15 animate-ping"
            style={{ animationDelay: `${i * 0.4}s`, animationDuration: '1.5s' }}
          />
        ))}
        {phase === phases.length - 1 && (
          <div className="absolute inset-0 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center animate-fade-in">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><path d="M20 6L9 17l-5-5" /></svg>
          </div>
        )}
      </div>

      {/* Terminal output */}
      <div className="w-full rounded-lg border border-slate-700/50 bg-slate-900 overflow-hidden">
        <div className="px-3 py-1.5 border-b border-slate-700/50">
          <span className="text-[10px] text-slate-500 font-mono">Beam NFC — EMV Contactless Read</span>
        </div>
        <div className="p-3 space-y-1">
          {phases.map((p, i) => (
            <div
              key={i}
              className={cn(
                'flex items-center gap-2 transition-all duration-300',
                i <= phase ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'
              )}
            >
              <span className={cn(
                'w-1.5 h-1.5 rounded-full shrink-0',
                i < phase ? 'bg-emerald-400' : i === phase && phase < phases.length - 1 ? 'bg-primary animate-pulse' : 'bg-emerald-400'
              )} />
              <span className={cn(
                'font-mono text-[11px]',
                i < phase || phase === phases.length - 1 ? 'text-slate-300' : 'text-white'
              )}>
                {p.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {phase === phases.length - 1 && (
        <Button onClick={onComplete} size="sm" className="gap-2">
          Continue with card data
          <HugeiconsIcon icon={ArrowRight01Icon} size={12} />
        </Button>
      )}
    </div>
  )
}

function ResponsePanel({ data, label }) {
  const [lines, setLines] = useState(0)
  const allLines = JSON.stringify(data, null, 2).split('\n')

  useEffect(() => {
    setLines(0)
  }, [data])

  useEffect(() => {
    if (lines < allLines.length) {
      const t = setTimeout(() => setLines(l => l + 1), 30)
      return () => clearTimeout(t)
    }
  }, [lines, allLines.length])

  return (
    <div className="rounded-lg border border-slate-700/50 bg-slate-900 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-700/50">
        <span className="text-[10px] text-slate-500 font-mono">{label}</span>
        <span className="rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-semibold px-1.5 py-0.5">200</span>
      </div>
      <pre className="p-3 text-[12px] leading-[1.7] text-slate-100 overflow-x-auto max-h-[300px]">
        <code>{allLines.slice(0, lines).join('\n')}</code>
        {lines < allLines.length && <span className="animate-pulse text-primary">|</span>}
      </pre>
    </div>
  )
}

function StatusBadge({ status }) {
  const colors = {
    pending: 'bg-muted text-muted-foreground',
    locked: 'bg-blue-100 text-blue-700',
    awaiting_otp: 'bg-amber-100 text-amber-700',
    paid: 'bg-emerald-100 text-emerald-700',
  }
  return (
    <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', colors[status] || 'bg-muted text-muted-foreground')}>
      {status}
    </span>
  )
}

function Spinner({ label }) {
  return (
    <span className="flex items-center gap-2">
      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      {label}
    </span>
  )
}

// --- Main ---

export default function Demo() {
  const { toast } = useToast()
  const responseRef = useRef(null)

  const [apiKey, setApiKey] = useState(null)
  const [apiKeys, setApiKeys] = useState([])
  const [loadingKeys, setLoadingKeys] = useState(true)
  const [currentStep, setCurrentStep] = useState('create')
  const [completedSteps, setCompletedSteps] = useState(new Set())
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState(null)
  const [session, setSession] = useState(null)
  const [responses, setResponses] = useState({})
  const [amount, setAmount] = useState(500)

  useEffect(() => { loadApiKeys() }, [])

  async function loadApiKeys() {
    try {
      const res = await api.get('/dashboard/api-keys')
      setApiKeys(res.data || [])
    } catch (err) {
      console.error('Failed to load keys:', err)
    } finally {
      setLoadingKeys(false)
    }
  }

  function markComplete(id) { setCompletedSteps(prev => new Set([...prev, id])) }
  function goToStep(id) { setError(null); setCurrentStep(id) }

  function reset() {
    setCurrentStep('create')
    setCompletedSteps(new Set())
    setSession(null)
    setResponses({})
    setError(null)
    setIsProcessing(false)
  }

  async function infraRequest(method, path, body) {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`)
    return data
  }

  async function handleCreateSession() {
    setIsProcessing(true); setError(null)
    try {
      const body = { amount, merchant_ref: `demo_${Date.now()}`, metadata: { source: 'beam_demo' } }
      setResponses(prev => ({ ...prev, create_req: body }))
      const res = await infraRequest('POST', '/v1/infra/sessions', body)
      setSession(res.data)
      setResponses(prev => ({ ...prev, create: res }))
    } catch (err) { setError(err.message) }
    finally { setIsProcessing(false) }
  }

  async function handleVerifySession() {
    setIsProcessing(true); setError(null)
    try {
      const body = { nonce: session.nonce, signature: session.signature }
      setResponses(prev => ({ ...prev, verify_req: body }))
      const res = await infraRequest('POST', `/v1/infra/sessions/${session.id}/verify`, body)
      setSession(prev => ({ ...prev, ...res.data, status: 'locked' }))
      setResponses(prev => ({ ...prev, verify: res }))
    } catch (err) { setError(err.message) }
    finally { setIsProcessing(false) }
  }

  async function handleCompleteSession() {
    setIsProcessing(true); setError(null)
    try {
      const body = { ...TEST_CARD }
      setResponses(prev => ({ ...prev, complete_req: body }))
      const res = await infraRequest('POST', `/v1/infra/sessions/${session.id}/complete`, body)
      setResponses(prev => ({ ...prev, complete: res }))
      if (res.data?.status === 'awaiting_otp') {
        setSession(prev => ({ ...prev, status: 'awaiting_otp' }))
      } else {
        setSession(prev => ({ ...prev, status: 'paid' }))
      }
    } catch (err) { setError(err.message) }
    finally { setIsProcessing(false) }
  }

  async function handleSubmitOtp() {
    setIsProcessing(true); setError(null)
    try {
      const body = { otp: TEST_OTP }
      setResponses(prev => ({ ...prev, otp_req: body }))
      const res = await infraRequest('POST', `/v1/infra/sessions/${session.id}/submit-otp`, body)
      setSession(prev => ({ ...prev, status: 'paid' }))
      setResponses(prev => ({ ...prev, otp: res }))
    } catch (err) { setError(err.message) }
    finally { setIsProcessing(false) }
  }

  const stepIndex = FLOW_STEPS.findIndex(s => s.id === currentStep)
  const stepObj = FLOW_STEPS[stepIndex]
  const response = responses[currentStep]

  function advanceToNext() {
    markComplete(currentStep)
    if (currentStep === 'complete' && responses.complete?.data?.status === 'awaiting_otp') {
      goToStep('otp')
    } else if (currentStep === 'complete' && (session?.status === 'paid' || responses.complete?.data?.status === 'paid')) {
      markComplete('otp')
      goToStep('done')
    } else {
      const next = FLOW_STEPS[stepIndex + 1]
      if (next) goToStep(next.id)
    }
  }

  // --- No API key screen ---
  if (!apiKey) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Beam Payment Demo</h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            Run the full Beam NFC payment flow with live API calls against the test environment.
          </p>
        </div>

        <div className="rounded-xl border bg-card shadow-card overflow-hidden">
          <div className="p-6 space-y-5">
            <div>
              <h2 className="text-[14px] font-semibold">Enter your Test API Key</h2>
              <p className="text-[12px] text-muted-foreground mt-1">
                The demo makes real API requests — sessions, transactions, and webhooks are all recorded.
              </p>
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="sk_test_..."
                className="font-mono text-sm flex-1"
                id="api-key-input"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.target.value.trim()) setApiKey(e.target.value.trim())
                }}
              />
              <Button onClick={() => {
                const val = document.getElementById('api-key-input').value.trim()
                if (val) setApiKey(val)
              }}>
                Start
              </Button>
            </div>

            {apiKeys.filter(k => k.environment === 'test').length > 0 && (
              <div className="rounded-lg bg-muted/50 border p-3 space-y-1.5">
                <p className="text-[11px] font-medium text-muted-foreground">Your test keys:</p>
                {apiKeys.filter(k => k.environment === 'test').map(k => (
                  <div key={k.id} className="flex items-center gap-2 text-[11px]">
                    <code className="font-mono text-muted-foreground">{k.key_prefix}...{k.key_suffix}</code>
                    <span className="text-muted-foreground/50">{k.label || 'No label'}</span>
                  </div>
                ))}
                <p className="text-[10px] text-muted-foreground">
                  Need the full key? <Link to="/api-keys" className="text-primary hover:underline">Create a new one</Link>.
                </p>
              </div>
            )}

            {loadingKeys && <p className="text-[11px] text-muted-foreground animate-pulse">Loading keys...</p>}
          </div>

          <div className="border-t bg-amber-50/80 px-6 py-3">
            <p className="text-[11px] text-amber-700">
              <strong>Test card:</strong> PAN 5060990580000217499 &middot; PIN 1111 &middot; Expiry 5003 &middot; CVV 111 &middot; OTP 123456
            </p>
          </div>
        </div>

        {/* Flow overview */}
        <div className="rounded-xl border bg-card shadow-card p-6 space-y-4">
          <h3 className="text-[13px] font-semibold text-muted-foreground">What this demo does</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {FLOW_STEPS.map((step) => (
              <div key={step.id} className="flex items-start gap-2.5 p-2">
                <div className={cn(
                  'w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
                  step.optional ? 'border border-dashed border-muted-foreground/20' : 'bg-muted/80'
                )}>
                  <HugeiconsIcon icon={step.icon} size={13} strokeWidth={1.5} className="text-muted-foreground" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-foreground leading-tight">{step.label}</p>
                  <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // --- Main Demo UI ---

  return (
    <div className="space-y-5">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Beam Payment Demo</h1>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            Live API calls — test environment
            {session && (
              <> &middot; Session <code className="font-mono">{session.id?.slice(0, 12)}...</code> <StatusBadge status={session.status} /></>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <code className="text-[10px] text-muted-foreground/60 font-mono bg-muted px-2 py-1 rounded hidden sm:block">
            {apiKey.slice(0, 10)}...
          </code>
          <Button variant="outline" size="sm" onClick={reset}>Reset</Button>
          <Button variant="ghost" size="sm" onClick={() => { setApiKey(null); reset() }}>Change Key</Button>
        </div>
      </div>

      {/* Step progress */}
      <div className="rounded-xl border bg-card shadow-card px-6 py-5">
        <StepProgress steps={FLOW_STEPS} currentStep={currentStep} completedSteps={completedSteps} />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Left: Action panel (3/5) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="rounded-xl border bg-card shadow-card overflow-hidden">
            {/* Step header */}
            <div className="px-6 py-4 border-b bg-muted/30">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center',
                  currentStep === 'done' ? 'bg-emerald-100 text-emerald-600' :
                  currentStep === 'nfc' ? 'bg-amber-100 text-amber-600' :
                  'bg-primary/10 text-primary'
                )}>
                  <HugeiconsIcon icon={stepObj.icon} size={15} strokeWidth={1.5} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-[14px] font-semibold">{stepObj.label}</h2>
                    {stepObj.optional && (
                      <span className="text-[9px] font-medium text-muted-foreground bg-muted rounded-full px-2 py-0.5">Conditional</span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">{stepObj.description}</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Create step */}
              {currentStep === 'create' && (
                <>
                  <div className="flex items-end gap-3">
                    <div className="space-y-1.5 flex-1 max-w-[180px]">
                      <label className="text-[11px] font-medium text-muted-foreground">Amount (NGN)</label>
                      <Input
                        type="number"
                        value={amount}
                        onChange={e => setAmount(Number(e.target.value))}
                        min={1}
                        className="font-mono"
                        disabled={!!response}
                      />
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <label className="text-[11px] font-medium text-muted-foreground">Endpoint</label>
                      <div className="flex items-center gap-2 h-9">
                        <span className="rounded bg-blue-100 text-blue-700 px-1.5 py-0.5 text-[10px] font-bold">POST</span>
                        <code className="text-[12px] text-muted-foreground font-mono">/v1/infra/sessions</code>
                      </div>
                    </div>
                  </div>
                  {!response && (
                    <Button onClick={handleCreateSession} disabled={isProcessing} className="gap-2">
                      {isProcessing ? <Spinner label="Creating session..." /> : <>Create Session <HugeiconsIcon icon={ArrowRight01Icon} size={12} /></>}
                    </Button>
                  )}
                </>
              )}

              {/* Verify step */}
              {currentStep === 'verify' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-muted-foreground">Endpoint</label>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-blue-100 text-blue-700 px-1.5 py-0.5 text-[10px] font-bold">POST</span>
                      <code className="text-[12px] text-muted-foreground font-mono">/v1/infra/sessions/{session?.id?.slice(0, 8)}...​/verify</code>
                    </div>
                  </div>
                  <div className="rounded-lg border border-slate-700/50 bg-slate-900 p-3">
                    <pre className="text-[11px] text-slate-300 font-mono leading-relaxed">
                      <code>{JSON.stringify({ nonce: session?.nonce?.slice(0, 20) + '...', signature: session?.signature?.slice(0, 20) + '...' }, null, 2)}</code>
                    </pre>
                  </div>
                  {!response && (
                    <Button onClick={handleVerifySession} disabled={isProcessing} className="gap-2">
                      {isProcessing ? <Spinner label="Verifying..." /> : <>Verify Session <HugeiconsIcon icon={ArrowRight01Icon} size={12} /></>}
                    </Button>
                  )}
                </>
              )}

              {/* NFC step */}
              {currentStep === 'nfc' && (
                <NfcAnimation onComplete={() => {
                  setResponses(prev => ({
                    ...prev,
                    nfc: { local: true, data: { aid: 'A0000000041010', scheme: 'Mastercard', pan: TEST_CARD.pan, expiry: TEST_CARD.expiry_date } },
                  }))
                }} />
              )}

              {/* Complete step */}
              {currentStep === 'complete' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-muted-foreground">Endpoint</label>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-blue-100 text-blue-700 px-1.5 py-0.5 text-[10px] font-bold">POST</span>
                      <code className="text-[12px] text-muted-foreground font-mono">/v1/infra/sessions/{session?.id?.slice(0, 8)}...​/complete</code>
                    </div>
                  </div>
                  <div className="rounded-lg border border-slate-700/50 bg-slate-900 p-3">
                    <pre className="text-[11px] text-slate-300 font-mono leading-relaxed">
                      <code>{JSON.stringify({ customer_id: TEST_CARD.customer_id, pan: '506099****7499', pin: '****', expiry_date: '****', cvv: '***' }, null, 2)}</code>
                    </pre>
                  </div>
                  <div className="rounded-lg bg-muted/50 border p-3">
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Server encrypts card data using RSA (PKCS1Padding) and submits to Interswitch <code className="font-mono text-[10px]">POST /api/v3/purchases</code>
                    </p>
                  </div>
                  {!response && (
                    <Button onClick={handleCompleteSession} disabled={isProcessing} className="gap-2">
                      {isProcessing ? <Spinner label="Processing via Interswitch..." /> : <>Complete Payment <HugeiconsIcon icon={ArrowRight01Icon} size={12} /></>}
                    </Button>
                  )}
                </>
              )}

              {/* OTP step */}
              {currentStep === 'otp' && (
                <>
                  <div className="rounded-lg bg-amber-50/80 border border-amber-200/60 p-4">
                    <p className="text-[12px] text-amber-800">
                      Interswitch returned <code className="font-mono font-semibold text-[11px]">T0</code> — OTP verification required.
                      In production, the cardholder receives the OTP via SMS from their bank.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-muted-foreground">Test OTP</label>
                      <Input value={TEST_OTP} readOnly className="font-mono w-32 text-center" />
                    </div>
                  </div>
                  {!response && (
                    <Button onClick={handleSubmitOtp} disabled={isProcessing} className="gap-2">
                      {isProcessing ? <Spinner label="Validating OTP..." /> : <>Submit OTP <HugeiconsIcon icon={ArrowRight01Icon} size={12} /></>}
                    </Button>
                  )}
                </>
              )}

              {/* Done step */}
              {currentStep === 'done' && (
                <div className="space-y-4">
                  <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-5 text-center">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                      <HugeiconsIcon icon={CheckmarkCircle02Icon} size={24} className="text-emerald-600" strokeWidth={1.5} />
                    </div>
                    <p className="text-[14px] font-semibold text-emerald-800">Payment Successful</p>
                    <p className="text-[12px] text-emerald-600 mt-1">
                      Session <code className="font-mono font-semibold">{session?.id?.slice(0, 12)}...</code> is now <strong>paid</strong>.
                    </p>
                  </div>
                  <div className="flex gap-2 justify-center">
                    <Button size="sm" asChild>
                      <Link to="/transactions">View Transactions</Link>
                    </Button>
                    <Button size="sm" variant="outline" onClick={reset}>Run Again</Button>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-destructive" />
                    <span className="text-[12px] font-semibold text-destructive">Request Failed</span>
                  </div>
                  <p className="text-[11px] text-destructive/80 mb-2">{error}</p>
                  <Button size="sm" variant="outline" onClick={() => setError(null)}>Retry</Button>
                </div>
              )}

              {/* Next step button (after response received) */}
              {response && currentStep !== 'done' && (
                <div className="pt-2 border-t">
                  <Button size="sm" onClick={advanceToNext} className="gap-2">
                    {currentStep === 'complete' && responses.complete?.data?.status === 'awaiting_otp'
                      ? 'Continue to OTP'
                      : currentStep === 'complete' && (session?.status === 'paid' || responses.complete?.data?.status === 'paid')
                      ? 'View Result'
                      : 'Next Step'}
                    <HugeiconsIcon icon={ArrowRight01Icon} size={12} />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Response panel (2/5) */}
        <div className="lg:col-span-2 space-y-4" ref={responseRef}>
          {response ? (
            <div className="rounded-xl border bg-card shadow-card overflow-hidden">
              <div className="px-4 py-3 border-b bg-muted/30">
                <h3 className="text-[12px] font-semibold text-muted-foreground">
                  {currentStep === 'nfc' ? 'Card Data (Local)' : 'API Response'}
                </h3>
              </div>
              <div className="p-4">
                <ResponsePanel data={response} label={currentStep === 'nfc' ? 'beam://nfc/read' : `${BASE_URL}/v1/infra/...`} />
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed bg-card/50 p-8 flex flex-col items-center justify-center text-center min-h-[200px]">
              <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                <HugeiconsIcon icon={CreditCardPosIcon} size={18} className="text-muted-foreground/40" strokeWidth={1.3} />
              </div>
              <p className="text-[12px] text-muted-foreground/60">
                {currentStep === 'nfc' ? 'Beam NFC reading in progress...' : 'Execute the request to see the response'}
              </p>
            </div>
          )}

          {/* Session state card */}
          {session && (
            <div className="rounded-xl border bg-card shadow-card p-4 space-y-3">
              <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Session State</h3>
              <div className="space-y-2">
                {[
                  ['ID', session.id?.slice(0, 16) + '...'],
                  ['Amount', `₦${(session.amount || amount).toLocaleString()}`],
                  ['Status', null, <StatusBadge key="s" status={session.status || 'pending'} />],
                  ['Created', session.created_at ? new Date(session.created_at).toLocaleTimeString() : '—'],
                ].map(([label, value, custom]) => (
                  <div key={label} className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">{label}</span>
                    {custom || <span className="font-mono text-foreground">{value}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
