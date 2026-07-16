import { redirect } from 'next/navigation'
import { startOfDay } from 'date-fns'
import { getCurrentUser } from '@/features/auth/services/authService'
import { scheduleService } from '@/features/scheduling/services/scheduleService'
import { prisma } from '@/lib/prisma'
import { TodayClient } from '@/features/scheduling/components/TodayClient'
import type { ScheduleWithDetails } from '@/features/scheduling/types'

export default async function TodayPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const today = startOfDay(new Date())

  const [rawSchedules, goldenRuleSetting] = await Promise.all([
    scheduleService.getByDate(today, user.id),
    prisma.setting.findUnique({ where: { key: 'golden_rule' } }),
  ])

  // Serialise Prisma Date objects → ISO strings so the type matches ScheduleWithDetails
  // (Next.js serialises them at runtime, but TypeScript needs the round-trip hint here)
  const schedules = JSON.parse(JSON.stringify(rawSchedules)) as ScheduleWithDetails[]

  const goldenRule = (goldenRuleSetting?.value as { text: string } | null)?.text ?? ''

  return (
    <TodayClient
      user={{ id: user.id, name: user.name }}
      initialSchedules={schedules}
      goldenRule={goldenRule}
      today={today.toISOString()}
    />
  )
}
