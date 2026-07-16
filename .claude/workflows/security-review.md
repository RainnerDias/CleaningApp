# Workflow: Security Review

## Purpose

This workflow defines the mandatory execution process for security audits, threat model assessments, and vulnerability evaluations of a system, feature, or codebase.

This file is loaded and executed by the **Technical Director** agent.
The TD reads this file, builds the execution plan, and invokes each phase's agent automatically.

---

## Execution Model

The Technical Director must:

1. Read this workflow in full before doing anything.
2. Identify the scope of the review: is it a single feature, a module, a service, or the full system?
3. Build the execution plan.
4. Execute phases in order.
5. Produce the Final Summary after all phases are complete.

There is **no Approval Gate** in this workflow. The security review itself produces actionable findings that the user must address. The TD presents findings grouped by severity and required actions.

---

## Agent Registry

| Phase | Agent             | File                                  |
| ----- | ----------------- | ------------------------------------- |
| 1     | Security Engineer | `.claude/agents/security-engineer.md` |

---

## Phase 1 — Security Review

**Agent:** Security Engineer (`.claude/agents/security-engineer.md`)

**Invoke with:**

- The scope of the review: code, architecture diagram, API contracts, or system description
- Context: environment (web, mobile, API, microservice), tech stack, authentication mechanism, and data sensitivity
- Instruction: "Perform a full security review of the provided scope."

**Objectives:**

- Perform a STRIDE threat model of the reviewed scope.
- Identify vulnerabilities across the full OWASP Top 10.
- Review authentication and authorization mechanisms.
- Review secrets management and credential handling.
- Review input validation and output encoding.
- Review cryptographic implementations.
- Review dependency security.
- Produce a prioritized, actionable remediation plan.

**Required Deliverables:**

### Threat Analysis (STRIDE)

- **Spoofing** — identity spoofing threats with attack vector and likelihood.
- **Tampering** — data and code integrity threats.
- **Repudiation** — logging and audit trail gaps.
- **Information Disclosure** — data exposure risks.
- **Denial of Service** — availability threats.
- **Elevation of Privilege** — privilege escalation paths.

### Risk Register

Prioritized table of findings:

| Severity | Risk Title | Affected Component | Attack Vector | Business Impact |
| -------- | ---------- | ------------------ | ------------- | --------------- |
| Critical | ...        | ...                | ...           | ...             |

Severity scale: Critical / High / Medium / Low / Informational.

### Security Recommendations

For each finding: description, evidence (location or configuration), concrete fix, priority (Immediate/Short-term/Long-term), and confirmation that the fix preserves business logic.

### OWASP Review

Full mapping to OWASP Top 10 (current edition) with Pass / Fail / Warning per category.

### Hardening Checklist

Actionable checklist covering: authentication, authorization, secrets management, transport security, input validation, logging, dependency security — specific to the reviewed system.

### Security Approval

Explicit overall verdict:

- **PASS** — no Critical or High findings. System is approved for the current scope.
- **CONDITIONAL PASS** — Medium findings only. System may proceed with documented remediation plan.
- **FAIL** — Critical or High findings present. Must be resolved before release.

**Phase Complete When:**

- All five deliverable sections are produced.
- Every Critical and High finding has a concrete remediation recommendation.
- Security Approval verdict is issued.
- TD has reviewed the full report.

---

## Final Phase — Delivery Summary

**Agent:** Technical Director (self)

**The TD must verify:**

- [ ] Phase 1 executed — Full security review with STRIDE, Risk Register, OWASP Review, and Hardening Checklist produced.
- [ ] Security Approval verdict issued.

**Final Output Format:**

```
## Security Review Summary

**Scope:** [What was reviewed]
**Overall Verdict:** PASS / CONDITIONAL PASS / FAIL

### Finding Summary
| Severity | Count |
|---|---|
| Critical | N |
| High | N |
| Medium | N |
| Low | N |
| Informational | N |

### Critical and High Findings (must be resolved)
[List with title and recommended fix for each]

### OWASP Top 10 Status
[Table with Pass/Fail/Warning per category]

### Required Actions Before Release
[Prioritized list of remediation items — empty if verdict is PASS]

### Recommended Monitoring
[Alerts or logging improvements to detect future exploits]
```

---

## Workflow Completion Criteria

This workflow is considered **complete** only when:

- Security Review was executed in full.
- Security Approval verdict is issued.
- All Critical and High findings have documented remediation plans.
- Technical Director has produced and presented the Final Delivery Summary.
- If verdict is FAIL: the user has been explicitly informed that release is blocked pending remediation.
