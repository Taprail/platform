import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

const NAV_SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'authentication', label: 'Authentication' },
  { id: 'sessions', label: 'Sessions' },
  { id: 'verify', label: 'Verify Session' },
  { id: 'infra-complete', label: 'Infra: Complete' },
  { id: 'infra-otp', label: 'Infra: Submit OTP' },
  { id: 'platform-charge', label: 'Platform: Charge' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'webhooks', label: 'Webhooks' },
  { id: 'errors', label: 'Error Handling' },
]

function MethodBadge({ method }) {
  const colors = {
    GET: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    POST: 'bg-blue-100 text-blue-700 border-blue-200',
    PUT: 'bg-amber-100 text-amber-700 border-amber-200',
    DELETE: 'bg-red-100 text-red-700 border-red-200',
  }
  return (
    <span className={cn('rounded-md border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide', colors[method] || 'bg-gray-100 text-gray-700 border-gray-200')}>
      {method}
    </span>
  )
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={copy} className="text-[10px] text-slate-400 hover:text-white transition-colors font-mono">
      {copied ? 'copied!' : 'copy'}
    </button>
  )
}

function CodeBlock({ code, lang, title }) {
  return (
    <div className="rounded-lg border border-slate-700/50 bg-slate-900 overflow-hidden">
      {title && (
        <div className="flex items-center justify-between border-b border-slate-700/50 px-4 py-2">
          <span className="text-[11px] font-medium text-slate-400">{title}</span>
          <CopyButton text={code} />
        </div>
      )}
      <pre className="p-4 text-[13px] leading-[1.75] text-slate-100 overflow-x-auto">
        <code>{code}</code>
      </pre>
    </div>
  )
}

function TabbedCode({ snippets }) {
  const [tab, setTab] = useState('curl')
  const tabs = [
    { id: 'curl', label: 'cURL' },
    { id: 'nodejs', label: 'Node.js' },
    { id: 'python', label: 'Python' },
  ]
  return (
    <div className="rounded-lg border border-slate-700/50 bg-slate-900 overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-700/50 px-4 py-2">
        <div className="flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn('rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors', tab === t.id ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white')}
            >
              {t.label}
            </button>
          ))}
        </div>
        <CopyButton text={snippets[tab]} />
      </div>
      <pre className="p-4 text-[13px] leading-[1.75] text-slate-100 overflow-x-auto">
        <code>{snippets[tab]}</code>
      </pre>
    </div>
  )
}

function ParamTable({ params }) {
  return (
    <div className="rounded-lg border overflow-hidden">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="bg-muted/50 border-b">
            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Parameter</th>
            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Type</th>
            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Required</th>
            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Description</th>
          </tr>
        </thead>
        <tbody>
          {params.map((p) => (
            <tr key={p.name} className="border-t">
              <td className="px-4 py-2.5 font-mono text-[12px] font-medium">{p.name}</td>
              <td className="px-4 py-2.5 text-muted-foreground text-[12px]">{p.type}</td>
              <td className="px-4 py-2.5">
                {p.required ? (
                  <span className="rounded-full bg-primary/10 text-primary text-[10px] font-semibold px-2 py-0.5">required</span>
                ) : (
                  <span className="text-[10px] text-muted-foreground">optional</span>
                )}
              </td>
              <td className="px-4 py-2.5 text-muted-foreground text-[12px]">{p.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Endpoint({ method, path, title, description, requestParams, responseParams, snippets, responseExample, notes }) {
  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <MethodBadge method={method} />
          <code className="text-[14px] font-mono text-foreground font-medium">{path}</code>
        </div>
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="text-[13px] text-muted-foreground mt-1 leading-relaxed">{description}</p>
      </div>

      {requestParams && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Request Parameters</p>
          <ParamTable params={requestParams} />
        </div>
      )}

      {snippets && <TabbedCode snippets={snippets} />}

      {responseParams && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Response Fields</p>
          <ParamTable params={responseParams} />
        </div>
      )}

      {responseExample && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Example Response</p>
          <CodeBlock code={JSON.stringify(responseExample, null, 2)} lang="json" />
        </div>
      )}

      {notes && (
        <div className="rounded-lg border border-amber-200/60 bg-amber-50/60 px-4 py-3">
          <p className="text-[12px] text-amber-800 leading-relaxed">{notes}</p>
        </div>
      )}
    </div>
  )
}

function SectionDivider() {
  return <div className="h-px bg-border/60 my-2" />
}

export default function PublicDocs() {
  const [activeSection, setActiveSection] = useState('overview')
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id)
        })
      },
      { rootMargin: '-80px 0px -70% 0px' }
    )
    NAV_SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  const scrollTo = (id) => {
    setActiveSection(id)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-card text-foreground">
      {/* Nav */}
      <nav className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled ? 'bg-card/80 backdrop-blur-xl border-b border-border/50 shadow-sm' : 'bg-transparent'
      )}>
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sidebar">
                <span className="text-xs font-bold leading-none text-white">T</span>
              </div>
              <span className="text-[14px] font-semibold tracking-tight text-foreground">Taprail</span>
            </Link>
            <div className="hidden sm:flex items-center gap-1 bg-muted/50 rounded-lg p-0.5">
              <Link to="/docs" className="text-[12px] font-medium px-3 py-1.5 rounded-md bg-card shadow-sm text-foreground">API Docs</Link>
              <Link to="/sdk" className="text-[12px] font-medium px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors">SDK</Link>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/login" className="text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors px-3.5 py-1.5 rounded-lg">
              Log in
            </Link>
            <Link to="/register" className="text-[13px] font-medium px-4 py-1.5 rounded-lg text-white bg-sidebar hover:bg-sidebar/90 transition-all">
              Get started
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 pt-20">
        <div className="flex gap-10">
          {/* Sidebar */}
          <aside className="hidden lg:block w-52 shrink-0">
            <div className="sticky top-20 space-y-0.5 py-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/50 mb-3 px-3">API Reference</p>
              {NAV_SECTIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => scrollTo(s.id)}
                  className={cn(
                    'block w-full text-left rounded-lg px-3 py-1.5 text-[13px] transition-colors',
                    activeSection === s.id
                      ? 'bg-primary/8 text-primary font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </aside>

          {/* Content */}
          <main className="flex-1 min-w-0 py-6 pb-32 space-y-16">
            {/* Overview */}
            <section id="overview" className="space-y-5">
              <div>
                <h1 className="text-[28px] font-semibold tracking-tight">API Documentation</h1>
                <p className="text-[15px] text-muted-foreground mt-2 leading-relaxed max-w-2xl">
                  The Taprail API lets you create payment sessions, process NFC card-present payments via Beam,
                  manage transactions, and receive real-time webhook notifications.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="rounded-xl border p-4 space-y-1.5">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Base URL</p>
                  <code className="text-[13px] font-mono text-foreground font-medium">https://api.taprail.co</code>
                </div>
                <div className="rounded-xl border p-4 space-y-1.5">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">API Version</p>
                  <code className="text-[13px] font-mono text-foreground font-medium">v1</code>
                  <p className="text-[11px] text-muted-foreground">All endpoints are prefixed with <code className="font-mono">/v1</code></p>
                </div>
              </div>

              <div className="rounded-xl border p-5 space-y-3">
                <p className="text-[13px] font-semibold text-foreground">Two API Tiers</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-violet-500" />
                      <p className="text-[13px] font-medium">Infra Tier</p>
                    </div>
                    <p className="text-[12px] text-muted-foreground leading-relaxed">
                      NFC card-present payments via Beam. You send raw card data from the NFC read,
                      the server encrypts and forwards to Interswitch. Supports OTP flow.
                    </p>
                    <code className="text-[11px] font-mono text-muted-foreground">/v1/infra/sessions/*</code>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-blue-500" />
                      <p className="text-[13px] font-medium">Platform Tier</p>
                    </div>
                    <p className="text-[12px] text-muted-foreground leading-relaxed">
                      Token-based payments via Beam Switch. You send a pre-obtained <code className="font-mono text-[11px]">payment_token</code>
                      instead of raw card data. Simpler integration, no OTP handling.
                    </p>
                    <code className="text-[11px] font-mono text-muted-foreground">/v1/payments/sessions/*</code>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[13px] font-semibold text-foreground">Response Envelope</p>
                <p className="text-[12px] text-muted-foreground">All API responses follow a consistent envelope format:</p>
                <CodeBlock code={`{
  "success": true,
  "data": { ... },
  "meta": { "limit": 20, "offset": 0, "total": 100 }
}`} lang="json" />
              </div>
            </section>

            <SectionDivider />

            {/* Authentication */}
            <section id="authentication" className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">Authentication</h2>
                <p className="text-[13px] text-muted-foreground mt-1 leading-relaxed">
                  Authenticate API requests by including your API key in the request headers.
                  Keys are scoped to an environment (test or live) and a business.
                </p>
              </div>

              <CodeBlock
                title="Authentication Headers"
                code={`# Using Authorization header (recommended)
Authorization: Bearer sk_test_your_api_key

# Using X-Beam-Key header
X-Beam-Key: sk_test_your_api_key`}
              />

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="rounded-lg border p-4 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    <p className="text-[13px] font-medium">Test Environment</p>
                  </div>
                  <p className="text-[12px] text-muted-foreground">
                    Keys prefixed with <code className="font-mono bg-muted px-1 py-0.5 rounded text-[11px]">sk_test_</code>. Sandbox — no real money moves.
                  </p>
                </div>
                <div className="rounded-lg border p-4 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <p className="text-[13px] font-medium">Live Environment</p>
                  </div>
                  <p className="text-[12px] text-muted-foreground">
                    Keys prefixed with <code className="font-mono bg-muted px-1 py-0.5 rounded text-[11px]">sk_live_</code>. Real transactions, real money.
                  </p>
                </div>
              </div>
            </section>

            <SectionDivider />

            {/* Sessions */}
            <section id="sessions" className="space-y-8">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">Payment Sessions</h2>
                <p className="text-[13px] text-muted-foreground mt-1 leading-relaxed">
                  A session represents a single payment intent. Create a session with the amount,
                  then verify, complete (Infra) or charge (Platform) it.
                </p>
              </div>

              <Endpoint
                method="POST"
                path="/v1/infra/sessions"
                title="Create Session"
                description="Initialize a new payment session. Returns a session object with a nonce and signature for verification."
                requestParams={[
                  { name: 'amount', type: 'integer', required: true, description: 'Amount in Naira (e.g. 5000 for ₦5,000)' },
                  { name: 'merchant_ref', type: 'string', required: true, description: 'Your unique reference for this payment' },
                  { name: 'metadata', type: 'object', required: false, description: 'Arbitrary key-value pairs attached to the session' },
                ]}
                snippets={{
                  curl: `curl -X POST https://api.taprail.co/v1/infra/sessions \\
  -H "Authorization: Bearer sk_test_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 5000,
    "merchant_ref": "order_123",
    "metadata": {"customer_id": "cust_456"}
  }'`,
                  nodejs: `const response = await fetch('https://api.taprail.co/v1/infra/sessions', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer sk_test_YOUR_KEY',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    amount: 5000,
    merchant_ref: 'order_123',
    metadata: { customer_id: 'cust_456' },
  }),
});

const { data: session } = await response.json();
console.log(session.id, session.nonce);`,
                  python: `import requests

response = requests.post(
    'https://api.taprail.co/v1/infra/sessions',
    headers={'Authorization': 'Bearer sk_test_YOUR_KEY'},
    json={
        'amount': 5000,
        'merchant_ref': 'order_123',
        'metadata': {'customer_id': 'cust_456'},
    },
)

session = response.json()['data']
print(session['id'], session['nonce'])`,
                }}
                responseExample={{
                  success: true,
                  data: {
                    id: 'ses_a1b2c3d4...',
                    amount: 5000,
                    status: 'pending',
                    merchant_ref: 'order_123',
                    nonce: 'nonce_xyz...',
                    signature: 'sig_abc...',
                    expires_at: '2026-03-27T12:05:00Z',
                    created_at: '2026-03-27T12:00:00Z',
                  },
                }}
              />

              <SectionDivider />

              <Endpoint
                method="GET"
                path="/v1/infra/sessions/{id}"
                title="Get Session"
                description="Retrieve the current state of a payment session by its ID."
                snippets={{
                  curl: `curl https://api.taprail.co/v1/infra/sessions/SESSION_ID \\
  -H "Authorization: Bearer sk_test_YOUR_KEY"`,
                  nodejs: `const response = await fetch(
  'https://api.taprail.co/v1/infra/sessions/SESSION_ID',
  { headers: { 'Authorization': 'Bearer sk_test_YOUR_KEY' } }
);

const { data: session } = await response.json();`,
                  python: `response = requests.get(
    f'https://api.taprail.co/v1/infra/sessions/{session_id}',
    headers={'Authorization': 'Bearer sk_test_YOUR_KEY'},
)

session = response.json()['data']`,
                }}
                responseParams={[
                  { name: 'id', type: 'string', required: true, description: 'Session ID (ses_...)' },
                  { name: 'amount', type: 'integer', required: true, description: 'Amount in Naira' },
                  { name: 'status', type: 'string', required: true, description: 'pending | locked | awaiting_otp | paid | expired | cancelled' },
                  { name: 'merchant_ref', type: 'string', required: true, description: 'Your reference' },
                  { name: 'created_at', type: 'string', required: true, description: 'ISO 8601 timestamp' },
                  { name: 'expires_at', type: 'string', required: true, description: 'ISO 8601 expiry timestamp' },
                ]}
              />
            </section>

            <SectionDivider />

            {/* Verify */}
            <section id="verify" className="space-y-5">
              <Endpoint
                method="POST"
                path="/v1/infra/sessions/{id}/verify"
                title="Verify Session"
                description="Lock a session for payment by verifying the nonce and signature. After verification, the session status changes to 'locked' and is ready for card data or token submission."
                requestParams={[
                  { name: 'nonce', type: 'string', required: true, description: 'Session nonce from the creation response' },
                  { name: 'signature', type: 'string', required: true, description: 'HMAC-SHA256 signature computed with your secret key' },
                ]}
                snippets={{
                  curl: `curl -X POST https://api.taprail.co/v1/infra/sessions/SESSION_ID/verify \\
  -H "Authorization: Bearer sk_test_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "nonce": "SESSION_NONCE",
    "signature": "COMPUTED_HMAC_SIGNATURE"
  }'`,
                  nodejs: `const response = await fetch(
  \`https://api.taprail.co/v1/infra/sessions/\${sessionId}/verify\`,
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer sk_test_YOUR_KEY',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      nonce: session.nonce,
      signature: computedSignature,
    }),
  }
);`,
                  python: `response = requests.post(
    f'https://api.taprail.co/v1/infra/sessions/{session_id}/verify',
    headers={'Authorization': 'Bearer sk_test_YOUR_KEY'},
    json={
        'nonce': session_nonce,
        'signature': computed_signature,
    },
)`,
                }}
                responseExample={{
                  success: true,
                  data: { verified: true, session: { id: 'ses_...', status: 'locked' } },
                }}
              />
            </section>

            <SectionDivider />

            {/* Infra Complete */}
            <section id="infra-complete" className="space-y-5">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="rounded-full bg-violet-100 text-violet-700 text-[10px] font-semibold px-2.5 py-0.5">Infra Tier</span>
                </div>
                <h2 className="text-xl font-semibold tracking-tight">Complete Payment (Beam NFC)</h2>
                <p className="text-[13px] text-muted-foreground mt-1 leading-relaxed">
                  After reading the card via Beam NFC, submit the card data to complete the payment.
                  The server encrypts the data using RSA and forwards it to Interswitch for processing.
                </p>
              </div>

              <Endpoint
                method="POST"
                path="/v1/infra/sessions/{id}/complete"
                title="Complete Session"
                description="Submit NFC card data to process the payment. If the issuer requires OTP verification, the response status will be 'awaiting_otp'."
                requestParams={[
                  { name: 'customer_id', type: 'string', required: true, description: 'Customer identifier (email or phone)' },
                  { name: 'pan', type: 'string', required: true, description: 'Card PAN from Beam NFC read' },
                  { name: 'pin', type: 'string', required: true, description: 'Card PIN entered by customer' },
                  { name: 'expiry_date', type: 'string', required: true, description: 'Card expiry in YYMM format' },
                  { name: 'cvv', type: 'string', required: true, description: 'Card CVV' },
                ]}
                snippets={{
                  curl: `curl -X POST https://api.taprail.co/v1/infra/sessions/SESSION_ID/complete \\
  -H "Authorization: Bearer sk_test_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "customer_id": "customer@example.com",
    "pan": "5060990580000217499",
    "pin": "1111",
    "expiry_date": "5003",
    "cvv": "111"
  }'`,
                  nodejs: `const response = await fetch(
  \`https://api.taprail.co/v1/infra/sessions/\${sessionId}/complete\`,
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer sk_test_YOUR_KEY',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      customer_id: 'customer@example.com',
      pan: cardData.pan,       // from Beam NFC read
      pin: customerPin,
      expiry_date: cardData.expiry,
      cvv: cardData.cvv,
    }),
  }
);`,
                  python: `response = requests.post(
    f'https://api.taprail.co/v1/infra/sessions/{session_id}/complete',
    headers={'Authorization': 'Bearer sk_test_YOUR_KEY'},
    json={
        'customer_id': 'customer@example.com',
        'pan': card_data['pan'],
        'pin': customer_pin,
        'expiry_date': card_data['expiry'],
        'cvv': card_data['cvv'],
    },
)`,
                }}
                responseExample={{
                  success: true,
                  data: {
                    id: 'ses_...',
                    status: 'awaiting_otp',
                    transaction: {
                      id: 'txn_...',
                      amount: 5000,
                      fee: 75,
                      net_amount: 4925,
                      payment_reference: 'FBN|WEB|...',
                    },
                  },
                }}
                notes="If the response status is 'awaiting_otp', prompt the customer for the OTP sent to their phone and submit it via the submit-otp endpoint. If the status is 'paid', the payment completed without OTP."
              />
            </section>

            <SectionDivider />

            {/* Infra OTP */}
            <section id="infra-otp" className="space-y-5">
              <Endpoint
                method="POST"
                path="/v1/infra/sessions/{id}/submit-otp"
                title="Submit OTP"
                description="Submit the OTP sent to the cardholder to complete payment. Maximum 3 attempts — after that the session is marked as failed."
                requestParams={[
                  { name: 'otp', type: 'string', required: true, description: 'One-time password sent to cardholder by their bank' },
                ]}
                snippets={{
                  curl: `curl -X POST https://api.taprail.co/v1/infra/sessions/SESSION_ID/submit-otp \\
  -H "Authorization: Bearer sk_test_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"otp": "123456"}'`,
                  nodejs: `const response = await fetch(
  \`https://api.taprail.co/v1/infra/sessions/\${sessionId}/submit-otp\`,
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer sk_test_YOUR_KEY',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ otp: '123456' }),
  }
);`,
                  python: `response = requests.post(
    f'https://api.taprail.co/v1/infra/sessions/{session_id}/submit-otp',
    headers={'Authorization': 'Bearer sk_test_YOUR_KEY'},
    json={'otp': '123456'},
)`,
                }}
                responseExample={{
                  success: true,
                  data: {
                    id: 'ses_...',
                    status: 'paid',
                    transaction: {
                      id: 'txn_...',
                      amount: 5000,
                      fee: 75,
                      net_amount: 4925,
                      status: 'success',
                    },
                  },
                }}
                notes="OTP attempts are limited to 3. After 3 failed attempts, the session is permanently marked as failed and you must create a new session."
              />
            </section>

            <SectionDivider />

            {/* Platform Charge */}
            <section id="platform-charge" className="space-y-5">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="rounded-full bg-blue-100 text-blue-700 text-[10px] font-semibold px-2.5 py-0.5">Platform Tier</span>
                </div>
                <h2 className="text-xl font-semibold tracking-tight">Charge Session (Token-Based)</h2>
                <p className="text-[13px] text-muted-foreground mt-1 leading-relaxed">
                  The Platform tier provides a higher-level abstraction. Instead of sending raw card data,
                  you send a <code className="font-mono bg-muted px-1.5 py-0.5 rounded text-[11px]">payment_token</code> obtained from the Beam Switch.
                </p>
              </div>

              <Endpoint
                method="POST"
                path="/v1/payments/sessions/{id}/charge"
                title="Charge Session"
                description="Charge a verified session using a payment token and customer email."
                requestParams={[
                  { name: 'payment_token', type: 'string', required: true, description: 'Token from Beam Switch (obtained via Beam P2P or tokenization)' },
                  { name: 'email', type: 'string', required: true, description: 'Customer email address' },
                ]}
                snippets={{
                  curl: `curl -X POST https://api.taprail.co/v1/payments/sessions/SESSION_ID/charge \\
  -H "Authorization: Bearer sk_test_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "payment_token": "tok_abc123...",
    "email": "customer@example.com"
  }'`,
                  nodejs: `const response = await fetch(
  \`https://api.taprail.co/v1/payments/sessions/\${sessionId}/charge\`,
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer sk_test_YOUR_KEY',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      payment_token: 'tok_abc123...',
      email: 'customer@example.com',
    }),
  }
);`,
                  python: `response = requests.post(
    f'https://api.taprail.co/v1/payments/sessions/{session_id}/charge',
    headers={'Authorization': 'Bearer sk_test_YOUR_KEY'},
    json={
        'payment_token': 'tok_abc123...',
        'email': 'customer@example.com',
    },
)`,
                }}
                notes="The Platform tier does not support OTP flows. If OTP is required by the card issuer, use the Infra tier with complete + submit-otp endpoints."
              />
            </section>

            <SectionDivider />

            {/* Transactions */}
            <section id="transactions" className="space-y-5">
              <h2 className="text-xl font-semibold tracking-tight">Transactions</h2>

              <Endpoint
                method="GET"
                path="/v1/payments/transactions"
                title="List Transactions"
                description="Retrieve a paginated list of transactions. Supports filtering by status and date range."
                snippets={{
                  curl: `curl "https://api.taprail.co/v1/payments/transactions?limit=20&offset=0" \\
  -H "Authorization: Bearer sk_test_YOUR_KEY"`,
                  nodejs: `const response = await fetch(
  'https://api.taprail.co/v1/payments/transactions?limit=20&offset=0',
  { headers: { 'Authorization': 'Bearer sk_test_YOUR_KEY' } }
);

const { data: transactions, meta } = await response.json();`,
                  python: `response = requests.get(
    'https://api.taprail.co/v1/payments/transactions',
    headers={'Authorization': 'Bearer sk_test_YOUR_KEY'},
    params={'limit': 20, 'offset': 0},
)

data = response.json()
transactions = data['data']`,
                }}
                responseParams={[
                  { name: 'id', type: 'string', required: true, description: 'Transaction ID (txn_...)' },
                  { name: 'session_id', type: 'string', required: true, description: 'Associated session ID' },
                  { name: 'amount', type: 'integer', required: true, description: 'Transaction amount in Naira' },
                  { name: 'fee', type: 'integer', required: true, description: 'Processing fee' },
                  { name: 'net_amount', type: 'integer', required: true, description: 'Amount after fees' },
                  { name: 'status', type: 'string', required: true, description: 'success | failed | pending' },
                  { name: 'payment_reference', type: 'string', required: true, description: 'Provider payment reference' },
                ]}
              />
            </section>

            <SectionDivider />

            {/* Webhooks */}
            <section id="webhooks" className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">Webhooks</h2>
                <p className="text-[13px] text-muted-foreground mt-1 leading-relaxed">
                  Taprail sends webhook events to your registered endpoints when payment events occur.
                  Each delivery includes an HMAC-SHA256 signature for verification.
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-[13px] font-semibold text-foreground">Signature Verification</p>
                <p className="text-[12px] text-muted-foreground leading-relaxed">
                  Each webhook includes an <code className="font-mono bg-muted px-1.5 py-0.5 rounded text-[11px]">X-Taprail-Signature</code> header.
                  Verify it against the request body using your webhook secret:
                </p>
                <CodeBlock
                  title="Verify webhook signature"
                  code={`const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}`}
                />
              </div>

              <div className="space-y-2">
                <p className="text-[13px] font-semibold text-foreground">Event Types</p>
                <div className="rounded-lg border overflow-hidden">
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="bg-muted/50 border-b">
                        <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Event</th>
                        <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ['session.created', 'A new payment session was created'],
                        ['session.verified', 'A session was successfully verified'],
                        ['session.paid', 'A session was fully paid'],
                        ['session.expired', 'A session expired without payment'],
                        ['session.cancelled', 'A session was cancelled'],
                        ['charge.succeeded', 'A charge completed successfully'],
                        ['charge.failed', 'A charge attempt failed'],
                      ].map(([event, desc]) => (
                        <tr key={event} className="border-t">
                          <td className="px-4 py-2.5 font-mono text-[12px] font-medium">{event}</td>
                          <td className="px-4 py-2.5 text-muted-foreground text-[12px]">{desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[13px] font-semibold text-foreground">Example Payload</p>
                <CodeBlock
                  code={JSON.stringify({
                    event: 'session.paid',
                    data: {
                      session_id: 'ses_a1b2c3d4...',
                      amount: 5000,
                      fee: 75,
                      net_amount: 4925,
                      payment_reference: 'taprail_...',
                      status: 'paid',
                    },
                    timestamp: '2026-03-27T12:01:30Z',
                  }, null, 2)}
                  lang="json"
                />
              </div>

              <div className="rounded-lg border p-4 space-y-1.5">
                <p className="text-[13px] font-semibold text-foreground">Retry Policy</p>
                <p className="text-[12px] text-muted-foreground leading-relaxed">
                  Failed deliveries are retried up to 5 times with exponential backoff (1s, 10s, 1m, 10m, 1h).
                  Your endpoint should return a 2xx status code within 10 seconds.
                </p>
              </div>
            </section>

            <SectionDivider />

            {/* Error Handling */}
            <section id="errors" className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">Error Handling</h2>
                <p className="text-[13px] text-muted-foreground mt-1 leading-relaxed">
                  When a request fails, the API returns a JSON error object with a descriptive message and optional error code.
                </p>
              </div>

              <CodeBlock
                title="Error response format"
                code={JSON.stringify({
                  success: false,
                  message: 'Session has expired',
                  code: 'SESSION_EXPIRED',
                }, null, 2)}
                lang="json"
              />

              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="bg-muted/50 border-b">
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">HTTP Status</th>
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Meaning</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['400', 'Bad Request — Invalid parameters or missing required fields'],
                      ['401', 'Unauthorized — Invalid or missing API key'],
                      ['404', 'Not Found — Session or resource does not exist'],
                      ['409', 'Conflict — Session is in an invalid state for this operation'],
                      ['422', 'Unprocessable — Payment failed (ISW rejection, OTP limit exceeded, etc.)'],
                      ['429', 'Rate Limited — Too many requests, back off and retry'],
                      ['500', 'Server Error — Something went wrong on our end'],
                    ].map(([code, desc]) => (
                      <tr key={code} className="border-t">
                        <td className="px-4 py-2.5 font-mono font-semibold">{code}</td>
                        <td className="px-4 py-2.5 text-muted-foreground text-[12px]">{desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t mt-16 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-[11px] text-muted-foreground">&copy; {new Date().getFullYear()} Taprail. All rights reserved.</span>
          <div className="flex items-center gap-5">
            <Link to="/docs" className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">API Docs</Link>
            <Link to="/sdk" className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">SDK</Link>
            <Link to="/login" className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link>
            <Link to="/register" className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">Get started</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
