# AI Development Framework

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Claude Code](https://img.shields.io/badge/Powered%20by-Claude%20Code-orange.svg)](https://claude.ai/code)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://www.conventionalcommits.org/)

A structured, repeatable AI-assisted software development framework for [Claude Code](https://claude.ai/code). It replaces ad-hoc AI interactions with a governed process: specialized agents, defined workflows, mandatory approval gates, and an engineering constitution that enforces quality at every step.

---

## What It Is

Most teams use AI coding assistants reactively — they ask for code and accept whatever comes back. This framework inverts that model.

Every development request is handled by a **Technical Director** agent that orchestrates a team of specialized subagents through a defined workflow. No implementation begins without a design review. No design is approved without a business discovery phase. No feature ships without QA, documentation, and a code review.

The result is software development that is:

- **Predictable** — every request follows the same process regardless of who is asking.
- **Auditable** — every decision, trade-off, and deliverable is documented.
- **Quality-enforced** — the framework rejects non-compliant deliverables before they reach production.

---

## Repository Structure

```
ai-development-framework/
├── CLAUDE.md                   ← Framework system prompt. Loaded automatically by Claude Code.
├── constitution.md             ← Engineering constitution. Defines all quality rules.
├── README.md                   ← This file.
│
├── .claude/
│   ├── agents/                 ← One file per specialized agent.
│   │   ├── technical-director.md
│   │   ├── product-manager.md
│   │   ├── business-analyst.md
│   │   ├── software-architect.md
│   │   ├── backend-engineer.md
│   │   ├── frontend-engineer.md
│   │   ├── qa-engineer.md
│   │   ├── security-engineer.md
│   │   ├── documentation-writer.md
│   │   ├── code-reviewer.md
│   │   └── devops-engineer.md
│   │
│   ├── workflows/              ← One file per type of work.
│   │   ├── new-feature.md
│   │   ├── bug-fix.md
│   │   ├── refactoring.md
│   │   ├── code-review.md
│   │   ├── security-review.md
│   │   ├── documentation.md
│   │   └── release.md
│   │
│   └── agent-memory/           ← Persistent memory written by agents across sessions.
│       ├── technical-director/
│       └── decisions/          ← Architecture Decision Records (ADRs).
```

### Key Files

| File                     | Purpose                                                                                                                                                                                                 |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CLAUDE.md`              | Loaded automatically by Claude Code. Defines the framework's operating model and governance rules.                                                                                                      |
| `constitution.md`        | Engineering constitution. Concrete, enforceable rules for architecture, code, tests, security, performance, observability, logging, git, CI/CD, versioning, releases, documentation, and anti-patterns. |
| `.claude/agents/*.md`    | Defines each specialized agent's identity, responsibilities, and boundaries.                                                                                                                            |
| `.claude/workflows/*.md` | Defines the mandatory phases, agents, deliverables, and approval gates for each type of work.                                                                                                           |

---

## How to Use

### Prerequisites

- [Claude Code](https://claude.ai/code) — CLI, desktop app, or IDE extension.
- An Anthropic API key with access to Claude Sonnet or above.

### Setup

**1. Clone the framework into your project.**

```bash
git clone https://github.com/your-org/ai-development-framework.git .claude-framework
```

Or copy the framework files directly into your existing repository's root.

**2. Create `PROJECT_CONTEXT.md` at your project root.**

This file tells the Technical Director about your specific project. It overrides framework defaults.

```markdown
# Project Context

## Project Name

My E-Commerce Platform

## Tech Stack

- Backend: Node.js 20, Express 5, PostgreSQL 16, Redis 7
- Frontend: React 18, TypeScript 5, Tailwind CSS 3
- Infrastructure: AWS ECS, RDS, ElastiCache, S3

## Domain

E-commerce platform for B2C sales. Core domains: catalog, cart, orders, payments, fulfillment.

## Team Structure

- 3 backend engineers
- 2 frontend engineers
- 1 QA engineer
- 1 DevOps engineer

## Conventions

- API base path: /api/v1/
- Auth: JWT with RS256, 15-minute access tokens, 7-day refresh tokens
- Database migrations: Flyway
- Testing: Jest for unit tests, Supertest for integration tests
- Frontend testing: React Testing Library

## Domain-Specific Rules

- All payment operations must be idempotent and logged to the audit_log table.
- PII must not leave the EU region. All user data is stored in eu-west-1.
- Orders in PENDING state older than 30 minutes are automatically cancelled.
```

**3. Open your project in Claude Code.**

```bash
cd your-project
claude
```

Claude Code will automatically load `CLAUDE.md` at session start.

**4. Make a request. The Technical Director takes it from there.**

```
> I need a user email verification flow after registration
```

The Technical Director will:

1. Classify the request as a new feature.
2. Load the New Feature workflow.
3. Build an execution plan.
4. Present the plan for your approval.
5. Execute each phase in order, invoking the appropriate specialized agent.
6. Deliver a complete implementation with tests, documentation, and code review.

---

## Available Agents

Agents are invoked by the Technical Director — you never call them directly.

| Agent                | File                                     | Responsibility                                                                                                           |
| -------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Technical Director   | `.claude/agents/technical-director.md`   | Master orchestrator. Entry point for all requests. Builds execution plans, delegates to specialists, enforces standards. |
| Product Manager      | `.claude/agents/product-manager.md`      | Business goals, user stories, acceptance criteria, success metrics.                                                      |
| Business Analyst     | `.claude/agents/business-analyst.md`     | Functional requirements, business rules, edge cases, input validations.                                                  |
| Software Architect   | `.claude/agents/software-architect.md`   | System design, API contracts, database changes, technical decisions, trade-off analysis.                                 |
| Backend Engineer     | `.claude/agents/backend-engineer.md`     | Backend implementation, APIs, business logic, unit tests.                                                                |
| Frontend Engineer    | `.claude/agents/frontend-engineer.md`    | UI implementation, responsive design, accessibility (WCAG 2.1 AA), frontend tests.                                       |
| QA Engineer          | `.claude/agents/qa-engineer.md`          | Test plans, test cases, acceptance criteria validation, regression analysis.                                             |
| Security Engineer    | `.claude/agents/security-engineer.md`    | Security reviews, threat modeling, OWASP Top 10 assessment, hardening recommendations.                                   |
| Documentation Writer | `.claude/agents/documentation-writer.md` | Technical documentation, API docs, user guides, changelog.                                                               |
| Code Reviewer        | `.claude/agents/code-reviewer.md`        | Code quality, SOLID principles, architecture compliance, test quality.                                                   |
| DevOps Engineer      | `.claude/agents/devops-engineer.md`      | CI/CD pipelines, infrastructure, deployments, observability, runbooks.                                                   |

---

## Available Workflows

The Technical Director selects the appropriate workflow automatically based on your request.

| Workflow        | File                                   | Triggers                                                    |
| --------------- | -------------------------------------- | ----------------------------------------------------------- |
| New Feature     | `.claude/workflows/new-feature.md`     | New functionality, new screen, new API endpoint, new module |
| Bug Fix         | `.claude/workflows/bug-fix.md`         | Defects, regressions, production incidents                  |
| Refactoring     | `.claude/workflows/refactoring.md`     | Technical debt, code cleanup, structural improvements       |
| Code Review     | `.claude/workflows/code-review.md`     | Pull request review, architecture validation                |
| Security Review | `.claude/workflows/security-review.md` | Security audit, vulnerability assessment                    |
| Documentation   | `.claude/workflows/documentation.md`   | Documentation creation or update                            |
| Release         | `.claude/workflows/release.md`         | Versioning, changelog, deployment preparation               |

### New Feature Workflow — Phases at a Glance

```
Phase 1: Business Discovery      (Product Manager)
Phase 2: Requirements Analysis   (Business Analyst)
Phase 3: Architecture            (Software Architect)
         ⛔ APPROVAL GATE — no code before user approves
Phase 4: Backend Development     (Backend Engineer)
Phase 5: Frontend Development    (Frontend Engineer) [if UI changes]
Phase 6: Quality Assurance       (QA Engineer)
Phase 7: Security Review         (Security Engineer) [if security triggers]
Phase 8: Documentation           (Documentation Writer)
Phase 9: Code Review             (Code Reviewer)
         ✅ Delivery Summary     (Technical Director)
```

---

## How to Adapt This Framework to a New Project

### Step 1 — Fork or Copy the Framework

```bash
git clone https://github.com/your-org/ai-development-framework.git my-project
cd my-project
git remote set-url origin https://github.com/your-org/my-project.git
```

### Step 2 — Create `PROJECT_CONTEXT.md`

Describe your stack, team, domain, and any project-specific rules. See the example in the [How to Use](#how-to-use) section above.

Project-specific rules in `PROJECT_CONTEXT.md` override framework defaults in `CLAUDE.md` and `constitution.md`.

### Step 3 — Customize Agent Files (Optional)

Agent files in `.claude/agents/` can be extended for your project without replacing them. Add a `## Project-Specific Instructions` section at the bottom of any agent file.

Example extension for the Backend Engineer agent:

```markdown
## Project-Specific Instructions

- All database access must go through the repository pattern defined in `src/repositories/`.
- Prisma is the only ORM used. Raw SQL is allowed in repository classes only.
- All new API routes must be registered in `src/routes/index.ts`.
- Environment variables are loaded through `src/config/env.ts`. Never access `process.env` directly.
```

### Step 4 — Customize the Constitution (Optional)

`constitution.md` defines framework-wide engineering rules. If your project needs stricter or different rules for specific sections, add a `## Project Overrides` section at the bottom of `constitution.md` and declare the overrides there.

### Step 5 — Initialize Agent Memory

The `.claude/agent-memory/` directory is where agents write persistent knowledge across sessions. Create the base directories:

```bash
mkdir -p .claude/agent-memory/technical-director
mkdir -p .claude/agent-memory/decisions
```

---

## Governance Model

### Approval Gates

Approval Gates are mandatory stops in the workflow where the Technical Director presents a consolidated plan and requires explicit human approval before continuing.

The New Feature workflow has one Approval Gate after Phase 3 (Architecture). No code is written before the user approves the User Story, Requirements, and Architecture Proposal.

Skipping an Approval Gate is a framework violation and results in the Technical Director refusing to continue.

### Constitution and CLAUDE.md

The Constitution (`constitution.md`) and `CLAUDE.md` are the two highest-authority documents in the framework.

- `CLAUDE.md` defines _how the framework operates_ — process, agent invocation rules, orchestration protocol.
- `constitution.md` defines _what quality means_ — concrete rules for code, tests, security, performance, and more.

No agent may produce a deliverable that violates either document. The Technical Director is the gatekeeper and will reject non-compliant outputs.

### Agent Memory

Agents write to `.claude/agent-memory/` to persist knowledge across sessions. This includes:

- Architecture decisions and their rationale.
- Project-specific conventions discovered during work.
- Recurring patterns and the execution plans that worked well for them.

This builds institutional knowledge that improves the quality of every subsequent session.

---

## How to Contribute

### Reporting Issues

Open an issue describing: what you expected, what happened, and which agent or workflow was involved.

### Proposing Changes to Agents or Workflows

1. Fork the repository.
2. Create a branch: `feat/<scope>-<description>`.
3. Make your changes. Every agent or workflow change requires a rationale in the PR description.
4. Open a pull request against `main`.
5. PRs that modify `CLAUDE.md` or `constitution.md` require at least two approvals.

### Adding a New Agent

1. Create a new file in `.claude/agents/<agent-name>.md`.
2. Follow the structure of an existing agent file: identity, responsibilities, boundaries, deliverables, memory protocol.
3. Register the new agent in `CLAUDE.md` under the Available Agents table.
4. Update all relevant workflow files to declare when the new agent should be invoked.
5. Update this README's Available Agents table.

### Adding a New Workflow

1. Create a new file in `.claude/workflows/<workflow-name>.md`.
2. Define: purpose, execution model, phases, agents, deliverables, approval gates, and completion criteria.
3. Register the new workflow in `CLAUDE.md` under the Available Workflows table and in the Technical Director's classification table (`.claude/agents/technical-director.md`).
4. Update this README's Available Workflows table.

### Commit Standards

All contributions follow Conventional Commits:

```
feat(agents): add data-engineer agent for pipeline tasks
fix(workflows): correct phase order in bug-fix workflow
docs(constitution): add anti-pattern for N+1 queries
chore(readme): update setup instructions for Claude Code 2.x
```

---

## License

MIT. See [LICENSE](LICENSE).
