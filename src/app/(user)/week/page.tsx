import { redirect } from 'next/navigation'
import { startOfWeek, endOfWeek, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { getCurrentUser } from '@/features/auth/services/authService'
import { scheduleService } from '@/features/scheduling/services/scheduleService'
import { WeekClient } from '@/features/scheduling/components/WeekClient'
import type { ScheduleWithDetails } from '@/features/scheduling/types'

export default async function WeekPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const now = new Date()
  const monday = startOfWeek(now, { weekStartsOn: 1 })
  const sunday = endOfWeek(now, { weekStartsOn: 1 })

  const rawSchedules = await scheduleService.getByDateRange(monday, sunday, user.id)
  const schedules = JSON.parse(JSON.stringify(rawSchedules)) as ScheduleWithDetails[]

  // Pre-format the week label server-side to avoid timezone hydration mismatch
  const initialWeekLabel = `${format(monday, "d 'de' MMM", { locale: ptBR })} – ${format(sunday, "d 'de' MMM", { locale: ptBR })}`

  return (
    <WeekClient
      user={{ id: user.id, name: user.name }}
      initialSchedules={schedules}
      initialWeekStart={monday.toISOString()}
      initialWeekLabel={initialWeekLabel}
    />
  )
}
