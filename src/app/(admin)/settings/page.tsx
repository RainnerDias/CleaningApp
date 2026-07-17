import { requireAdmin } from '@/features/auth/services/authService'
import { prisma } from '@/lib/prisma'
import { SettingsPageClient } from '@/features/settings/components/SettingsPageClient'

const GOLDEN_RULE_DEFAULT_TITLE = 'Regra de Ouro'
const GOLDEN_RULE_DEFAULT_TEXT =
  'Regra de ouro: Retire todos os objetos → limpe embaixo, atrás, em cima e os próprios objetos → recoloque tudo no lugar.'

export default async function SettingsPage() {
  await requireAdmin()

  const setting = await prisma.setting.findUnique({ where: { key: 'golden_rule' } })
  const val = setting?.value as { title?: string; text?: string } | null
  const initialGoldenRuleTitle = val?.title ?? GOLDEN_RULE_DEFAULT_TITLE
  const initialGoldenRuleText = val?.text ?? GOLDEN_RULE_DEFAULT_TEXT

  return (
    <SettingsPageClient
      initialGoldenRuleTitle={initialGoldenRuleTitle}
      initialGoldenRuleText={initialGoldenRuleText}
    />
  )
}
