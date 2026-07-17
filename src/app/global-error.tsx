'use client'

import { useEffect } from 'react'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error('[global error boundary]', error)
  }, [error])

  return (
    <html lang="pt-BR">
      <body
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          fontFamily: 'system-ui, sans-serif',
          textAlign: 'center',
          gap: '1rem',
          padding: '1rem',
        }}
      >
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Algo deu errado</h2>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', maxWidth: '32rem' }}>
          {error.message ?? 'Ocorreu um erro inesperado.'}
        </p>
        {error.digest && (
          <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>ID: {error.digest}</p>
        )}
        <button
          onClick={reset}
          style={{
            padding: '0.5rem 1rem',
            border: '1px solid #d1d5db',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            fontSize: '0.875rem',
          }}
        >
          Tentar novamente
        </button>
      </body>
    </html>
  )
}
