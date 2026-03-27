import { HugeiconsIcon } from '@hugeicons/react'
import Alert01Icon from '@hugeicons/core-free-icons/Alert01Icon'
import CheckmarkCircle02Icon from '@hugeicons/core-free-icons/CheckmarkCircle02Icon'
import BankIcon from '@hugeicons/core-free-icons/BankIcon'
import UserCircleIcon from '@hugeicons/core-free-icons/UserCircleIcon'
import File01Icon from '@hugeicons/core-free-icons/File01Icon'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

function ReviewSection({ icon, title, children, complete }) {
  return (
    <div className={cn(
      'rounded-xl border p-5',
      complete ? 'border-emerald-200/40 bg-emerald-50/10' : 'border-border/60'
    )}>
      <div className="flex items-center gap-2.5 mb-3.5">
        <div className={cn(
          'flex h-6 w-6 items-center justify-center rounded-md',
          complete ? 'bg-emerald-100 text-emerald-600' : 'bg-muted text-muted-foreground/50'
        )}>
          <HugeiconsIcon icon={icon} size={12} strokeWidth={1.5} />
        </div>
        <p className="text-[12px] font-semibold text-foreground uppercase tracking-wider">{title}</p>
        {complete && (
          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={13} className="text-emerald-500 ml-auto" strokeWidth={2} />
        )}
      </div>
      <div className="space-y-0 divide-y divide-border/30">{children}</div>
    </div>
  )
}

function ReviewField({ label, value, mono }) {
  if (!value) return null
  return (
    <div className="flex items-center justify-between py-2 text-[13px]">
      <span className="text-muted-foreground/70">{label}</span>
      <span className={cn('font-medium text-foreground text-right max-w-[60%] truncate', mono && 'font-mono text-[12px]')}>
        {value}
      </span>
    </div>
  )
}

export function ReviewSubmit({ submission, documents, onSubmit, onBack, submitting }) {
  const biz = submission.business_info || {}
  const dir = submission.director_info || {}

  const maskBvn = (bvn) => {
    if (!bvn) return null
    return '\u2022\u2022\u2022\u2022\u2022\u2022\u2022' + bvn.slice(-4)
  }

  const hasBiz = biz.business_name && biz.rc_number
  const hasDir = dir.full_name && dir.bvn
  const hasDocs = documents.length > 0

  return (
    <div className="rounded-xl border bg-card shadow-card overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border/40">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/8 text-primary">
          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={15} strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-[14px] font-semibold text-foreground">Review & Submit</p>
          <p className="text-[11px] text-muted-foreground/60">Verify everything is correct before submitting</p>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Warning */}
        <div className="flex items-start gap-3 rounded-xl bg-amber-50/60 border border-amber-200/50 px-4 py-3">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 mt-0.5">
            <HugeiconsIcon icon={Alert01Icon} size={12} className="text-amber-600" strokeWidth={2} />
          </div>
          <p className="text-[12px] text-amber-800/80 leading-relaxed">
            Once submitted, your application enters review and cannot be edited until the review is complete.
            Please verify all information is accurate.
          </p>
        </div>

        {/* Business Info */}
        <ReviewSection icon={BankIcon} title="Business" complete={hasBiz}>
          <ReviewField label="Business name" value={biz.business_name} />
          <ReviewField label="RC number" value={biz.rc_number} mono />
          <ReviewField label="Type" value={biz.business_type} />
          <ReviewField label="Industry" value={biz.industry} />
          <ReviewField label="Address" value={[biz.address, biz.city, biz.state].filter(Boolean).join(', ')} />
          <ReviewField label="Incorporated" value={biz.date_of_incorporation} />
          <ReviewField label="Website" value={biz.website} />
        </ReviewSection>

        {/* Director Info */}
        <ReviewSection icon={UserCircleIcon} title="Director" complete={hasDir}>
          <ReviewField label="Full name" value={dir.full_name} />
          <ReviewField label="Email" value={dir.email} />
          <ReviewField label="Phone" value={dir.phone} />
          <ReviewField label="BVN" value={maskBvn(dir.bvn)} mono />
          <ReviewField label="Date of birth" value={dir.date_of_birth} />
          <ReviewField label="Nationality" value={dir.nationality} />
          <ReviewField label="Address" value={dir.address} />
        </ReviewSection>

        {/* Documents */}
        <ReviewSection icon={File01Icon} title="Documents" complete={hasDocs}>
          {documents.length === 0 ? (
            <p className="py-2 text-[12px] text-muted-foreground/50">No documents uploaded</p>
          ) : (
            documents.map((doc) => (
              <ReviewField
                key={doc.id || doc.document_type}
                label={doc.document_type.replace(/_/g, ' ')}
                value={doc.file_name}
              />
            ))
          )}
        </ReviewSection>
      </div>

      <div className="flex justify-between px-6 py-3.5 border-t border-border/40 bg-muted/20">
        <Button type="button" variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className="min-w-[160px]"
        >
          {submitting ? 'Submitting...' : 'Submit for Review'}
        </Button>
      </div>
    </div>
  )
}
