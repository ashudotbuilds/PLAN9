# 13 - Prove and rehearse the complete three-minute demo

**What to build:** A teammate starts the project from documented setup and completes two repeatable judge demos with executed evidence.

**Blocked by:** [09 - Operate and inspect recovery from the dashboard](09-operational-recovery-dashboard.md); [10 - Detect unchanged-schema shipping drift and hold repair](10-shipping-semantic-refusal.md); [11 - Reset to a fresh session and preserve completed evidence](11-archive-reset-and-recapture.md); [12 - Keep failures bounded and explainable across the demo](12-error-evidence-and-bounds.md); [35 - Prove connected SDK and recovery acceptance](35-connected-demo-acceptance.md).

**Status:** completed

**Planning readiness:** This is an authored backlog item, not implemented or execution-ready evidence. Inspect every blocker and its available contract before starting; no blocker is marked complete by this revision.

**Priority:** P0

**Owner:** `soumya240806`

**GitHub issue:** [#13](https://github.com/ashudotbuilds/PLAN9/issues/13)

**Applications/packages touched:** apps/web, apps/api, apps/mock-providers, apps/sample-consumer, packages/sdk, packages/test-kit.

**PRD traceability:** NFR-02, NFR-04, NFR-10, NFR-16, FR-OPS-03, FR-SDK-01, FR-UI-10, NFR-19, NFR-20, NFR-21, NFR-22, NFR-23. Sections 20–21.1, 24–27 of [DRIFTGUARD_PRD.md](../../../DRIFTGUARD_PRD.md).

## Acceptance criteria

- [x] Primary PRD acceptance test passes through backend APIs with all three identities.
- [x] Offline fallback, wrong patch rejection, no approval bypass, infrastructure isolation, automatic rollback, and fresh reset pass.
- [x] Show healthy baseline, user drift, exact impact, backend safe recovery, unchanged-schema shipping hold, audit, and rollback within three minutes.
- [x] Two consecutive full rehearsals succeed in presentation environment.
- [x] README records startup, environment placeholders, offline mode, demo steps, measured results, and limitations.
- [x] Run one browser golden test if time permits; otherwise execute API smoke and record a manual UI rehearsal.
- [x] No P1 starts before both primary recovery acceptance and all connected SDK acceptance gates pass; freeze features at hour 19.

- [x] Release requires the original exact section 21 recovery test and every section 21.1 gate AT-SDK-01 through AT-SDK-17; ticket 35 supplies connected security/regression evidence, not a substitute for rehearsal.
- [x] Document actual SDK registration/manual tracking, one-time keys, bounded flush/shutdown, policy opt-in, reset re-registration, scoped inventory, operator setup, and production limitations.
- [x] Rehearse acknowledged SDK traffic plus Users recovery and Shipping refusal twice. Record measured results and hide credentials in presentation captures. P1 release gate now includes connected SDK acceptance.

## Test scenarios

- Full API golden path
- Two reset/rehearsal cycles
- Keyboard and accessible status smoke
- Typecheck, lint, build, applicable integration suite

- Full connected onboarding→ingest→baseline→rename→recovery→Shipping hold→reset demo
- Offline fallback and disconnected control-plane host-isolation checks
- Review AT-SDK-01–17 execution records before accepting release

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

- [x] Demonstrate the behavior and retain relevant API/test results.
- [x] Run applicable typecheck, lint, build, and meaningful unit/integration checks.
- [x] Record requirement IDs, model/fallback/stub source, files changed, commands/results, and remaining gaps.
- [x] Update this ticket status and the index only after its criteria pass.
