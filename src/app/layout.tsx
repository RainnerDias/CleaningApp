import type { Metadata } from 'next'
import { QueryProvider } from '@/providers/query-provider'
import './globals.css'

export const metadata: Metadata = {
  title: 'CleaningApp',
  description: 'Cleaning service management application',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  )
}
