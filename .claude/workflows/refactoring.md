# Workflow: Refactoring

## Purpose

This workflow defines the mandatory execution process for technical debt reduction, code cleanup, and structural improvements that do not change observable system behavior.

This file is loaded and executed by the **Technical Director** agent.
The TD reads this file, builds the execution plan, and invokes each phase's agent automatically.

---

## Execution Model

The Technical Director must:

1. Read this workflow in full before doing anything.
2. Build the execution plan based on the phases below.
3. Present the plan to the user before any work begins.
4. Execute phases in order, invoking each agent via the Task tool.
5. Stop at the Approval Gate and wait for explicit user confirmation before any code is changed.
6. Produce the Final Summary only after all phases are complete.

---

## Agent Registry

| Phase | Agent                                     | File                                                                         |
| ----- | ----------------------------------------- | ---------------------------------------------------------------------------- |
| 1     | Software Architect                        | `.claude/agents/software-architect.md`                                       |
| 2     | Backend Engineer and/or Frontend Engineer | `.claude/agents/backend-engineer.md` / `.claude/agents/frontend-engineer.md` |
| 3     | QA Engineer                               | `.claude/agents/qa-engineer.md`                                              |
| 4     | Code Reviewer                             | `.claude/agents/code-reviewer.md`                                            |

---

## Phase 1 — Scope & Refactoring Plan

**Agent:** Software Architect (`.claude/agents/software-architect.md`)

**Invoke with:**

- Original refactoring request (verbatim)
- Instruction: "Produce the Scope Analysis and Refactoring Plan for this request."

**Objectives:**

- Identify every file, module, class, and function affected by the refactoring.
- Quantify the current technical debt: why this refactoring is necessary now.
- Define the target state: what the code looks like after the refactoring.
- Define acceptance criteria: how to verify that the refactoring is complete and correct.
- Assess regression risk: which existing behaviors could break.
- Confirm that no observable behavior changes — the refactoring is purely structural.

**Required Deliverables:**

- Scope Definition — exhaustive list of affected components with current and target state description.
- Motivation — why this refactoring is needed (technical debt category, maintenance cost, violation of which principle).
- Acceptance Criteria — testable criteria that define "refactoring complete and correct."
- Regression Risk Assessment — areas of the system most likely to regress with severity levels.
- Sequencing Plan — recommended order of changes to minimize risk (e.g., extract interface before replacing implementation).
- Out-of-Scope Declaration — explicit list of what is NOT being changed in this refactoring.

**Phase Complete When:**

- Scope is complete enough for an engineer to implement without ambiguity.
- Acceptance criteria are testable.
- Regression risks are documented.
- TD has validated the plan is consistent with the system architecture.

---

## ⛔ APPROVAL GATE

**The Technical Director must stop here.**

Before any code is changed, the TD must:

1. Present a consolidated summary to the user containing:
   - Scope Definition and Motivation (Phase 1)
   - Acceptance Criteria (Phase 1)
   - Regression Risk Assessment (Phase 1)
   - Sequencing Plan (Phase 1)
   - Out-of-Scope Declaration (Phase 1)

2. Ask the user explicitly:

   > "The refactoring scope and plan are defined. Do you approve this plan and authorize implementation to begin?"

3. Wait for explicit user approval.

**No code may be changed before the user types an explicit approval.**

If the user requests changes, update the Phase 1 deliverables and re-present.

---

## Phase 2 — Refactoring Implementation

**Condition:** Invoke Backend Engineer for server-side refactoring. Invoke Frontend Engineer for UI/component refactoring. Invoke both if the refactoring spans both layers.

**Agent:** Backend Engineer (`.claude/agents/backend-engineer.md`) and/or Frontend Engineer (`.claude/agents/frontend-engineer.md`)

**Invoke with:**

- Original refactoring request
- Phase 1 deliverables (Scope Definition, Acceptance Criteria, Sequencing Plan, Out-of-Scope Declaration)
- Instruction: "Implement the refactoring following the approved plan."

**Objectives:**

- Execute the refactoring exactly as planned. No scope creep.
- Follow the sequencing plan to minimize risk at each step.
- Preserve all observable behavior — no functional changes.
- Update or add tests as needed to cover the refactored code. Do not delete existing tests.
- If a scope boundary is reached that should be crossed, stop and flag it to the TD instead of expanding silently.

**Required Deliverables:**

- Refactored Code — all changes within the approved scope.
- Test Updates — any test additions or modifications required by the structural change.
- Implementation Notes — summary of what was changed, in what order, and any deviations from the plan.
- Deviations Log — explicit list of anything that diverged from the Sequencing Plan, with justification.

**Phase Complete When:**

- All components in the Scope Definition have been refactored.
- No out-of-scope changes were made (or deviations are explicitly logged and approved by TD).
- Existing tests still pass.
- TD has reviewed the implementation against the approved plan.

---

## Phase 3 — QA Validation

**Agent:** QA Engineer (`.claude/agents/qa-engineer.md`)

**Invoke with:**

- Phase 1 deliverables (Acceptance Criteria, Regression Risk Assessment)
- Phase 2 deliverables (Implementation Notes, Deviations Log)
- Instruction: "Produce the QA validation for this refactoring."

**Objectives:**

- Verify that every Acceptance Criterion from Phase 1 is satisfied.
- Verify that no regression was introduced in the areas identified in the Regression Risk Assessment.
- Confirm that observable system behavior is unchanged.

**Required Deliverables:**

- Test Plan — scope and strategy for validating a behavior-preserving change.
- Test Cases — one per Acceptance Criterion plus one per high-risk area in the Regression Risk Assessment.
- Regression Checklist — confirmation that all high-risk areas were tested.
- Risk Analysis — pass/fail validation per Acceptance Criterion. All must pass before proceeding.

**Phase Complete When:**

- All Acceptance Criteria pass.
- Regression Checklist is complete.
- No new defects introduced.
- TD has reviewed the QA deliverables.

---

## Phase 4 — Code Review

**Agent:** Code Reviewer (`.claude/agents/code-reviewer.md`)

**Invoke with:**

- Phase 1 deliverables (Scope Definition, Acceptance Criteria, Out-of-Scope Declaration)
- Phase 2 deliverables (Refactored Code, Implementation Notes, Deviations Log)
- Phase 3 deliverables (QA Report summary)
- Instruction: "Perform the code review for this refactoring."

**Objectives:**

- Verify the refactoring achieves its stated goal (e.g., improved cohesion, reduced coupling, SOLID compliance).
- Verify no out-of-scope changes were made without authorization.
- Validate that the code is in a better structural state than before.
- Confirm tests cover the refactored paths.

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

- [ ] Phase 1 executed — Scope and Refactoring Plan produced.
- [ ] Approval Gate cleared — explicit user approval received.
- [ ] Phase 2 executed — Refactoring implemented within approved scope.
- [ ] Phase 3 executed — All Acceptance Criteria pass QA.
- [ ] Phase 4 executed — Code Review approved.

**Final Output Format:**

```
## Delivery Summary

**Refactoring:** [Short description]
**Status:** Complete / Partial / Blocked

### Phases Executed
| Phase | Agent | Status | Notes |
|---|---|---|---|
| 1 — Scope & Plan | Software Architect | ✅ Complete | |
| 2 — Implementation | Backend/Frontend Engineer | ✅ Complete | |
| 3 — QA Validation | QA Engineer | ✅ Complete | |
| 4 — Code Review | Code Reviewer | ✅ Complete | |

### What Changed
[2-3 sentences summarizing the structural improvement achieved]

### Behavior Preserved
[Confirmation that observable behavior is unchanged]

### Open Items
[Any deferred improvements or follow-up actions]
```

---

## Workflow Completion Criteria

This workflow is considered **complete** only when:

- All mandatory phases were executed.
- The Approval Gate was respected — user provided explicit approval.
- All Acceptance Criteria passed QA.
- Code Review returned "APPROVE" or "APPROVE WITH COMMENTS".
- Technical Director has produced and presented the Final Delivery Summary.
