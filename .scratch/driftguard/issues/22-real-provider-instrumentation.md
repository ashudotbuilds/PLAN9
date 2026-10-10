# 22 - Design an opt-in production compatibility proxy or gateway

**What to build:** Design and then narrowly validate an opt-in production proxy/gateway for approved sandbox traffic, preserving correlation, redaction, observed behavior, validation, and rollback.

**Blocked by:** [13 - Prove and rehearse the complete three-minute demo](13-golden-demo-release.md).

**Status:** deferred - scope definition required

**Planning readiness:** This is an authored backlog item, not implemented or execution-ready evidence. Inspect every blocker and its available contract before starting; no blocker is marked complete by this revision.

**Priority:** P2 - outside the 24-hour demo

**Owner:** `chandrabhan-kushwaha`

**GitHub issue:** [#22](https://github.com/ashudotbuilds/PLAN9/issues/22)

**Applications/packages touched:** apps/api, packages/observer.

**PRD traceability:** FR-DIS-03, NFR-23. Sections 8 (P2), 13.4, 22, 28 of [DRIFTGUARD_PRD.md](../../../DRIFTGUARD_PRD.md).

## Acceptance criteria

- [ ] Define sandbox provider, consent, sampling, and resource budgets before implementation.
- [ ] Capture actual traffic without changing consumer outcomes.
- [ ] Maintain detector independence from provider controls.
- [ ] Validate against a sandbox workflow and bounded failure cases.

- [ ] Scope this brief to a future opt-in production proxy/gateway with approved routing, credential isolation, TLS, latency/traffic budgets, regional policy, availability choice, and bypass/rollback design.
- [ ] The P0 manual Node SDK/registration/ingestion belongs to tickets 28–35; the selected P1 client wrapper belongs to ticket 36. Neither is deferred by this brief.
- [ ] A reviewed threat model and sandbox consent are prerequisites; proxy delivery preserves exact hashes, validation policy, last-known-good versions, and provenance.

## Test scenarios

- Request/response parity
- Redaction and capture limits
- Provider timeout without altered application semantics

- Explicit routing consent and credential boundary
- Bypass/fail-open/fail-closed behavior with latency budget

Exercise public package seams with fixture-driven unit tests; use Fastify injection for applicable routes and a mocked API client for UI interactions. Show this ticket's observable result over the real provider HTTP boundary when relevant. Record only commands actually executed.

## API contracts

No additional approved API route. Define the required contract within this deferred scope before implementation; reuse the evidence and validation vocabulary.

## Scope boundary

This is a future feature brief, not an executable hackathon promise. Ticket 13 gates it on complete recovery plus connected SDK P0 acceptance; production release prerequisites remain separate. First settle provider scope, public contracts, policy, resource budgets, and independent validation data; then split implementation if it exceeds one context window.

## Completion evidence

- [ ] Demonstrate the behavior and retain relevant API/test results.
- [ ] Run applicable typecheck, lint, build, and meaningful unit/integration checks.
- [ ] Record requirement IDs, model/fallback/stub source, files changed, commands/results, and remaining gaps.
- [ ] Update this ticket status and the index only after its criteria pass.
