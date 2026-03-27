import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import CheckmarkBadge01Icon from '@hugeicons/core-free-icons/CheckmarkBadge01Icon'
import Shield01Icon from '@hugeicons/core-free-icons/Shield01Icon'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { StepIndicator } from '@/components/kyb/StepIndicator'
import { BusinessInfoForm } from '@/components/kyb/BusinessInfoForm'
import { DirectorInfoForm } from '@/components/kyb/DirectorInfoForm'
import { DocumentUpload } from '@/components/kyb/DocumentUpload'
import { ReviewSubmit } from '@/components/kyb/ReviewSubmit'

const STEP_DESCRIPTIONS = [
  'Enter your registered business information',
  'Provide details about the primary director',
  'Upload verification documents',
  'Review and submit your application',
]

export default function KybOnboarding() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  const [submission, setSubmission] = useState(null)
  const [businessInfo, setBusinessInfo] = useState({
    business_name: '',
    rc_number: '',
    business_type: '',
    address: '',
    city: '',
    state: '',
    country: 'NG',
    date_of_incorporation: '',
    industry: '',
    website: '',
    description: '',
  })
  const [directorInfo, setDirectorInfo] = useState({
    full_name: '',
    email: '',
    phone: '',
    bvn: '',
    date_of_birth: '',
    nationality: 'Nigerian',
    address: '',
  })
  const [documents, setDocuments] = useState([])

  useEffect(() => {
    loadKyb()
  }, [])

  async function loadKyb() {
    setLoading(true)
    try {
      const res = await api.get('/dashboard/kyb')
      const data = res.data

      if (data.status === 'pending_review' || data.status === 'approved') {
        navigate('/kyb/status', { replace: true })
        return
      }

      setSubmission(data)
      if (data.business_info) setBusinessInfo((prev) => ({ ...prev, ...data.business_info }))
      if (data.director_info) setDirectorInfo((prev) => ({ ...prev, ...data.director_info }))
      if (data.documents) setDocuments(data.documents)
    } catch (err) {
      if (err.message?.includes('not found') || err.message?.includes('Not found')) {
        setSubmission(null)
      } else {
        toast({ title: 'Failed to load verification status', description: err.message, variant: 'destructive' })
      }
    } finally {
      setLoading(false)
    }
  }

  async function ensureSubmission() {
    if (submission?.id) return submission
    try {
      const res = await api.post('/dashboard/kyb', {})
      setSubmission(res.data)
      return res.data
    } catch (err) {
      toast({ title: 'Failed to create submission', description: err.message, variant: 'destructive' })
      return null
    }
  }

  async function handleBusinessInfoContinue() {
    setSaving(true)
    try {
      const sub = await ensureSubmission()
      if (!sub) return
      const res = await api.put('/dashboard/kyb/business-info', businessInfo)
      setSubmission((prev) => ({ ...prev, business_info: res.data?.business_info || businessInfo }))
      setCurrentStep(1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      toast({ title: 'Failed to save business info', description: err.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  async function handleDirectorInfoContinue() {
    setSaving(true)
    try {
      const res = await api.put('/dashboard/kyb/director-info', directorInfo)
      setSubmission((prev) => ({ ...prev, director_info: res.data?.director_info || directorInfo }))
      setCurrentStep(2)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      toast({ title: 'Failed to save director info', description: err.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  function handleDocumentUpload(type, file) {
    setDocuments((prev) => [
      ...prev.filter((d) => d.document_type !== type),
      { id: crypto.randomUUID(), document_type: type, file_name: file.name },
    ])
  }

  function handleDocumentDelete(type) {
    setDocuments((prev) => prev.filter((d) => d.document_type !== type))
  }

  function handleDocumentsContinue() {
    setCurrentStep(3)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit() {
    setSaving(true)
    try {
      await api.post('/dashboard/kyb/submit', {})
      toast({ title: 'Application submitted', description: 'We\'ll review your submission and get back to you.' })
      navigate('/kyb/status', { replace: true })
    } catch (err) {
      toast({ title: 'Failed to submit', description: err.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const completedSteps = [currentStep > 0, currentStep > 1, currentStep > 2, false]

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-[420px] w-full max-w-3xl rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/8 text-primary shrink-0">
          <HugeiconsIcon icon={CheckmarkBadge01Icon} size={20} strokeWidth={1.3} />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Business Verification</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            {STEP_DESCRIPTIONS[currentStep]}
          </p>
        </div>
      </div>

      {/* Why this matters */}
      {currentStep === 0 && !submission?.id && (
        <div className="flex items-start gap-3 rounded-xl border border-blue-200/50 bg-blue-50/30 px-5 py-4 max-w-3xl">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-600 shrink-0 mt-0.5">
            <HugeiconsIcon icon={Shield01Icon} size={13} strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-[13px] font-medium text-blue-900">Why do we need this?</p>
            <p className="text-[12px] text-blue-700/70 leading-relaxed mt-0.5">
              Nigerian financial regulations require us to verify your business (KYB) and director identity (KYC)
              before enabling live payment processing. This protects both you and your customers.
            </p>
          </div>
        </div>
      )}

      <StepIndicator currentStep={currentStep} completedSteps={completedSteps} />

      <div className="max-w-3xl">
        {currentStep === 0 && (
          <BusinessInfoForm
            data={businessInfo}
            onChange={setBusinessInfo}
            onContinue={handleBusinessInfoContinue}
            saving={saving}
          />
        )}

        {currentStep === 1 && (
          <DirectorInfoForm
            data={directorInfo}
            onChange={setDirectorInfo}
            onContinue={handleDirectorInfoContinue}
            onBack={() => { setCurrentStep(0); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            saving={saving}
          />
        )}

        {currentStep === 2 && (
          <DocumentUpload
            documents={documents}
            onUpload={handleDocumentUpload}
            onDelete={handleDocumentDelete}
            onContinue={handleDocumentsContinue}
            onBack={() => { setCurrentStep(1); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
          />
        )}

        {currentStep === 3 && (
          <ReviewSubmit
            submission={{ business_info: businessInfo, director_info: directorInfo }}
            documents={documents}
            onSubmit={handleSubmit}
            onBack={() => { setCurrentStep(2); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            submitting={saving}
          />
        )}
      </div>
    </div>
  )
}
