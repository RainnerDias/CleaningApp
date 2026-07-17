import { requireAdmin } from '@/features/auth/services/authService'
import { prisma } from '@/lib/prisma'
import { SettingsPageClient } from '@/features/settings/components/SettingsPageClient'

const GOLDEN_RULE_DEFAULT_TEXT =
  'Regra de ouro: Retire todos os objetos → limpe embaixo, atrás, em cima e os próprios objetos → recoloque tudo no lugar.'

/**
 * Admin Settings page — server component.
 *
 * Validates admin access, prefetches the golden_rule setting from Prisma
 * (avoiding an extra round-trip through the API), then passes the initial
 * text to the client shell so the textarea is populated on first paint.
 */
export default async function SettingsPage() {
  await requireAdmin()

  const setting = await prisma.setting.findUnique({ where: { key: 'golden_rule' } })
  const initialGoldenRuleText =
    (setting?.value as { text?: string } | null)?.text ?? GOLDEN_RULE_DEFAULT_TEXT

  return <SettingsPageClient initialGoldenRuleText={initialGoldenRuleText} />
}
