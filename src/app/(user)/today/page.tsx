import { redirect } from 'next/navigation'
import { startOfDay, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { getCurrentUser } from '@/features/auth/services/authService'
import { scheduleService } from '@/features/scheduling/services/scheduleService'
import { prisma } from '@/lib/prisma'
import { TodayClient } from '@/features/scheduling/components/TodayClient'
import type { ScheduleWithDetails } from '@/features/scheduling/types'

const GOLDEN_RULE_DEFAULT_TEXT =
  'Regra de ouro: Retire todos os objetos → limpe embaixo, atrás, em cima e os próprios objetos → recoloque tudo no lugar.'

const WEEKDAYS_PT = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'] as const
const MONTHS_PT = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
] as const

void MONTHS_PT

export default async function TodayPage({
  searchParams,
}: {
  searchParams: Promise<{ viewAs?: string }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const today = startOfDay(new Date())

  // Admins can preview another user's today view via ?viewAs=<userId>
  const { viewAs } = await searchParams
  let targetUser = { id: user.id, name: user.name }

  if (user.role === 'admin' && viewAs) {
    const found = await prisma.user.findUnique({
      where: { id: viewAs, active: true },
      select: { id: true, name: true },
    })
    if (found) targetUser = found
  }

  const [rawSchedules, goldenRuleSetting] = await Promise.all([
    scheduleService.getByDate(today, targetUser.id),
    prisma.setting.findUnique({ where: { key: 'golden_rule' } }),
  ])

  const schedules = JSON.parse(JSON.stringify(rawSchedules)) as ScheduleWithDetails[]
  const val = goldenRuleSetting?.value as { title?: string; text?: string } | null
  const goldenRule = val?.text ?? GOLDEN_RULE_DEFAULT_TEXT
  const goldenRuleTitle = val?.title ?? 'Regra de Ouro'

  // Compute the date label server-side to prevent hydration mismatch from
  // timezone differences between the UTC server and the client's local time.
  const todayLabel = `Hoje é ${WEEKDAYS_PT[today.getDay()]}, ${format(today, "d 'de' MMMM", { locale: ptBR })}`

  return (
    <TodayClient
      user={targetUser}
      initialSchedules={schedules}
      goldenRule={goldenRule}
      goldenRuleTitle={goldenRuleTitle}
      todayLabel={todayLabel}
      today={today.toISOString()}
    />
  )
}
