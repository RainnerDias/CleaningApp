# Workflow: Code Review

## Purpose

This workflow defines the mandatory execution process for reviewing a pull request, code change, or architectural decision before it is merged or approved.

This file is loaded and executed by the **Technical Director** agent.
The TD reads this file, builds the execution plan, and invokes each phase's agent automatically.

---

## Execution Model

The Technical Director must:

1. Read this workflow in full before doing anything.
2. Build the execution plan.
3. Execute phases in order.
4. Produce the Final Summary after all phases are complete.

There is **no Approval Gate** in this workflow — the code review itself IS the gate. The TD presents the review findings to the user and the final recommendation drives the next action.

---

## Agent Registry

| Phase | Agent             | File                                  |
| ----- | ----------------- | ------------------------------------- |
| 1     | Code Reviewer     | `.claude/agents/code-reviewer.md`     |
| 2     | Security Engineer | `.claude/agents/security-engineer.md` |

---

## Phase 1 — Code Review

**Agent:** Code Reviewer (`.claude/agents/code-reviewer.md`)

**Invoke with:**

- The code changes to be reviewed (file paths, PR description, or pasted diff)
- Any relevant context: the feature or bug being addressed, the architectural constraints, and any acceptance criteria
- Instruction: "Perform a full code review of these changes."

**Objectives:**

- Understand the intent of the change before evaluating it.
- Review for bugs: logical errors, null dereferences, race conditions, off-by-one errors, incorrect assumptions.
- Review for code smells: long methods, god classes, duplicated logic, magic numbers, inappropriate intimacy.
- Validate architectural alignment: does the code respect the layering, module boundaries, and patterns in use?
- Validate SOLID principles: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion.
- Validate test coverage: are the tests meaningful, covering the right paths, and actually capable of failing?
- Validate documentation: are public APIs, complex logic, and configuration changes documented?

**Required Deliverables:**

- Review Report — structured findings using severity: CRITICAL / HIGH / MEDIUM / LOW / INFO, each with: ID, category, location, description, and actionable suggestion.
- Scores — Maintainability / Security / Performance rated 0–10 with brief justification per dimension.
- Final Recommendation — one of: APPROVE / APPROVE WITH COMMENTS / REQUEST CHANGES / REJECT, with 2–4 sentence rationale.

**Review is Blocked by:**

- Any CRITICAL finding — code with CRITICAL severity must not merge.
- Missing tests for any business rule or edge case.
- Architecture drift without documented justification.
- Security anti-patterns (hardcoded credentials, missing auth checks, unvalidated inputs, etc.).

**Phase Complete When:**

- Review Report is complete.
- Final Recommendation is issued.
- TD has reviewed and accepted the report.

---

## Phase 2 — Security Review

**Condition:** Execute only if the code changes involve any of the following:

- Authentication or authorization logic
- User data (PII, sensitive attributes)
- Payment flows
- External API integrations
- File uploads or downloads
- Session management
- Cryptographic operations

If none of the above apply, skip this phase.

**Agent:** Security Engineer (`.claude/agents/security-engineer.md`)

**Invoke with:**

- The code changes to be reviewed
- Phase 1 deliverables (Review Report)
- Instruction: "Perform a security review of these code changes."

**Required Deliverables:**

- Threat Analysis — STRIDE assessment of the changed code.
- Risk Register — findings with severity (Critical/High/Medium/Low/Informational).
- Security Recommendations — concrete actions for each finding.
- OWASP Review — mapping to OWASP Top 10.
- Hardening Checklist — specific to the reviewed component.
- Security Approval — explicit pass/fail. Critical or High findings must be resolved before merging.

**Phase Complete When:**

- No Critical or High severity findings remain open.
- Security Engineer has issued explicit approval.

---

## Final Phase — Delivery Summary

**Agent:** Technical Director (self)

**The TD must verify:**

- [ ] Phase 1 executed — Code Review complete with Final Recommendation issued.
- [ ] Phase 2 executed or explicitly skipped (no security triggers).

**Final Output Format:**

```
## Code Review Summary

**PR / Change:** [Identifier or description]
**Status:** Approved / Changes Required / Rejected

### Review Findings
[Summary of top findings by severity]

### Scores
| Dimension | Score |
|---|---|
| Maintainability | X/10 |
| Security | X/10 |
| Performance | X/10 |

### Final Recommendation
[APPROVE / APPROVE WITH COMMENTS / REQUEST CHANGES / REJECT]

[Rationale]

### Security Review
[APPROVED / SKIPPED / FINDINGS OPEN]

### Required Actions Before Merge
[List of CRITICAL/HIGH findings that must be resolved, or "None"]
```

---

## Workflow Completion Criteria

This workflow is considered **complete** only when:

- Code Review produced a Final Recommendation.
- Security Review was executed or explicitly skipped with justification.
- No open CRITICAL findings remain.
- Technical Director has produced and presented the Final Delivery Summary.
