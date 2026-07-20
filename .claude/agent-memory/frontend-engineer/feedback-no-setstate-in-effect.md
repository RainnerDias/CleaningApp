---
name: feedback-no-setstate-in-effect
description: Project ESLint rule (react-hooks/set-state-in-effect) bans calling setState synchronously inside a useEffect body — design around it
metadata:
  type: feedback
---

Never call `setState` (any `setX`) directly inside a `useEffect` body. The project enforces the `react-hooks/set-state-in-effect` ESLint rule, which treats this as an error and will fail the pre-commit hook.

**Why:** The rule prevents cascading renders caused by synchronous state updates inside effects. This is a deliberate design constraint in this codebase (noted in TodayClient.tsx comments as well).

**How to apply:**

- Initialise state from props/server-fetched data once via `useState(initialValue)` — not by syncing with a later refetch in an effect.
- If you need derived/computed state from query data, compute it inline during render rather than using an effect to mirror it into local state.
- If external updates must be reflected (e.g. real-time sync), use event-driven patterns (subscriptions, callbacks) rather than effects that call setState.
- An admin who needs to see externally-changed data can simply refresh the page — that is the accepted tradeoff in this project.
