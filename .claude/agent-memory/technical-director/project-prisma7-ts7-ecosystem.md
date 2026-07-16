---
name: prisma7-ts7-ecosystem-notes
description: Prisma 7 and TypeScript 7 breaking changes encountered during initial scaffold — critical for future database and lint work
metadata:
  type: project
---

The initial scaffold (2026-07-16) hit two major ecosystem breaking changes:

**Prisma 7 breaking change:** The `url = env("DATABASE_URL")` property no longer goes in `prisma/schema.prisma`. It now belongs in `prisma.config.ts` using `defineConfig({ datasource: { url: process.env.DATABASE_URL } })`. The datasource block in schema.prisma should have only `provider = "postgresql"`. The `PrismaClient()` constructor no longer accepts a `datasourceUrl` argument — it reads from `prisma.config.ts` automatically.

**Why:** Prisma 7 restructured its configuration model. The old schema-embedded URL approach is deprecated/removed.

**How to apply:** Any future work adding Prisma models or migrations: do not add `url` to schema.prisma. Keep it in prisma.config.ts. When the Code Reviewer flags this as a "missing url field" finding, it is a false positive.

---

**TypeScript 7 / ESLint 10 incompatibility:** `eslint-config-next` and `@typescript-eslint` crash at import time with TypeScript 7 because `ts.Extension` is no longer exported from the TS7 CJS entry. The workaround is a custom flat ESLint config (`eslint.config.js`) using `next/dist/compiled/babel/eslint-parser` for AST + `eslint-scope` for scope management, with all Next.js/React/Hooks rules applied manually via their individual plugins.

**Why:** TypeScript 7 restructured its package layout (now ESM-only). The `typescript-eslint` ecosystem caps at `typescript <6.1.0` as of the scaffold date.

**How to apply:** Do not attempt to reinstall `eslint-config-next` directly or use `.eslintrc.*` format — it will fail. The custom `eslint.config.js` is the working solution. When adding new lint rules, add them to this file following the existing pattern.

---

**Installed versions (July 2026):** Next.js 16, TypeScript 7, Prisma 7, ESLint 10, React 19, Vitest 4, Playwright 1.61. All higher than the original spec (Next.js 15, TypeScript 5, etc.) due to `@latest` resolving newer versions.
