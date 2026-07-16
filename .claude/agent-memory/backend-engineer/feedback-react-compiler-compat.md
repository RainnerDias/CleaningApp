---
name: feedback-react-compiler-compat
description: React Compiler ESLint rules that affect react-hook-form usage in this project
metadata:
  type: feedback
---

Do NOT use `watch()` from `useForm()` to read reactive form values. React Compiler's `react-hooks/incompatible-library` rule flags it because the returned function cannot be memoized.

**Why:** The project runs React Compiler (ESLint rule `react-hooks/incompatible-library`), which disallows calling non-hook functions that read state outside of the render phase.

**How to apply:** Always use `useWatch({ control, name: '...' })` from react-hook-form instead of `const { watch } = useForm()` and then `watch('field')`.

---

Do NOT call `setState()` synchronously inside a `useEffect` body. The rule `react-hooks/set-state-in-effect` blocks it.

**Why:** Causes cascading renders; React Compiler enforces the effect-as-sync-bridge pattern.

**How to apply:** For resetting dependent state when props change, include all state in the react-hook-form `reset()` call (tracked via the form schema) rather than managing parallel `useState`. Use `setValue` for programmatic field updates.

---

Do NOT use `z.boolean().default(true)` (or `.default()` on any field) in a Zod schema passed to `zodResolver`. This creates an input/output type mismatch that causes a TS error in `useForm<z.infer<schema>>`.

**Why:** `zodResolver` infers the _input_ type (where `.default()` fields are optional), but `useForm<OutputType>` expects the _output_ type (where they're required). The mismatch makes the resolver unassignable.

**How to apply:** Declare booleans as `z.boolean()` (non-optional, no default) and provide defaults exclusively via `useForm({ defaultValues: { ... } })`.
