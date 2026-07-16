# Contributing to Casa Limpa

Thank you for contributing to Casa Limpa. This document explains how to set up a local development environment, what conventions to follow, and what is required before opening a pull request.

---

## Project overview

Casa Limpa is a mobile-first household cleaning management web app built with Next.js, React 19, Supabase, and Prisma 7. The codebase follows Clean Architecture with feature-based folder organization.

See [ARCHITECTURE.md](ARCHITECTURE.md) for a detailed description of the system design, and [README.md](README.md) for a quick-start guide.

---

## Development setup

Follow these steps to get the app running locally:

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-org/casa-limpa.git
   cd casa-limpa
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   ```bash
   cp .env.local.example .env.local
   ```

   Fill in all required variables. See the table in [README.md](README.md#local-development) for a description of each one.

4. **Run database migrations**

   ```bash
   npx prisma migrate deploy
   ```

5. **Seed the database**

   ```bash
   npx prisma db seed
   ```

6. **Apply Row-Level Security policies**
   Open the Supabase SQL editor and run `supabase/rls-policies.sql`.

7. **Create Supabase Storage buckets**
   Create `avatars` and `task-photos` buckets in the Supabase dashboard, both with authenticated-user-only access.

8. **Start the development server**
   ```bash
   npm run dev
   ```

---

## Branch naming

All branches follow the pattern `type/short-description`. Use the same types as Conventional Commits:

| Type        | When to use                                |
| ----------- | ------------------------------------------ |
| `feat/`     | New feature or user-facing functionality   |
| `fix/`      | Bug fix                                    |
| `refactor/` | Code restructuring without behavior change |
| `docs/`     | Documentation changes only                 |
| `chore/`    | Tooling, configuration, dependencies       |

Examples:

```
feat/weekly-summary-email
fix/schedule-generation-duplicate-entries
refactor/task-repository-query-optimization
docs/api-photo-endpoint
chore/upgrade-prisma-7-8
```

---

## Commit convention

All commits follow [Conventional Commits](https://www.conventionalcommits.org/) format:

```
type(scope): description
```

**Types:** `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`, `ci`

**Scope:** the feature folder name or the area affected (e.g., `scheduling`, `auth`, `reports`, `ui`)

**Description:** written in present tense, lowercase, no period at the end

Examples:

```
feat(scheduling): add biweekly frequency support
fix(auth): redirect to login when session expires mid-session
test(tasks): add Vitest coverage for task deletion edge cases
docs(api): document photo upload endpoint request shape
chore(deps): upgrade @prisma/adapter-pg to 7.8
```

Commits that modify `CLAUDE.md` or `constitution.md` require a clear rationale in the commit body.

---

## Pull request checklist

Before opening a PR, confirm all of the following:

- [ ] **Tests pass:** `npm test` exits with zero failures
- [ ] **E2E tests pass:** `npx playwright test` exits with zero failures
- [ ] **Type check passes:** `npm run type-check` exits with no errors
- [ ] **Lint passes:** `npm run lint` exits with zero warnings
- [ ] **The PR description explains WHY** — not just what changed, but why the change is needed and how it solves the problem
- [ ] **New features include tests** — business logic must have unit tests; user-facing flows must have at least one Playwright test
- [ ] **API changes are reflected in `docs/API.md`**
- [ ] **No secrets or credentials are committed** — check for any `.env` file accidentally staged

---

## Code standards

### General

- No comments that describe _what_ the code does — only comments that explain _why_ when the reason is non-obvious.
- No hardcoded secrets, connection strings, or environment-specific values anywhere in source code.
- Error handling is mandatory in every API route handler. Never swallow exceptions silently.
- All API boundaries must validate input with a Zod schema before passing data to services.

### API routes

Every API route must:

1. Call `getCurrentUser()` and return `401` if no session exists.
2. Parse the request body or query params with a Zod schema.
3. Check the caller's role and return `403` if the operation requires admin access.
4. Return the response in the standard envelope: `{ "data": ... }` or `{ "error": "..." }`.

### Services and repositories

- Services contain business logic only. They call repositories for data access.
- Repositories contain Prisma queries only. They do not contain business rules.
- Neither services nor repositories import Next.js-specific APIs (`NextRequest`, `NextResponse`, `cookies`, etc.).

### Frontend components

- Client Components are marked with `'use client'` at the top of the file.
- Server Components do not import from `'use client'` files.
- All form submissions go through React Hook Form with a Zod resolver.
- TanStack Query mutations must invalidate the relevant query cache keys after success.

---

## Adding a new feature

When adding a new feature, follow this structure:

1. **Create a feature directory** under `src/features/<feature-name>/`:
   - `types.ts` — TypeScript types and Zod schemas for this feature
   - `repository.ts` — Prisma queries, imported as `server-only`
   - `service.ts` — Business logic, calls the repository, imported as `server-only`
   - `hooks.ts` — TanStack Query hooks for use in Client Components
   - `store.ts` — Zustand store slice if local UI state is needed

2. **Create API routes** under `src/app/api/<feature-name>/`:
   - One `route.ts` file per resource or sub-resource
   - Import the service, not the repository directly

3. **Create page components** under `src/app/(admin)/<feature-name>/` or `src/app/(user)/<feature-name>/`

4. **Write unit tests** alongside the feature files (e.g., `service.test.ts`)

5. **Write a Playwright test** in `tests/e2e/<feature-name>.spec.ts` covering at least the happy path

6. **Update `docs/API.md`** with the new endpoint documentation

---

## Playwright end-to-end tests

Playwright tests live in `tests/e2e/`. They use `page.route()` to intercept API calls and return mock responses, so they do not require a live backend or a seeded database.

Run the full suite:

```bash
npx playwright test
```

Run a specific file:

```bash
npx playwright test tests/e2e/scheduling.spec.ts
```

Open the interactive UI:

```bash
npx playwright test --ui
```

When writing a new e2e test, mock every `fetch` or API call that the UI makes using `page.route()`. Do not rely on a real database connection.

---

## Questions

Open an issue with the `question` label and describe what you are trying to understand or accomplish.
