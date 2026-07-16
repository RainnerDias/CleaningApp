'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Sparkles, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const forgotSchema = z.object({
  email: z.string().email('Email inválido'),
})
type ForgotSchema = z.infer<typeof forgotSchema>

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<ForgotSchema>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
  })

  const { isSubmitting } = form.formState

  const onSubmit = form.handleSubmit(async (data) => {
    setError(null)
    const supabase = createClient()
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${location.origin}/auth/callback?next=/reset-password`,
    })
    if (resetError) {
      setError(resetError.message)
      return
    }
    setSent(true)
  })

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-lg border border-border shadow-sm px-8 py-10 space-y-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Sparkles className="size-6" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">Recuperar senha</h1>
              <p className="text-sm text-muted-foreground">
                Digite seu email para receber o link de recuperação
              </p>
            </div>
          </div>

          {sent ? (
            <div className="flex flex-col items-center gap-4 text-center py-2">
              <CheckCircle2 className="size-10 text-green-500" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">
                Se esse email estiver cadastrado, você receberá um link de recuperação em instantes.
                Verifique também a caixa de spam.
              </p>
              <Link href="/login" className="text-sm font-medium text-primary hover:underline">
                Voltar ao login
              </Link>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                void onSubmit(e)
              }}
              noValidate
              className="space-y-5"
            >
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  aria-invalid={!!form.formState.errors.email}
                  {...form.register('email')}
                />
                {form.formState.errors.email && (
                  <p role="alert" className="text-xs text-destructive">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
                >
                  <AlertCircle className="size-4 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{error}</span>
                </div>
              )}

              <Button type="submit" disabled={isSubmitting} className="w-full" size="lg">
                {isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                {isSubmitting ? 'Enviando…' : 'Enviar link de recuperação'}
              </Button>

              <div className="text-center">
                <Link
                  href="/login"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Voltar ao login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
