'use client'

import { useState } from 'react'
import { Star, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useUpdateSetting } from '../hooks/useSettings'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SettingsPageClientProps {
  /** Server-prefetched text value — used to initialise the textarea */
  initialGoldenRuleText: string
}

// ---------------------------------------------------------------------------
// GoldenRuleCard
// ---------------------------------------------------------------------------

function GoldenRuleCard({ initialGoldenRuleText }: SettingsPageClientProps) {
  // Draft state is initialised once from the server-prefetched prop.
  // The project's lint rules forbid calling setState inside effects, so we do
  // not synchronise the draft with subsequent query refetches. An admin who
  // wants to pick up an external change can simply refresh the page.
  const [draftText, setDraftText] = useState(initialGoldenRuleText)

  const {
    mutate: updateSetting,
    isPending,
    isSuccess,
    isError,
    error,
    reset,
  } = useUpdateSetting('golden_rule')

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setDraftText(e.target.value)
    // Clear any prior success/error banner when the user starts typing again
    if (isSuccess || isError) reset()
  }

  function handleSave() {
    const trimmed = draftText.trim()
    if (!trimmed || isPending) return
    updateSetting(trimmed)
  }

  return (
    <section
      aria-labelledby="golden-rule-heading"
      className="rounded-xl border border-border bg-card shadow-sm"
    >
      {/* Card header */}
      <div className="flex items-center gap-2 border-b border-border px-6 py-4">
        <Star className="size-4 shrink-0 text-amber-500" aria-hidden="true" />
        <h2 id="golden-rule-heading" className="text-base font-semibold">
          Regra de Ouro
        </h2>
      </div>

      {/* Card body */}
      <div className="px-6 py-5 space-y-4">
        <p className="text-sm text-muted-foreground">
          Este texto aparece como um banner fixo no painel de tarefas do dia para todos os usuários.
          Edite-o para refletir a metodologia de limpeza da casa.
        </p>

        {/* Live preview */}
        <div
          role="note"
          aria-label="Pré-visualização da regra de ouro"
          className="rounded-lg border-l-4 border-amber-400 bg-amber-50 px-4 py-3 dark:bg-amber-900/20"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
            Regra de Ouro — pré-visualização
          </p>
          <p className="mt-1 text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
            {draftText.trim() || (
              <span className="italic text-amber-600/60 dark:text-amber-400/60">
                Nenhum texto inserido
              </span>
            )}
          </p>
        </div>

        {/* Textarea */}
        <div className="space-y-1.5">
          <label htmlFor="golden-rule-textarea" className="text-sm font-medium text-foreground">
            Texto da regra
          </label>
          <Textarea
            id="golden-rule-textarea"
            value={draftText}
            onChange={handleChange}
            rows={4}
            maxLength={500}
            placeholder="Descreva a regra de ouro de limpeza..."
            aria-describedby="golden-rule-char-count"
            disabled={isPending}
            className="min-h-[100px]"
          />
          <span
            id="golden-rule-char-count"
            className="block text-xs text-muted-foreground"
            aria-live="polite"
            aria-atomic="true"
          >
            {draftText.length}/500 caracteres
          </span>
        </div>

        {/* Success / error feedback */}
        {isSuccess && (
          <div
            role="status"
            aria-live="polite"
            className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-2.5 text-sm font-medium text-green-700 dark:bg-green-900/20 dark:text-green-400"
          >
            <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
            Salvo com sucesso!
          </div>
        )}

        {isError && (
          <div
            role="alert"
            aria-live="assertive"
            className="flex items-start gap-2 rounded-lg bg-destructive/10 px-4 py-2.5 text-sm font-medium text-destructive"
          >
            <AlertCircle className="size-4 mt-0.5 shrink-0" aria-hidden="true" />
            {error?.message ?? 'Erro ao salvar. Tente novamente.'}
          </div>
        )}

        {/* Save button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={!draftText.trim() || isPending}
            aria-busy={isPending}
          >
            {isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Client shell for the admin Settings page.
 *
 * UI flow:
 * - On mount the textarea shows the server-prefetched golden rule text.
 * - Typing updates the draft and clears any prior success/error banner.
 * - "Salvar" calls PATCH /api/settings/golden_rule and shows inline feedback.
 * - A live preview above the textarea shows the text as users will see it.
 */
export function SettingsPageClient({ initialGoldenRuleText }: SettingsPageClientProps) {
  return (
    <div className="px-4 md:px-6 pt-6 pb-8 max-w-3xl mx-auto space-y-6">
      {/* Page header */}
      <div className="border-b border-border pb-6">
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Gerencie as configurações do sistema.
        </p>
      </div>

      <GoldenRuleCard initialGoldenRuleText={initialGoldenRuleText} />
    </div>
  )
}
