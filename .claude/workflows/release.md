# Workflow: Release

## Purpose

This workflow defines the mandatory execution process for preparing, validating, and deploying a software release — including versioning, changelog, deployment, and smoke testing.

This file is loaded and executed by the **Technical Director** agent.
The TD reads this file, builds the execution plan, and invokes each phase's agent automatically.

---

## Execution Model

The Technical Director must:

1. Read this workflow in full before doing anything.
2. Confirm the release type with the user: **Major** (breaking changes), **Minor** (new features), **Patch** (bug fixes only), or **Hotfix** (emergency fix on a released version).
3. Build the execution plan.
4. Execute phases in order.
5. Stop at the Approval Gate before the production deployment.
6. Produce the Final Summary after all phases are complete.

---

## Agent Registry

| Phase | Agent                | File                                     |
| ----- | -------------------- | ---------------------------------------- |
| 1     | Documentation Writer | `.claude/agents/documentation-writer.md` |
| 2     | DevOps Engineer      | `.claude/agents/devops-engineer.md`      |
| 3     | QA Engineer          | `.claude/agents/qa-engineer.md`          |

---

## Phase 1 — Release Preparation

**Agent:** Documentation Writer (`.claude/agents/documentation-writer.md`)

**Invoke with:**

- Release type (Major / Minor / Patch / Hotfix)
- List of all features, bug fixes, and breaking changes included in this release
- Current version number
- Instruction: "Produce the release preparation artifacts."

**Objectives:**

- Determine the new version number following Semantic Versioning 2.0.0.
- Write the changelog entry for this release.
- Update version references in the codebase (package.json, pyproject.toml, or equivalent).
- For breaking changes: write a migration guide describing what consumers must change.

**Required Deliverables:**

- New Version Number — with SemVer justification (which component incremented and why).
- Changelog Entry — formatted as:
  ```
  ## [<version>] - <YYYY-MM-DD>

  ### Added
  - [New functionality]

  ### Changed
  - [Modified functionality — breaking changes marked with **BREAKING**]

  ### Fixed
  - [Bug fixes]

  ### Security
  - [Security fixes or improvements]

  ### Deprecated
  - [Functionality to be removed in a future version]
  ```
- Version File Updates — list of files updated with the new version number.
- Migration Guide — required for Major releases or any release with breaking changes. Empty section for others.

**Phase Complete When:**

- Version number is assigned and justified.
- Changelog entry is complete with all included changes.
- TD has validated the changelog against the known feature/fix list.

---

## Phase 2 — Deployment Planning

**Agent:** DevOps Engineer (`.claude/agents/devops-engineer.md`)

**Invoke with:**

- Release type and version number (Phase 1)
- Known infrastructure changes included in this release (if any)
- Instruction: "Produce the deployment plan for this release."

**Objectives:**

- Define the deployment strategy for this release (blue/green, rolling, canary, or recreate).
- Define the environment promotion flow: staging deployment first, then production.
- Define the smoke test acceptance criteria that must pass before production deployment proceeds.
- Define the rollback strategy and trigger conditions.
- Identify any maintenance window requirements.

**Required Deliverables:**

- Deployment Strategy — chosen pattern with justification.
- Environment Promotion Flow — sequence: dev → staging → production, with gates between stages.
- Smoke Test Criteria — list of critical paths that must be verified after deployment.
- Rollback Strategy — automated triggers and manual steps with estimated RTO.
- Maintenance Window — required or not, with justification.
- CI/CD Changes — any pipeline updates required for this release.

**Phase Complete When:**

- Deployment strategy is defined.
- Smoke test criteria are specified clearly enough for the QA Engineer.
- Rollback strategy is documented.
- TD has validated the deployment plan.

---

## Phase 3 — Smoke Test Plan

**Agent:** QA Engineer (`.claude/agents/qa-engineer.md`)

**Invoke with:**

- Phase 1 deliverables (Changelog — list of changes included)
- Phase 2 deliverables (Smoke Test Criteria)
- Instruction: "Produce the smoke test plan for this release."

**Objectives:**

- Design a focused smoke test plan that covers the critical paths for this release.
- Include tests for: new functionality, fixed bugs, and regression of core existing flows.
- Scope is intentionally narrow — smoke tests confirm "nothing is catastrophically broken," not full regression.

**Required Deliverables:**

- Smoke Test Plan — scope, objectives, and environment requirements.
- Smoke Test Cases — one per critical path in the Smoke Test Criteria from Phase 2, format: TC-ID / Steps / Expected Result / Pass/Fail.
- Regression Checklist — core existing flows that must not regress.
- Go / No-Go Recommendation — explicit: PROCEED TO PRODUCTION / HOLD with justification.

**Phase Complete When:**

- Smoke Test Plan is complete.
- Go / No-Go recommendation is issued based on staging results.
- TD has reviewed the recommendation.

---

## ⛔ APPROVAL GATE — Production Deployment

**The Technical Director must stop here.**

Before deploying to production, the TD must:

1. Present a consolidated release summary to the user containing:
   - Version number and changelog (Phase 1)
   - Deployment strategy and rollback plan (Phase 2)
   - Smoke test Go / No-Go recommendation from staging (Phase 3)

2. Ask the user explicitly:

   > "Staging deployment and smoke tests are complete. The release is ready for production. Do you authorize the production deployment?"

3. Wait for explicit user approval.

**Production deployment does not proceed without explicit user approval, even if all smoke tests pass.**

If the Go / No-Go from Phase 3 is HOLD, the TD must inform the user of the blocking issues before presenting the gate.

---

## Final Phase — Delivery Summary

**Agent:** Technical Director (self)

**The TD must verify:**

- [ ] Phase 1 executed — Version number, changelog, and migration guide produced.
- [ ] Phase 2 executed — Deployment plan and rollback strategy defined.
- [ ] Phase 3 executed — Smoke tests passed on staging, Go/No-Go issued.
- [ ] Approval Gate cleared — explicit user authorization for production deployment received.

**Final Output Format:**

```
## Release Delivery Summary

**Version:** [x.y.z]
**Release Type:** Major / Minor / Patch / Hotfix
**Status:** Complete / Partial / Blocked

### Release Artifacts
- Changelog: [location]
- Version files updated: [list]
- Migration guide: [location or "N/A"]

### Deployment
- Strategy: [blue/green / rolling / canary / recreate]
- Staging: ✅ Deployed and smoke-tested
- Production: ✅ Deployed / 🔄 Pending authorization / ❌ Blocked

### Smoke Test Results
[Summary of Pass/Fail per smoke test case]

### Rollback Procedure
[Link or one-sentence summary of rollback steps]

### Open Items
[Any post-release actions, monitoring to watch, or deferred work]
```

---

## Workflow Completion Criteria

This workflow is considered **complete** only when:

- All three phases were executed.
- Staging deployment succeeded and smoke tests passed.
- Approval Gate was cleared by the user.
- Production deployment completed successfully (or is confirmed pending, with explicit user acknowledgment).
- Technical Director has produced and presented the Final Delivery Summary.
