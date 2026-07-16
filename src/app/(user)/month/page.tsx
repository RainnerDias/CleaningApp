import { redirect } from 'next/navigation'
import { startOfMonth, endOfMonth } from 'date-fns'
import { getCurrentUser } from '@/features/auth/services/authService'
import { scheduleService } from '@/features/scheduling/services/scheduleService'
import { MonthClient } from '@/features/scheduling/components/MonthClient'
import type { ScheduleWithDetails } from '@/features/scheduling/types'

export default async function MonthPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  const rawSchedules = await scheduleService.getByDateRange(monthStart, monthEnd, user.id)

  // Serialise Prisma Date objects → ISO strings
  const schedules = JSON.parse(JSON.stringify(rawSchedules)) as ScheduleWithDetails[]

  return <MonthClient initialSchedules={schedules} initialMonthStart={monthStart.toISOString()} />
}
