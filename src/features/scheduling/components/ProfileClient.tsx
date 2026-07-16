'use client'

import { useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Loader2, Camera } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UserProfile {
  id: string
  name: string
  email: string
  role: 'admin' | 'user'
  avatarUrl: string | null
}

interface ProfileStats {
  completedThisMonth: number
  completionRate: number
}

interface ProfileClientProps {
  /** Server-fetched authenticated user */
  user: UserProfile
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n.charAt(0).toUpperCase())
    .join('')
}

function roleLabel(role: 'admin' | 'user'): string {
  return role === 'admin' ? 'Administrador' : 'Usuário'
}

// ---------------------------------------------------------------------------
// AvatarSection
// ---------------------------------------------------------------------------

interface AvatarSectionProps {
  user: UserProfile
  onAvatarChange: (url: string) => void
}

function AvatarSection({ user, onAvatarChange }: AvatarSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const MAX_SIZE = 2 * 1024 * 1024 // 2 MB

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting same file
    if (!file) return

    if (file.size > MAX_SIZE) {
      setError('Arquivo muito grande. Máximo permitido: 2 MB.')
      return
    }
    if (!file.type.startsWith('image/')) {
      setError('Selecione um arquivo de imagem válido.')
      return
    }

    // Optimistic preview
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)
    setError(null)
    setUploading(true)

    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/profile/avatar', { method: 'POST', body: form })

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: { message?: string } }
        throw new Error(body.error?.message ?? 'Falha ao enviar foto')
      }

      const data = (await res.json()) as { avatarUrl: string }
      URL.revokeObjectURL(objectUrl)
      setPreviewUrl(null)
      onAvatarChange(data.avatarUrl)
    } catch (err) {
      URL.revokeObjectURL(objectUrl)
      setPreviewUrl(null)
      setError(err instanceof Error ? err.message : 'Falha ao enviar foto')
    } finally {
      setUploading(false)
    }
  }

  const displayUrl = previewUrl ?? user.avatarUrl

  return (
    <section aria-label="Foto de perfil" className="flex flex-col items-center gap-3">
      {/* Avatar circle */}
      <div className="relative">
        <div
          className="size-20 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-border"
          aria-label={displayUrl ? `Foto de ${user.name}` : `Iniciais de ${user.name}`}
        >
          {displayUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={displayUrl}
              alt={`Avatar de ${user.name}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <span
              className="text-xl font-bold text-muted-foreground select-none"
              aria-hidden="true"
            >
              {getInitials(user.name)}
            </span>
          )}
        </div>

        {/* Upload overlay shown while uploading */}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
            <Loader2 className="size-5 animate-spin text-white" aria-hidden="true" />
          </div>
        )}
      </div>

      {/* Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        aria-busy={uploading}
      >
        <Camera className="size-3.5" aria-hidden="true" />
        Alterar foto
      </Button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
        onChange={handleFileSelect}
      />

      {error && (
        <p role="alert" className="text-xs text-destructive text-center">
          {error}
        </p>
      )}
    </section>
  )
}

// ---------------------------------------------------------------------------
// PersonalInfoSection
// ---------------------------------------------------------------------------

interface PersonalInfoSectionProps {
  user: UserProfile
  onNameUpdate: (name: string) => void
}

function PersonalInfoSection({ user, onNameUpdate }: PersonalInfoSectionProps) {
  const [name, setName] = useState(user.name)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('O nome não pode estar vazio.')
      return
    }

    setError(null)
    setSuccess(false)
    setSaving(true)

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      })

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: { message?: string } }
        throw new Error(body.error?.message ?? 'Falha ao salvar')
      }

      onNameUpdate(trimmed)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao salvar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section aria-label="Informações pessoais">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
        Informações pessoais
      </h2>

      <form onSubmit={handleSave} className="space-y-3" noValidate>
        {/* Name */}
        <div className="space-y-1">
          <label htmlFor="profile-name" className="text-xs font-medium">
            Nome
          </label>
          <Input
            id="profile-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={255}
            autoComplete="name"
            aria-required="true"
          />
        </div>

        {/* Email (read-only) */}
        <div className="space-y-1">
          <label htmlFor="profile-email" className="text-xs font-medium">
            E-mail
          </label>
          <Input
            id="profile-email"
            type="email"
            value={user.email}
            readOnly
            disabled
            className="opacity-60 cursor-not-allowed"
            aria-readonly="true"
          />
          <p className="text-xs text-muted-foreground">O e-mail não pode ser alterado.</p>
        </div>

        {/* Role (read-only) */}
        <div className="space-y-1">
          <p className="text-xs font-medium">Perfil de acesso</p>
          <span className="inline-flex items-center rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium">
            {roleLabel(user.role)}
          </span>
        </div>

        {/* Feedback */}
        {error && (
          <p role="alert" className="text-xs text-destructive">
            {error}
          </p>
        )}
        {success && (
          <p role="status" className="text-xs text-green-600 dark:text-green-400">
            Alterações salvas com sucesso.
          </p>
        )}

        <Button type="submit" size="sm" disabled={saving} aria-busy={saving}>
          {saving && <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />}
          Salvar alterações
        </Button>
      </form>
    </section>
  )
}

// ---------------------------------------------------------------------------
// PasswordSection
// ---------------------------------------------------------------------------

function PasswordSection() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (newPassword.length < 8) {
      setError('A senha deve ter no mínimo 8 caracteres.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }

    setSaving(true)

    try {
      const res = await fetch('/api/profile/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword, confirmPassword }),
      })

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: { message?: string } }
        throw new Error(body.error?.message ?? 'Falha ao alterar senha')
      }

      setNewPassword('')
      setConfirmPassword('')
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao alterar senha')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section aria-label="Alterar senha">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
        Alterar senha
      </h2>

      <form onSubmit={handleSubmit} className="space-y-3" noValidate>
        {/* New password */}
        <div className="space-y-1">
          <label htmlFor="profile-new-password" className="text-xs font-medium">
            Nova senha
          </label>
          <Input
            id="profile-new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={8}
            autoComplete="new-password"
            aria-required="true"
            aria-describedby="profile-password-hint"
          />
          <p id="profile-password-hint" className="text-xs text-muted-foreground">
            Mínimo 8 caracteres.
          </p>
        </div>

        {/* Confirm password */}
        <div className="space-y-1">
          <label htmlFor="profile-confirm-password" className="text-xs font-medium">
            Confirmar senha
          </label>
          <Input
            id="profile-confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            minLength={8}
            autoComplete="new-password"
            aria-required="true"
          />
        </div>

        {/* Feedback */}
        {error && (
          <p role="alert" className="text-xs text-destructive">
            {error}
          </p>
        )}
        {success && (
          <p role="status" className="text-xs text-green-600 dark:text-green-400">
            Senha alterada com sucesso.
          </p>
        )}

        <Button type="submit" size="sm" disabled={saving} aria-busy={saving}>
          {saving && <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />}
          Alterar senha
        </Button>
      </form>
    </section>
  )
}

// ---------------------------------------------------------------------------
// StatsSection
// ---------------------------------------------------------------------------

function StatsSection() {
  const {
    data: stats,
    isLoading,
    isError,
  } = useQuery<ProfileStats>({
    queryKey: ['profile', 'stats'],
    queryFn: async () => {
      const res = await fetch('/api/profile/stats')
      if (!res.ok) throw new Error('Falha ao carregar estatísticas')
      return res.json() as Promise<ProfileStats>
    },
    staleTime: 60_000,
  })

  return (
    <section
      aria-label="Estatísticas do mês"
      className="rounded-xl border border-border bg-card p-4 space-y-2"
    >
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Estatísticas do mês
      </h2>

      {isLoading && (
        <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
          Carregando...
        </p>
      )}

      {isError && (
        <p className="text-sm text-destructive" role="alert">
          Não foi possível carregar as estatísticas.
        </p>
      )}

      {stats && (
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Tarefas concluídas este mês</dt>
            <dd className="font-bold text-green-600 dark:text-green-400">
              {stats.completedThisMonth}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Taxa de conclusão</dt>
            <dd className="font-bold">{stats.completionRate.toFixed(0)}%</dd>
          </div>
        </dl>
      )}
    </section>
  )
}

// ---------------------------------------------------------------------------
// ProfileClient — main export
// ---------------------------------------------------------------------------

/**
 * User-facing profile page.
 *
 * Sections:
 * 1. Avatar — upload, preview, 2 MB limit
 * 2. Personal info — editable name, read-only email + role
 * 3. Change password — new password + confirm
 * 4. Stats — this month's completed tasks + completion rate
 */
export function ProfileClient({ user: serverUser }: ProfileClientProps) {
  // Maintain local mutable state that mirrors the server user but can be
  // updated optimistically (e.g. after a successful name/avatar save).
  // The server component only renders once on page load, so initialising from
  // props is sufficient — no sync effect is needed.
  const [user, setUser] = useState<UserProfile>(serverUser)

  function handleAvatarChange(avatarUrl: string) {
    setUser((u) => ({ ...u, avatarUrl }))
  }

  function handleNameUpdate(name: string) {
    setUser((u) => ({ ...u, name }))
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* ── Header ── */}
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-bold tracking-tight">Perfil</h1>
      </div>

      <div className="px-4 space-y-6 max-w-lg mx-auto">
        {/* Avatar */}
        <AvatarSection user={user} onAvatarChange={handleAvatarChange} />

        {/* Divider */}
        <div className={cn('h-px bg-border')} aria-hidden="true" />

        {/* Personal info */}
        <PersonalInfoSection user={user} onNameUpdate={handleNameUpdate} />

        {/* Divider */}
        <div className="h-px bg-border" aria-hidden="true" />

        {/* Change password */}
        <PasswordSection />

        {/* Divider */}
        <div className="h-px bg-border" aria-hidden="true" />

        {/* Stats */}
        <StatsSection />
      </div>
    </div>
  )
}
