# Constitution

# AI Development Framework — Engineering Constitution

This document defines the complete set of engineering rules that govern all work produced within this framework.
It is the technical authority for all agents. Every rule here is mandatory and enforceable.

The Technical Director treats this document, together with `CLAUDE.md`, as the highest authority in every session.
CLAUDE.md defines _how the framework operates_. This Constitution defines _what quality looks like_.

Rules in this Constitution complement — and never duplicate — the rules in `CLAUDE.md`.
Where both apply, the stricter rule governs.

---

## 1. Architecture

### 1.1 Module Boundaries

- A module may not import from another module's internal packages. Only public interfaces are crossed.
- Circular dependencies between modules are forbidden. Any detected cycle must be broken before merging.
- Shared domain types live in a dedicated `domain` or `model` package. No module redefines a type that already exists in the shared layer.
- Infrastructure concerns (database, HTTP client, message broker) are never imported directly in domain or application layer code. They are injected through interfaces.

### 1.2 Dependency Rules

- The dependency arrow always points inward: Infrastructure → Application → Domain.
- Domain layer has zero external library dependencies. It depends only on the standard library and internal interfaces.
- Any new third-party dependency requires: declared purpose, license check (MIT, Apache 2.0, or BSD only), and vulnerability scan result in the PR description.
- Dependencies pinned to an exact version or commit hash in lock files. Floating ranges (`^`, `~`, `*`) are forbidden in production manifests.

### 1.3 API Design

- All REST APIs follow resource-oriented design. URLs identify resources; HTTP methods express intent.
- URL paths use lowercase kebab-case. Query parameters use camelCase. JSON body fields use camelCase.
- Every API endpoint returns a consistent error envelope: `{ "error": { "code": string, "message": string, "details"?: object } }`.
- Pagination is mandatory for any endpoint that returns a collection. Default page size: 20. Maximum page size: 100.
- API versioning is path-based: `/v1/`, `/v2/`. A new version is created when a breaking change cannot be avoided.
- Deprecation notice must be in place for at least one minor release before a version is removed.

### 1.4 Database

- Every table has a primary key. Surrogate keys use UUID v4 or ULIDv2. Auto-increment integers are not used for new tables.
- Every table has `created_at` and `updated_at` timestamp columns with timezone. Soft-delete tables also have `deleted_at`.
- Migrations are forward-only. No rollback scripts. Every migration is idempotent.
- Indexes are defined at migration time alongside the table. No index is added ad hoc without a corresponding migration file.
- N+1 queries are forbidden. Any ORM query that touches a relationship must use eager loading or explicit joins.
- Raw SQL is allowed only in repository layer. Application and domain layers never write SQL.

---

## 2. Code

### 2.1 Naming

- Names are in the language of the project's domain, not the implementation technology.
- Boolean variables and functions are named to read as assertions: `isActive`, `hasPermission`, `canRetry`.
- Functions that perform side effects are named with verbs: `createUser`, `sendEmail`, `publishEvent`.
- Functions that return values without side effects are named with nouns or adjectives: `userById`, `activeSubscriptions`, `formatted`.
- Abbreviations are forbidden unless they are universally understood in the domain (e.g., `id`, `url`, `api`).

### 2.2 Function and Method Design

- Maximum function length: 40 lines of logic. Lines of comments do not count.
- Maximum cyclomatic complexity per function: 10. Any function exceeding this must be refactored.
- Functions with more than 4 parameters must use a parameter object instead.
- Functions must not produce observable side effects beyond what their name and signature imply.
- Pure functions are preferred. Functions with side effects must be clearly separated from functions without.

### 2.3 Error Handling

- Every error is either handled at the call site or explicitly propagated with added context.
- Errors are enriched with context as they propagate upward. A bare `throw err` or `return err` without context is not acceptable.
- Panic (or equivalent unrecoverable termination) is reserved for programmer errors detected at startup. It is never used for runtime conditions.
- User-facing error messages never expose internal details (stack traces, SQL queries, file paths, dependency names).
- All error codes returned by an API are documented in the API contract.

### 2.4 Comments

- Comments explain _why_, never _what_. Code that needs a comment to explain what it does is code that needs to be renamed.
- Every unexported regular expression, magic number, and non-obvious constant has a one-line comment explaining its origin or intent.
- No commented-out code is committed. Use version control history instead.

---

## 3. Tests

### 3.1 Coverage Requirements

- Minimum unit test line coverage for business logic: 90%.
- Every public function that contains branching logic has at least one test per branch.
- Every function listed in the Edge Cases section of the Requirements Analysis has a dedicated test.
- Tests for error paths are mandatory. A function with 3 error conditions has 3 corresponding error-path tests.

### 3.2 Test Structure

- Every test follows the Arrange / Act / Assert pattern. Each section is separated by a blank line.
- Test names follow the pattern: `should [expected behavior] when [condition]`.
- Tests are independent. No test depends on the execution of another test.
- Tests are deterministic. No test uses `time.Now()`, `Math.random()`, or any other non-seeded source of randomness directly. These are injected as dependencies and stubbed in tests.

### 3.3 Test Isolation

- Unit tests do not touch the network, file system, or any real external system.
- Integration tests run against a real database and a real message broker. Mocking a database in an integration test is forbidden.
- Test databases are isolated per test run using a unique schema or database name. Tests never share state across runs.
- Every test that creates data cleans up that data on completion — including on failure.

### 3.4 Test Quality

- An assertion that always passes is not a test. Every assertion must be capable of failing.
- Assertions on structure (e.g., `response is not null`) must be followed by assertions on content.
- `expect(true).toBe(true)` and equivalent vacuous assertions are forbidden.
- Tests do not `sleep` or use fixed delays. Async tests use explicit await or callback mechanisms.

---

## 4. Security

### 4.1 Input Validation

- All input is untrusted until validated. Validation happens at the system boundary — the API layer.
- Every API endpoint validates: presence of required fields, type correctness, value range and format.
- String inputs have explicit maximum length constraints enforced before processing.
- File uploads validate MIME type, file extension, and maximum file size before processing. MIME type is detected from file content, not the `Content-Type` header.

### 4.2 Authentication and Authorization

- Every protected endpoint verifies both authentication (who are you?) and authorization (are you allowed?) independently.
- Authorization checks are performed in the application layer, not the API routing layer.
- JWT tokens use RS256 or ES256 signing algorithms. HS256 with a shared secret is forbidden for inter-service tokens.
- Token expiry is enforced. A token without an `exp` claim is rejected.
- Session tokens are rotated after privilege escalation (e.g., after multi-factor authentication confirmation).

### 4.3 Data Protection

- PII fields (name, email, phone, address, tax ID, date of birth) are identified in the data model documentation.
- PII is never included in log output, error messages, or structured error responses.
- Data at rest: PII fields are encrypted at the column level, or the entire database uses encryption at rest with key rotation enabled.
- Data in transit: all communications use TLS 1.2 minimum. TLS 1.0 and 1.1 are disabled.
- Sensitive data (passwords, tokens, keys) is never returned in API responses after creation.

### 4.4 Dependency and Supply Chain

- All dependencies are scanned for known vulnerabilities before merging (OWASP Dependency-Check or equivalent).
- Critical and High CVEs in direct dependencies block the merge. Medium CVEs require documented justification.
- No dependency is sourced from an unverified or unofficial registry.

---

## 5. Performance

### 5.1 Response Time Budgets

- Synchronous API endpoints: P99 response time ≤ 500ms under expected load.
- Read-heavy list endpoints: P99 ≤ 200ms with pagination applied.
- File upload endpoints: P99 for metadata response ≤ 200ms. File transfer time is excluded.
- Background jobs and async tasks: no response time budget, but maximum execution time per job must be declared in the job definition.

### 5.2 Database Performance

- Every query touching more than one table must have EXPLAIN ANALYZE (or equivalent) results reviewed before merging.
- Full table scans on tables with more than 10,000 expected rows are forbidden without a corresponding index.
- Queries in a loop are forbidden. Batch operations use `IN` clauses or bulk insert/update APIs.
- Database connections are pooled. No code opens a connection directly from application logic.

### 5.3 Caching

- Caching is an explicit architectural decision documented in the Architecture Proposal.
- Cache TTL is declared at the definition site. No unbounded cache entries.
- Cache invalidation strategy is documented alongside the caching decision.
- Cached data is never used as the source of truth for write operations. Writes always go to the primary store.

### 5.4 Async and Queuing

- Any operation that may take longer than 1 second is executed asynchronously.
- Background jobs are idempotent. Re-running a job with the same inputs produces the same result and no side effects.
- Job queues have defined retry policies: maximum attempts, backoff strategy, and dead-letter destination.
- Dead-letter queue messages trigger an alert within 5 minutes of arrival.

---

## 6. Observability

### 6.1 Metrics

- Every service exposes a `/metrics` or equivalent endpoint compatible with Prometheus scraping.
- Standard metrics are instrumented by default: request count, request latency (P50, P95, P99), error rate, queue depth.
- Business metrics (e.g., orders created, payments processed) are instrumented as counters on the domain event handlers.
- Dashboards are provisioned as code alongside the service (Grafana JSON, CloudWatch dashboard JSON, or equivalent).

### 6.2 Distributed Tracing

- Every inbound HTTP request creates a trace span with the operation name, HTTP method, route, and status code.
- Outbound HTTP calls, database queries, and queue operations are child spans of the parent request span.
- Trace context is propagated across service boundaries using W3C TraceContext headers.
- Sampling rate for production: 10% for standard traffic. 100% for requests that result in 5xx errors.

### 6.3 Alerting

- Every service has at minimum: an error rate alert (threshold: > 1% of requests for > 2 minutes) and a latency alert (P99 > 1s for > 2 minutes).
- Alerts route to the on-call channel defined in the service's runbook.
- Every alert has a corresponding runbook entry explaining: what it means, how to diagnose it, and how to resolve it.
- Alerts are reviewed in every release cycle. Flapping alerts (trigger/resolve more than 3 times per week) are treated as defects.

---

## 7. Logging

### 7.1 Log Format

- All logs are structured JSON. Human-readable text logs are not acceptable in production services.
- Every log entry contains: `timestamp` (ISO 8601 UTC), `level`, `service`, `traceId`, `spanId`, `message`.
- Log entries for request handling include: `method`, `path`, `statusCode`, `durationMs`, `requestId`.

### 7.2 Log Levels

- `ERROR`: An unhandled condition that caused a request or job to fail. Always includes `error.message` and `error.stack`.
- `WARN`: A handled but unexpected condition that did not cause a failure but may indicate a problem.
- `INFO`: A normal, significant business event (e.g., `order.created`, `payment.processed`). Not emitted per request.
- `DEBUG`: Internal state useful during development. Not enabled in production by default.

### 7.3 What Must Be Logged

- Every unhandled exception — at ERROR level with full context.
- Every significant domain event — at INFO level (user created, order placed, payment completed).
- Every external service call failure — at ERROR level with the remote endpoint name and the error received.
- Every authentication failure — at WARN level with the reason but without credentials.

### 7.4 What Must Never Be Logged

- Passwords, tokens, API keys, private keys, or any credential — in any format.
- PII: full names, email addresses, phone numbers, tax IDs, dates of birth, or payment card data.
- Full HTTP request bodies or response bodies unless the service is explicitly designed for audit logging and the data is encrypted at rest.
- Internal stack traces in user-facing responses (they may appear in server-side logs at ERROR level).

---

## 8. Git

### 8.1 Branch Strategy

- `main` is always deployable. Every commit on `main` represents a known-good state.
- `develop` is the integration branch when one is used. It is the base for feature branches.
- Feature branches are cut from `main` (or `develop` if used) and merged back via pull request only.
- Hotfix branches are cut from the current release tag, not from `main`. After merge, the fix is also cherry-picked to `main`.

### 8.2 Branch Naming

- Feature: `feat/<ticket-id>-<short-description>` — e.g., `feat/PROJ-123-user-email-verification`
- Bug fix: `fix/<ticket-id>-<short-description>` — e.g., `fix/PROJ-456-login-session-expiry`
- Hotfix: `hotfix/<version>-<short-description>` — e.g., `hotfix/1.4.2-payment-timeout`
- Refactor: `refactor/<short-description>` — e.g., `refactor/extract-order-domain`
- Release: `release/<version>` — e.g., `release/2.1.0`
- Branch names are lowercase. Spaces are replaced with hyphens.

### 8.3 Branch Lifetime

- Feature branches must be merged or abandoned within 5 business days of creation.
- Branches inactive for more than 10 days are flagged for deletion by the Technical Director.
- Long-lived feature branches are replaced by feature flags in `main`.

---

## 9. Commits

### 9.1 Message Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

- `type` is one of: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`, `ci`, `revert`.
- `scope` identifies the module, service, or domain area affected: e.g., `auth`, `orders`, `payments`, `ci`.
- `description` is imperative mood, lowercase, no trailing period, 72 characters maximum.
- Body is wrapped at 72 characters. It explains _what changed and why_, not _how_.

### 9.2 Breaking Changes

- Breaking changes are marked with `!` after the type/scope: `feat(api)!: remove deprecated v1 endpoints`.
- Breaking changes require a `BREAKING CHANGE:` footer explaining the migration path.
- Breaking changes to public APIs require explicit user approval before the commit is written.

### 9.3 Commit Discipline

- One logical change per commit. Commits that mix unrelated changes are rejected during code review.
- Work-in-progress commits (`wip:`, `tmp:`, `checkpoint:`) must be squashed before the PR is approved.
- Commits that disable tests, skip linting, or add `@ts-ignore` / `// eslint-disable` require a comment explaining why in the commit body.

---

## 10. CI/CD

### 10.1 Required Checks

Every pull request must pass all of the following before merge is allowed:

1. Linting — zero warnings, zero errors.
2. Type checking — zero type errors.
3. Unit tests — 100% pass rate, coverage threshold met.
4. Integration tests — 100% pass rate.
5. Security scan — no Critical or High vulnerabilities in new or modified dependencies.
6. Build — artifact must be produced successfully.

### 10.2 Pipeline Rules

- CI pipelines run on every push to every branch. They are not optional on any branch.
- No step in the pipeline may be skipped via a commit flag without a corresponding tracking issue explaining why.
- Pipeline failures are the responsibility of the engineer who authored the failing commit. They must be resolved within 2 hours or the branch is reverted.
- Pipeline execution time target: under 10 minutes for the full pipeline. Steps exceeding 3 minutes individually are candidates for parallelization.

### 10.3 Deployment Gates

- Deployment to staging is automatic after a successful merge to `develop` (or `main` if no develop branch).
- Deployment to production is manual and requires: successful staging deployment, passing smoke test suite, and explicit approval from the Technical Director or designated release owner.
- Production deployments are performed during a declared deployment window. Emergency deployments outside the window require incident documentation.

### 10.4 Rollback

- Every production deployment is reversible within 5 minutes via a documented rollback procedure.
- The rollback procedure for each service is recorded in the service's runbook.
- Database migrations that are not backward compatible block automatic deployment — they require a multi-step deployment coordinated with the Technical Director.

---

## 11. Versioning

### 11.1 Semantic Versioning

- All services and libraries follow Semantic Versioning 2.0.0: `MAJOR.MINOR.PATCH`.
- `PATCH` is incremented for backward-compatible bug fixes.
- `MINOR` is incremented for backward-compatible new functionality.
- `MAJOR` is incremented for any breaking change.
- Pre-release versions use the suffix `-alpha.N`, `-beta.N`, or `-rc.N`.

### 11.2 Version Tagging

- Every release is tagged in git with the format `v<MAJOR>.<MINOR>.<PATCH>`.
- Tags are annotated (`git tag -a`), not lightweight. The annotation message is the release title.
- Tags are immutable. A tag is never moved after it is pushed to the remote.
- Hotfix releases increment `PATCH` and are tagged directly from the hotfix branch before merging.

---

## 12. Releases

### 12.1 Release Process

- A release branch `release/<version>` is cut from `main` when the release scope is finalized.
- Only bug fixes and documentation updates are committed to the release branch after it is cut.
- The release is tagged on the release branch. The branch is then merged into `main` and deleted.
- The changelog is updated as the final commit on the release branch before tagging.

### 12.2 Changelog Format

```markdown
## [<version>] - <YYYY-MM-DD>

### Added

- [Description of new functionality]

### Changed

- [Description of changed functionality — breaking changes flagged with **BREAKING**]

### Fixed

- [Description of bug fixed]

### Security

- [Description of security fix or improvement]

### Deprecated

- [Description of functionality that will be removed in a future version]
```

- Every changelog entry is written for the audience of an API consumer, not an internal developer.
- Entries reference the feature or bug by name, not by internal ticket number.
- The `Unreleased` section is maintained continuously in the changelog and is replaced with the version number at release time.

### 12.3 Hotfix Releases

- Hotfixes bypass the normal release branch process. They are cut directly from the release tag being fixed.
- Hotfix scope is limited strictly to the defect being fixed. No feature work is included.
- After a hotfix is released, a post-mortem entry is written in `.claude/agent-memory/incidents/` describing the root cause and prevention.

---

## 13. Documentation

### 13.1 Architecture Decision Records

- Every significant architectural decision is recorded as an ADR in `.claude/agent-memory/decisions/`.
- ADR file name format: `<NNNN>-<short-title>.md` — e.g., `0001-use-event-sourcing-for-orders.md`.
- ADR format:
  ```
  # <Title>
  Date: <YYYY-MM-DD>
  Status: Proposed | Accepted | Deprecated | Superseded by [NNNN]

  ## Context
  [The situation that forced a decision]

  ## Decision
  [The decision made]

  ## Rationale
  [Why this decision was made over alternatives]

  ## Trade-offs
  [What is gained and what is lost]

  ## Consequences
  [What changes as a result of this decision]
  ```
- ADRs are immutable after they reach `Accepted`. To reverse a decision, create a new ADR that supersedes it.

### 13.2 API Documentation

- API documentation is co-located with the service code, not in a separate repository.
- Every API endpoint is documented with: description, authentication requirement, request parameters with types and constraints, response body with all fields, and all possible error codes with their meaning.
- API documentation is updated in the same PR as the implementation. Documentation-only updates to describe unimplemented endpoints are forbidden.
- OpenAPI/Swagger specifications are generated from code annotations, not written by hand.

### 13.3 Runbooks

- Every service deployed to production has a runbook.
- Runbook minimum sections: Service Overview, Dependencies, Deployment, Rollback, Alert Runbook, Common Failure Modes.
- Runbooks are reviewed and validated at every release. Outdated runbooks are treated as defects.

---

## 14. Anti-Patterns

The following patterns are explicitly forbidden. Any code reviewer who identifies one of these must block the PR with a `Blocker` finding.

| Anti-Pattern                                  | Why It Is Forbidden                                                                                                     |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| God Object / God Class                        | Violates SRP. Becomes unmaintainable and untestable.                                                                    |
| Shotgun Surgery                               | A single logical change requires edits to many unrelated files. Indicates missing abstraction.                          |
| Primitive Obsession                           | Using raw strings and integers for domain concepts instead of value objects.                                            |
| Magic Numbers and Strings                     | Unnamed literal values embedded in logic. Replace with named constants.                                                 |
| Catch-All Exception Handlers                  | `catch (Exception e) {}` swallows errors and destroys observability.                                                    |
| Boolean Parameter Flags                       | Functions that behave differently based on a boolean argument should be two separate functions.                         |
| Anemic Domain Model                           | Domain objects that are pure data bags with no behavior. Business logic leaks into application or infrastructure layer. |
| Service Locator                               | Using a global registry to resolve dependencies instead of injecting them.                                              |
| Shared Mutable State                          | Global variables or singletons with mutable state shared across request boundaries.                                     |
| Polling Instead of Eventing                   | Checking a condition repeatedly on a timer when an event-driven approach is available.                                  |
| Direct Cross-Service Database Access          | A service reading from or writing to another service's database table.                                                  |
| Synchronous Communication for Fire-and-Forget | Using a blocking HTTP call for an operation that does not require an immediate response.                                |
| Logging PII                                   | Including any personally identifiable information in log output.                                                        |
| Secrets in Environment Variable Defaults      | `config.DB_PASSWORD = process.env.DB_PASSWORD \|\| 'password'`                                                          |
| Test Assertions on Mocks                      | `expect(mock.wasCalled()).toBe(true)` as the only assertion — no verification of actual behavior.                       |
