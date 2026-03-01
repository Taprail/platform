import { cn } from '@/lib/utils'

const statusConfig = {
  success: { label: 'Success', className: 'bg-emerald-50 text-emerald-700' },
  paid: { label: 'Paid', className: 'bg-emerald-50 text-emerald-700' },
  delivered: { label: 'Delivered', className: 'bg-emerald-50 text-emerald-700' },
  active: { label: 'Active', className: 'bg-emerald-50 text-emerald-700' },
  pending: { label: 'Pending', className: 'bg-amber-50 text-amber-700' },
  locked: { label: 'Locked', className: 'bg-amber-50 text-amber-700' },
  failed: { label: 'Failed', className: 'bg-red-50 text-red-700' },
  expired: { label: 'Expired', className: 'bg-gray-50 text-gray-600' },
  cancelled: { label: 'Cancelled', className: 'bg-gray-50 text-gray-600' },
  suspended: { label: 'Suspended', className: 'bg-red-50 text-red-700' },
  deactivated: { label: 'Deactivated', className: 'bg-gray-50 text-gray-600' },
}

export function StatusBadge({ status }) {
  const config = statusConfig[status] || { label: status, className: 'bg-gray-50 text-gray-600' }
  return (
    <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium', config.className)}>
      {config.label}
    </span>
  )
}
