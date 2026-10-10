# 17 - Detect rate limits and propose safe bounded handling

**What to build:** An operator sees new 429 behavior and a retry recommendation that respects replay risk.

**Blocked by:** [13 - Prove and rehearse the complete three-minute demo](13-golden-demo-release.md).

**Status:** ready-for-agent

**Priority:** P1 - optional after P0 acceptance is stable

**Owner:** Detection engineer

**Applications/packages touched:** apps/mock-providers, packages/observer, packages/detector, apps/api, apps/web.

**PRD traceability:** FR-SIM-06, FR-OBS-06, FR-DET-06.

## Acceptance criteria

- [ ] Inject a named rate-limit scenario with optional Retry-After.
- [ ] Capture header/status changes and classify behavioral drift.
- [ ] Bound retries and delay under a fake clock; apply retry only to permitted read-only/idempotent operations.
- [ ] Never retry payment-like or non-idempotent actions.
- [ ] Explain exhaustion, missing/malformed Retry-After, and provider availability separately.

## Test scenarios

- 429 with seconds/date/absent/malformed Retry-After
- Retry count and duration limits
- Side-effecting workflow refusal

Exercise public package seams with fixture-driven unit tests; use Fastify injection for applicable routes and a mocked API client for UI interactions. Show this ticket's observable result over the real provider HTTP boundary when relevant. Record only commands actually executed.

## API contracts

- [A05](../API_CATALOG.md#a05)
- [A06](../API_CATALOG.md#a06)
- [A08](../API_CATALOG.md#a08)
- [M04](../API_CATALOG.md#m04)

## Scope boundary

Do not start until the primary P0 acceptance test is stable. Keep this extension optional for the judge demo, and publish any required schema or policy extension before implementing it.

## Completion evidence

- [ ] Demonstrate the behavior and retain relevant API/test results.
- [ ] Run applicable typecheck, lint, build, and meaningful unit/integration checks.
- [ ] Record requirement IDs, model/fallback/stub source, files changed, commands/results, and remaining gaps.
- [ ] Update this ticket status and the index only after its criteria pass.
