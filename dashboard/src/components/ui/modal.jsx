import * as React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { HugeiconsIcon } from '@hugeicons/react'
import Cancel01Icon from '@hugeicons/core-free-icons/Cancel01Icon'
import { cn } from '@/lib/utils'

export function Modal({ open, onOpenChange, children }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className={cn(
            'fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%]',
            'rounded-xl border bg-card shadow-lg',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
            'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
            'duration-200'
          )}
        >
          {children}
          <Dialog.Close asChild>
            <button className="absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground/50 hover:text-foreground hover:bg-muted/40 transition-all duration-150">
              <HugeiconsIcon icon={Cancel01Icon} size={16} strokeWidth={1.8} />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export function ModalHeader({ children, className }) {
  return (
    <div className={cn('px-6 pt-6 pb-4', className)}>
      {children}
    </div>
  )
}

export function ModalTitle({ children, className }) {
  return (
    <Dialog.Title className={cn('text-[15px] font-semibold tracking-tight', className)}>
      {children}
    </Dialog.Title>
  )
}

export function ModalDescription({ children, className }) {
  return (
    <Dialog.Description className={cn('text-[13px] text-muted-foreground mt-1', className)}>
      {children}
    </Dialog.Description>
  )
}

export function ModalBody({ children, className }) {
  return (
    <div className={cn('px-6 pb-6', className)}>
      {children}
    </div>
  )
}

export function ModalFooter({ children, className }) {
  return (
    <div className={cn('flex items-center justify-end gap-2 px-6 pb-6', className)}>
      {children}
    </div>
  )
}
