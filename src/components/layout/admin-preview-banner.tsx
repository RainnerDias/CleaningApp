'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, ArrowLeft } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface PreviewUser {
  id: string
  name: string
}

interface AdminPreviewBannerProps {
  users: PreviewUser[]
}

export function AdminPreviewBanner({ users }: AdminPreviewBannerProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentViewAsId = searchParams.get('viewAs') ?? undefined

  function handleUserChange(userId: string | null) {
    if (!userId) return
    router.push(`/today?viewAs=${userId}`)
  }

  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-2 px-4 py-1.5 bg-info/10 border-b border-info/20 text-xs font-medium text-info"
    >
      <Eye className="size-3 shrink-0" aria-hidden="true" />
      <span className="shrink-0">Modo visualização</span>

      <Select value={currentViewAsId} onValueChange={handleUserChange}>
        <SelectTrigger className="h-6 text-xs w-40 border-info/30 bg-transparent text-info focus:ring-info/30">
          <SelectValue placeholder="Selecionar usuário" />
        </SelectTrigger>
        <SelectContent>
          {users.map((u) => (
            <SelectItem key={u.id} value={u.id}>
              {u.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Link
        href="/dashboard"
        className="ml-auto flex items-center gap-1 shrink-0 underline underline-offset-2 hover:opacity-70 transition-opacity"
      >
        <ArrowLeft className="size-3" aria-hidden="true" />
        Voltar para Admin
      </Link>
    </div>
  )
}
