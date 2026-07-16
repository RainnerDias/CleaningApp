---
name: project-stack-versions
description: Actual installed package versions and breaking changes discovered during scaffold + Phase 1.2 (July 2026)
metadata:
  type: project
---

Installed versions are newer than the stack specification (Next.js 15, TypeScript 5) — by July 2026 the latest versions are: Next.js 16, TypeScript 7, Prisma 7, Vitest 4, ESLint 10.

## Prisma 7 Breaking Changes

**1. Connection URL configuration moved to prisma.config.ts**
The `url` property in `prisma/schema.prisma` datasource block is no longer valid. Connection URLs must be defined in `prisma.config.ts` using `defineConfig({ datasource: { url: ... } })`. The CLI reads this file; the runtime client does NOT.

**2. No `directUrl` in prisma.config.ts**
Prisma 7's `Datasource` type only supports `url` and `shadowDatabaseUrl`. There is NO `directUrl` property (unlike Prisma 5/6 schema.prisma). For migrations that need a direct connection, set the `url` in `prisma.config.ts` to the direct/session-mode URL.

**3. PrismaClient requires a Driver Adapter (mandatory)**
Prisma 7 uses a WebAssembly query engine ("client" engine type). `new PrismaClient()` throws at runtime; `new PrismaClient({})` also throws: "Using engine type 'client' requires either 'adapter' or 'accelerateUrl' to be provided." The libquery binary engine fallback is gone. You MUST use either `adapter` (e.g., `@prisma/adapter-pg`) or `accelerateUrl` (Prisma Accelerate).

**4. `datasourceUrl` removed from PrismaClient constructor**
`new PrismaClient({ datasourceUrl: '...' })` throws "Unknown property datasourceUrl". Connection URLs are no longer accepted in the constructor.

**5. Seed command moved from package.json to prisma.config.ts**
`package.json → prisma → seed` is no longer used. Instead: `migrations.seed` in `prisma.config.ts`.

**6. Prisma CLI does NOT load .env.local**
Prisma CLI only reads `.env`, not `.env.local` (Next.js convention). Fix: manually load `.env.local` at the top of `prisma.config.ts` using `readFileSync`.

## Supabase Pooler Compatibility

Supabase provides two pooler modes (same host, different ports):

- Port **6543** — Transaction mode (pgbouncer=true): For app queries. Prisma CLI `db push` CANNOT use this — it blocks DDL.
- Port **5432** — Session mode: Supports DDL and prepared statements. Use for migrations AND for `@prisma/adapter-pg` at runtime.

The `DATABASE_URL` env var (port 6543) is preserved as the base URL in `.env.local`. `prisma.config.ts` automatically derives the session-mode URL (port 5432) for CLI operations. `SESSION_URL` (port 5432, no pgbouncer flag) is added to `.env.local` for the runtime `PrismaPg` adapter.

## Solution Pattern (prisma.config.ts + src/lib/prisma.ts)

```typescript
// prisma.config.ts — CLI-only, derives session URL for migrations
export default defineConfig({
  datasource: { url: resolveMigrationUrl(process.env.DATABASE_URL) },
  migrations: { seed: 'tsx prisma/seed.ts' },
})

// src/lib/prisma.ts — runtime client uses PrismaPg adapter
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
const pool = new Pool({ connectionString: process.env.SESSION_URL })
const adapter = new PrismaPg(pool)
export const prisma = new PrismaClient({ adapter })
```

Packages added: `pg`, `@prisma/adapter-pg`, `@types/pg`, `tsx`.

**Why:** Discovered during Phase 1.2 on 2026-07-16. Prisma 7 is a significant architectural shift that required resolving 6 separate breaking changes before db push and seed worked.

**How to apply:** Any new `PrismaClient` instantiation MUST use `new PrismaClient({ adapter })`. Any new Prisma CLI operation needs `prisma.config.ts` to have the correct session-mode URL.

[[shadcn-tailwind-v4-quirks]]

## Phase 2.1 Additions (2026-07-16)

### @base-ui/react Dialog/AlertDialog type imports

Correct import pattern for @base-ui/react v1.6.0 dialog types:

```typescript
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import type {
  DialogPopupProps,
  DialogTitleProps,
  DialogDescriptionProps,
} from '@base-ui/react/dialog'
```

Types are exported from the ROOT module (`@base-ui/react/dialog`), not from the `Dialog` namespace. `DialogPrimitive.PopupProps` does NOT exist — the correct name is `DialogPopupProps`.

For AlertDialog: import `AlertDialogPopupProps`, `AlertDialogTitleProps`, `AlertDialogDescriptionProps` from `@base-ui/react/alert-dialog`.

### jsdom missing from devDependencies

The vitest.config.ts specified `environment: 'jsdom'` but `jsdom` was not installed. It was added via `npm install --save-dev jsdom`. Pure schema/logic tests should use `// @vitest-environment node` annotation to skip jsdom initialization.
