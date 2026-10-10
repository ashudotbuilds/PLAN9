# 13 - Prove and rehearse the complete three-minute demo

**What to build:** A teammate starts the project from documented setup and completes two repeatable judge demos with executed evidence.

**Blocked by:** [09 - Operate and inspect recovery from the dashboard](09-operational-recovery-dashboard.md); [10 - Detect unchanged-schema shipping drift and hold repair](10-shipping-semantic-refusal.md); [11 - Reset to a fresh session and preserve completed evidence](11-archive-reset-and-recapture.md); [12 - Keep failures bounded and explainable across the demo](12-error-evidence-and-bounds.md).

**Status:** ready-for-agent

**Priority:** P0

**Owner:** QA and reliability engineer

**Applications/packages touched:** apps/web, apps/api, apps/mock-providers, packages/test-kit.

**PRD traceability:** NFR-02, NFR-04, NFR-10, NFR-16, FR-OPS-03.

## Acceptance criteria

- [ ] Primary PRD acceptance test passes through backend APIs with all three identities.
- [ ] Offline fallback, wrong patch rejection, no approval bypass, infrastructure isolation, automatic rollback, and fresh reset pass.
- [ ] Show healthy baseline, user drift, exact impact, backend safe recovery, unchanged-schema shipping hold, audit, and rollback within three minutes.
- [ ] Two consecutive full rehearsals succeed in presentation environment.
- [ ] README records startup, environment placeholders, offline mode, demo steps, measured results, and limitations.
- [ ] Run one browser golden test if time permits; otherwise execute API smoke and record a manual UI rehearsal.
- [ ] No P1 starts before primary acceptance passes; freeze features at hour 19.

## Test scenarios

- Full API golden path
- Two reset/rehearsal cycles
- Keyboard and accessible status smoke
- Typecheck, lint, build, applicable integration suite

Exercise public package seams with fixture-driven unit tests; use Fastify injection for applicable routes and a mocked API client for UI interactions. Show this ticket's observable result over the real provider HTTP boundary when relevant. Record only commands actually executed.

## API contracts

- [A01](../API_CATALOG.md#a01)
- [A02](../API_CATALOG.md#a02)
- [A03](../API_CATALOG.md#a03)
- [A04](../API_CATALOG.md#a04)
- [A05](../API_CATALOG.md#a05)
- [A06](../API_CATALOG.md#a06)
- [A07](../API_CATALOG.md#a07)
- [A08](../API_CATALOG.md#a08)
- [A09](../API_CATALOG.md#a09)
- [A10](../API_CATALOG.md#a10)
- [A11](../API_CATALOG.md#a11)
- [A12](../API_CATALOG.md#a12)
- [A13](../API_CATALOG.md#a13)
- [A15](../API_CATALOG.md#a15)
- [A16](../API_CATALOG.md#a16)
- [A17](../API_CATALOG.md#a17)

## Scope boundary

Deliver the acceptance criteria as one observable slice. Preserve the PRD safety gates and keep speculative P1/P2 behavior outside this ticket.

## Completion evidence

- [ ] Demonstrate the behavior and retain relevant API/test results.
- [ ] Run applicable typecheck, lint, build, and meaningful unit/integration checks.
- [ ] Record requirement IDs, model/fallback/stub source, files changed, commands/results, and remaining gaps.
- [ ] Update this ticket status and the index only after its criteria pass.
