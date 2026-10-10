# 02 - Capture a healthy baseline and trace workflow reads

**What to build:** An operator captures actual provider responses and workflow results into a versioned baseline, with evidence showing which canonical fields each workflow read.

**Blocked by:** [01 - Start a healthy demo across three applications](01-healthy-demo-startup.md); [28 - Establish local operator and project onboarding](28-local-project-onboarding.md).

**Status:** ready-for-agent

**Planning readiness:** This is an authored backlog item, not implemented or execution-ready evidence. Inspect every blocker and its available contract before starting; no blocker is marked complete by this revision.

**Priority:** P0

**Owner:** `saransh-sh`

**GitHub issue:** [#2](https://github.com/ashudotbuilds/PLAN9/issues/2)

**Applications/packages touched:** apps/api, apps/web, packages/observer, packages/lineage, packages/adapter-runtime.

**PRD traceability:** FR-OBS-01, FR-OBS-02, FR-OBS-03, FR-OBS-05, FR-IMP-01, FR-IMP-02, NFR-03, NFR-09, NFR-14, FR-LIN-01, FR-MON-01, FR-ING-02, NFR-21, NFR-22. Sections 12.6, 13, 13.2–13.3, 16 of [DRIFTGUARD_PRD.md](../../../DRIFTGUARD_PRD.md).

## Acceptance criteria

- [ ] Capture all three user identities and the inventory/shipping fixtures over HTTP.
- [ ] Baseline adapter maps name to CanonicalUser.displayName; canonical user contains id and displayName.
- [ ] welcome_email records a stubbed intent with a nonempty baseline-equal recipientName; customer_profile returns baseline-equal id and displayName.
- [ ] inventory_sync and delivery_estimate also have explicit inputs and invariants; runtime reads persist dependency edges.
- [ ] Raw evidence stays immutable; redaction occurs before persistence, and normalization creates a separate derived record.
- [ ] A second equivalent capture produces equivalent fingerprints despite approved volatile fields.

- [ ] Baseline capture resolves operator-authorized project/environment/session scope, acquires the shared mock demo lease atomically, and refuses another scope with 409 DEMO_SCOPE_BUSY.
- [ ] Store sanitized immutable captures and independent baseline/latest versions with source, policy version, endpoint, fixture context, and evidence references. Never promote registration or metadata-only SDK events to known-good baselines.
- [ ] Runtime field-read edges carry scope/provenance; declared edges stay distinct. Enforce the 1,000-observation/10 MiB session retention bound without evicting linked baseline evidence.

## Test scenarios

- Missing or malformed provider response
- Nested field reads and untouched workflows
- Volatile-field normalization and redaction
- Partial capture never claims a complete baseline

- Two scopes compete for baseline lease; losing scope persists no baseline
- Different policy/fixture context never creates false hidden-versus-missing drift
- Retention limit refuses new capture rather than deleting proof

Exercise public package seams with fixture-driven unit tests; use Fastify injection for applicable routes and a mocked API client for UI interactions. Show this ticket's observable result over the real provider HTTP boundary when relevant. Record only commands actually executed.

## API contracts

- [A02](../API_CATALOG.md#a02)
- [A03](../API_CATALOG.md#a03)
- [A15](../API_CATALOG.md#a15)

## Scope boundary

Deliver the acceptance criteria as one observable slice. Preserve the PRD safety gates and keep speculative P1/P2 behavior outside this ticket.

## Completion evidence

- [ ] Demonstrate the behavior and retain relevant API/test results.
- [ ] Run applicable typecheck, lint, build, and meaningful unit/integration checks.
- [ ] Record requirement IDs, model/fallback/stub source, files changed, commands/results, and remaining gaps.
- [ ] Update this ticket status and the index only after its criteria pass.
