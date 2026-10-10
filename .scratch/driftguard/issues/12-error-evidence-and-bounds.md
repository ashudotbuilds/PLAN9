# 12 - Keep failures bounded and explainable across the demo

**What to build:** Operators get useful evidence and stable errors even when a provider, model, or recovery stage fails.

**Blocked by:** [08 - Run recovery through one backend command](08-backend-recovery-run.md); [11 - Reset to a fresh session and preserve completed evidence](11-archive-reset-and-recapture.md); [33 - Enforce SDK privacy and failure isolation](33-sdk-privacy-failure-isolation.md).

**Status:** completed

**Planning readiness:** This is an authored backlog item, not implemented or execution-ready evidence. Inspect every blocker and its available contract before starting; no blocker is marked complete by this revision.

**Priority:** P0

**Owner:** `AnushkaBhardwaj15`

**GitHub issue:** [#12](https://github.com/ashudotbuilds/PLAN9/issues/12)

**Applications/packages touched:** apps/api, apps/web, packages/observer, packages/repair, packages/validation.

**PRD traceability:** FR-OPS-01, NFR-04, NFR-07, NFR-08, NFR-09, NFR-13, NFR-14, NFR-19, NFR-20, NFR-21, NFR-22, NFR-23. Sections 12.5, 13.1–13.2, 16.1, 22–23 of [DRIFTGUARD_PRD.md](../../../DRIFTGUARD_PRD.md).

## Acceptance criteria

- [x] Every response exposes X-Correlation-Id; errors contain stable code, safe message/details, and correlationId.
- [x] Bound response size, observation timeout, probe count, and replay execution; oversized/malformed responses preserve bounded evidence and hashes.
- [x] Redact authorization, cookies, keys, and configured fields before storage or optional model submission.
- [x] Audit run creation, proposal, validation, activation, replay, rollback, and reset with correlation and immutable hashes.
- [x] Logs and UI explain provider availability, model failure, validation timeout, and patch modification without invented success.
- [x] Missing live-model key disables only optional live generation; core recovery remains operational.

- [x] Integrate SDK/ingestion errors into the safe correlation envelope: 401/403, stale/conflicting 409, 413, 429 with bounded Retry-After, and 503 without partial accepted counters or fabricated success.
- [x] Verify numeric limits at SDK transport and API boundaries; distinguish diagnostics/telemetry loss from provider outage. Bound aggregate unauthenticated failure logs so rejected traffic cannot expand audit indefinitely.
- [x] Redact operator/ingestion credentials before logging and persistence; disclose TLS, durable tenancy, RBAC, and retention/deletion as production gates, not completed demo features.

## Test scenarios

- 400/404/409 and infrastructure errors follow envelope
- Configured secrets absent from persisted/model/UI data
- Malformed/large provider response and timeouts
- Audit append-only within session
- Measure seeded detection P95 and reset latency

- Injected persistence failure leaves no observation/counter/finding fragments
- Direct hostile evidence rejected/redacted before logging
- Bounded rejection aggregation under auth flood
- SDK outage/drop diagnostics remain separate from provider health

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

- [x] Demonstrate the behavior and retain relevant API/test results.
- [x] Run applicable typecheck, lint, build, and meaningful unit/integration checks.
- [x] Record requirement IDs, model/fallback/stub source, files changed, commands/results, and remaining gaps.
- [x] Update this ticket status and the index only after its criteria pass.
