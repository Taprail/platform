import { HugeiconsIcon } from '@hugeicons/react'
import BankIcon from '@hugeicons/core-free-icons/BankIcon'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const businessTypes = ['Limited Company', 'Sole Proprietorship', 'Partnership', 'NGO']
const industries = ['Financial Services', 'E-commerce', 'Technology', 'Healthcare', 'Education', 'Transportation', 'Logistics', 'Retail', 'Other']
const nigerianStates = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
  'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau',
  'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
]

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

function SelectField({ value, onChange, options, placeholder }) {
  return (
    <select
      value={value || ''}
      onChange={onChange}
      className="flex h-9 w-full rounded-lg border border-input bg-white px-3 py-1 text-sm shadow-soft transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20 focus-visible:border-primary/30"
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  )
}

export function BusinessInfoForm({ data, onChange, onContinue, saving }) {
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
            <HugeiconsIcon icon={BankIcon} size={15} strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-[14px] font-semibold text-foreground">Business Information</p>
            <p className="text-[11px] text-muted-foreground/60">Registered business details as per CAC</p>
          </div>
        </div>

        <div className="p-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Registered business name" required>
              <Input
                value={data.business_name || ''}
                onChange={(e) => update('business_name', e.target.value)}
                placeholder="Acme Technologies Ltd"
                required
              />
            </FormField>

            <FormField label="RC / Registration number" required hint="As shown on your CAC certificate">
              <Input
                value={data.rc_number || ''}
                onChange={(e) => update('rc_number', e.target.value)}
                placeholder="RC-123456"
                required
              />
            </FormField>

            <FormField label="Business type">
              <SelectField
                value={data.business_type}
                onChange={(e) => update('business_type', e.target.value)}
                options={businessTypes}
                placeholder="Select type"
              />
            </FormField>

            <FormField label="Industry">
              <SelectField
                value={data.industry}
                onChange={(e) => update('industry', e.target.value)}
                options={industries}
                placeholder="Select industry"
              />
            </FormField>

            <FormField label="Business address" required>
              <Input
                value={data.address || ''}
                onChange={(e) => update('address', e.target.value)}
                placeholder="123 Herbert Macaulay Way"
                required
                className="sm:col-span-2"
              />
            </FormField>

            <FormField label="City" required>
              <Input
                value={data.city || ''}
                onChange={(e) => update('city', e.target.value)}
                placeholder="Lagos"
                required
              />
            </FormField>

            <FormField label="State" required>
              <SelectField
                value={data.state}
                onChange={(e) => update('state', e.target.value)}
                options={nigerianStates}
                placeholder="Select state"
              />
            </FormField>

            <FormField label="Date of incorporation">
              <Input
                type="date"
                value={data.date_of_incorporation || ''}
                onChange={(e) => update('date_of_incorporation', e.target.value)}
              />
            </FormField>

            <FormField label="Website">
              <Input
                type="url"
                value={data.website || ''}
                onChange={(e) => update('website', e.target.value)}
                placeholder="https://example.com"
              />
            </FormField>

            <div className="sm:col-span-2">
              <FormField label="Business description">
                <textarea
                  value={data.description || ''}
                  onChange={(e) => update('description', e.target.value)}
                  placeholder="Briefly describe what your business does..."
                  rows={3}
                  className="flex w-full rounded-lg border border-input bg-white px-3 py-2 text-sm shadow-soft transition-all duration-150 placeholder:text-muted-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20 focus-visible:border-primary/30 resize-none"
                />
              </FormField>
            </div>
          </div>
        </div>

        <div className="flex justify-end px-6 py-3.5 border-t border-border/40 bg-muted/20">
          <Button type="submit" disabled={saving} className="min-w-[120px]">
            {saving ? 'Saving...' : 'Continue'}
          </Button>
        </div>
      </div>
    </form>
  )
}
