import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

const NAV_SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'installation', label: 'Installation' },
  { id: 'provider', label: 'TaprailProvider' },
  { id: 'nfc-payment', label: 'useNFCPayment' },
  { id: 'sessions', label: 'useSession' },
  { id: 'transactions', label: 'useTransactions' },
  { id: 'payment-sheet', label: 'PaymentSheet' },
  { id: 'beam-p2p', label: 'Beam P2P' },
  { id: 'card-networks', label: 'Card Networks' },
  { id: 'testing', label: 'Testing' },
]

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

function CodeBlock({ code, title, lang }) {
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

function PropTable({ props }) {
  return (
    <div className="rounded-lg border overflow-hidden">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="bg-muted/50 border-b">
            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Prop</th>
            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Type</th>
            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Default</th>
            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Description</th>
          </tr>
        </thead>
        <tbody>
          {props.map((p) => (
            <tr key={p.name} className="border-t">
              <td className="px-4 py-2.5 font-mono text-[12px] font-medium">{p.name}</td>
              <td className="px-4 py-2.5 text-muted-foreground text-[12px] font-mono">{p.type}</td>
              <td className="px-4 py-2.5 text-muted-foreground text-[12px]">{p.default || '—'}</td>
              <td className="px-4 py-2.5 text-muted-foreground text-[12px]">{p.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SectionDivider() {
  return <div className="h-px bg-border/60 my-2" />
}

export default function PublicSdk() {
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
              <Link to="/docs" className="text-[12px] font-medium px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors">API Docs</Link>
              <Link to="/sdk" className="text-[12px] font-medium px-3 py-1.5 rounded-md bg-card shadow-sm text-foreground">SDK</Link>
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
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/50 mb-3 px-3">SDK Reference</p>
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
                <h1 className="text-[28px] font-semibold tracking-tight">React Native SDK</h1>
                <p className="text-[15px] text-muted-foreground mt-2 leading-relaxed max-w-2xl">
                  The <code className="font-mono bg-muted px-1.5 py-0.5 rounded text-[13px]">@taprail/react-native</code> SDK
                  gives your mobile app everything it needs to accept Beam NFC payments — card reading,
                  session management, OTP handling, and a drop-in PaymentSheet component.
                </p>
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                {[
                  { title: 'Beam NFC', description: 'Full EMV contactless card reading — PPSE, AID selection, GPO, TLV parsing. Works offline.' },
                  { title: 'Session Management', description: 'Create, verify, and complete payment sessions with built-in state machine and error handling.' },
                  { title: 'Drop-in UI', description: 'PaymentSheet component handles the entire flow — NFC read, PIN entry, OTP, and success state.' },
                ].map((f) => (
                  <div key={f.title} className="rounded-xl border p-4 space-y-1.5">
                    <p className="text-[13px] font-semibold text-foreground">{f.title}</p>
                    <p className="text-[12px] text-muted-foreground leading-relaxed">{f.description}</p>
                  </div>
                ))}
              </div>
            </section>

            <SectionDivider />

            {/* Installation */}
            <section id="installation" className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">Installation</h2>
                <p className="text-[13px] text-muted-foreground mt-1 leading-relaxed">
                  Install the SDK package and its peer dependency. The SDK requires React Native 0.70+ and supports both Expo and bare React Native projects.
                </p>
              </div>

              <CodeBlock
                title="npm"
                code="npm install @taprail/react-native"
              />

              <CodeBlock
                title="yarn"
                code="yarn add @taprail/react-native"
              />

              <div className="rounded-lg border border-amber-200/60 bg-amber-50/60 px-4 py-3">
                <p className="text-[12px] text-amber-800 leading-relaxed">
                  <strong>Android only:</strong> Beam NFC requires Android 9+ with NFC hardware. The SDK will gracefully degrade on iOS (session management works, NFC reading is disabled).
                </p>
              </div>
            </section>

            <SectionDivider />

            {/* Provider */}
            <section id="provider" className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">TaprailProvider</h2>
                <p className="text-[13px] text-muted-foreground mt-1 leading-relaxed">
                  Wrap your app with <code className="font-mono bg-muted px-1.5 py-0.5 rounded text-[11px]">TaprailProvider</code> to
                  configure the SDK. All hooks and components must be rendered inside this provider.
                </p>
              </div>

              <CodeBlock
                title="App.jsx"
                code={`import { TaprailProvider } from '@taprail/react-native'

export default function App() {
  return (
    <TaprailProvider
      apiKey="sk_test_YOUR_KEY"
      tier="infra"
      baseUrl="https://api.taprail.co"
    >
      <NavigationContainer>
        <AppStack />
      </NavigationContainer>
    </TaprailProvider>
  )
}`}
              />

              <PropTable props={[
                { name: 'apiKey', type: 'string', description: 'Your Taprail API key (test or live)' },
                { name: 'tier', type: '"infra" | "platform"', default: '"infra"', description: 'API tier — infra for NFC card-present, platform for token-based' },
                { name: 'baseUrl', type: 'string', default: '"https://api.taprail.co"', description: 'API base URL. Override for custom environments.' },
                { name: 'children', type: 'ReactNode', description: 'Your app tree' },
              ]} />
            </section>

            <SectionDivider />

            {/* useNFCPayment */}
            <section id="nfc-payment" className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">useNFCPayment</h2>
                <p className="text-[13px] text-muted-foreground mt-1 leading-relaxed">
                  The primary hook for Beam NFC payments. Handles the entire flow: session creation, NFC card reading,
                  payment completion, and OTP verification. State transitions are exposed so you can build any UI on top.
                </p>
              </div>

              <CodeBlock
                title="Accept a Beam NFC payment"
                code={`import { useNFCPayment } from '@taprail/react-native'

function PaymentScreen() {
  const { startPayment, submitOtp, state, session, error } = useNFCPayment()

  const handlePay = async () => {
    await startPayment({
      amount: 5000,
      currency: 'NGN',
      merchantRef: 'order_123',
    })
  }

  // state transitions:
  // idle → creating → verifying → ready → detecting → reading
  //   → completing → (awaiting_otp) → success | error

  if (state === 'awaiting_otp') {
    return <OtpInput onSubmit={(otp) => submitOtp(otp)} />
  }

  if (state === 'success') {
    return <Text>Payment complete! Session: {session.id}</Text>
  }

  return (
    <View>
      <Text>Amount: ₦5,000</Text>
      <Button title="Tap to Pay" onPress={handlePay} />
      {state === 'detecting' && <Text>Hold card near phone...</Text>}
      {error && <Text style={{ color: 'red' }}>{error}</Text>}
    </View>
  )
}`}
              />

              <div className="space-y-2">
                <p className="text-[13px] font-semibold text-foreground">Return Values</p>
                <PropTable props={[
                  { name: 'startPayment', type: '(opts) => Promise', description: 'Start the Beam NFC payment flow with amount, currency, and merchantRef' },
                  { name: 'submitOtp', type: '(otp: string) => Promise', description: 'Submit OTP when state is awaiting_otp' },
                  { name: 'cancel', type: '() => void', description: 'Cancel the current payment flow' },
                  { name: 'reset', type: '() => void', description: 'Reset to idle state' },
                  { name: 'state', type: 'string', description: 'Current flow state (idle, creating, verifying, ready, detecting, reading, completing, awaiting_otp, success, error)' },
                  { name: 'session', type: 'Session | null', description: 'Current session object' },
                  { name: 'transaction', type: 'Transaction | null', description: 'Transaction object after successful payment' },
                  { name: 'cardData', type: 'CardData | null', description: 'Parsed card data from Beam NFC read (scheme, masked PAN, expiry)' },
                  { name: 'error', type: 'string | null', description: 'Error message if state is error' },
                ]} />
              </div>

              <div className="space-y-2">
                <p className="text-[13px] font-semibold text-foreground">State Machine</p>
                <div className="rounded-lg border bg-muted/30 p-5">
                  <div className="flex items-center gap-2 flex-wrap text-[12px] font-mono">
                    {['idle', 'creating', 'verifying', 'ready', 'detecting', 'reading', 'completing', 'awaiting_otp', 'success'].map((s, i, arr) => (
                      <span key={s} className="flex items-center gap-2">
                        <span className={cn(
                          'rounded-md px-2 py-1 font-medium',
                          s === 'success' ? 'bg-emerald-100 text-emerald-700' :
                          s === 'detecting' || s === 'reading' ? 'bg-amber-100 text-amber-700' :
                          'bg-muted text-foreground'
                        )}>{s}</span>
                        {i < arr.length - 1 && <span className="text-muted-foreground">&rarr;</span>}
                      </span>
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-3">
                    The <code className="font-mono">awaiting_otp</code> state only occurs if the card issuer requires OTP verification (ISW response code T0).
                  </p>
                </div>
              </div>
            </section>

            <SectionDivider />

            {/* useSession */}
            <section id="sessions" className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">useSession</h2>
                <p className="text-[13px] text-muted-foreground mt-1 leading-relaxed">
                  Lower-level hook for manual session management. Use this when you need full control over the payment flow instead of the all-in-one <code className="font-mono text-[11px]">useNFCPayment</code>.
                </p>
              </div>

              <CodeBlock
                title="Manual session control"
                code={`import { useSession } from '@taprail/react-native'

function CustomFlow() {
  const {
    createSession,
    verifySession,
    completeSession,
    submitOtp,
    session,
    loading,
  } = useSession()

  // Step 1: Create
  const sess = await createSession({
    amount: 5000,
    merchantRef: 'order_123',
  })

  // Step 2: Verify
  await verifySession(sess.id, {
    nonce: sess.nonce,
    signature: sess.signature,
  })

  // Step 3: Complete with card data from Beam NFC
  const result = await completeSession(sess.id, {
    customerId: 'customer@example.com',
    pan: cardData.pan,
    pin: enteredPin,
    expiryDate: cardData.expiry,
    cvv: cardData.cvv,
  })

  // Step 4: OTP if needed
  if (result.status === 'awaiting_otp') {
    await submitOtp(sess.id, otpValue)
  }
}`}
              />
            </section>

            <SectionDivider />

            {/* useTransactions */}
            <section id="transactions" className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">useTransactions</h2>
                <p className="text-[13px] text-muted-foreground mt-1 leading-relaxed">
                  Fetch and display transaction history for the authenticated business.
                </p>
              </div>

              <CodeBlock
                title="Display transaction history"
                code={`import { useTransactions } from '@taprail/react-native'

function TransactionList() {
  const { transactions, loading, refresh, loadMore } = useTransactions({
    limit: 20,
  })

  return (
    <FlatList
      data={transactions}
      onRefresh={refresh}
      onEndReached={loadMore}
      renderItem={({ item }) => (
        <View>
          <Text>{item.amount} NGN — {item.status}</Text>
          <Text>{item.payment_reference}</Text>
        </View>
      )}
    />
  )
}`}
              />
            </section>

            <SectionDivider />

            {/* PaymentSheet */}
            <section id="payment-sheet" className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">PaymentSheet</h2>
                <p className="text-[13px] text-muted-foreground mt-1 leading-relaxed">
                  A pre-built, customizable bottom sheet component that handles the entire Beam NFC payment flow.
                  Includes NFC detection animation, PIN entry, OTP input, and success/error states.
                </p>
              </div>

              <CodeBlock
                title="Drop-in PaymentSheet"
                code={`import { PaymentSheet } from '@taprail/react-native'

function Checkout() {
  const [visible, setVisible] = useState(false)

  return (
    <>
      <Button title="Pay ₦5,000" onPress={() => setVisible(true)} />

      <PaymentSheet
        visible={visible}
        onClose={() => setVisible(false)}
        amount={5000}
        currency="NGN"
        merchantRef="order_123"
        onSuccess={(session, transaction) => {
          console.log('Paid!', transaction.id)
          setVisible(false)
        }}
        onError={(error) => {
          console.error('Payment failed:', error)
        }}
      />
    </>
  )
}`}
              />

              <PropTable props={[
                { name: 'visible', type: 'boolean', description: 'Show/hide the payment sheet' },
                { name: 'onClose', type: '() => void', description: 'Called when the sheet is dismissed' },
                { name: 'amount', type: 'number', description: 'Payment amount in Naira' },
                { name: 'currency', type: 'string', default: '"NGN"', description: 'Currency code' },
                { name: 'merchantRef', type: 'string', description: 'Your unique reference for this payment' },
                { name: 'onSuccess', type: '(session, txn) => void', description: 'Called on successful payment' },
                { name: 'onError', type: '(error) => void', description: 'Called on payment failure' },
                { name: 'theme', type: 'object', default: '{}', description: 'Override colors: { primary, background, text, success, error }' },
              ]} />
            </section>

            <SectionDivider />

            {/* Beam P2P */}
            <section id="beam-p2p" className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">Beam P2P Transfers</h2>
                <p className="text-[13px] text-muted-foreground mt-1 leading-relaxed">
                  Beam P2P enables phone-to-phone contactless transfers using NFC. One device acts as the sender (reader)
                  and the other as the receiver (tag emulator).
                </p>
              </div>

              <CodeBlock
                title="Send money via Beam P2P"
                code={`import { useTaprail } from '@taprail/react-native'

function P2PScreen() {
  const { beam } = useTaprail()

  // Sender: read the receiver's token via NFC
  const receiverToken = await beam.readP2PToken()

  // Receiver: emit your token via NFC
  await beam.emitP2PToken({ userId: 'user_123' })
}`}
              />

              <div className="rounded-lg border border-blue-200/60 bg-blue-50/60 px-4 py-3">
                <p className="text-[12px] text-blue-800 leading-relaxed">
                  Beam P2P uses Android Host Card Emulation (HCE) to emulate an NFC tag.
                  Both devices must have NFC enabled and be running the app.
                </p>
              </div>
            </section>

            <SectionDivider />

            {/* Card Networks */}
            <section id="card-networks" className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">Supported Card Networks</h2>
                <p className="text-[13px] text-muted-foreground mt-1 leading-relaxed">
                  Beam supports full EMV contactless reading for the following card networks.
                  Network detection is automatic based on the AID returned during PPSE selection.
                </p>
              </div>

              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="bg-muted/50 border-b">
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Network</th>
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">AID</th>
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['Visa', 'A0000000031010', 'Supported'],
                      ['Mastercard', 'A0000000041010', 'Supported'],
                      ['Verve', 'A0000003710001', 'Supported'],
                      ['Afrigo', 'A00000089301001', 'Supported'],
                    ].map(([network, aid, status]) => (
                      <tr key={network} className="border-t">
                        <td className="px-4 py-2.5 font-medium">{network}</td>
                        <td className="px-4 py-2.5 font-mono text-[12px] text-muted-foreground">{aid}</td>
                        <td className="px-4 py-2.5">
                          <span className="rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-semibold px-2 py-0.5">{status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-2">
                <p className="text-[13px] font-semibold text-foreground">NFC Read Flow (EMV Contactless)</p>
                <div className="rounded-lg border bg-muted/30 p-5">
                  <div className="flex items-center gap-2 flex-wrap text-[12px] font-mono">
                    {['PPSE Select', 'AID Select', 'GPO', 'Read Records', 'TLV Parse', 'Card Data'].map((s, i, arr) => (
                      <span key={s} className="flex items-center gap-2">
                        <span className="rounded-md bg-muted px-2 py-1 font-medium text-foreground">{s}</span>
                        {i < arr.length - 1 && <span className="text-muted-foreground">&rarr;</span>}
                      </span>
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-3">
                    The entire NFC read happens locally on the device — no network required. Card data is encrypted before transmission.
                  </p>
                </div>
              </div>
            </section>

            <SectionDivider />

            {/* Testing */}
            <section id="testing" className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">Testing</h2>
                <p className="text-[13px] text-muted-foreground mt-1 leading-relaxed">
                  Use test-mode API keys and the Interswitch sandbox to test the full payment flow without real money.
                </p>
              </div>

              <div className="rounded-xl border p-5 space-y-3">
                <p className="text-[13px] font-semibold text-foreground">Test Card Details</p>
                <div className="rounded-lg border overflow-hidden">
                  <table className="w-full text-[13px]">
                    <tbody>
                      {[
                        ['PAN', '5060990580000217499'],
                        ['PIN', '1111'],
                        ['Expiry', '5003 (YYMM)'],
                        ['CVV', '111'],
                        ['OTP', '123456'],
                      ].map(([label, value]) => (
                        <tr key={label} className="border-t first:border-t-0">
                          <td className="px-4 py-2.5 font-medium text-muted-foreground w-28">{label}</td>
                          <td className="px-4 py-2.5 font-mono text-[12px]">{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <CodeBlock
                title="Test payment flow"
                code={`// Use test-mode provider
<TaprailProvider
  apiKey="sk_test_YOUR_KEY"
  tier="infra"
  baseUrl="https://api.taprail.co"
>
  <App />
</TaprailProvider>

// In development, the SDK logs NFC events to console:
// [Beam] PPSE selected: 2PAY.SYS.DDF01
// [Beam] AID selected: A0000000041010 (Mastercard)
// [Beam] GPO complete, reading records...
// [Beam] Card data extracted: ****7499`}
              />

              <div className="rounded-lg border border-amber-200/60 bg-amber-50/60 px-4 py-3">
                <p className="text-[12px] text-amber-800 leading-relaxed">
                  <strong>Tip:</strong> Use the <Link to="/demo" className="underline font-medium">Beam Demo</Link> in
                  the dashboard to test the full API flow interactively before integrating the SDK.
                </p>
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
