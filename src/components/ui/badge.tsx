import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'success' | 'destructive' | 'secondary' | 'outline'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-primary/10 text-primary',
  success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  destructive: 'bg-destructive/10 text-destructive',
  secondary: 'bg-secondary text-secondary-foreground',
  outline: 'border border-border text-foreground bg-transparent',
}

/**
 * Small inline label for status indicators and tags.
 */
function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge, type BadgeProps, type BadgeVariant }
