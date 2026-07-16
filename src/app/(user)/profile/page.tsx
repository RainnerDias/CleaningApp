import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/features/auth/services/authService'
import { ProfileClient } from '@/features/scheduling/components/ProfileClient'

export default async function ProfilePage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  return (
    <ProfileClient
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
      }}
    />
  )
}
