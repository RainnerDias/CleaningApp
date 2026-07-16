import { redirect } from 'next/navigation'
import { subDays, startOfDay } from 'date-fns'
import { getCurrentUser } from '@/features/auth/services/authService'
import { scheduleService } from '@/features/scheduling/services/scheduleService'
import { HistoryClient } from '@/features/scheduling/components/HistoryClient'
import type { ScheduleWithDetails } from '@/features/scheduling/types'

export default async function HistoryPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const today = startOfDay(new Date())
  const from = subDays(today, 30)

  const rawSchedules = await scheduleService.getByDateRange(from, today, user.id)

  // Serialise Prisma Date objects → ISO strings
  const schedules = JSON.parse(JSON.stringify(rawSchedules)) as ScheduleWithDetails[]

  return <HistoryClient initialSchedules={schedules} />
}
