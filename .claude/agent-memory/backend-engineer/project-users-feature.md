---
name: project-users-feature
description: Users CRUD feature conventions — invite via Supabase Auth, admin client for auth.admin ops, no delete
metadata:
  type: project
---

User management does NOT use a standard CRUD pattern — key differences:

- **No create via DB directly**: user creation goes through `supabase.auth.admin.inviteUserByEmail()`, which sends an invitation email. The DB record is created after with the auth user's id.
- **No delete**: users are never deleted. They are disabled (`active: false`) which also bans them in Supabase Auth via `updateUserById(id, { ban_duration: '876000h' })`. Re-enabling sets `ban_duration: 'none'`.
- **Admin client required**: `src/lib/supabase/admin.ts` uses `SUPABASE_SECRET_KEY` (service role) for `auth.admin` operations. The regular server client uses `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and cannot call admin APIs.

**Why:** Supabase Auth is the source of truth for authentication. The `users` table stays in sync with Supabase Auth — ids must match.

**How to apply:** Any feature touching user creation or deactivation must coordinate both Supabase Auth and the DB. The admin client (`createAdminClient()`) must be used for `auth.admin` calls; the regular `createServerClient()` does not have the service role key.

See also: [[project-stack-versions]]
