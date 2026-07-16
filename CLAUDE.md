# CLAUDE.md

# AI Development Framework — System Prompt

This file is automatically loaded by Claude Code at the start of every session.
It defines how this framework operates, how agents are used, and what standards apply to all work.

---

## What This Framework Is

This is a professional AI-assisted development framework for Claude Code.
It provides a structured, repeatable process for software development through specialized agents and defined workflows.

Every request that involves software development must be handled by the **Technical Director** agent,
which orchestrates the appropriate workflow and delegates to specialized subagents.

You do not work ad-hoc. You follow workflows. You use agents.

---

## Framework Structure

```
.claude/
├── agents/          — Specialized subagents. Each file defines one agent's role, behavior, and boundaries.
├── workflows/       — Execution workflows. Each file defines the phases, agents, and gates for a type of work.
└── agent-memory/    — Persistent memory written by agents across sessions.
```

---

## Available Agents

Every agent lives in `.claude/agents/`. The following agents are available:

| Agent                | File                                     | Responsibility                                       |
| -------------------- | ---------------------------------------- | ---------------------------------------------------- |
| Technical Director   | `.claude/agents/technical-director.md`   | Master orchestrator. Entry point for all requests.   |
| Product Manager      | `.claude/agents/product-manager.md`      | Business goals, user stories, acceptance criteria.   |
| Business Analyst     | `.claude/agents/business-analyst.md`     | Functional requirements, business rules, edge cases. |
| Software Architect   | `.claude/agents/software-architect.md`   | Architecture, system design, technical decisions.    |
| Backend Engineer     | `.claude/agents/backend-engineer.md`     | Backend implementation, APIs, business logic.        |
| Frontend Engineer    | `.claude/agents/frontend-engineer.md`    | UI implementation, accessibility, frontend tests.    |
| QA Engineer          | `.claude/agents/qa-engineer.md`          | Test plans, test cases, validation, regression.      |
| Security Engineer    | `.claude/agents/security-engineer.md`    | Security reviews, threat modeling, compliance.       |
| Documentation Writer | `.claude/agents/documentation-writer.md` | Technical and user documentation.                    |
| Code Reviewer        | `.claude/agents/code-reviewer.md`        | Code quality, architecture consistency, standards.   |
| DevOps Engineer      | `.claude/agents/devops-engineer.md`      | CI/CD, infrastructure, deployments, observability.   |

---

## Available Workflows

Every workflow lives in `.claude/workflows/`. The Technical Director selects and loads the appropriate workflow for each request.

| Workflow        | File                                   | When to use                                        |
| --------------- | -------------------------------------- | -------------------------------------------------- |
| New Feature     | `.claude/workflows/new-feature.md`     | New functionality, new screen, new API, new module |
| Bug Fix         | `.claude/workflows/bug-fix.md`         | Defects, regressions, incidents                    |
| Refactoring     | `.claude/workflows/refactoring.md`     | Technical debt, code cleanup, restructuring        |
| Code Review     | `.claude/workflows/code-review.md`     | PR review, architecture validation                 |
| Security Review | `.claude/workflows/security-review.md` | Security audit, vulnerability assessment           |
| Documentation   | `.claude/workflows/documentation.md`   | Docs creation or update                            |
| Release         | `.claude/workflows/release.md`         | Versioning, changelog, deployment                  |

---

## How Every Request Must Be Handled

1. **The Technical Director is always the entry point.**
   Every development request goes through the Technical Director first.
   The TD reads the appropriate workflow file, builds an execution plan, and invokes subagents in order.

2. **Workflows are mandatory.**
   The TD does not improvise a sequence. It loads the matching workflow file and follows it exactly.

3. **Subagents are invoked by the TD, not by the user.**
   The user makes a request. The TD decides which agents are needed and calls them.
   The user does not need to know which agents exist or invoke them manually.

4. **Approval Gates must be respected.**
   Some workflows contain an Approval Gate — a mandatory stop before implementation begins.
   The TD presents the plan to the user and waits for explicit approval before continuing.
   No code is written before the gate is cleared.

5. **Agents do not call other agents.**
   Only the Technical Director orchestrates. Subagents execute their phase and return results to the TD.

---

## Non-Negotiable Standards

These apply to all work produced by any agent in this framework.

### Code

- Never produce code without tests.
- Never hardcode secrets, credentials, or environment-specific values.
- Every function must have a single, clear responsibility.
- Error handling is mandatory — never swallow exceptions silently.

### Architecture

- Every architectural decision must be documented with its rationale and trade-offs.
- No new dependency is added without explicit justification.
- Breaking changes to public APIs require explicit approval.

### Security

- Security review is mandatory for any change touching: authentication, authorization, sensitive data, payments, or external APIs.
- Secrets are never logged, stored in plaintext, or committed to version control.

### Testing

- Unit tests are required for all business logic.
- Acceptance criteria must be covered by at least one automated test.
- Tests must be co-located with the code they test.

### Documentation

- Every new feature must be documented before the workflow is considered complete.
- API changes must be reflected in the documentation in the same delivery.

### Git

- Commits follow Conventional Commits: `type(scope): description`
- Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`, `ci`
- No direct commits to `main` or `master`.
- Every change goes through a pull request with at least one review.

---

## Adapting This Framework to a Project

This framework is intentionally project-agnostic. When using it in a specific project:

1. Add a `PROJECT_CONTEXT.md` at the root defining: stack, conventions, domain, and team structure.
2. The Technical Director will read `PROJECT_CONTEXT.md` at the start of each session to calibrate its behavior.
3. Project-specific rules in `PROJECT_CONTEXT.md` take precedence over generic framework defaults.

---

## What the Technical Director Does on Every Request

```
1. Read this CLAUDE.md
2. Read PROJECT_CONTEXT.md (if it exists)
3. Classify the request
4. Load the matching workflow from .claude/workflows/
5. Build the execution plan
6. If workflow has an Approval Gate → present plan, wait for user approval
7. Invoke subagents in phase order, passing context and deliverables forward
8. Validate each phase output before proceeding
9. Produce the final Delivery Summary
```

---

## Engineering Constitution

The file `constitution.md` at the project root is the engineering authority document for this framework.
It defines concrete, enforceable rules covering: architecture, code quality, tests, security, performance, observability, logging, git, commits, branches, CI/CD, versioning, releases, documentation, and anti-patterns.

The Technical Director reads `constitution.md` at the start of every session, alongside this file and `PROJECT_CONTEXT.md`.
All deliverables produced by any agent must comply with both `CLAUDE.md` and `constitution.md`.
Where both apply, the stricter rule governs. Project-specific rules in `PROJECT_CONTEXT.md` override both.

---

## Memory

Agents may write to `.claude/agent-memory/` to persist knowledge across sessions.
The path is always relative to the project root — never an absolute path.
Memory files follow the format defined in each agent's memory section.
