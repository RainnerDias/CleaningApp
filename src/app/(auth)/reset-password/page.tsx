'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Sparkles, Loader2, AlertCircle } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const resetSchema = z
  .object({
    password: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres'),
    confirmPassword: z.string().min(1, 'Confirme a senha'),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })
type ResetSchema = z.infer<typeof resetSchema>

export default function ResetPasswordPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const form = useForm<ResetSchema>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  const { isSubmitting } = form.formState

  const onSubmit = form.handleSubmit(async (data) => {
    setError(null)
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({
      password: data.password,
    })
    if (updateError) {
      setError(updateError.message)
      return
    }
    router.push('/today')
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
              <h1 className="text-2xl font-semibold tracking-tight">Nova senha</h1>
              <p className="text-sm text-muted-foreground">Escolha uma nova senha para sua conta</p>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              void onSubmit(e)
            }}
            noValidate
            className="space-y-5"
          >
            <div className="space-y-1.5">
              <Label htmlFor="password">Nova senha</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                aria-invalid={!!form.formState.errors.password}
                {...form.register('password')}
              />
              {form.formState.errors.password && (
                <p role="alert" className="text-xs text-destructive">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirmar senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                aria-invalid={!!form.formState.errors.confirmPassword}
                {...form.register('confirmPassword')}
              />
              {form.formState.errors.confirmPassword && (
                <p role="alert" className="text-xs text-destructive">
                  {form.formState.errors.confirmPassword.message}
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
              {isSubmitting ? 'Salvando…' : 'Salvar nova senha'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
