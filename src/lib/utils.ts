import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Consistent styling class for native `<select>` elements used with react-hook-form. */
export const nativeSelectClass =
  'flex h-9 w-full appearance-none rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors ' +
  'focus-visible:outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 ' +
  'disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30'

export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0] ?? '')
    .join('')
    .toUpperCase()
}
