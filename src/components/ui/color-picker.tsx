'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface ColorPickerProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type'
> {
  /** Label displayed next to the color preview circle */
  label?: string
}

/**
 * Styled wrapper around `<input type="color">` that shows a preview circle
 * and a hex value label. Forwards the ref to the underlying input.
 */
const ColorPicker = forwardRef<HTMLInputElement, ColorPickerProps>(
  ({ className, label, value, onChange, ...props }, ref) => {
    return (
      <div className="flex items-center gap-3">
        <div className="relative flex-shrink-0">
          {/* Color preview circle */}
          <div
            className="size-9 rounded-full border border-border shadow-sm"
            style={{ backgroundColor: (value as string) ?? '#000000' }}
            aria-hidden="true"
          />
          {/* Native color input positioned over the preview */}
          <input
            ref={ref}
            type="color"
            value={value}
            onChange={onChange}
            className={cn(
              'absolute inset-0 opacity-0 w-full h-full cursor-pointer rounded-full',
              className
            )}
            aria-label={label ?? 'Selecionar cor'}
            {...props}
          />
        </div>

        {/* Hex value display */}
        <div className="flex flex-col">
          {label && <span className="text-xs text-muted-foreground leading-tight">{label}</span>}
          <span className="text-sm font-mono font-medium">
            {(value as string | undefined)?.toUpperCase() ?? '#000000'}
          </span>
        </div>
      </div>
    )
  }
)

ColorPicker.displayName = 'ColorPicker'

export { ColorPicker }
