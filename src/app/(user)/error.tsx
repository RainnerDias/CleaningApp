'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function UserError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('[user error boundary]', error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="rounded-full bg-destructive/10 p-4">
        <AlertTriangle className="size-8 text-destructive" />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Algo deu errado</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          {error.message ?? 'Ocorreu um erro inesperado. Tente novamente.'}
        </p>
        {error.digest && <p className="text-xs text-muted-foreground/60">ID: {error.digest}</p>}
      </div>
      <Button onClick={reset} variant="outline" size="sm" className="gap-2">
        <RefreshCw className="size-4" />
        Tentar novamente
      </Button>
    </div>
  )
}
