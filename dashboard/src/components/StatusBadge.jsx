import { cn } from '@/lib/utils'

const statusConfig = {
  success: { label: 'Success', dotClass: 'bg-emerald-500', bgClass: 'bg-emerald-50', className: 'text-emerald-700' },
  paid: { label: 'Paid', dotClass: 'bg-emerald-500', bgClass: 'bg-emerald-50', className: 'text-emerald-700' },
  delivered: { label: 'Delivered', dotClass: 'bg-emerald-500', bgClass: 'bg-emerald-50', className: 'text-emerald-700' },
  active: { label: 'Active', dotClass: 'bg-emerald-500', bgClass: 'bg-emerald-50', className: 'text-emerald-700' },
  approved: { label: 'Approved', dotClass: 'bg-emerald-500', bgClass: 'bg-emerald-50', className: 'text-emerald-700' },
  pending: { label: 'Pending', dotClass: 'bg-amber-500', bgClass: 'bg-amber-50', className: 'text-amber-700' },
  locked: { label: 'Locked', dotClass: 'bg-amber-500', bgClass: 'bg-amber-50', className: 'text-amber-700' },
  pending_review: { label: 'Pending Review', dotClass: 'bg-amber-500', bgClass: 'bg-amber-50', className: 'text-amber-700' },
  in_progress: { label: 'In Progress', dotClass: 'bg-blue-500', bgClass: 'bg-blue-50', className: 'text-blue-700' },
  not_started: { label: 'Not Started', dotClass: 'bg-gray-300', bgClass: 'bg-gray-50', className: 'text-gray-500' },
  failed: { label: 'Failed', dotClass: 'bg-red-500', bgClass: 'bg-red-50', className: 'text-red-700' },
  rejected: { label: 'Rejected', dotClass: 'bg-red-500', bgClass: 'bg-red-50', className: 'text-red-700' },
  expired: { label: 'Expired', dotClass: 'bg-gray-300', bgClass: 'bg-gray-50', className: 'text-gray-500' },
  cancelled: { label: 'Cancelled', dotClass: 'bg-gray-300', bgClass: 'bg-gray-50', className: 'text-gray-500' },
  suspended: { label: 'Suspended', dotClass: 'bg-red-500', bgClass: 'bg-red-50', className: 'text-red-700' },
  deactivated: { label: 'Deactivated', dotClass: 'bg-gray-300', bgClass: 'bg-gray-50', className: 'text-gray-500' },
}

export function StatusBadge({ status }) {
  const config = statusConfig[status] || { label: status, dotClass: 'bg-gray-300', bgClass: 'bg-gray-50', className: 'text-gray-500' }
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium', config.bgClass, config.className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', config.dotClass)} />
      {config.label}
    </span>
  )
}
