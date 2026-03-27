import { HugeiconsIcon } from '@hugeicons/react'
import UserCircleIcon from '@hugeicons/core-free-icons/UserCircleIcon'
import Shield01Icon from '@hugeicons/core-free-icons/Shield01Icon'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

function FormField({ label, required, hint, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[13px] font-medium text-foreground">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground/50">{hint}</p>}
    </div>
  )
}

export function DirectorInfoForm({ data, onChange, onContinue, onBack, saving }) {
  const update = (field, value) => onChange({ ...data, [field]: value })

  const handleSubmit = (e) => {
    e.preventDefault()
    onContinue()
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="rounded-xl border bg-card shadow-card overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border/40">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/8 text-primary">
            <HugeiconsIcon icon={UserCircleIcon} size={15} strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-[14px] font-semibold text-foreground">Director Details</p>
            <p className="text-[11px] text-muted-foreground/60">Primary director or authorized signatory</p>
          </div>
        </div>

        <div className="p-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Full name" required>
              <Input
                value={data.full_name || ''}
                onChange={(e) => update('full_name', e.target.value)}
                placeholder="Adaeze Okonkwo"
                required
              />
            </FormField>

            <FormField label="Email address" required>
              <Input
                type="email"
                value={data.email || ''}
                onChange={(e) => update('email', e.target.value)}
                placeholder="adaeze@example.com"
                required
              />
            </FormField>

            <FormField label="Phone number" required>
              <Input
                type="tel"
                value={data.phone || ''}
                onChange={(e) => update('phone', e.target.value)}
                placeholder="+234 800 000 0000"
                required
              />
            </FormField>

            <FormField label="Date of birth">
              <Input
                type="date"
                value={data.date_of_birth || ''}
                onChange={(e) => update('date_of_birth', e.target.value)}
              />
            </FormField>

            <FormField label="Nationality">
              <Input
                value={data.nationality || 'Nigerian'}
                onChange={(e) => update('nationality', e.target.value)}
              />
            </FormField>

            <div className="sm:col-span-2">
              <FormField label="Residential address" required>
                <Input
                  value={data.address || ''}
                  onChange={(e) => update('address', e.target.value)}
                  placeholder="12 Admiralty Way, Lekki, Lagos"
                  required
                />
              </FormField>
            </div>
          </div>

          {/* BVN section — visually separated */}
          <div className="mt-6 pt-5 border-t border-border/40">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600 shrink-0 mt-0.5">
                <HugeiconsIcon icon={Shield01Icon} size={13} strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-[13px] font-medium text-foreground">BVN Verification</p>
                <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
                  Your BVN is used to verify your identity through the Central Bank of Nigeria.
                  It is encrypted and never stored in plain text.
                </p>
              </div>
            </div>

            <FormField label="Bank Verification Number (BVN)" required hint="11-digit number from any Nigerian bank">
              <Input
                value={data.bvn || ''}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 11)
                  update('bvn', val)
                }}
                placeholder="22200000000"
                pattern="\d{11}"
                title="BVN must be exactly 11 digits"
                inputMode="numeric"
                className="font-mono tracking-wider max-w-xs"
                required
              />
            </FormField>
          </div>
        </div>

        <div className="flex justify-between px-6 py-3.5 border-t border-border/40 bg-muted/20">
          <Button type="button" variant="ghost" onClick={onBack}>
            Back
          </Button>
          <Button type="submit" disabled={saving} className="min-w-[120px]">
            {saving ? 'Saving...' : 'Continue'}
          </Button>
        </div>
      </div>
    </form>
  )
}
