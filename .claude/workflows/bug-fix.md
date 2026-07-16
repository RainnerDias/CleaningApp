# Workflow: Bug Fix

## Purpose

This workflow defines the mandatory execution process for fixing defects, regressions, and production incidents.

This file is loaded and executed by the **Technical Director** agent.
The TD reads this file, builds the execution plan, and invokes each phase's agent automatically.

---

## Execution Model

The Technical Director must:

1. Read this workflow in full before doing anything.
2. Build the execution plan based on the phases below.
3. Present the plan to the user before any fix begins.
4. Execute phases in order, invoking each agent via the Task tool.
5. Pass the outputs of each phase as inputs to the next.
6. Stop at the Approval Gate for HIGH or CRITICAL severity bugs and wait for explicit user confirmation.
7. Produce the Final Summary only after all phases are complete.

---

## Agent Registry

| Phase | Agent                                     | File                                                                         |
| ----- | ----------------------------------------- | ---------------------------------------------------------------------------- |
| 1     | Business Analyst                          | `.claude/agents/business-analyst.md`                                         |
| 2     | Backend Engineer and/or Frontend Engineer | `.claude/agents/backend-engineer.md` / `.claude/agents/frontend-engineer.md` |
| 3     | QA Engineer                               | `.claude/agents/qa-engineer.md`                                              |
| 4     | Security Engineer                         | `.claude/agents/security-engineer.md`                                        |
| 5     | Code Reviewer                             | `.claude/agents/code-reviewer.md`                                            |

---

## Phase 1 — Bug Triage & Analysis

**Agent:** Business Analyst (`.claude/agents/business-analyst.md`)

**Invoke with:**

- Original bug report or incident description (verbatim)
- Instruction: "Produce the Bug Triage & Analysis for this defect report."

**Objectives:**

- Confirm the bug is reproducible and document exact reproduction steps.
- Identify the root cause or most likely root cause if not yet confirmed.
- Determine the blast radius: which users, features, or data are affected.
- Assign severity: **CRITICAL** (data loss, security breach, full outage) / **HIGH** (major feature broken, workaround unavailable) / **MEDIUM** (partial feature broken, workaround available) / **LOW** (cosmetic, edge case, minimal impact).
- Identify regression risk: what other areas could be affected by a fix.
- List the functional requirements and business rules that the buggy behavior violates.

**Required Deliverables:**

- Bug Report — title, severity, affected component, environment (prod/staging/dev), reproduction steps.
- Root Cause Analysis — confirmed or hypothesized cause with evidence.
- Blast Radius — list of affected users, data, or features.
- Violated Requirements — which functional requirements or business rules are broken.
- Regression Map — components that share the faulty code path.
- Assumptions & Open Questions — anything that needs clarification before fixing.

**Phase Complete When:**

- Severity is assigned and justified.
- Root cause is identified with sufficient confidence to plan a fix.
- TD has confirmed no open questions block proceeding.

---

## ⛔ APPROVAL GATE (CRITICAL and HIGH severity only)

**If severity is MEDIUM or LOW, skip this gate and proceed directly to Phase 2.**

**If severity is CRITICAL or HIGH, the Technical Director must stop here.**

Before any fix is written, the TD must:

1. Present a consolidated summary to the user containing:
   - Bug Report with severity and blast radius (Phase 1)
   - Root Cause Analysis (Phase 1)
   - Violated Requirements (Phase 1)
   - Proposed fix approach (TD's assessment based on Phase 1)

2. Ask the user explicitly:

   > "This is a HIGH/CRITICAL severity bug. The triage is complete. Do you approve this fix plan and authorize implementation to begin?"

3. Wait for explicit user approval.

**No code may be written before the user types an explicit approval for HIGH/CRITICAL bugs.**

---

## Phase 2 — Fix Implementation

**Condition:** Invoke Backend Engineer if the bug is server-side. Invoke Frontend Engineer if the bug is client-side. Invoke both if the bug spans both layers.

**Agent:** Backend Engineer (`.claude/agents/backend-engineer.md`) and/or Frontend Engineer (`.claude/agents/frontend-engineer.md`)

**Invoke with:**

- Original bug report
- Phase 1 deliverables (Bug Report, Root Cause Analysis, Violated Requirements, Regression Map)
- Instruction: "Implement the fix for this bug following the triage analysis."

**Objectives:**

- Implement the minimal fix that resolves the root cause without introducing new behavior.
- Do not refactor, clean up, or improve adjacent code beyond what is strictly necessary to fix the bug.
- Write a regression test that would have caught this bug before it reached production.
- Document any deviation from the simplest fix and justify it.

**Required Deliverables:**

- Fix Implementation — the changed code, scoped strictly to the defect.
- Regression Test — a test that fails on the unpatched code and passes on the patched code.
- Implementation Notes — description of what was changed, why, and any trade-offs made.
- Risk Assessment — any side effects or regression risks introduced by the fix.

**Phase Complete When:**

- Root cause is addressed in code.
- Regression test exists and passes.
- Implementation Notes document the scope of the change.
- TD has validated the fix matches the root cause from Phase 1.

---

## Phase 3 — QA Validation

**Agent:** QA Engineer (`.claude/agents/qa-engineer.md`)

**Invoke with:**

- Original bug report
- Phase 1 deliverables (Bug Report, Violated Requirements, Regression Map)
- Phase 2 deliverables (Fix Implementation, Regression Test, Risk Assessment)
- Instruction: "Produce the QA validation for this bug fix."

**Objectives:**

- Verify the fix resolves the reported defect.
- Verify no regression was introduced in the areas identified in the Regression Map.
- Validate that all violated requirements from Phase 1 now pass.

**Required Deliverables:**

- Test Plan — scope, strategy, and environment requirements.
- Test Cases — at minimum: one confirming the bug is fixed, one per violated requirement, and one per item on the Regression Map.
- Edge Cases — boundary scenarios for the fixed behavior.
- Regression Checklist — confirmation that all regression map items were tested.
- Risk Analysis — residual risk assessment after the fix.

**Phase Complete When:**

- The bug is confirmed fixed.
- All regression map items are tested.
- No new defects were introduced.
- TD has reviewed the QA deliverables.

---

## Phase 4 — Security Review

**Condition:** Execute only if the bug involves any of the following:

- Authentication or authorization logic
- User data (PII, sensitive attributes)
- Input validation or sanitization
- Session management
- Cryptographic operations
- External API integrations

If none of the above apply, skip this phase and proceed to Phase 5.

**Agent:** Security Engineer (`.claude/agents/security-engineer.md`)

**Invoke with:**

- Phase 1 deliverables (Root Cause Analysis, Blast Radius)
- Phase 2 deliverables (Fix Implementation)
- Instruction: "Perform a security review of this bug fix."

**Required Deliverables:**

- Threat Analysis — STRIDE assessment focused on the vulnerability that caused the bug.
- Risk Register — findings with severity (Critical/High/Medium/Low/Informational).
- Security Recommendations — concrete actions for any findings.
- OWASP Review — mapping of the original bug to OWASP Top 10 categories.
- Hardening Checklist — specific to the fixed component.
- Security Approval — explicit pass/fail. Critical or High findings must be resolved before release.

**Phase Complete When:**

- No Critical or High severity findings remain open.
- Security Engineer has issued explicit approval.

---

## Phase 5 — Code Review

**Agent:** Code Reviewer (`.claude/agents/code-reviewer.md`)

**Invoke with:**

- Phase 1 deliverables (Root Cause Analysis, Violated Requirements)
- Phase 2 deliverables (Fix Implementation, Regression Test)
- Phase 3 deliverables (QA Report summary)
- Instruction: "Perform the code review for this bug fix."

**Objectives:**

- Confirm the fix is minimal and does not introduce unnecessary changes.
- Validate the regression test quality — it must actually fail on the unpatched code.
- Check for introduction of new technical debt or anti-patterns.
- Validate error handling completeness in the fixed code path.

**Required Deliverables:**

- Review Report — findings with severity: CRITICAL / HIGH / MEDIUM / LOW / INFO.
- Scores — Maintainability / Security / Performance rated 0–10.
- Final Recommendation — APPROVE / APPROVE WITH COMMENTS / REQUEST CHANGES / REJECT with rationale.

**Phase Complete When:**

- No CRITICAL findings remain open.
- Final Recommendation is "APPROVE" or "APPROVE WITH COMMENTS".
- TD has reviewed the report.

---

## Final Phase — Delivery Summary

**Agent:** Technical Director (self)

**The TD must verify:**

- [ ] Phase 1 executed — Bug triage and root cause analysis produced.
- [ ] Approval Gate cleared (CRITICAL/HIGH) or explicitly skipped (MEDIUM/LOW).
- [ ] Phase 2 executed — Fix implemented with regression test.
- [ ] Phase 3 executed — QA confirmed the bug is fixed.
- [ ] Phase 4 executed or explicitly skipped (no security triggers).
- [ ] Phase 5 executed — Code Review approved.

**Final Output Format:**

```
## Delivery Summary

**Bug:** [Bug title]
**Severity:** [CRITICAL / HIGH / MEDIUM / LOW]
**Status:** Complete / Partial / Blocked

### Phases Executed
| Phase | Agent | Status | Notes |
|---|---|---|---|
| 1 — Bug Triage | Business Analyst | ✅ Complete | |
| 2 — Fix Implementation | Backend/Frontend Engineer | ✅ Complete | |
| 3 — QA Validation | QA Engineer | ✅ Complete | |
| 4 — Security Review | Security Engineer | ✅ Complete / ⏭ Skipped | |
| 5 — Code Review | Code Reviewer | ✅ Complete | |

### Root Cause
[One-sentence summary of the root cause]

### Fix Summary
[One-sentence description of what was changed]

### Regression Test
[Confirmation that regression test exists and passes]

### Open Items
[Any follow-up actions or deferred improvements]
```

---

## Workflow Completion Criteria

This workflow is considered **complete** only when:

- All mandatory phases were executed (or explicitly skipped with documented justification).
- The Approval Gate was respected for CRITICAL and HIGH severity bugs.
- The bug is confirmed fixed by QA.
- Code Review returned "APPROVE" or "APPROVE WITH COMMENTS".
- No open Critical or High security findings (if security review was triggered).
- Technical Director has produced and presented the Final Delivery Summary.
