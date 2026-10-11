# 17 - Detect rate limits and propose safe bounded handling

**What to build:** An operator sees new 429 behavior and a retry recommendation that respects replay risk.

**Blocked by:** [13 - Prove and rehearse the complete three-minute demo](13-golden-demo-release.md).

**Status:** completed

**Planning readiness:** Fully implemented, verified with comprehensive unit and contract tests across packages/contracts, packages/observer, apps/mock-providers, apps/api, and apps/web.

**Priority:** P1 - optional after P0 acceptance is stable

**Owner:** `ashudotbuilds`

**GitHub issue:** [#17](https://github.com/ashudotbuilds/PLAN9/issues/17)

**Applications/packages touched:** apps/mock-providers, packages/observer, packages/detector, apps/api, apps/web.

**PRD traceability:** FR-SIM-06, FR-OBS-06, FR-DET-06, FR-MON-01, NFR-19. Sections 12.5, 13.3, 23 of [DRIFTGUARD_PRD.md](../../../DRIFTGUARD_PRD.md).

## Acceptance criteria

- [x] Inject a named rate-limit scenario with optional Retry-After.
- [x] Capture header/status changes and classify behavioral drift.
- [x] Bound retries and delay under a fake clock; apply retry only to permitted read-only/idempotent operations.
- [x] Never retry payment-like or non-idempotent actions.
- [x] Explain exhaustion, missing/malformed Retry-After, and provider availability separately.

- [x] Separate provider rate-limit behavior analysis from the P0 SDK-to-control-plane transport retry bounds already required by tickets 32–33. One scoped 429 is evidence, not automatic provider-wide confirmation.

## Test scenarios

- 429 with seconds/date/absent/malformed Retry-After
- Retry count and duration limits
- Side-effecting workflow refusal

- SDK ingestion 429 does not become external provider drift
- Single response remains limited/suspected evidence

Exercise public package seams with fixture-driven unit tests; use Fastify injection for applicable routes and a mocked API client for UI interactions. Show this ticket's observable result over the real provider HTTP boundary when relevant. Record only commands actually executed.

## API contracts

- [A05](../API_CATALOG.md#a05)
- [A06](../API_CATALOG.md#a06)
- [A08](../API_CATALOG.md#a08)
- [M04](../API_CATALOG.md#m04)

## Scope boundary

Do not start until ticket 13 verifies both the original section 21 recovery test and all connected SDK gates in section 21.1, with remaining time before the hour-19 freeze. Keep this extension optional for the judge demo, and publish any required schema or policy extension before implementing it.

## Completion evidence

- [x] Demonstrate the behavior and retain relevant API/test results.
- [x] Run applicable typecheck, lint, build, and meaningful unit/integration checks.
- [x] Record requirement IDs, model/fallback/stub source, files changed, commands/results, and remaining gaps.
- [x] Update this ticket status and the index only after its criteria pass.
