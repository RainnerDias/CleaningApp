'use client'

import * as React from 'react'
import { AlertDialog as AlertDialogPrimitive } from '@base-ui/react/alert-dialog'
import type {
  AlertDialogPopupProps,
  AlertDialogTitleProps,
  AlertDialogDescriptionProps,
} from '@base-ui/react/alert-dialog'
import { cn } from '@/lib/utils'

/* ── Root & Trigger ─────────────────────────────────────────────────────── */

const AlertDialogRoot = AlertDialogPrimitive.Root
const AlertDialogTrigger = AlertDialogPrimitive.Trigger
const AlertDialogClose = AlertDialogPrimitive.Close

/* ── Portal + Backdrop ───────────────────────────────────────────────────── */

function AlertDialogPortal({ children }: { children: React.ReactNode }) {
  return (
    <AlertDialogPrimitive.Portal>
      <AlertDialogPrimitive.Backdrop
        className={cn(
          'fixed inset-0 z-50 bg-black/50',
          'data-[open]:animate-in data-[closed]:animate-out',
          'data-[open]:fade-in-0 data-[closed]:fade-out-0',
          'transition-opacity duration-200'
        )}
      />
      {children}
    </AlertDialogPrimitive.Portal>
  )
}
AlertDialogPortal.displayName = 'AlertDialogPortal'

/* ── Popup (content container) ───────────────────────────────────────────── */

const AlertDialogContent = React.forwardRef<HTMLDivElement, AlertDialogPopupProps>(
  ({ className, children, ...props }, ref) => (
    <AlertDialogPortal>
      <AlertDialogPrimitive.Popup
        ref={ref}
        className={cn(
          'fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2',
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
      </AlertDialogPrimitive.Popup>
    </AlertDialogPortal>
  )
)
AlertDialogContent.displayName = 'AlertDialogContent'

/* ── Header ──────────────────────────────────────────────────────────────── */

function AlertDialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-1.5 text-left mb-4', className)} {...props} />
}
AlertDialogHeader.displayName = 'AlertDialogHeader'

/* ── Footer ──────────────────────────────────────────────────────────────── */

function AlertDialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col-reverse gap-2 mt-6 sm:flex-row sm:justify-end', className)}
      {...props}
    />
  )
}
AlertDialogFooter.displayName = 'AlertDialogFooter'

/* ── Title ───────────────────────────────────────────────────────────────── */

const AlertDialogTitle = React.forwardRef<HTMLHeadingElement, AlertDialogTitleProps>(
  ({ className, ...props }, ref) => (
    <AlertDialogPrimitive.Title
      ref={ref}
      className={cn('text-lg font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  )
)
AlertDialogTitle.displayName = 'AlertDialogTitle'

/* ── Description ─────────────────────────────────────────────────────────── */

const AlertDialogDescription = React.forwardRef<HTMLParagraphElement, AlertDialogDescriptionProps>(
  ({ className, ...props }, ref) => (
    <AlertDialogPrimitive.Description
      ref={ref}
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
)
AlertDialogDescription.displayName = 'AlertDialogDescription'

export {
  AlertDialogRoot,
  AlertDialogTrigger,
  AlertDialogClose,
  AlertDialogPortal,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
}
