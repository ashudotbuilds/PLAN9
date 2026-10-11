# 16 - Validate an optional bounded pagination strategy

**What to build:** An operator reviews a bounded pagination strategy and proves that inventory synchronization retrieves the exact expected item set once.

**Blocked by:** [15 - Detect an inventory pagination protocol change](15-pagination-drift-detection.md).

**Status:** completed

**Planning readiness:** This is an authored backlog item, not implemented or execution-ready evidence. Inspect every blocker and its available contract before starting; no blocker is marked complete by this revision.

**Priority:** P1 - optional after P0 acceptance is stable

**Owner:** `saransh-sh`

**GitHub issue:** [#16](https://github.com/ashudotbuilds/PLAN9/issues/16)

**Applications/packages touched:** packages/repair, packages/validation, apps/api, apps/web.

**PRD traceability:** FR-SIM-05, FR-OBS-06, FR-DET-06, FR-VAL-07, NFR-20. Sections 13, 13.4, 22 of [DRIFTGUARD_PRD.md](../../../DRIFTGUARD_PRD.md).

## Acceptance criteria

- [x] Define an explicitly approved strategy contract separately from the P0 rename/coalesce adapter DSL.
- [x] Publish any contract extension and policy decision before implementation; never silently widen P0 operations.
- [x] Validate exact item set, stable identity deduplication, termination, and bounded request count.
- [x] Reject cursor loops, omissions, and repeated items; preserve prior strategy and evidence.
- [x] Enable activation only with validated strategy hash and explicit compatible policy; otherwise present a safe migration proposal.

- [x] Bind approved strategy/evidence/hash and activation to recorded scope and operator authorization; keep unsafe request changes held and avoid introducing a production proxy under this ticket.

## Test scenarios

- Two-page and empty inventory
- Repeated cursor, duplicate item, omitted item
- Request limit and strategy modification after validation

- Foreign-scope strategy hash and evidence cannot authorize activation

Exercise public package seams with fixture-driven unit tests; use Fastify injection for applicable routes and a mocked API client for UI interactions. Show this ticket's observable result over the real provider HTTP boundary when relevant. Record only commands actually executed.

## API contracts

- [A10](../API_CATALOG.md#a10)
- [A11](../API_CATALOG.md#a11)
- [A12](../API_CATALOG.md#a12)
- [A13](../API_CATALOG.md#a13)

## Scope boundary

Do not start until ticket 13 verifies both the original section 21 recovery test and all connected SDK gates in section 21.1, with remaining time before the hour-19 freeze. Keep this extension optional for the judge demo, and publish any required schema or policy extension before implementing it.

## Completion evidence

- [x] Demonstrate the behavior and retain relevant API/test results.
- [x] Run applicable typecheck, lint, build, and meaningful unit/integration checks.
- [x] Record requirement IDs, model/fallback/stub source, files changed, commands/results, and remaining gaps.
- [x] Update this ticket status and the index only after its criteria pass.
