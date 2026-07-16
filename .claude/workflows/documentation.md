# Workflow: Documentation

## Purpose

This workflow defines the mandatory execution process for creating, updating, or auditing technical and user documentation.

This file is loaded and executed by the **Technical Director** agent.
The TD reads this file, builds the execution plan, and invokes each phase's agent automatically.

---

## Execution Model

The Technical Director must:

1. Read this workflow in full before doing anything.
2. Classify the documentation request:
   - **New documentation**: documenting a feature or system for the first time.
   - **Update**: synchronizing docs with a recently changed implementation.
   - **Audit**: reviewing all existing documentation for accuracy and completeness.
   - **Onboarding**: creating a guide for new team members or users.
3. Build the execution plan.
4. Execute phases in order.
5. Produce the Final Summary after all phases are complete.

There is **no Approval Gate** in this workflow. Documentation is reviewed by the TD before delivery.

---

## Agent Registry

| Phase | Agent                | File                                     |
| ----- | -------------------- | ---------------------------------------- |
| 1     | Documentation Writer | `.claude/agents/documentation-writer.md` |

---

## Phase 1 — Documentation Audit (for Update and Audit requests)

**Condition:** Execute this phase only for **Update** or **Audit** request types. For New documentation or Onboarding requests, skip to Phase 2.

**Agent:** Documentation Writer (`.claude/agents/documentation-writer.md`)

**Invoke with:**

- Description of the scope: which feature, module, API, or system to audit.
- Instruction: "Audit the existing documentation for this scope and produce a gap analysis."

**Objectives:**

- Read all existing documentation for the scope.
- Compare documentation against the actual implementation.
- Identify: outdated content, missing sections, inaccurate API descriptions, broken examples.
- Produce a prioritized list of documentation debt.

**Required Deliverables:**

- Documentation Inventory — list of all existing docs for the scope with their location and purpose.
- Gap Analysis — what is missing, what is wrong, and what is outdated.
- Priority List — documentation items ranked by reader impact (High/Medium/Low).

**Phase Complete When:**

- Gap Analysis is complete.
- TD has confirmed scope before production begins.

---

## Phase 2 — Documentation Production

**Agent:** Documentation Writer (`.claude/agents/documentation-writer.md`)

**Invoke with:**

- Documentation request type and scope
- Phase 1 deliverables (Gap Analysis, Priority List) — if Phase 1 was executed
- For feature documentation: Phase 3 architecture deliverables, implementation notes, API contracts
- Instruction: "Produce the documentation for this scope."

**Objectives:**

- Write or update all documentation within the approved scope.
- Synchronize API documentation with the actual implemented contracts.
- Ensure all code examples are accurate and executable.
- Write for the correct audience: technical (developer-facing) and/or user-facing.
- Update the changelog with a properly formatted entry.

**Required Deliverables (all five sections of the Documentation Writer's mandatory output):**

### 1. Summary

Executive overview (3–6 sentences) of what was documented and why.

### 2. Technical Documentation

Developer-facing documentation including: architecture overviews, API references with request/response schemas, configuration options, module descriptions, and code examples.

### 3. User Documentation

End-user-facing documentation including: feature descriptions in plain language, step-by-step how-to guides, FAQs, and troubleshooting tips.

### 4. Changelog

Structured entry:

```
## [Date] - Documentation Update
### Added
- [New docs added]
### Updated
- [Docs revised or synchronized]
### Deprecated / Removed
- [Docs removed or marked outdated]
```

### 5. Next Steps

Prioritized list of: documentation gaps requiring team input, areas needing clarification, and code-level observations flagged for the engineering team.

**Phase Complete When:**

- All five mandatory sections are present.
- API documentation matches the actual implementation (or discrepancies are explicitly flagged in Next Steps).
- Changelog entry is written.
- TD has confirmed documentation matches the implemented behavior.

---

## Final Phase — Delivery Summary

**Agent:** Technical Director (self)

**The TD must verify:**

- [ ] Phase 1 executed or explicitly skipped (new documentation or onboarding request).
- [ ] Phase 2 executed — all five documentation sections produced.
- [ ] Changelog entry written.
- [ ] API documentation matches implementation.

**Final Output Format:**

```
## Documentation Delivery Summary

**Scope:** [What was documented]
**Request Type:** New / Update / Audit / Onboarding
**Status:** Complete / Partial / Blocked

### Documentation Produced
[List of documents created or updated with their location]

### Changelog Entry
[Formatted changelog entry]

### Next Steps
[Prioritized list of follow-up items]

### Open Items
[Any gaps that require team input or implementation clarification]
```

---

## Workflow Completion Criteria

This workflow is considered **complete** only when:

- Documentation is synchronized with the actual implementation.
- All five Documentation Writer output sections are present and complete.
- Changelog entry is written.
- Technical Director has produced and presented the Final Delivery Summary.
