'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sun, CalendarDays, Calendar, History, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/today', label: 'Hoje', icon: Sun },
  { href: '/week', label: 'Semana', icon: CalendarDays },
  { href: '/month', label: 'Mês', icon: Calendar },
  { href: '/history', label: 'Histórico', icon: History },
  { href: '/profile', label: 'Perfil', icon: User },
] as const

/**
 * Fixed bottom navigation bar for the user-facing layout.
 * Shows icon + label for each section. Active item uses foreground color.
 */
export function UserBottomNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="User navigation"
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-border bg-background h-16 px-1"
    >
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || pathname.startsWith(`${href}/`)
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? 'page' : undefined}
            aria-label={label}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-[10px] font-medium transition-colors',
              isActive ? 'text-foreground' : 'text-muted-foreground'
            )}
          >
            <Icon className="size-5" aria-hidden="true" />
            <span>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
