import { useState } from 'react'

const STORAGE_KEY = 'taprail_checklist_dismissed'

export function useOnboarding(overviewData) {
  const [isDismissed, setIsDismissed] = useState(
    () => localStorage.getItem(STORAGE_KEY) === 'true'
  )

  const steps = [
    { label: 'Complete business verification', description: 'Verify your business to unlock live payments', icon: 'ShieldCheck', to: '/kyb', complete: overviewData?.kyb_status === 'approved' },
    { label: 'Create your first API key', description: 'Generate test and live API keys', icon: 'Key', to: '/api-keys', complete: !!overviewData?.has_api_keys },
    { label: 'Set up a webhook endpoint', description: 'Receive real-time event notifications', icon: 'Webhook', to: '/webhooks', complete: !!overviewData?.has_webhooks },
    { label: 'Make a test payment', description: 'Try the interactive Beam payment demo', icon: 'CreditCard', to: '/demo', complete: !!overviewData?.has_transactions },
  ]

  const isComplete = steps.every((s) => s.complete)

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, 'true')
    setIsDismissed(true)
  }

  return { steps, isComplete, isDismissed, dismiss }
}
