'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Sparkles, Loader2, AlertCircle } from 'lucide-react'

import { useAuth } from '@/features/auth/hooks/useAuth'
import { loginSchema, type LoginSchema } from '@/features/auth/validators'
import type { AuthUser } from '@/features/auth/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const { signIn } = useAuth()
  const router = useRouter()
  const [authError, setAuthError] = useState<string | null>(null)

  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const { isSubmitting } = form.formState

  const onSubmit = form.handleSubmit(async (data) => {
    setAuthError(null)

    const { error } = await signIn(data.email, data.password)

    if (error) {
      setAuthError(error.message)
      return
    }

    // Determine redirect destination based on user role
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const user = (await response.json()) as AuthUser
        router.push(user.role === 'admin' ? '/dashboard' : '/today')
      } else {
        router.push('/today')
      }
    } catch {
      router.push('/today')
    }
  })

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-lg border border-border shadow-sm px-8 py-10 space-y-8">
          {/* ── Logo & heading ─────────────────────────────────────────── */}
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Sparkles className="size-6" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">Casa Limpa</h1>
              <p className="text-sm text-muted-foreground">Gerencie sua limpeza com inteligência</p>
            </div>
          </div>

          {/* ── Form ───────────────────────────────────────────────────── */}
          <form
            onSubmit={(e) => {
              void onSubmit(e)
            }}
            noValidate
            aria-label="Login form"
            className="space-y-5"
          >
            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                aria-invalid={!!form.formState.errors.email}
                aria-describedby={form.formState.errors.email ? 'email-error' : undefined}
                {...form.register('email')}
              />
              {form.formState.errors.email && (
                <p id="email-error" role="alert" className="text-xs text-destructive">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                aria-invalid={!!form.formState.errors.password}
                aria-describedby={form.formState.errors.password ? 'password-error' : undefined}
                {...form.register('password')}
              />
              {form.formState.errors.password && (
                <p id="password-error" role="alert" className="text-xs text-destructive">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            {/* Auth error banner */}
            {authError && (
              <div
                role="alert"
                aria-live="polite"
                className="flex items-start gap-2.5 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
              >
                <AlertCircle className="size-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{authError}</span>
              </div>
            )}

            {/* Submit */}
            <Button type="submit" disabled={isSubmitting} className="w-full" size="lg">
              {isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
