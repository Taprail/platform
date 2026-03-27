import { Link } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import Key01Icon from '@hugeicons/core-free-icons/Key01Icon'
import CodeIcon from '@hugeicons/core-free-icons/CodeIcon'
import NfcIcon from '@hugeicons/core-free-icons/NfcIcon'
import Shield01Icon from '@hugeicons/core-free-icons/Shield01Icon'
import CheckmarkCircle02Icon from '@hugeicons/core-free-icons/CheckmarkCircle02Icon'
import ArrowRight01Icon from '@hugeicons/core-free-icons/ArrowRight01Icon'
import { cn } from '@/lib/utils'

const steps = [
  {
    num: 1,
    icon: Key01Icon,
    title: 'Get your API keys',
    description: 'Generate a test API key from the dashboard. You\'ll use this to authenticate all API requests.',
    link: { to: '/api-keys', label: 'Go to API Keys' },
    code: {
      label: 'Use your API key in the Authorization header',
      lang: 'bash',
      content: `# Your test API key
curl -H "Authorization: Bearer symble_test_YOUR_KEY" \\
  https://api.taprail.co/v1/infra/sessions`,
    },
  },
  {
    num: 2,
    icon: CodeIcon,
    title: 'Install the Beam SDK',
    description: 'Add the Taprail React Native SDK to your mobile app. This gives you NFC card reading via Beam, session management, and the drop-in PaymentSheet.',
    code: {
      label: 'Install @taprail/react-native',
      lang: 'bash',
      content: `npm install @taprail/react-native

# Wrap your app with the provider
import { TaprailProvider } from '@taprail/react-native'

<TaprailProvider
  apiKey="symble_test_YOUR_KEY"
  tier="infra"
  baseUrl="https://api.taprail.co"
>
  <App />
</TaprailProvider>`,
    },
  },
  {
    num: 3,
    icon: Shield01Icon,
    title: 'Create & verify a session',
    description: 'Create a payment session from your server, then verify it from the mobile SDK using the nonce and signature.',
    code: {
      label: 'Create session → verify → ready for Beam tap',
      lang: 'javascript',
      content: `// Server-side: create a session
const session = await fetch('/v1/infra/sessions', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer symble_test_YOUR_KEY',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    amount: 5000,
    merchant_ref: 'order_123',
  }),
})

// Mobile SDK: verify the session
const { nonce, signature } = session.data
await taprail.verifySession(session.data.id, { nonce, signature })`,
    },
  },
  {
    num: 4,
    icon: NfcIcon,
    title: 'Read card via Beam & complete payment',
    description: 'Use the useNFCPayment hook to read the card via Beam NFC, then complete the session. If OTP is required, the hook handles it automatically.',
    code: {
      label: 'Accept a Beam NFC payment in 4 lines',
      lang: 'javascript',
      content: `import { useNFCPayment } from '@taprail/react-native'

const { startPayment, state } = useNFCPayment()

// Start the full Beam payment flow
await startPayment({ amount: 5000, currency: 'NGN' })

// state transitions: idle → ready → detecting → reading
//   → (awaiting_otp) → success / error`,
    },
  },
  {
    num: 5,
    icon: CheckmarkCircle02Icon,
    title: 'Set up webhooks & go live',
    description: 'Register a webhook endpoint to receive real-time payment events. Once your business is verified (KYB), switch to live mode and start processing real payments.',
    link: { to: '/webhooks', label: 'Set up webhooks' },
    code: {
      label: 'Webhook payload for a successful payment',
      lang: 'json',
      content: `{
  "event": "session.paid",
  "data": {
    "session_id": "a1b2c3d4-...",
    "amount": 5000,
    "fee": 75,
    "net_amount": 4925,
    "payment_reference": "taprail_...",
    "status": "paid"
  }
}`,
    },
  },
]

export default function QuickStart() {
  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Quick Start</h1>
        <p className="text-[13px] text-muted-foreground mt-1">
          Go from zero to accepting Beam NFC payments in five steps.
        </p>
      </div>

      <div className="space-y-6">
        {steps.map((step, i) => (
          <div key={step.num} className="rounded-xl border bg-card shadow-card overflow-hidden">
            <div className="px-6 py-5 flex items-start gap-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary">
                <HugeiconsIcon icon={step.icon} size={17} strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {step.num}
                  </span>
                  <h3 className="text-[14px] font-semibold text-foreground">{step.title}</h3>
                </div>
                <p className="text-[12.5px] text-muted-foreground leading-[1.65]">{step.description}</p>
                {step.link && (
                  <Link
                    to={step.link.to}
                    className="inline-flex items-center gap-1.5 mt-2 text-[12px] font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    {step.link.label}
                    <HugeiconsIcon icon={ArrowRight01Icon} size={12} />
                  </Link>
                )}
              </div>
            </div>

            {step.code && (
              <div className="border-t border-border/40 bg-sidebar overflow-hidden">
                <div className="flex items-center px-4 py-2 border-b border-white/[0.06]">
                  <span className="text-[10px] text-white/25 font-mono">{step.code.label}</span>
                </div>
                <pre className="p-4 text-[12px] font-mono leading-[1.75] text-white/70 overflow-x-auto">
                  <code>{step.code.content}</code>
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-primary/15 bg-primary/[0.02] p-6 text-center">
        <p className="text-[14px] font-medium text-foreground">Ready to test?</p>
        <p className="text-[12.5px] text-muted-foreground mt-1">
          Try the interactive Beam demo to see the full payment flow in action.
        </p>
        <Link
          to="/demo"
          className="inline-flex items-center gap-2 mt-4 text-[12px] font-semibold text-white bg-primary hover:bg-primary/90 h-9 px-5 rounded-lg transition-all duration-150"
        >
          Open Beam demo
          <HugeiconsIcon icon={ArrowRight01Icon} size={12} />
        </Link>
      </div>
    </div>
  )
}
