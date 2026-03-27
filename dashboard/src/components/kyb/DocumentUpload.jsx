import { HugeiconsIcon } from '@hugeicons/react'
import Upload01Icon from '@hugeicons/core-free-icons/Upload01Icon'
import File01Icon from '@hugeicons/core-free-icons/File01Icon'
import Cancel01Icon from '@hugeicons/core-free-icons/Cancel01Icon'
import CheckmarkCircle02Icon from '@hugeicons/core-free-icons/CheckmarkCircle02Icon'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const documentSpecs = [
  {
    type: 'cac_certificate',
    label: 'CAC Certificate',
    description: 'Certificate of Incorporation issued by the Corporate Affairs Commission',
    required: true,
    icon: '📋',
  },
  {
    type: 'director_id',
    label: 'Director Government ID',
    description: 'NIN slip, international passport, or driver\'s license of the primary director',
    required: true,
    icon: '🪪',
  },
  {
    type: 'utility_bill',
    label: 'Utility Bill',
    description: 'Recent utility bill (within 3 months) for business address verification',
    required: false,
    icon: '🏠',
  },
]

export function DocumentUpload({ documents, onUpload, onDelete, onContinue, onBack }) {
  const getDoc = (type) => documents.find((d) => d.document_type === type)

  const handleFileChange = (type, e) => {
    const file = e.target.files?.[0]
    if (file) onUpload(type, file)
  }

  const requiredMissing = documentSpecs
    .filter((d) => d.required)
    .some((d) => !getDoc(d.type))

  const uploadedCount = documentSpecs.filter((d) => getDoc(d.type)).length

  return (
    <div className="rounded-xl border bg-card shadow-card overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/8 text-primary">
            <HugeiconsIcon icon={File01Icon} size={15} strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-[14px] font-semibold text-foreground">Documents</p>
            <p className="text-[11px] text-muted-foreground/60">Upload required documents for verification</p>
          </div>
        </div>
        <span className="text-[11px] font-medium text-muted-foreground bg-muted rounded-full px-2.5 py-1">
          {uploadedCount}/{documentSpecs.length} uploaded
        </span>
      </div>

      <div className="p-6 space-y-4">
        {documentSpecs.map((spec) => {
          const uploaded = getDoc(spec.type)
          return (
            <div
              key={spec.type}
              className={cn(
                'rounded-xl border p-4 transition-all duration-200',
                uploaded ? 'border-emerald-200/60 bg-emerald-50/20' : 'border-border/60 bg-muted/5'
              )}
            >
              <div className="flex items-start gap-3">
                <span className="text-lg mt-0.5">{spec.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-[13px] font-semibold text-foreground">{spec.label}</p>
                    {spec.required ? (
                      <span className="rounded-md bg-amber-50 text-amber-700 border border-amber-200/60 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                        Required
                      </span>
                    ) : (
                      <span className="rounded-md bg-muted text-muted-foreground/50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                        Optional
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground/60 leading-relaxed">{spec.description}</p>

                  {uploaded ? (
                    <div className="flex items-center justify-between mt-3 rounded-lg border bg-white px-3 py-2.5 shadow-soft">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-50 text-emerald-600">
                          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} strokeWidth={1.8} />
                        </div>
                        <span className="text-[12px] font-medium text-foreground truncate max-w-[200px]">{uploaded.file_name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onDelete(spec.type)}
                        className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground/30 hover:text-destructive hover:bg-red-50 transition-all"
                      >
                        <HugeiconsIcon icon={Cancel01Icon} size={12} strokeWidth={2} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center gap-3 mt-3 rounded-lg border-2 border-dashed border-border/50 px-4 py-3 cursor-pointer hover:border-primary/30 hover:bg-primary/[0.02] transition-all">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/60 shrink-0">
                        <HugeiconsIcon icon={Upload01Icon} size={14} className="text-muted-foreground/50" strokeWidth={1.5} />
                      </div>
                      <div>
                        <span className="text-[12px] font-medium text-foreground/70 block">Click to upload</span>
                        <span className="text-[10px] text-muted-foreground/40">PDF, JPG, or PNG — max 5MB</span>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange(spec.type, e)}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex justify-between px-6 py-3.5 border-t border-border/40 bg-muted/20">
        <Button type="button" variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button type="button" onClick={onContinue} disabled={requiredMissing} className="min-w-[120px]">
          Continue
        </Button>
      </div>
    </div>
  )
}
