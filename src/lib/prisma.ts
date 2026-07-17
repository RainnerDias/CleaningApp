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
// In dev, both the Pool and PrismaClient are stored on globalThis to survive
// Next.js hot-module reloads without leaking connections.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  pgPool: Pool | undefined
}

function createPool(): Pool {
  const connectionString = process.env.SESSION_URL ?? process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('Missing SESSION_URL or DATABASE_URL environment variable')
  }
  return new Pool({ connectionString })
}

// Module-level cache — avoids calling getInstance() on every Proxy property access
let _client: PrismaClient | undefined

function getInstance(): PrismaClient {
  // Fast path: already created this module lifecycle
  if (_client) return _client
  // Dev hot-reload path: reuse the instance that survived the module reload
  if (globalForPrisma.prisma) {
    _client = globalForPrisma.prisma
    return _client
  }
  const pool = globalForPrisma.pgPool ?? createPool()
  const adapter = new PrismaPg(pool)
  _client = new PrismaClient({ adapter })
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.pgPool = pool
    globalForPrisma.prisma = _client
  }
  return _client
}

// Pool is NOT created at import time — deferred to the first DB access.
// This lets Next.js statically import route modules at build time without
// DATABASE_URL / SESSION_URL being present in the build environment.
export const prisma = new Proxy({} as PrismaClient, {
  get(_, prop: string | symbol) {
    return Reflect.get(getInstance(), prop)
  },
})
