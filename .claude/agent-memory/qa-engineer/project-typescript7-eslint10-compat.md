---
name: project-typescript7-eslint10-compat
description: TypeScript 7 + ESLint v10 compatibility issues in the CleaningApp — known breakages and working workarounds
metadata:
  type: project
---

The CleaningApp uses TypeScript 7.0.2 and ESLint 10.7.0, which creates a compatibility gap with the tooling ecosystem (as of 2026-07-15).

**Known breakages:**

1. `@typescript-eslint/typescript-estree@8.64.0` crashes at module-load time with TypeScript 7.
   - Root cause: TypeScript 7 restructured its package — the main CJS entry (`.`) only exports `{ version, versionMajorMinor }`. The old `ts.Extension` enum is gone from the main entry.
   - Any code that does `require('typescript')` and then accesses `ts.Extension` crashes instantly.
   - This makes `@typescript-eslint/parser`, `typescript-eslint`, and `eslint-config-next` (which transitively imports `typescript-eslint`) all unusable.
   - Peer dep of `typescript-eslint@8.64.0` is `typescript >=4.8.4 <6.1.0`.

2. `next/dist/compiled/babel/eslint-parser` (the parser used internally by `eslint-config-next`) is incompatible with ESLint v10.
   - The Babel parser's `parseForESLint` returns a scope manager without `addGlobals`, which ESLint v10 requires via `SourceCode.finalize()`.
   - Fix: wrap the parser to replace its scope manager with one from `eslint-scope`, which does implement `addGlobals`.

3. `eslint-plugin-react@7.37.5` peer dep caps at `^9.7` (ESLint v10 not listed).
   - `react.version: 'detect'` triggers `context.getFilename()` which fails in ESLint v10 flat config mode.
   - Fix: set `react.version` to the explicit version string (`'19.2.7'`) in settings.

**Working solution (in `eslint.config.js`):**

- Use `next/dist/compiled/babel/eslint-parser` as the AST parser, wrapped to provide an `eslint-scope`-based scope manager.
- Register `@next/eslint-plugin-next`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-import`, `eslint-plugin-jsx-a11y` directly.
- Set `settings.react.version: '19.2.7'` explicitly (not 'detect').
- TypeScript-specific ESLint rules from `next/typescript` cannot be applied — `@typescript-eslint` does not support TypeScript 7.

**How to apply:** When investigating ESLint or TypeScript tooling issues in this project, this root cause applies. Any upgrade path requires either `typescript-eslint` gaining TypeScript 7 support or the project downgrading TypeScript to the `<6.1.0` range.

[[project-stack-typescript7]]
