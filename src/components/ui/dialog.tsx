'use client'

import * as React from 'react'
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import type {
  DialogPopupProps,
  DialogTitleProps,
  DialogDescriptionProps,
} from '@base-ui/react/dialog'
import { cn } from '@/lib/utils'

/* ── Root & Trigger ─────────────────────────────────────────────────────── */

const DialogRoot = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogClose = DialogPrimitive.Close

/* ── Portal + Backdrop ───────────────────────────────────────────────────── */

function DialogPortal({ children }: { children: React.ReactNode }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop
        className={cn(
          'fixed inset-0 z-50 bg-black/50',
          'data-[open]:animate-in data-[closed]:animate-out',
          'data-[open]:fade-in-0 data-[closed]:fade-out-0',
          'transition-opacity duration-200'
        )}
      />
      {children}
    </DialogPrimitive.Portal>
  )
}
DialogPortal.displayName = 'DialogPortal'

/* ── Popup (content container) ───────────────────────────────────────────── */

const DialogContent = React.forwardRef<HTMLDivElement, DialogPopupProps>(
  ({ className, children, ...props }, ref) => (
    <DialogPortal>
      <DialogPrimitive.Popup
        ref={ref}
        className={cn(
          'fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2',
          'rounded-xl border border-border bg-background p-6 shadow-xl',
          'focus:outline-none',
          'data-[open]:animate-in data-[closed]:animate-out',
          'data-[open]:fade-in-0 data-[closed]:fade-out-0',
          'data-[open]:zoom-in-95 data-[closed]:zoom-out-95',
          'transition-all duration-200',
          className
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Popup>
    </DialogPortal>
  )
)
DialogContent.displayName = 'DialogContent'

/* ── Header ──────────────────────────────────────────────────────────────── */

function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-1.5 text-left mb-4', className)} {...props} />
}
DialogHeader.displayName = 'DialogHeader'

/* ── Footer ──────────────────────────────────────────────────────────────── */

function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col-reverse gap-2 mt-6 sm:flex-row sm:justify-end', className)}
      {...props}
    />
  )
}
DialogFooter.displayName = 'DialogFooter'

/* ── Title ───────────────────────────────────────────────────────────────── */

const DialogTitle = React.forwardRef<HTMLHeadingElement, DialogTitleProps>(
  ({ className, ...props }, ref) => (
    <DialogPrimitive.Title
      ref={ref}
      className={cn('text-lg font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  )
)
DialogTitle.displayName = 'DialogTitle'

/* ── Description ─────────────────────────────────────────────────────────── */

const DialogDescription = React.forwardRef<HTMLParagraphElement, DialogDescriptionProps>(
  ({ className, ...props }, ref) => (
    <DialogPrimitive.Description
      ref={ref}
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
)
DialogDescription.displayName = 'DialogDescription'

export {
  DialogRoot,
  DialogTrigger,
  DialogClose,
  DialogPortal,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
