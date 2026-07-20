import { redirect } from 'next/navigation'
import { startOfDay, format, parseISO, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { getCurrentUser } from '@/features/auth/services/authService'
import { scheduleService } from '@/features/scheduling/services/scheduleService'
import { prisma } from '@/lib/prisma'
import { TodayClient } from '@/features/scheduling/components/TodayClient'
import type { ScheduleWithDetails } from '@/features/scheduling/types'

const GOLDEN_RULE_DEFAULT_TEXT =
  'Regra de ouro: Retire todos os objetos → limpe embaixo, atrás, em cima e os próprios objetos → recoloque tudo no lugar.'

export default async function TodayPage({
  searchParams,
}: {
  searchParams: Promise<{ viewAs?: string; date?: string }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const { viewAs, date: dateParam } = await searchParams

  // Parse the ?date= param; fall back to today if absent or invalid
  const viewDate = startOfDay(dateParam ? parseISO(dateParam) : new Date())
  const isToday = isSameDay(viewDate, startOfDay(new Date()))

  // Admins can preview another user's today view via ?viewAs=<userId>
  let targetUser = { id: user.id, name: user.name }

  if (user.role === 'admin' && viewAs) {
    const found = await prisma.user.findUnique({
      where: { id: viewAs, active: true },
      select: { id: true, name: true },
    })
    if (found) targetUser = found
  }

  const [rawSchedules, goldenRuleSetting] = await Promise.all([
    scheduleService.getByDate(viewDate, targetUser.id),
    prisma.setting.findUnique({ where: { key: 'golden_rule' } }),
  ])

  const schedules = JSON.parse(JSON.stringify(rawSchedules)) as ScheduleWithDetails[]
  const val = goldenRuleSetting?.value as { title?: string; text?: string } | null
  const goldenRule = val?.text ?? GOLDEN_RULE_DEFAULT_TEXT
  const goldenRuleTitle = val?.title ?? 'Regra de Ouro'

  // Compute the date label server-side to prevent hydration mismatch from
  // timezone differences between the UTC server and the client's local time.
  const dayName = format(viewDate, 'EEEE', { locale: ptBR })
  const capitalDay = dayName.charAt(0).toUpperCase() + dayName.slice(1)
  const dateLabel = `${capitalDay}, ${format(viewDate, "d 'de' MMMM", { locale: ptBR })}`
  const todayLabel = isToday ? `Hoje é ${dateLabel}` : dateLabel

  return (
    <TodayClient
      user={targetUser}
      initialSchedules={schedules}
      goldenRule={goldenRule}
      goldenRuleTitle={goldenRuleTitle}
      todayLabel={todayLabel}
      viewDate={viewDate.toISOString()}
      isToday={isToday}
      viewAsUserId={user.role === 'admin' && viewAs ? viewAs : undefined}
    />
  )
}
