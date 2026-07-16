# Contributing

Thank you for your interest in contributing to the AI Development Framework.

## What This Is

This is a Claude Code AI-assisted development framework — a collection of agent definitions, workflow files, and engineering standards. Contributions improve how agents reason, how workflows are structured, and how quality is enforced.

## Before You Start

- Read [CLAUDE.md](CLAUDE.md) — the framework's operating model.
- Read [constitution.md](constitution.md) — the engineering standards that govern all contributions.
- All work follows Conventional Commits and requires a pull request.

## Contribution Types

| Type                 | What it is                                                                    |
| -------------------- | ----------------------------------------------------------------------------- |
| Agent improvement    | Refining an agent's objectives, deliverables, or self-check                   |
| Workflow improvement | Adding a phase, fixing a gate, improving deliverable definitions              |
| New workflow         | Proposing a new workflow type for a gap not yet covered                       |
| Constitution rule    | Adding or refining an engineering standard                                    |
| Bug                  | A workflow or agent produces incorrect, incomplete, or contradictory guidance |
| Documentation        | Improving README, this file, or other documentation                           |

## How to Contribute

### 1. Open an Issue First

For anything beyond a minor fix, open an issue before writing code. Describe:

- What is wrong or missing
- Why it matters
- What your proposed change looks like

### 2. Fork and Branch

```
git checkout -b feat/improve-qa-engineer-deliverables
```

Branch naming follows `type/short-description` using Conventional Commit types: `feat`, `fix`, `refactor`, `docs`, `chore`.

### 3. Make Your Changes

Follow the standards in [constitution.md](constitution.md):

- Agents must be internally consistent: objectives, deliverables, and self-checks must align.
- Workflows must be consistent with the agents they invoke: deliverable names, severity scales, and verdict labels must match.
- Paths must always be relative to the project root — never absolute.
- No placeholders or TODOs in final content.

### 4. Commit with Conventional Commits

```
feat(qa-engineer): add regression checklist to mandatory deliverables

Aligns qa-engineer.md output structure with the requirements in new-feature.md Phase 6.
```

Format: `type(scope): description`

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`, `ci`

### 5. Open a Pull Request

- Title: same format as your commit message.
- Description: explain the problem, your solution, and why it's the right approach.
- All PRs require at least one review before merging.
- No direct commits to `main`.

## Consistency Requirements

The most common contribution mistakes are consistency gaps. Before submitting, verify:

- **Agent ↔ Workflow alignment**: If you change a deliverable name in an agent file, update every workflow that references it.
- **Severity scales**: All findings use CRITICAL / HIGH / MEDIUM / LOW / INFO.
- **Verdict labels**: Code reviews use APPROVE / APPROVE WITH COMMENTS / REQUEST CHANGES / REJECT.
- **Paths**: All file paths are relative (`./claude/agents/...`), never absolute.
- **Self-checks**: The number in an agent's self-check ("All N mandatory output sections") must match the actual output structure count.

## Questions

Open an issue with the label `question`.
