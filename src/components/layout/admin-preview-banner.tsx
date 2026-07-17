'use client'

import Link from 'next/link'
import { Eye, ArrowLeft } from 'lucide-react'

/**
 * Rendered inside the user layout whenever the logged-in user is an admin.
 * Makes it immediately obvious that the admin is previewing the user view,
 * and provides a one-click path back to the admin dashboard.
 */
export function AdminPreviewBanner() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-center gap-2 px-4 py-1.5 bg-info/10 border-b border-info/20 text-xs font-medium text-info"
    >
      <Eye className="size-3 shrink-0" aria-hidden="true" />
      <span>Você está no modo visualização</span>
      <Link
        href="/dashboard"
        className="ml-1 flex items-center gap-1 underline underline-offset-2 hover:opacity-70 transition-opacity"
      >
        <ArrowLeft className="size-3" aria-hidden="true" />
        Voltar para Admin
      </Link>
    </div>
  )
}
