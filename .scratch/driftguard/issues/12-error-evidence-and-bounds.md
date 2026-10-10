# 12 - Keep failures bounded and explainable across the demo

**What to build:** Operators get useful evidence and stable errors even when a provider, model, or recovery stage fails.

**Blocked by:** [08 - Run recovery through one backend command](08-backend-recovery-run.md); [11 - Reset to a fresh session and preserve completed evidence](11-archive-reset-and-recapture.md).

**Status:** ready-for-agent

**Priority:** P0

**Owner:** QA and reliability engineer

**Applications/packages touched:** apps/api, apps/web, packages/observer, packages/repair, packages/validation.

**PRD traceability:** FR-OPS-01, NFR-04, NFR-07, NFR-08, NFR-09, NFR-13, NFR-14.

## Acceptance criteria

- [ ] Every response exposes X-Correlation-Id; errors contain stable code, safe message/details, and correlationId.
- [ ] Bound response size, observation timeout, probe count, and replay execution; oversized/malformed responses preserve bounded evidence and hashes.
- [ ] Redact authorization, cookies, keys, and configured fields before storage or optional model submission.
- [ ] Audit run creation, proposal, validation, activation, replay, rollback, and reset with correlation and immutable hashes.
- [ ] Logs and UI explain provider availability, model failure, validation timeout, and patch modification without invented success.
- [ ] Missing live-model key disables only optional live generation; core recovery remains operational.

## Test scenarios

- 400/404/409 and infrastructure errors follow envelope
- Configured secrets absent from persisted/model/UI data
- Malformed/large provider response and timeouts
- Audit append-only within session
- Measure seeded detection P95 and reset latency

Exercise public package seams with fixture-driven unit tests; use Fastify injection for applicable routes and a mocked API client for UI interactions. Show this ticket's observable result over the real provider HTTP boundary when relevant. Record only commands actually executed.

## API contracts

- [A01](../API_CATALOG.md#a01)
- [A02](../API_CATALOG.md#a02)
- [A06](../API_CATALOG.md#a06)
- [A08](../API_CATALOG.md#a08)
- [A17](../API_CATALOG.md#a17)

## Scope boundary

Deliver the acceptance criteria as one observable slice. Preserve the PRD safety gates and keep speculative P1/P2 behavior outside this ticket.

## Completion evidence

- [ ] Demonstrate the behavior and retain relevant API/test results.
- [ ] Run applicable typecheck, lint, build, and meaningful unit/integration checks.
- [ ] Record requirement IDs, model/fallback/stub source, files changed, commands/results, and remaining gaps.
- [ ] Update this ticket status and the index only after its criteria pass.
