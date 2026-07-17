import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/features/auth/services/authService'
import { prisma } from '@/lib/prisma'
import { UserBottomNav } from '@/components/layout/user-bottom-nav'
import { AdminPreviewBanner } from '@/components/layout/admin-preview-banner'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Sparkles } from 'lucide-react'
import { getInitials } from '@/lib/utils'

export default async function UserLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  // When an admin is in preview mode, fetch the list of active non-admin
  // users so the banner can render the user selector.
  const previewUsers =
    user.role === 'admin'
      ? await prisma.user.findMany({
          where: { active: true, role: 'user' },
          select: { id: true, name: true },
          orderBy: { name: 'asc' },
        })
      : []

  return (
    <div className="flex flex-col min-h-screen">
      {user.role === 'admin' && <AdminPreviewBanner users={previewUsers} />}

      {/* Compact top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between h-14 px-4 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center size-6 rounded-md bg-brand/10 shrink-0">
            <Sparkles className="size-3.5 text-brand" aria-hidden="true" />
          </div>
          <span className="font-semibold text-sm tracking-tight">Casa Limpa</span>
        </div>

        <Avatar className="size-8" aria-label={`Conectado como ${user.name}`}>
          <AvatarFallback className="bg-brand/10 text-brand text-xs font-semibold">
            {getInitials(user.name)}
          </AvatarFallback>
        </Avatar>
      </header>

      {/* Page content — padded bottom to clear the fixed bottom nav */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden pb-16">{children}</main>

      <UserBottomNav />
    </div>
  )
}
