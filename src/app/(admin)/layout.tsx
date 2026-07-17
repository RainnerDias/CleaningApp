import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/features/auth/services/authService'
import { AdminSidebar } from '@/components/layout/admin-sidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  if (user.role !== 'admin') {
    redirect('/today')
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar user={user} />

      {/* Content area: offset for desktop sidebar, padded-bottom for mobile nav */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden pb-16 md:pb-0">{children}</main>
    </div>
  )
}
