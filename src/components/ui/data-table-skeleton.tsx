import { cn } from '@/lib/utils'

interface DataTableSkeletonProps {
  /** Number of placeholder rows to render (default: 3) */
  rows?: number
  /** Number of columns to render (default: 5) */
  columns?: number
  className?: string
}

/**
 * Shimmer loading skeleton for data tables.
 * Renders a header row and configurable body rows.
 */
export function DataTableSkeleton({ rows = 3, columns = 5, className }: DataTableSkeletonProps) {
  return (
    <div className={cn('w-full overflow-hidden rounded-lg border border-border', className)}>
      {/* Table header */}
      <div className="flex gap-4 border-b border-border bg-muted/40 px-4 py-3">
        {Array.from({ length: columns }).map((_, i) => (
          <div
            key={i}
            className="h-3 flex-1 animate-pulse rounded-full bg-muted"
            style={{ maxWidth: i === 0 ? '40px' : undefined }}
          />
        ))}
      </div>

      {/* Table rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className={cn('flex gap-4 px-4 py-3', rowIndex < rows - 1 && 'border-b border-border')}
        >
          {/* First column: icon-like circle */}
          <div className="size-8 flex-shrink-0 animate-pulse rounded-full bg-muted" />
          {/* Remaining columns */}
          {Array.from({ length: columns - 1 }).map((_, colIndex) => (
            <div
              key={colIndex}
              className="h-3 flex-1 animate-pulse rounded-full bg-muted"
              style={{ animationDelay: `${(rowIndex * (columns - 1) + colIndex) * 50}ms` }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
