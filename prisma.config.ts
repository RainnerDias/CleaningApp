import { defineConfig } from 'prisma/config'
import { readFileSync } from 'fs'
import { join } from 'path'

// ---------------------------------------------------------------------------
// Load .env.local for Prisma CLI
// Prisma CLI only reads `.env` by default; Next.js uses `.env.local`.
// ---------------------------------------------------------------------------
try {
  const envPath = join(process.cwd(), '.env.local')
  const content = readFileSync(envPath, 'utf-8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIndex = trimmed.indexOf('=')
    if (eqIndex === -1) continue
    const key = trimmed.slice(0, eqIndex).trim()
    const raw = trimmed.slice(eqIndex + 1).trim()
    const value = raw.replace(/^["']|["']$/g, '')
    if (!process.env[key]) process.env[key] = value
  }
} catch {
  // .env.local not present — continue with whatever env vars are already set
}

// ---------------------------------------------------------------------------
// Migration URL resolution
//
// Prisma 7 does not support `directUrl` in prisma.config.ts (unlike Prisma 5/6
// which had it in schema.prisma). The `datasource.url` here is used exclusively
// by the Prisma CLI (db push, migrate). The runtime PrismaClient reads
// DATABASE_URL from env directly and is unaffected by this file.
//
// Supabase provides:
//   - Transaction pooler (port 6543, pgbouncer=true): optimised for app queries.
//     Prisma's db push CANNOT use this — pgbouncer transaction mode blocks DDL.
//   - Session pooler (port 5432, same host): supports DDL, works for migrations.
//   - Direct connection (db.{ref}.supabase.co:5432): best for migrations.
//
// Strategy:
//   1. If DIRECT_URL is set in env, use it.
//   2. Else if DATABASE_URL is a transaction pooler URL (port 6543),
//      derive the session-mode URL automatically (same host, port 5432).
//   3. Otherwise use DATABASE_URL as-is.
// ---------------------------------------------------------------------------
function resolveMigrationUrl(dbUrl: string | undefined): string | undefined {
  if (!dbUrl) return undefined

  // Explicit overrides win — check both conventional names
  if (process.env.DIRECT_URL) return process.env.DIRECT_URL
  if (process.env.SESSION_URL) return process.env.SESSION_URL

  try {
    const parsed = new URL(dbUrl)

    // Not a transaction pooler URL — use as-is
    if (parsed.port !== '6543' && !parsed.searchParams.has('pgbouncer')) {
      return dbUrl
    }

    // Switch to session mode: same host, port 5432, no pgbouncer flag.
    // Session mode supports DDL and multi-statement transactions.
    parsed.port = '5432'
    parsed.searchParams.delete('pgbouncer')
    return parsed.toString()
  } catch {
    return dbUrl
  }
}

const migrationUrl = resolveMigrationUrl(process.env.DATABASE_URL)

export default defineConfig({
  datasource: {
    url: migrationUrl,
  },
  migrations: {
    // Prisma 7: seed command lives here, not in package.json
    seed: 'tsx prisma/seed.ts',
  },
})
