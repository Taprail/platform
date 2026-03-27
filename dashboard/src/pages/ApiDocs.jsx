import { useState } from 'react'
import { CodeBlock } from '@/components/developer/CodeBlock'
import { snippets } from '@/lib/code-snippets'
import { cn } from '@/lib/utils'

const METHOD_COLORS = {
  GET: 'bg-emerald-100 text-emerald-700',
  POST: 'bg-blue-100 text-blue-700',
  PUT: 'bg-amber-100 text-amber-700',
  DELETE: 'bg-red-100 text-red-700',
}

const sections = [
  { id: 'authentication', label: 'Authentication' },
  { id: 'sessions', label: 'Infra: Beam Sessions' },
  { id: 'platform', label: 'Platform: Token Sessions' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'webhooks', label: 'Webhooks' },
]

function MethodBadge({ method }) {
  return (
    <span className={cn('rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide', METHOD_COLORS[method] || 'bg-gray-100 text-gray-700')}>
      {method}
    </span>
  )
}

function EndpointPath({ path }) {
  return <code className="text-[13px] font-mono text-muted-foreground">{path}</code>
}

function SchemaTable({ fields }) {
  return (
    <div className="rounded-lg border overflow-hidden">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-muted/50">
            <th className="text-left px-3 py-2 font-medium">Field</th>
            <th className="text-left px-3 py-2 font-medium">Type</th>
            <th className="text-left px-3 py-2 font-medium">Description</th>
          </tr>
        </thead>
        <tbody>
          {fields.map((f) => (
            <tr key={f.name} className="border-t">
              <td className="px-3 py-2 font-mono">{f.name}</td>
              <td className="px-3 py-2 text-muted-foreground">{f.type}</td>
              <td className="px-3 py-2 text-muted-foreground">{f.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function EndpointSection({ snippet, requestFields, responseFields }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <MethodBadge method={snippet.method} />
        <EndpointPath path={snippet.path} />
      </div>
      <p className="text-sm text-muted-foreground">{snippet.description}</p>

      {requestFields && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Request Body</p>
          <SchemaTable fields={requestFields} />
        </div>
      )}

      {responseFields && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Response</p>
          <SchemaTable fields={responseFields} />
        </div>
      )}

      <CodeBlock snippets={{ curl: snippet.curl, nodejs: snippet.nodejs, python: snippet.python }} />
    </div>
  )
}

export default function ApiDocs() {
  const [activeSection, setActiveSection] = useState('authentication')

  const scrollTo = (id) => {
    setActiveSection(id)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">API Documentation</h1>
        <p className="text-[13px] text-muted-foreground mt-1">Reference guide for the Taprail Payments API</p>
      </div>

      <div className="flex gap-8">
        {/* Sidebar navigation */}
        <nav className="hidden lg:block w-48 shrink-0">
          <div className="sticky top-20 space-y-1">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => scrollTo(s.id)}
                className={cn(
                  'block w-full text-left rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors',
                  activeSection === s.id
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-12">
          {/* Authentication */}
          <section id="authentication" className="space-y-4">
            <h2 className="text-base font-semibold tracking-tight">Authentication</h2>
            <div className="rounded-xl border bg-card shadow-card p-6 space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Authenticate API requests by including your API key in the request headers.
                You can use either the <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">Authorization</code> header
                or the <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">X-Beam-Key</code> header.
              </p>
              <div className="rounded-lg border bg-slate-900 overflow-hidden">
                <pre className="p-4 text-[13px] leading-relaxed text-slate-100 overflow-x-auto">
                  <code>{`# Using Authorization header
Authorization: Bearer sk_test_your_api_key

# Using X-Beam-Key header
X-Beam-Key: sk_test_your_api_key`}</code>
                </pre>
              </div>
              <div className="space-y-2">
                <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">Environments</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-lg border p-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                      <p className="text-xs font-medium">Test</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Keys prefixed with <code className="font-mono">sk_test_</code>. No real money moves.
                    </p>
                  </div>
                  <div className="rounded-lg border p-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <p className="text-xs font-medium">Live</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Keys prefixed with <code className="font-mono">sk_live_</code>. Real transactions.
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                All API responses follow a consistent envelope format:
              </p>
              <div className="rounded-lg border bg-slate-900 overflow-hidden">
                <pre className="p-4 text-[13px] leading-relaxed text-slate-100 overflow-x-auto">
                  <code>{`{
  "success": true,
  "data": { ... },
  "meta": { "limit": 20, "offset": 0, "total": 100 }
}`}</code>
                </pre>
              </div>
            </div>
          </section>

          {/* Infra: Beam Sessions */}
          <section id="sessions" className="space-y-6">
            <h2 className="text-base font-semibold tracking-tight">Infra: Beam Sessions</h2>

            <div className="rounded-xl border bg-card shadow-card p-6 space-y-6">
              <div>
                <h3 className="text-sm font-medium">{snippets.createSession.title}</h3>
                <EndpointSection
                  snippet={snippets.createSession}
                  requestFields={[
                    { name: 'amount', type: 'integer', description: 'Amount in minor units (e.g. kobo)' },
                    { name: 'merchant_ref', type: 'string', description: 'Your unique reference for this payment' },
                    { name: 'metadata', type: 'object', description: 'Optional key-value pairs' },
                  ]}
                  responseFields={[
                    { name: 'id', type: 'string', description: 'Session ID (ses_...)' },
                    { name: 'amount', type: 'integer', description: 'Amount in minor units' },
                    { name: 'status', type: 'string', description: 'pending | paid | expired | cancelled' },
                    { name: 'nonce', type: 'string', description: 'One-time nonce for verification' },
                    { name: 'expires_at', type: 'string', description: 'ISO 8601 expiry timestamp' },
                  ]}
                />
              </div>

              <hr className="border-border" />

              <div>
                <h3 className="text-sm font-medium">{snippets.getSession.title}</h3>
                <EndpointSection
                  snippet={snippets.getSession}
                  responseFields={[
                    { name: 'id', type: 'string', description: 'Session ID' },
                    { name: 'amount', type: 'integer', description: 'Amount in minor units' },
                    { name: 'status', type: 'string', description: 'Current session status' },
                    { name: 'merchant_ref', type: 'string', description: 'Your reference' },
                    { name: 'created_at', type: 'string', description: 'ISO 8601 timestamp' },
                  ]}
                />
              </div>

              <hr className="border-border" />

              <div>
                <h3 className="text-sm font-medium">{snippets.verifySession.title}</h3>
                <EndpointSection
                  snippet={snippets.verifySession}
                  requestFields={[
                    { name: 'nonce', type: 'string', description: 'Session nonce from creation response' },
                    { name: 'signature', type: 'string', description: 'HMAC-SHA256 signature computed with your secret key' },
                  ]}
                  responseFields={[
                    { name: 'verified', type: 'boolean', description: 'Whether the verification succeeded' },
                    { name: 'session', type: 'object', description: 'Full session object if verified' },
                  ]}
                />
              </div>
            </div>
          </section>

          {/* Platform Tier */}
          <section id="platform" className="space-y-6">
            <h2 className="text-base font-semibold tracking-tight">Platform: Token-Based Sessions</h2>

            <div className="rounded-xl border bg-card shadow-card p-6 space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                The Platform tier provides a higher-level abstraction for token-based payments. Instead of sending raw card data,
                you send a <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">payment_token</code> obtained from the Beam Switch.
                Session creation and verification work identically to the Infra tier.
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide bg-blue-100 text-blue-700">POST</span>
                  <code className="text-[13px] font-mono text-muted-foreground">/v1/payments/sessions/{'{id}'}/charge</code>
                </div>
                <p className="text-sm text-muted-foreground">Charge a verified session using a payment token and customer email.</p>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Request Body</p>
                  <div className="rounded-lg border overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="text-left px-3 py-2 font-medium">Field</th>
                          <th className="text-left px-3 py-2 font-medium">Type</th>
                          <th className="text-left px-3 py-2 font-medium">Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t">
                          <td className="px-3 py-2 font-mono">payment_token</td>
                          <td className="px-3 py-2 text-muted-foreground">string</td>
                          <td className="px-3 py-2 text-muted-foreground">Token from Beam Switch (obtained via Beam P2P or tokenization)</td>
                        </tr>
                        <tr className="border-t">
                          <td className="px-3 py-2 font-mono">email</td>
                          <td className="px-3 py-2 text-muted-foreground">string</td>
                          <td className="px-3 py-2 text-muted-foreground">Customer email address</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="rounded-lg border bg-slate-900 overflow-hidden">
                  <div className="border-b border-slate-700 px-4 py-2">
                    <span className="text-xs font-medium text-slate-400">curl</span>
                  </div>
                  <pre className="p-4 text-[13px] leading-relaxed text-slate-100 overflow-x-auto">
                    <code>{`curl -X POST https://api.taprail.co/v1/payments/sessions/{session_id}/charge \\
  -H "Authorization: Bearer sk_test_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "payment_token": "tok_abc123...",
    "email": "customer@example.com"
  }'`}</code>
                  </pre>
                </div>
              </div>

              <div className="rounded-lg border border-amber-200/60 bg-amber-50/60 px-4 py-3">
                <p className="text-[12px] text-amber-800 leading-relaxed">
                  <strong>Note:</strong> The Platform tier does not support OTP flows. If OTP is required by the card issuer,
                  use the Infra tier with <code className="font-mono text-[11px]">complete</code> + <code className="font-mono text-[11px]">submit-otp</code> endpoints instead.
                </p>
              </div>
            </div>
          </section>

          {/* Transactions */}
          <section id="transactions" className="space-y-6">
            <h2 className="text-base font-semibold tracking-tight">Transactions</h2>

            <div className="rounded-xl border bg-card shadow-card p-6 space-y-6">
              <div>
                <h3 className="text-sm font-medium">{snippets.listTransactions.title}</h3>
                <EndpointSection
                  snippet={snippets.listTransactions}
                  responseFields={[
                    { name: 'id', type: 'string', description: 'Transaction ID (txn_...)' },
                    { name: 'session_id', type: 'string', description: 'Associated session ID' },
                    { name: 'amount', type: 'integer', description: 'Transaction amount' },
                    { name: 'fee', type: 'integer', description: 'Processing fee' },
                    { name: 'net_amount', type: 'integer', description: 'Amount after fees' },
                    { name: 'status', type: 'string', description: 'success | failed | pending' },
                    { name: 'payment_reference', type: 'string', description: 'Provider payment reference' },
                  ]}
                />
              </div>
            </div>
          </section>

          {/* Webhooks */}
          <section id="webhooks" className="space-y-4">
            <h2 className="text-base font-semibold tracking-tight">Webhooks</h2>

            <div className="rounded-xl border bg-card shadow-card p-6 space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Taprail sends webhook events to your registered endpoints when payment events occur.
                Each delivery includes a signature header for verification.
              </p>

              <div className="space-y-2">
                <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">Signature Verification</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Each webhook delivery includes an <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">X-Taprail-Signature</code> header
                  containing an HMAC-SHA256 signature of the request body, computed using your webhook secret.
                </p>
                <div className="rounded-lg border bg-slate-900 overflow-hidden">
                  <pre className="p-4 text-[13px] leading-relaxed text-slate-100 overflow-x-auto">
                    <code>{`const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}`}</code>
                  </pre>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">Event Types</p>
                <div className="rounded-lg border overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="text-left px-3 py-2 font-medium">Event</th>
                        <th className="text-left px-3 py-2 font-medium">Description</th>
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
                          <td className="px-3 py-2 font-mono">{event}</td>
                          <td className="px-3 py-2 text-muted-foreground">{desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">Retry Policy</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Failed deliveries are retried up to 5 times with exponential backoff.
                  Your endpoint should return a 2xx status code within 10 seconds.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
