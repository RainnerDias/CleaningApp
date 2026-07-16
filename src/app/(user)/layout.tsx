import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/features/auth/services/authService'
import { UserBottomNav } from '@/components/layout/user-bottom-nav'
import { Sparkles } from 'lucide-react'

export default async function UserLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Compact top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between h-14 px-4 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" aria-hidden="true" />
          <span className="font-semibold text-sm tracking-tight">Casa Limpa</span>
        </div>

        {/* User avatar placeholder */}
        <div
          className="size-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold uppercase select-none"
          aria-label={`Logged in as ${user.name}`}
        >
          {user.name.charAt(0)}
        </div>
      </header>

      {/* Page content — padded bottom to clear the fixed bottom nav */}
      <main className="flex-1 overflow-auto pb-16">{children}</main>

      <UserBottomNav />
    </div>
  )
}
