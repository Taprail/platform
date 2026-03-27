import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import Clock01Icon from '@hugeicons/core-free-icons/Clock01Icon'
import CheckmarkCircle02Icon from '@hugeicons/core-free-icons/CheckmarkCircle02Icon'
import Alert01Icon from '@hugeicons/core-free-icons/Alert01Icon'
import SecurityCheckIcon from '@hugeicons/core-free-icons/SecurityCheckIcon'
import ShieldBanIcon from '@hugeicons/core-free-icons/ShieldBanIcon'
import FingerPrintIcon from '@hugeicons/core-free-icons/FingerPrintIcon'
import BankIcon from '@hugeicons/core-free-icons/BankIcon'
import UserCircleIcon from '@hugeicons/core-free-icons/UserCircleIcon'
import Key01Icon from '@hugeicons/core-free-icons/Key01Icon'
import ArrowRight01Icon from '@hugeicons/core-free-icons/ArrowRight01Icon'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

export default function KybStatus() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)

  useEffect(() => {
    loadStatus()
  }, [])

  async function loadStatus() {
    setLoading(true)
    try {
      const res = await api.get('/dashboard/kyb')
      const d = res.data
      if (d.status === 'not_started' || d.status === 'in_progress') {
        navigate('/kyb', { replace: true })
        return
      }
      setData(d)
    } catch {
      navigate('/kyb', { replace: true })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-64 w-full max-w-2xl rounded-xl" />
      </div>
    )
  }

  if (!data) return null

  const sub = data.submission
  const status = data.status

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Verification Status</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          Track your business verification progress
        </p>
      </div>

      <div className="max-w-2xl space-y-5">
        {/* Main status card */}
        <div className="rounded-xl border bg-card shadow-card overflow-hidden">
          <div className="p-8">
            {status === 'pending_review' && (
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-6">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 border border-amber-200/50">
                    <HugeiconsIcon icon={Clock01Icon} size={28} className="text-amber-500" strokeWidth={1.3} />
                  </div>
                  <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-amber-400 border-2 border-white animate-pulse" />
                </div>
                <p className="text-lg font-semibold text-foreground mb-1.5">Under Review</p>
                <p className="text-[13px] text-muted-foreground max-w-sm leading-relaxed">
                  Your submission is being reviewed. We typically complete reviews within 24–48 hours.
                  You'll receive an email notification once the review is done.
                </p>
                <div className="flex items-center gap-2 mt-5 rounded-lg bg-muted/50 px-4 py-2">
                  <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-[11px] font-medium text-muted-foreground">Review in progress</span>
                </div>
              </div>
            )}

            {status === 'approved' && (
              <div className="flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-200/50 mb-6">
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} size={28} className="text-emerald-500" strokeWidth={1.3} />
                </div>
                <p className="text-lg font-semibold text-foreground mb-1.5">Business Verified</p>
                <p className="text-[13px] text-muted-foreground max-w-sm leading-relaxed mb-6">
                  Congratulations! Your business has been verified. You can now generate live API keys and start processing real payments.
                </p>
                <div className="flex gap-3">
                  <Button asChild className="gap-2">
                    <Link to="/api-keys">
                      <HugeiconsIcon icon={Key01Icon} size={14} strokeWidth={1.5} />
                      Get Live API Keys
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="gap-2">
                    <Link to="/dashboard">
                      Go to Dashboard
                      <HugeiconsIcon icon={ArrowRight01Icon} size={12} />
                    </Link>
                  </Button>
                </div>
              </div>
            )}

            {status === 'rejected' && (
              <div className="flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 border border-red-200/50 mb-6">
                  <HugeiconsIcon icon={Alert01Icon} size={28} className="text-red-500" strokeWidth={1.3} />
                </div>
                <p className="text-lg font-semibold text-foreground mb-1.5">Verification Unsuccessful</p>
                {sub?.rejection_reason && (
                  <div className="rounded-xl bg-red-50/80 border border-red-200/60 px-5 py-3 mt-2 mb-4 max-w-sm">
                    <p className="text-[12px] text-red-700 leading-relaxed">{sub.rejection_reason}</p>
                  </div>
                )}
                <p className="text-[13px] text-muted-foreground max-w-sm leading-relaxed mb-6">
                  Please review the feedback above and update your application.
                </p>
                <Button asChild>
                  <Link to="/kyb">Edit & Resubmit</Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Identity verification checks */}
        {sub && (sub.bvn_verified !== null || sub.aml_status) && (
          <div className="rounded-xl border bg-card shadow-card overflow-hidden">
            <div className="px-6 py-3.5 border-b border-border/40">
              <p className="text-[13px] font-semibold text-foreground">Identity Verification</p>
            </div>
            <div className="p-5 space-y-2.5">
              <VerificationRow
                icon={FingerPrintIcon}
                label="BVN Verification"
                detail={sub.bvn_verification_ref ? `Ref: ${sub.bvn_verification_ref}` : null}
                status={sub.bvn_verified ? 'passed' : 'failed'}
                reason={sub.bvn_failure_reason}
              />
              {sub.aml_status && (
                <VerificationRow
                  icon={SecurityCheckIcon}
                  label="AML Screening"
                  status={sub.aml_status === 'VERIFIED' || sub.aml_status === 'MATCH' ? 'passed' : sub.aml_status === 'FAILED' ? 'failed' : 'pending'}
                  reason={sub.aml_failure_reason}
                />
              )}
            </div>
          </div>
        )}

        {/* Submission summary */}
        {sub && (
          <div className="rounded-xl border bg-card shadow-card overflow-hidden">
            <div className="px-6 py-3.5 border-b border-border/40">
              <p className="text-[13px] font-semibold text-foreground">Submission Summary</p>
            </div>
            <div className="p-5 space-y-4">
              {/* Business */}
              <div className="space-y-0">
                <div className="flex items-center gap-2 mb-2">
                  <HugeiconsIcon icon={BankIcon} size={12} className="text-muted-foreground/50" strokeWidth={1.5} />
                  <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider">Business</p>
                </div>
                <div className="grid grid-cols-2 gap-x-6">
                  <DetailRow label="Name" value={sub.registered_name} />
                  <DetailRow label="RC Number" value={sub.registration_number} />
                  <DetailRow label="Type" value={sub.business_type} />
                  <DetailRow label="Industry" value={sub.industry} />
                </div>
              </div>

              <div className="h-px bg-border/30" />

              {/* Director */}
              <div className="space-y-0">
                <div className="flex items-center gap-2 mb-2">
                  <HugeiconsIcon icon={UserCircleIcon} size={12} className="text-muted-foreground/50" strokeWidth={1.5} />
                  <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider">Director</p>
                </div>
                <div className="grid grid-cols-2 gap-x-6">
                  <DetailRow label="Name" value={sub.director_full_name} />
                  <DetailRow label="BVN" value={sub.director_bvn ? `\u2022\u2022\u2022\u2022\u2022\u2022\u2022${sub.director_bvn.slice(-4)}` : null} />
                </div>
              </div>

              <div className="h-px bg-border/30" />

              {/* Dates */}
              <div className="grid grid-cols-2 gap-x-6">
                <DetailRow
                  label="Submitted"
                  value={sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : null}
                />
                {sub.reviewed_at && (
                  <DetailRow
                    label="Reviewed"
                    value={new Date(sub.reviewed_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function VerificationRow({ icon, label, detail, status, reason }) {
  const passed = status === 'passed'
  const failed = status === 'failed'

  return (
    <div className={cn(
      'flex items-start gap-3 rounded-lg border px-4 py-3',
      passed && 'border-emerald-200/50 bg-emerald-50/20',
      failed && 'border-red-200/50 bg-red-50/20',
      !passed && !failed && 'border-amber-200/50 bg-amber-50/20',
    )}>
      <div className={cn(
        'flex h-7 w-7 items-center justify-center rounded-lg shrink-0',
        passed && 'bg-emerald-100 text-emerald-600',
        failed && 'bg-red-100 text-red-500',
        !passed && !failed && 'bg-amber-100 text-amber-600',
      )}>
        {passed ? (
          <HugeiconsIcon icon={SecurityCheckIcon} size={14} strokeWidth={1.5} />
        ) : failed ? (
          <HugeiconsIcon icon={ShieldBanIcon} size={14} strokeWidth={1.5} />
        ) : (
          <HugeiconsIcon icon={icon} size={14} strokeWidth={1.5} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-[13px] font-medium">{label}</p>
          <span className={cn(
            'text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md',
            passed && 'text-emerald-700 bg-emerald-100',
            failed && 'text-red-700 bg-red-100',
            !passed && !failed && 'text-amber-700 bg-amber-100',
          )}>
            {passed ? 'Passed' : failed ? 'Failed' : 'Pending'}
          </span>
        </div>
        {detail && <p className="text-[10px] text-muted-foreground/50 mt-0.5 font-mono">{detail}</p>}
        {reason && <p className="text-[11px] text-red-600 mt-1">{reason}</p>}
      </div>
    </div>
  )
}

function DetailRow({ label, value }) {
  if (!value) return null
  return (
    <div className="py-1.5">
      <p className="text-[10px] text-muted-foreground/50 font-medium">{label}</p>
      <p className="text-[13px] font-medium mt-0.5">{value}</p>
    </div>
  )
}
