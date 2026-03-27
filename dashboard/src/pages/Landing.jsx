import { Link } from 'react-router-dom'
import { useState, useEffect, useRef, useCallback } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import NfcIcon from '@hugeicons/core-free-icons/NfcIcon'
import SmartPhone01Icon from '@hugeicons/core-free-icons/SmartPhone01Icon'
import CreditCardPosIcon from '@hugeicons/core-free-icons/CreditCardPosIcon'
import ArrowRight01Icon from '@hugeicons/core-free-icons/ArrowRight01Icon'
import CodeIcon from '@hugeicons/core-free-icons/CodeIcon'
import ApiIcon from '@hugeicons/core-free-icons/ApiIcon'
import FlashIcon from '@hugeicons/core-free-icons/FlashIcon'
import Shield01Icon from '@hugeicons/core-free-icons/Shield01Icon'
import GlobalIcon from '@hugeicons/core-free-icons/GlobalIcon'
import CheckmarkCircle02Icon from '@hugeicons/core-free-icons/CheckmarkCircle02Icon'
import AnalyticsUpIcon from '@hugeicons/core-free-icons/AnalyticsUpIcon'
import LockIcon from '@hugeicons/core-free-icons/LockIcon'
import CloudServerIcon from '@hugeicons/core-free-icons/CloudServerIcon'
import PuzzleIcon from '@hugeicons/core-free-icons/PuzzleIcon'
import ArrowDown01Icon from '@hugeicons/core-free-icons/ArrowDown01Icon'
import Store01Icon from '@hugeicons/core-free-icons/Store01Icon'
import DeliveryBox01Icon from '@hugeicons/core-free-icons/DeliveryBox01Icon'
import ShoppingBag01Icon from '@hugeicons/core-free-icons/ShoppingBag01Icon'
import { cn } from '@/lib/utils'

function useScrollReveal(threshold = 0.1) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])

  return { ref, visible }
}

function useCodeReveal() {
  const { ref, visible } = useScrollReveal(0.3)
  const [lines, setLines] = useState(0)

  useEffect(() => {
    if (!visible) return
    let i = 0
    const total = 5
    const id = setInterval(() => { i++; setLines(i); if (i >= total) clearInterval(id) }, 180)
    return () => clearInterval(id)
  }, [visible])

  return { ref, lines }
}

const capabilities = [
  {
    icon: NfcIcon,
    title: 'Beam tap to pay',
    description: 'A customer holds their card or phone near any NFC-enabled device and the payment goes through. No POS terminal, no card reader dongle, no extra hardware. The smartphone your merchant already owns is the terminal.',
    color: 'bg-primary/8 text-primary',
  },
  {
    icon: SmartPhone01Icon,
    title: 'Beam P2P transfers',
    description: 'Two phones, one tap. Beam negotiates an NFC handshake between devices and settles the payment in a single gesture — peer-to-peer, instant, and without either party needing a bank app or USSD code.',
    color: 'bg-violet-500/8 text-violet-600',
  },
  {
    icon: CreditCardPosIcon,
    title: 'Every card network',
    description: 'Full EMV contactless support across Visa, Mastercard, Verve, and Afrigo. We handle PPSE discovery, AID selection, GPO commands, and TLV parsing under the hood — your app just receives a payment result.',
    color: 'bg-emerald-500/8 text-emerald-600',
  },
  {
    icon: Shield01Icon,
    title: 'Security without the overhead',
    description: 'Card data is RSA-encrypted on the device before it ever touches a network. Your servers never see, store, or transmit a PAN. PCI scope shrinks to almost nothing because sensitive data never reaches your infrastructure.',
    color: 'bg-amber-500/8 text-amber-600',
  },
  {
    icon: CodeIcon,
    title: 'One SDK, ship in days',
    description: 'A single React Native package gives you useNFCPayment, useSession, and a drop-in PaymentSheet component. What typically takes months of integration across multiple providers and card networks now takes an afternoon.',
    color: 'bg-sky-500/8 text-sky-600',
  },
  {
    icon: ApiIcon,
    title: 'A complete payment backend',
    description: 'Transactions, refunds, settlements, disputes, customers, webhooks, team management, and real-time analytics — all from one consistent REST API. No stitching five services together to get a working payment stack.',
    color: 'bg-rose-500/8 text-rose-600',
  },
]

const steps = [
  {
    num: '1',
    title: 'Create your account',
    description: 'Sign up and get sandbox API keys instantly. No paperwork, no sales calls, no waiting for approval.',
  },
  {
    num: '2',
    title: 'Build your experience',
    description: 'Install the React Native SDK or call the REST API directly. Build exactly the payment flow your users need.',
  },
  {
    num: '3',
    title: 'Verify your business',
    description: 'Complete KYB verification through our dashboard. We walk you through every step of the process.',
  },
  {
    num: '4',
    title: 'Accept real payments',
    description: 'Switch to live mode and start processing. Every Beam-enabled phone your merchants use is now a payment terminal.',
  },
]

const useCases = [
  {
    icon: Store01Icon,
    title: 'Street vendors & market sellers',
    description: 'The suya seller who processes 200 small payments a night needs a terminal that fits in a pocket, not on a counter. Beam turns their phone into one.',
    color: 'bg-orange-500/8 text-orange-600',
  },
  {
    icon: DeliveryBox01Icon,
    title: 'Logistics & delivery riders',
    description: 'The delivery rider collecting payment on arrival needs to process a card payment at someone\'s front door. No connectivity worries, no clunky hardware — just a tap.',
    color: 'bg-blue-500/8 text-blue-600',
  },
  {
    icon: ShoppingBag01Icon,
    title: 'Retail stores & boutiques',
    description: 'The boutique owner expanding to three locations doesn\'t want to buy three POS terminals. Every staff member\'s phone is now a checkout counter.',
    color: 'bg-pink-500/8 text-pink-600',
  },
]

const faqs = [
  {
    q: 'What phones are supported?',
    a: 'Any Android phone with NFC hardware running Android 9 or later. That covers the vast majority of smartphones sold in the last five years.',
  },
  {
    q: 'How much does Taprail cost?',
    a: 'No setup fees, no monthly charges, no hardware costs. You pay 1.5% per successful transaction, capped at ₦2,000. That\'s it.',
  },
  {
    q: 'Is it PCI compliant?',
    a: 'Yes. Card data is RSA-encrypted on the device before it leaves the phone. Your servers never see, store, or transmit raw card numbers. PCI scope is minimal.',
  },
  {
    q: 'What card networks do you support?',
    a: 'Visa, Mastercard, Verve, and Afrigo. Full EMV contactless support with automatic network detection.',
  },
  {
    q: 'How long does integration take?',
    a: 'Most developers ship a working payment flow in an afternoon. Install the SDK, use the useNFCPayment hook, and you\'re accepting payments.',
  },
  {
    q: 'What happens if the phone loses connection during a payment?',
    a: 'Beam reads the card data locally via NFC — no internet needed for the tap itself. The payment is submitted when connectivity is available, and our session system ensures no duplicate charges.',
  },
]

const comparison = [
  { feature: 'Hardware cost', pos: '₦50K – ₦200K', beam: '₦0 — uses existing phones' },
  { feature: 'Setup time', pos: '2–6 weeks', beam: '30 seconds' },
  { feature: 'Integration effort', pos: 'Months', beam: 'An afternoon' },
  { feature: 'Multi-location', pos: 'Buy more terminals', beam: 'Every phone is a terminal' },
  { feature: 'Card networks', pos: 'Varies by provider', beam: 'Visa, MC, Verve, Afrigo' },
  { feature: 'PCI scope', pos: 'Full terminal compliance', beam: 'Minimal — encrypted on device' },
]

const devFeatures = [
  { icon: FlashIcon, text: 'Real-time webhooks' },
  { icon: LockIcon, text: 'Sandbox & live modes' },
  { icon: CloudServerIcon, text: 'Idempotent endpoints' },
  { icon: PuzzleIcon, text: 'React Native hooks' },
  { icon: AnalyticsUpIcon, text: 'Built-in analytics' },
  { icon: GlobalIcon, text: 'Multi-provider routing' },
]

export default function Landing() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const whySection = useScrollReveal()
  const capSection = useScrollReveal()
  const stepsSection = useScrollReveal()
  const devSection = useScrollReveal()
  const useCaseSection = useScrollReveal()
  const faqSection = useScrollReveal()
  const compSection = useScrollReveal()
  const codeReveal = useCodeReveal()

  return (
    <div className="min-h-screen bg-card text-foreground">
      {/* Floating nav */}
      <nav className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-card/80 backdrop-blur-xl border-b border-border/50 shadow-card'
          : 'bg-transparent'
      )}>
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sidebar">
              <span className="text-xs font-bold leading-none text-white">T</span>
            </div>
            <span className="text-[14px] font-semibold tracking-tight text-foreground">Taprail</span>
          </div>
          <div className="hidden sm:flex items-center gap-6 text-[13px] text-muted-foreground">
            <a href="#why" className="hover:text-foreground transition-colors">Why Taprail</a>
            <a href="#product" className="hover:text-foreground transition-colors">Product</a>
            <a href="#developers" className="hover:text-foreground transition-colors">Developers</a>
            <Link to="/docs" className="hover:text-foreground transition-colors">Docs</Link>
            <Link to="/sdk" className="hover:text-foreground transition-colors">SDK</Link>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors px-3.5 py-1.5 rounded-lg"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="text-[13px] font-medium px-4 py-1.5 rounded-lg transition-all duration-200 text-white bg-sidebar hover:bg-sidebar/90"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-6 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-[12px] font-semibold text-primary uppercase tracking-[0.15em] mb-5 animate-fade-in">Contactless Payment Infrastructure</p>

            <h1 className="text-[42px] sm:text-[50px] font-semibold tracking-[-0.03em] leading-[1.08] text-foreground animate-slide-up">
              Payments as simple
              <br />
              <span className="bg-gradient-to-r from-primary via-primary/90 to-violet-500 bg-clip-text text-transparent">
                as a tap
              </span>
            </h1>

            <p className="text-[15.5px] text-muted-foreground leading-[1.7] mt-5 max-w-[500px] mx-auto animate-slide-up" style={{ animationDelay: '100ms' }}>
              Accepting in-person payments has been broken for too long — expensive hardware, fragmented providers, months of integration. Beam turns any NFC-enabled phone into a payment terminal with one SDK and a single API call.
            </p>

            <div className="flex items-center justify-center gap-3 mt-9 animate-slide-up" style={{ animationDelay: '200ms' }}>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 text-[13px] font-semibold text-white bg-primary hover:bg-primary/90 h-11 px-6 rounded-lg transition-all duration-150 active:scale-[0.98]"
              >
                Start building — it's free
                <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
              </Link>
            </div>

            <div className="flex items-center justify-center gap-5 mt-8 animate-slide-up" style={{ animationDelay: '300ms' }}>
              {[
                'Sandbox in 30 seconds',
                'No monthly fees',
                'PCI compliant',
              ].map((text) => (
                <div key={text} className="flex items-center gap-1.5">
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} size={12} className="text-success" strokeWidth={2} />
                  <span className="text-[11px] text-muted-foreground/60">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Beam Pulse */}
      <section className="py-6 px-6">
        <div className="flex items-center justify-center">
          <div className="relative h-20 w-20">
            <div className="absolute inset-0 flex items-center justify-center">
              <HugeiconsIcon icon={NfcIcon} size={24} className="text-primary/60" strokeWidth={1.5} />
            </div>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="absolute inset-0 rounded-full border border-primary/20 animate-beam-pulse"
                style={{ animationDelay: `${i * 0.6}s` }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Code Preview */}
      <section className="pt-6 pb-6 px-6" ref={codeReveal.ref}>
        <div className="max-w-[680px] mx-auto">
          <div className="rounded-xl bg-sidebar overflow-hidden shadow-2xl shadow-sidebar/10 ring-1 ring-sidebar-border">
            <div className="flex items-center px-4 py-2.5 border-b border-white/[0.06]">
              <div className="flex gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                <div className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                <div className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
              </div>
              <span className="text-[10px] text-white/20 font-mono ml-3">payment.jsx</span>
            </div>
            <div className="p-5 text-[12.5px] font-mono leading-[1.85] overflow-x-auto">
              <div className={cn('transition-opacity duration-300', codeReveal.lines >= 1 ? 'opacity-100' : 'opacity-0')}>
                <span className="text-[#c678dd]">import</span>
                <span className="text-white/50"> {'{ '}</span>
                <span className="text-[#61afef]">useNFCPayment</span>
                <span className="text-white/50">{' } '}</span>
                <span className="text-[#c678dd]">from</span>
                <span className="text-[#98c379]"> '@taprail/react-native'</span>
              </div>
              <div className={cn('h-4 transition-opacity duration-300', codeReveal.lines >= 2 ? 'opacity-100' : 'opacity-0')} />
              <div className={cn('transition-opacity duration-300', codeReveal.lines >= 2 ? 'opacity-100' : 'opacity-0')}>
                <span className="text-[#c678dd]">const</span>
                <span className="text-white/50"> {'{ '}</span>
                <span className="text-[#e06c75]">startPayment</span>
                <span className="text-white/50">{' } = '}</span>
                <span className="text-[#61afef]">useNFCPayment</span>
                <span className="text-white/40">()</span>
              </div>
              <div className={cn('h-4 transition-opacity duration-300', codeReveal.lines >= 3 ? 'opacity-100' : 'opacity-0')} />
              <div className={cn('transition-opacity duration-300', codeReveal.lines >= 4 ? 'opacity-100' : 'opacity-0')}>
                <span className="text-white/15">{'// Accept a ₦5,000 Beam payment. That\'s it.'}</span>
              </div>
              <div className={cn('transition-opacity duration-300', codeReveal.lines >= 5 ? 'opacity-100' : 'opacity-0')}>
                <span className="text-[#c678dd]">await</span>
                <span className="text-white/50"> </span>
                <span className="text-[#61afef]">startPayment</span>
                <span className="text-white/40">{'({ '}</span>
                <span className="text-[#e06c75]">amount</span>
                <span className="text-white/30">: </span>
                <span className="text-[#d19a66]">5000</span>
                <span className="text-white/30">, </span>
                <span className="text-[#e06c75]">currency</span>
                <span className="text-white/30">: </span>
                <span className="text-[#98c379]">'NGN'</span>
                <span className="text-white/40">{' })'}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Taprail */}
      <section className="py-24 px-6" id="why" ref={whySection.ref}>
        <div className={cn('max-w-3xl mx-auto transition-all duration-700', whySection.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6')}>
          <p className="text-[11px] font-semibold text-primary uppercase tracking-[0.15em] mb-4 text-center">Why Taprail</p>
          <h2 className="text-[30px] sm:text-[34px] font-semibold tracking-tight leading-[1.15] text-center text-foreground max-w-xl mx-auto">
            Payments should just work
          </h2>
          <p className="text-[14px] text-muted-foreground mt-4 text-center max-w-lg mx-auto leading-relaxed">
            A customer walks up, taps their phone or card, and it's done. That's all a payment should ever be. But getting there has never been simple.
          </p>

          <div className="mt-14 space-y-10">
            <div className="rounded-xl border border-border/40 bg-card p-6 sm:p-8 shadow-card">
              <p className="text-[11px] font-semibold text-muted-foreground/50 uppercase tracking-[0.12em] mb-3">For merchants</p>
              <h3 className="text-[18px] font-semibold text-foreground tracking-tight mb-3">Accepting card payments costs too much before you earn anything</h3>
              <div className="space-y-4 text-[14.5px] text-muted-foreground leading-[1.8]">
                <p>
                  To accept a card payment in person, a merchant needs a POS terminal. That's ₦50,000 to ₦200,000 for a piece of hardware — before a single transaction. It takes weeks to arrive, ties you to one bank's network, and becomes obsolete the moment something better comes along.
                </p>
                <p>
                  But the bigger problem isn't the hardware — it's who gets left out. The keke driver collecting fares, the woman selling provisions at the market, the logistics rider collecting payment on delivery. These businesses move. They don't have counters. They can't bolt a terminal to anything. And so they stay cash-only — not by choice, but because the payment system was never built for them.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-border/40 bg-card p-6 sm:p-8 shadow-card">
              <p className="text-[11px] font-semibold text-muted-foreground/50 uppercase tracking-[0.12em] mb-3">For developers</p>
              <h3 className="text-[18px] font-semibold text-foreground tracking-tight mb-3">Building payment experiences shouldn't take months</h3>
              <div className="space-y-4 text-[14.5px] text-muted-foreground leading-[1.8]">
                <p>
                  If you're a developer trying to add in-person payments to your app, you're signing up for a world of pain. You need an NFC library to read the card, an EMV parser to make sense of the data, a tokenization layer to keep it secure, and a processor-specific API to actually move the money. Each one has its own docs, its own error codes, its own edge cases. You spend months on payment plumbing instead of building the product people care about.
                </p>
                <p>
                  And when it's finally working, you're locked into a single processor with no fallback. If they go down, your payments go down. If you want to switch, you're rewriting from scratch. The whole system is fragile in ways that only show up when it matters most.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-primary/15 bg-primary/[0.02] p-6 sm:p-8">
              <p className="text-[11px] font-semibold text-primary uppercase tracking-[0.12em] mb-3">The Taprail approach</p>
              <h3 className="text-[18px] font-semibold text-foreground tracking-tight mb-3">The terminal is already in everyone's pocket</h3>
              <div className="space-y-4 text-[14.5px] text-muted-foreground leading-[1.8]">
                <p>
                  Nearly every smartphone shipped in the last five years has an NFC chip. The hardware is already there — in the merchant's hand, in the customer's pocket. What's been missing is a software layer simple enough for a developer to integrate in an afternoon and reliable enough for a merchant to depend on for every sale.
                </p>
                <p className="text-foreground font-medium">
                  Taprail is that layer. One SDK to read the card, encrypt the data, route the payment, and settle the funds. One API for transactions, refunds, disputes, and webhooks. A customer taps, the money moves, and neither the merchant nor the developer had to think about what happened in between.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <section className="px-6">
        <div className="max-w-5xl mx-auto">
          <div className="h-px bg-border/60" />
        </div>
      </section>

      {/* Product / Capabilities */}
      <section className="py-24 px-6" id="product" ref={capSection.ref}>
        <div className="max-w-5xl mx-auto">
          <div className={cn('max-w-xl mx-auto text-center mb-14 transition-all duration-700', capSection.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6')}>
            <p className="text-[11px] font-semibold text-primary uppercase tracking-[0.15em] mb-3">Product</p>
            <h2 className="text-[28px] font-semibold tracking-tight leading-snug text-foreground">
              Everything you need to accept
              <br />contactless payments
            </h2>
            <p className="text-[14px] text-muted-foreground mt-3 leading-relaxed max-w-md mx-auto">
              From reading a card via Beam to settling funds into your bank account, Taprail handles the entire payment lifecycle through a single integration.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {capabilities.map(({ icon, title, description, color }, i) => (
              <div
                key={title}
                className={cn(
                  'rounded-xl border border-border/40 bg-card p-5 shadow-card transition-all duration-200 hover:border-border/80 hover:shadow-card-hover',
                  capSection.visible ? 'animate-slide-up' : 'opacity-0'
                )}
                style={capSection.visible ? { animationDelay: `${i * 80}ms` } : undefined}
              >
                <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg mb-4', color)}>
                  <HugeiconsIcon icon={icon} size={17} strokeWidth={1.5} />
                </div>
                <h3 className="text-[13px] font-semibold text-foreground mb-1.5">{title}</h3>
                <p className="text-[12.5px] text-muted-foreground leading-[1.65]">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-6 bg-background" ref={stepsSection.ref}>
        <div className="max-w-5xl mx-auto">
          <div className={cn('text-center mb-12 transition-all duration-700', stepsSection.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6')}>
            <p className="text-[11px] font-semibold text-primary uppercase tracking-[0.15em] mb-3">Getting started</p>
            <h2 className="text-[28px] font-semibold tracking-tight text-foreground">From signup to live payments in four steps</h2>
            <p className="text-[14px] text-muted-foreground mt-3 max-w-md mx-auto leading-relaxed">
              We stripped away everything that makes payment integration slow. No sales calls, no long contracts, no waiting for hardware to arrive.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 max-w-3xl mx-auto">
            {steps.map(({ num, title, description }, i) => (
              <div
                key={num}
                className={cn(
                  'rounded-xl border border-border/40 bg-card p-5 shadow-card',
                  stepsSection.visible ? 'animate-slide-up' : 'opacity-0'
                )}
                style={stepsSection.visible ? { animationDelay: `${i * 100}ms` } : undefined}
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground mb-4">{num}</span>
                <h3 className="text-[13px] font-semibold text-foreground mb-1">{title}</h3>
                <p className="text-[11.5px] text-muted-foreground leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 px-6" id="use-cases" ref={useCaseSection.ref}>
        <div className="max-w-5xl mx-auto">
          <div className={cn('max-w-xl mx-auto text-center mb-14 transition-all duration-700', useCaseSection.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6')}>
            <p className="text-[11px] font-semibold text-primary uppercase tracking-[0.15em] mb-3">Use cases</p>
            <h2 className="text-[28px] font-semibold tracking-tight leading-snug text-foreground">
              Built for every business that moves
            </h2>
            <p className="text-[14px] text-muted-foreground mt-3 leading-relaxed max-w-md mx-auto">
              The businesses that need card payments most are the ones traditional POS was never built for. Beam changes that.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {useCases.map(({ icon, title, description, color }, i) => (
              <div
                key={title}
                className={cn(
                  'rounded-xl border border-border/40 bg-card p-5 shadow-card',
                  useCaseSection.visible ? 'animate-slide-up' : 'opacity-0'
                )}
                style={useCaseSection.visible ? { animationDelay: `${i * 100}ms` } : undefined}
              >
                <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg mb-4', color)}>
                  <HugeiconsIcon icon={icon} size={17} strokeWidth={1.5} />
                </div>
                <h3 className="text-[13px] font-semibold text-foreground mb-1.5">{title}</h3>
                <p className="text-[12.5px] text-muted-foreground leading-[1.65]">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16 px-6 bg-background" ref={compSection.ref}>
        <div className={cn('max-w-2xl mx-auto transition-all duration-700', compSection.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6')}>
          <div className="text-center mb-10">
            <p className="text-[11px] font-semibold text-primary uppercase tracking-[0.15em] mb-3">Compare</p>
            <h2 className="text-[28px] font-semibold tracking-tight text-foreground">Beam vs traditional POS</h2>
          </div>

          <div className="rounded-xl border border-border/40 bg-card overflow-hidden shadow-card">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="border-b border-border/40">
                  <th className="text-left px-5 py-3 text-muted-foreground/50 font-medium"></th>
                  <th className="text-left px-5 py-3 text-muted-foreground/50 font-medium">Traditional POS</th>
                  <th className="text-left px-5 py-3 text-primary font-semibold">Beam</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map(({ feature, pos, beam }, i) => (
                  <tr key={feature} className={i < comparison.length - 1 ? 'border-b border-border/20' : ''}>
                    <td className="px-5 py-3 font-medium text-foreground">{feature}</td>
                    <td className="px-5 py-3 text-muted-foreground">{pos}</td>
                    <td className="px-5 py-3 text-foreground font-medium">{beam}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Developer section */}
      <section className="py-16 px-6" id="developers" ref={devSection.ref}>
        <div className={cn('max-w-5xl mx-auto transition-all duration-700', devSection.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6')}>
          <div className="rounded-2xl bg-sidebar overflow-hidden relative">
            <div className="absolute inset-0 opacity-[0.04]" style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
              backgroundSize: '20px 20px',
            }} />

            <div className="relative z-10 p-8 sm:p-12">
              <div className="grid lg:grid-cols-2 gap-10 items-center">
                <div>
                  <p className="text-[11px] font-semibold text-primary uppercase tracking-[0.15em] mb-3">Built for developers</p>
                  <h2 className="text-[24px] font-semibold tracking-tight text-white leading-snug">
                    You build the experience.
                    <br />We handle the infrastructure.
                  </h2>
                  <p className="text-[13px] text-sidebar-foreground/50 leading-[1.7] mt-3 max-w-sm">
                    Accepting a contactless payment via Beam involves NFC antenna management, EMV command sequences, TLV data parsing, RSA encryption, and routing to the right processor. Taprail abstracts all of that behind a single React Native hook and a clean REST API. You focus on the checkout experience your users see — we handle everything that happens after the tap.
                  </p>
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-2 mt-6 text-[12px] font-semibold text-sidebar bg-white hover:bg-white/90 h-9 px-5 rounded-lg transition-all duration-150"
                  >
                    Get API keys
                    <HugeiconsIcon icon={ArrowRight01Icon} size={12} />
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {devFeatures.map(({ icon, text }) => (
                    <div key={text} className="flex items-center gap-2.5 rounded-lg bg-white/[0.05] border border-sidebar-border px-3.5 py-3">
                      <HugeiconsIcon icon={icon} size={14} className="text-sidebar-foreground/30 shrink-0" strokeWidth={1.5} />
                      <span className="text-[11px] font-medium text-sidebar-foreground/50">{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6" id="faq" ref={faqSection.ref}>
        <div className={cn('max-w-2xl mx-auto transition-all duration-700', faqSection.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6')}>
          <div className="text-center mb-10">
            <p className="text-[11px] font-semibold text-primary uppercase tracking-[0.15em] mb-3">FAQ</p>
            <h2 className="text-[28px] font-semibold tracking-tight text-foreground">Common questions</h2>
          </div>

          <div className="space-y-2">
            {faqs.map(({ q, a }) => (
              <details key={q} className="group rounded-xl border border-border/40 bg-card shadow-card overflow-hidden">
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none text-[13px] font-medium text-foreground hover:bg-muted/30 transition-colors">
                  {q}
                  <HugeiconsIcon
                    icon={ArrowDown01Icon}
                    size={14}
                    className="text-muted-foreground/40 shrink-0 ml-4 transition-transform duration-200 group-open:rotate-180"
                    strokeWidth={2}
                  />
                </summary>
                <div className="px-5 pb-4 text-[12.5px] text-muted-foreground leading-[1.7]">
                  {a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-[28px] font-semibold tracking-tight text-foreground">
            The phone in your pocket is the
            <br />only terminal you need
          </h2>
          <p className="text-[14px] text-muted-foreground mt-3 leading-relaxed max-w-md mx-auto">
            Stop spending on hardware that becomes obsolete. Stop stitching together payment providers. Accept contactless payments with Beam — one integration and zero upfront cost.
          </p>

          <Link
            to="/register"
            className="inline-flex items-center gap-2 mt-8 text-[13px] font-semibold text-white bg-primary hover:bg-primary/90 h-11 px-7 rounded-lg transition-all duration-150 active:scale-[0.98]"
          >
            Create free account
            <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 pt-14 pb-8 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 mb-12">
            {/* Brand */}
            <div className="col-span-2 sm:col-span-3 lg:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-sidebar">
                  <span className="text-[10px] font-bold leading-none text-white">T</span>
                </div>
                <span className="text-[13px] font-semibold text-foreground">Taprail</span>
              </div>
              <p className="text-[11px] text-muted-foreground/50 leading-relaxed max-w-[180px]">
                Beam-powered payment infrastructure for Africa.
              </p>
            </div>

            {/* Product */}
            <div>
              <p className="text-[11px] font-semibold text-foreground uppercase tracking-[0.1em] mb-3">Product</p>
              <div className="space-y-2">
                <a href="#why" className="block text-[11px] text-muted-foreground/50 hover:text-foreground transition-colors">Why Taprail</a>
                <a href="#product" className="block text-[11px] text-muted-foreground/50 hover:text-foreground transition-colors">Beam NFC</a>
                <a href="#use-cases" className="block text-[11px] text-muted-foreground/50 hover:text-foreground transition-colors">Use cases</a>
                <a href="#faq" className="block text-[11px] text-muted-foreground/50 hover:text-foreground transition-colors">FAQ</a>
              </div>
            </div>

            {/* Developers */}
            <div>
              <p className="text-[11px] font-semibold text-foreground uppercase tracking-[0.1em] mb-3">Developers</p>
              <div className="space-y-2">
                <Link to="/docs" className="block text-[11px] text-muted-foreground/50 hover:text-foreground transition-colors">API reference</Link>
                <a href="#developers" className="block text-[11px] text-muted-foreground/50 hover:text-foreground transition-colors">SDK</a>
                <Link to="/register" className="block text-[11px] text-muted-foreground/50 hover:text-foreground transition-colors">Get API keys</Link>
              </div>
            </div>

            {/* Company */}
            <div>
              <p className="text-[11px] font-semibold text-foreground uppercase tracking-[0.1em] mb-3">Company</p>
              <div className="space-y-2">
                <span className="block text-[11px] text-muted-foreground/30">About</span>
                <span className="block text-[11px] text-muted-foreground/30">Blog</span>
                <span className="block text-[11px] text-muted-foreground/30">Contact</span>
              </div>
            </div>

            {/* Legal */}
            <div>
              <p className="text-[11px] font-semibold text-foreground uppercase tracking-[0.1em] mb-3">Legal</p>
              <div className="space-y-2">
                <span className="block text-[11px] text-muted-foreground/30">Privacy policy</span>
                <span className="block text-[11px] text-muted-foreground/30">Terms of service</span>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-border/30 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-[10px] text-muted-foreground/30">&copy; {new Date().getFullYear()} Taprail. All rights reserved.</span>
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-[10px] text-muted-foreground/40 hover:text-foreground transition-colors">Dashboard</Link>
              <Link to="/register" className="text-[10px] text-muted-foreground/40 hover:text-foreground transition-colors">Get started</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
