# Workflow: New Feature

## Purpose

This workflow defines the mandatory execution process for implementing any new feature,
new screen, new API endpoint, or new module.

This file is loaded and executed by the **Technical Director** agent.
The TD reads this file, builds the execution plan, and invokes each phase's agent automatically.

---

## Execution Model

The Technical Director must:

1. Read this workflow in full before doing anything.
2. Build the execution plan based on the phases below.
3. Present the plan to the user before any implementation begins.
4. Execute phases in order, invoking each agent via the Task tool.
5. Pass the outputs of each phase as inputs to the next.
6. Stop at every Approval Gate and wait for explicit user confirmation.
7. Produce the Final Summary only after all phases are complete.

---

## Agent Registry

The following agents are used in this workflow.
Each invocation must load the agent from its file.

| Phase | Agent                | File                                     |
| ----- | -------------------- | ---------------------------------------- |
| 1     | Product Manager      | `.claude/agents/product-manager.md`      |
| 2     | Business Analyst     | `.claude/agents/business-analyst.md`     |
| 3     | Software Architect   | `.claude/agents/software-architect.md`   |
| 4     | Backend Engineer     | `.claude/agents/backend-engineer.md`     |
| 5     | Frontend Engineer    | `.claude/agents/frontend-engineer.md`    |
| 6     | QA Engineer          | `.claude/agents/qa-engineer.md`          |
| 7     | Security Engineer    | `.claude/agents/security-engineer.md`    |
| 8     | Documentation Writer | `.claude/agents/documentation-writer.md` |
| 9     | Code Reviewer        | `.claude/agents/code-reviewer.md`        |

---

## Phase 1 — Business Discovery

**Agent:** Product Manager (`.claude/agents/product-manager.md`)

**Invoke with:**

- Original user request (verbatim)
- Instruction: "Produce the Business Discovery artifacts for this feature request."

**Objectives:**

- Understand the business goal behind the request.
- Define the user persona and their need.
- Write the User Story in the format: "As a [persona], I want [action] so that [benefit]."
- Define Acceptance Criteria — minimum 3 items, format: Given / When / Then.
- Identify success metrics — how will we know this feature succeeded?
- Identify stakeholders and impacted users.

**Required Deliverables:**

- User Story — format: "As a [persona], I want [action] so that [benefit]."
- Acceptance Criteria — minimum 3 items, Given/When/Then format.
- Business Context — 2-3 sentences explaining the business motivation.
- Success Metrics — at least 1 measurable metric.

**Phase Complete When:**

- User Story is written and unambiguous.
- Acceptance Criteria cover the happy path and at least 1 edge case.
- TD has validated the deliverables are complete before proceeding.

---

## Phase 2 — Requirements Analysis

**Agent:** Business Analyst (`.claude/agents/business-analyst.md`)

**Invoke with:**

- Original user request
- Phase 1 deliverables (User Story, Acceptance Criteria, Business Context, Success Metrics)
- Instruction: "Produce the Requirements Analysis for this feature."

**Objectives:**

- Translate the User Story into concrete functional requirements.
- Identify all business rules that govern this feature.
- Identify input validations and data constraints.
- Map edge cases and exception flows.
- State explicit assumptions and flag open questions.

**Required Deliverables:**

- Functional Requirements — numbered list, each item testable and unambiguous.
- Non-Functional Requirements — performance, availability, scalability expectations.
- Business Rules — explicit conditions that govern behavior.
- Edge Cases — list of non-happy-path scenarios with expected behavior.
- Assumptions — explicit list of what was assumed to be true.
- Open Questions — items that require clarification before or during implementation.

**Phase Complete When:**

- Every Acceptance Criterion from Phase 1 maps to at least one Functional Requirement.
- Business Rules are explicit and unambiguous.
- TD has confirmed no open questions block proceeding.

---

## Phase 3 — Architecture

**Agent:** Software Architect (`.claude/agents/software-architect.md`)

**Invoke with:**

- Original user request
- Phase 1 deliverables
- Phase 2 deliverables
- Instruction: "Produce the Architecture Proposal for this feature."

**Objectives:**

- Design the technical solution at the system level.
- Identify all modules, services, and components affected.
- Define API contracts (endpoints, request/response shapes, HTTP methods, status codes).
- Define database changes (new tables, new columns, schema migrations, indexes).
- Identify cross-cutting concerns (caching, logging, error handling, rate limiting).
- Evaluate scalability and performance implications.
- Identify technical risks and propose mitigations.
- Present trade-offs when multiple valid approaches exist.

**Required Deliverables:**

- Architecture Proposal — component diagram or structured description of how the solution fits the system.
- API Contract — for every new or modified endpoint: method, path, request body, response body, error codes.
- Database Changes — for every schema change: table name, column name, type, constraints, migration strategy.
- Technical Decisions — list of decisions made with rationale.
- Trade-offs — alternatives considered and why they were rejected.
- Risks — technical risks with probability, impact, and mitigation.

**Phase Complete When:**

- All Functional Requirements from Phase 2 are addressed in the architecture.
- API contracts are complete enough for a backend engineer to implement without ambiguity.
- Database changes include migration strategy.
- TD has validated the architecture is consistent with existing system design.

---

## ⛔ APPROVAL GATE

**The Technical Director must stop here.**

Before any implementation begins, the TD must:

1. Present a consolidated summary to the user containing:
   - User Story and Acceptance Criteria (Phase 1)
   - Key Functional Requirements and Business Rules (Phase 2)
   - Architecture Proposal, API Contracts, and DB Changes (Phase 3)
   - Identified Risks

2. Ask the user explicitly:

   > "The discovery and design phases are complete. Do you approve this plan and authorize implementation to begin?"

3. Wait for explicit user approval.

**No code, no tests, no implementation of any kind may begin before the user types an explicit approval.**

If the user requests changes, loop back to the relevant phase, update the deliverables, and re-present for approval.

---

## Phase 4 — Backend Development

**Condition:** Execute always, unless the feature is purely frontend with no backend changes.

**Agent:** Backend Engineer (`.claude/agents/backend-engineer.md`)

**Invoke with:**

- Original user request
- Phase 1 deliverables (Acceptance Criteria)
- Phase 2 deliverables (Functional Requirements, Business Rules, Edge Cases)
- Phase 3 deliverables (Architecture Proposal, API Contract, Database Changes)
- Instruction: "Implement the backend for this feature following the approved architecture."

**Objectives:**

- Implement all API endpoints defined in the Architecture Proposal.
- Implement all business rules defined in Phase 2.
- Apply all input validations.
- Handle all error cases explicitly — no silent failures.
- Write unit tests covering business logic, validations, and edge cases.
- Follow the project's coding standards and naming conventions.

**Required Deliverables:**

- Implementation — all backend code for the feature.
- Unit Tests — covering: happy path, business rules, validations, and edge cases from Phase 2.
- Implementation Notes — any deviations from the Architecture Proposal, with justification.

**Phase Complete When:**

- All API endpoints from Phase 3 are implemented.
- All business rules from Phase 2 are enforced in code.
- Unit test coverage exists for every item in the Edge Cases list from Phase 2.
- Implementation Notes document any deviation from the approved architecture.
- TD has reviewed that implementation matches the approved plan.

---

## Phase 5 — Frontend Development

**Condition:** Execute only if the feature requires UI changes or new screens.
If no UI is involved, skip this phase entirely and proceed to Phase 6.

**Agent:** Frontend Engineer (`.claude/agents/frontend-engineer.md`)

**Invoke with:**

- Original user request
- Phase 1 deliverables (User Story, Acceptance Criteria)
- Phase 3 deliverables (Architecture Proposal, API Contract)
- Phase 4 deliverables (Implementation Notes)
- Instruction: "Implement the frontend for this feature."

**Objectives:**

- Implement all UI changes required by the User Story.
- Consume the API contracts defined in Phase 3.
- Ensure responsive behavior across breakpoints.
- Meet accessibility standards (WCAG 2.1 AA minimum).
- Handle loading states, error states, and empty states.

**Required Deliverables:**

- UI Implementation — all frontend code for the feature.
- Responsive Validation — confirmation that the UI works at mobile, tablet, and desktop breakpoints.
- Accessibility Checks — confirmation of keyboard navigation, color contrast, and ARIA labels where applicable.
- Frontend Tests — component tests for new or modified components.

**Phase Complete When:**

- All UI flows from the User Story are implemented.
- API integration matches the contracts from Phase 3.
- Responsive and accessibility checks are documented.

---

## Phase 6 — Quality Assurance

**Agent:** QA Engineer (`.claude/agents/qa-engineer.md`)

**Invoke with:**

- Original user request
- Phase 1 deliverables (User Story, Acceptance Criteria)
- Phase 2 deliverables (Functional Requirements, Business Rules, Edge Cases)
- Phase 4 deliverables (Implementation Notes)
- Phase 5 deliverables (if executed)
- Instruction: "Produce the QA validation for this feature."

**Objectives:**

- Validate that every Acceptance Criterion from Phase 1 is met.
- Validate that every Functional Requirement from Phase 2 is implemented.
- Execute edge case scenarios from Phase 2.
- Identify regression risks in related existing functionality.
- Produce a formal QA report with pass/fail status per criterion.

**Required Deliverables:**

- Test Plan — scope, objectives, test strategy, entry/exit criteria, and environment requirements.
- Test Cases — one per Acceptance Criterion, format: TC-ID / Title / Preconditions / Steps / Expected Result / Priority. Must include happy path and at least one negative scenario per criterion.
- Edge Cases — boundary, adversarial, and non-obvious scenarios from Phase 2, each with expected behavior and potential failure mode.
- Regression Checklist — affected modules grouped by risk level (High/Medium/Low) with recommended test type per item.
- Risk Analysis — risk matrix (Likelihood × Impact) with explicit pass/fail validation for each Acceptance Criterion.

**Phase Complete When:**

- All Acceptance Criteria have a corresponding test case with a Pass result in the Risk Analysis.
- Regression Checklist is complete with risk levels assigned to all affected modules.
- No Acceptance Criterion is marked as failing in the Risk Analysis.
- TD has reviewed and accepted all QA deliverables.

---

## Phase 7 — Security Review

**Condition:** Execute only if the feature affects any of the following:

- Authentication or authorization logic
- User data (PII, sensitive attributes)
- Payment flows
- External API integrations
- File uploads or downloads
- Session management

If none of the above apply, skip this phase entirely and proceed to Phase 8.

**Agent:** Security Engineer (`.claude/agents/security-engineer.md`)

**Invoke with:**

- Original user request
- Phase 3 deliverables (Architecture Proposal, API Contract, Database Changes)
- Phase 4 deliverables (Implementation)
- Instruction: "Perform a security review of this feature."

**Objectives:**

- Identify authentication and authorization vulnerabilities.
- Validate input sanitization and injection prevention.
- Review secrets and credential handling.
- Assess data exposure risks.
- Check for OWASP Top 10 applicability.
- Validate that sensitive data is not logged.

**Required Deliverables:**

- Security Report — findings list with severity: Critical / High / Medium / Low / Informational.
- Vulnerability Assessment — for each finding: description, affected component, recommendation.
- Hardening Recommendations — concrete changes to reduce attack surface.
- Security Approval — explicit pass/fail. Critical or High findings must be resolved before release.

**Phase Complete When:**

- No Critical or High severity findings remain open.
- All findings are documented with recommended actions.
- Security Engineer has issued explicit approval.

---

## Phase 8 — Documentation

**Agent:** Documentation Writer (`.claude/agents/documentation-writer.md`)

**Invoke with:**

- Original user request
- Phase 1 deliverables (User Story, Acceptance Criteria)
- Phase 3 deliverables (API Contract, Architecture Proposal)
- Phase 4 deliverables (Implementation Notes)
- Phase 7 deliverables (if executed)
- Instruction: "Produce the documentation for this feature."

**Objectives:**

- Document the feature for technical consumers (developers, integrators).
- Document the feature for end users (if applicable).
- Update the changelog.
- Ensure API documentation is synchronized with the implemented contracts.

**Required Deliverables:**

- Technical Documentation — what was built, how it works, how to integrate or extend it.
- API Documentation — for every new or modified endpoint: description, parameters, request/response examples, error codes.
- User Documentation — end-user facing guide (if the feature has a user-facing component).
- Changelog Entry — format: `## [version] - YYYY-MM-DD` with sections: Added / Changed / Fixed.

**Phase Complete When:**

- All new API endpoints are documented with examples.
- Changelog entry is written.
- TD has confirmed documentation matches the implemented behavior.

---

## Phase 9 — Code Review

**Agent:** Code Reviewer (`.claude/agents/code-reviewer.md`)

**Invoke with:**

- Original user request
- Phase 3 deliverables (Architecture Proposal — as the reference for what was planned)
- Phase 4 deliverables (Implementation)
- Phase 5 deliverables (if executed)
- Phase 6 deliverables (QA Report)
- Instruction: "Perform the code review for this feature."

**Objectives:**

- Validate that implementation matches the approved architecture from Phase 3.
- Review code quality: readability, maintainability, naming, complexity.
- Review SOLID principles and design patterns.
- Identify code smells, duplication, and unnecessary complexity.
- Validate test quality — not just coverage, but assertion quality and test isolation.
- Validate error handling completeness.

**Required Deliverables:**

- Review Report — structured findings using severity: CRITICAL / HIGH / MEDIUM / LOW / INFO, each with: ID, category, location, description, and actionable suggestion.
- Scores — Maintainability / Security / Performance rated 0–10 with brief justification per dimension.
- Final Recommendation — one of: APPROVE / APPROVE WITH COMMENTS / REQUEST CHANGES / REJECT, with 2–4 sentence rationale.

**Review is Blocked by:**

- Any CRITICAL finding — code with CRITICAL severity must not merge under any circumstances.
- Architecture drift: implementation diverges from the approved plan without documented justification.
- Missing tests for any business rule or edge case from Phase 2.
- Security anti-patterns (hardcoded credentials, missing auth checks, unvalidated inputs, etc.).
- Unhandled error paths in critical flows.

**Phase Complete When:**

- No CRITICAL findings remain open.
- Final Recommendation is "APPROVE" or "APPROVE WITH COMMENTS".
- TD has reviewed the report.

---

## Phase 10 — DevOps & Deployment

**Condition:** Execute only if the feature involves any of the following:

- New or modified infrastructure resources (database, cache, message queue, external service)
- Changes to CI/CD pipeline requirements
- New environment variables or secrets that must be provisioned in production
- Database schema migrations that require coordination with the deployment pipeline
- New Dockerfile, container configuration, or orchestration changes

If none of the above apply, skip this phase entirely and proceed to the Final Phase.

**Agent:** DevOps Engineer (`.claude/agents/devops-engineer.md`)

**Invoke with:**

- Original user request
- Phase 3 deliverables (Architecture Proposal, Database Changes)
- Phase 4 deliverables (Implementation Notes)
- Instruction: "Produce the deployment and infrastructure plan for this feature."

**Objectives:**

- Define the deployment strategy for the feature (blue/green, rolling, canary, or recreate).
- Update or create CI/CD pipeline configuration to cover build, test, and deploy of the new feature.
- Provision or document required infrastructure changes.
- Define monitoring and observability additions specific to the new feature.
- Document the rollback strategy.

**Required Deliverables:**

- Deployment Strategy — chosen pattern with justification and environment promotion flow (dev → staging → production).
- CI/CD Changes — pipeline configuration updates required, with YAML snippets where applicable.
- Infrastructure Changes — new or modified resources, with IaC tool and approach specified.
- Monitoring Plan — new metrics, alerts, and dashboards specific to the feature's new endpoints or events.
- Rollback Strategy — automated triggers and thresholds, manual steps, and estimated RTO.

**Phase Complete When:**

- All infrastructure required by the feature is provisioned or formally planned in IaC.
- CI/CD pipeline is updated to build, test, and deploy the feature end-to-end.
- Monitoring plan covers at minimum: error rate and latency for new endpoints.
- Rollback strategy is documented and validated by the TD.

---

## Final Phase — Delivery Summary

**Agent:** Technical Director (self)

After all phases are complete, the Technical Director produces the final summary.

**The TD must verify:**

- [ ] Phase 1 executed — User Story and Acceptance Criteria produced.
- [ ] Phase 2 executed — Requirements and Business Rules documented.
- [ ] Phase 3 executed — Architecture approved by user.
- [ ] Approval Gate cleared — explicit user approval received.
- [ ] Phase 4 executed — Backend implemented and tested.
- [ ] Phase 5 executed or explicitly skipped (no UI changes).
- [ ] Phase 6 executed — All Acceptance Criteria pass QA.
- [ ] Phase 7 executed or explicitly skipped (no security triggers).
- [ ] Phase 8 executed — Documentation and changelog updated.
- [ ] Phase 9 executed — Code Review approved.
- [ ] Phase 10 executed or explicitly skipped (no infrastructure changes).

**Final Output Format:**

```
## Delivery Summary

**Feature:** [Feature name]
**Status:** Complete / Partial / Blocked

### Phases Executed
| Phase | Agent | Status | Notes |
|---|---|---|---|
| 1 — Business Discovery | Product Manager | ✅ Complete | |
| 2 — Requirements Analysis | Business Analyst | ✅ Complete | |
| 3 — Architecture | Software Architect | ✅ Complete | |
| 4 — Backend Development | Backend Engineer | ✅ Complete | |
| 5 — Frontend Development | Frontend Engineer | ✅ Complete / ⏭ Skipped | |
| 6 — Quality Assurance | QA Engineer | ✅ Complete | |
| 7 — Security Review | Security Engineer | ✅ Complete / ⏭ Skipped | |
| 8 — Documentation | Documentation Writer | ✅ Complete | |
| 9 — Code Review | Code Reviewer | ✅ Complete | |
| 10 — DevOps & Deployment | DevOps Engineer | ✅ Complete / ⏭ Skipped | |

### Deliverables Produced
- [List all artifacts produced across all phases]

### Open Items
- [Any known limitations, deferred decisions, or follow-up actions]

### Remaining Risks
- [Any risks identified that were not fully mitigated]

### Recommended Next Steps
- [What should happen after this feature is merged]
```

---

## Workflow Completion Criteria

This workflow is considered **complete** only when:

- All mandatory phases were executed (or explicitly skipped with documented justification).
- The Approval Gate was respected — user provided explicit approval.
- All Acceptance Criteria passed QA.
- Code Review returned "APPROVE" or "APPROVE WITH COMMENTS".
- No open Critical or High security findings.
- Documentation and changelog are updated.
- Technical Director has produced and presented the Final Delivery Summary.
