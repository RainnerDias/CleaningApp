import 'server-only'

import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

// Prisma 7 uses a WebAssembly query engine and requires a Driver Adapter.
// PrismaPg wraps a pg.Pool and is passed to the PrismaClient constructor.
//
// SESSION_URL uses the Supabase session-mode pooler (port 5432), which supports
// prepared statements and full SQL semantics — required by PrismaPg.
// DATABASE_URL (transaction pooler, port 6543) is NOT compatible with PrismaPg.
//
// Both the Pool and the PrismaClient are kept as module-level singletons to
// avoid creating new connections on every Next.js hot-module reload in dev.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient
  pgPool: Pool
}

function createPool(): Pool {
  const connectionString = process.env.SESSION_URL ?? process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('Missing SESSION_URL or DATABASE_URL environment variable')
  }
  return new Pool({ connectionString })
}

const pool = globalForPrisma.pgPool ?? createPool()
const adapter = new PrismaPg(pool)

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.pgPool = pool
  globalForPrisma.prisma = prisma
}
