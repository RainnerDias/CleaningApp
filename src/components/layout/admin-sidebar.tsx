'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Calendar,
  Users,
  ClipboardList,
  Home,
  BarChart2,
  Settings,
  LogOut,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { AuthUser } from '@/features/auth/types'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/users', label: 'Users', icon: Users },
  { href: '/tasks', label: 'Tasks', icon: ClipboardList },
  { href: '/rooms', label: 'Rooms', icon: Home },
  { href: '/reports', label: 'Reports', icon: BarChart2 },
  { href: '/settings', label: 'Settings', icon: Settings },
] as const

interface AdminSidebarProps {
  /** Authenticated admin user passed from the server layout */
  user: AuthUser
}

/**
 * Admin shell: renders a left sidebar on desktop and a bottom nav on mobile.
 * Wraps the page content to ensure proper spacing on both breakpoints.
 */
export function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      {/* ── Desktop sidebar ────────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-64 min-h-screen border-r border-border bg-sidebar shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2 px-6 h-16 border-b border-border shrink-0">
          <Sparkles className="size-5 text-primary" aria-hidden="true" />
          <span className="font-semibold text-base tracking-tight">Casa Limpa</span>
        </div>

        {/* Navigation */}
        <nav aria-label="Admin navigation" className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(`${href}/`)
            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* User + Logout */}
        <div className="border-t border-border px-3 py-4 space-y-1">
          <div className="px-3 py-2">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              void handleSignOut()
            }}
            className="flex w-full items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
          >
            <LogOut className="size-4 shrink-0" aria-hidden="true" />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Mobile bottom navigation ───────────────────────────────────── */}
      <nav
        aria-label="Admin navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-border bg-background h-16 px-1"
      >
        {NAV_ITEMS.slice(0, 6).map(({ href, label, icon: Icon }) => {
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
    </>
  )
}
