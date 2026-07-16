import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  /** Lucide icon component to display */
  icon: LucideIcon
  /** Page title */
  title: string
  /** Subtitle shown below the title */
  subtitle?: string
  className?: string
}

/**
 * Centered empty / under-construction state for pages not yet implemented.
 * Matches the Notion-like neutral palette used throughout the app.
 */
export function EmptyState({
  icon: Icon,
  title,
  subtitle = 'Em construção',
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 min-h-[60vh] px-4 text-center',
        className
      )}
    >
      <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
        <Icon className="size-8 text-muted-foreground" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  )
}
