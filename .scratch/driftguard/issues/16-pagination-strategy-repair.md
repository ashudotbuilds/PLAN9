# 16 - Validate an optional bounded pagination strategy

**What to build:** An operator reviews a bounded pagination strategy and proves that inventory synchronization retrieves the exact expected item set once.

**Blocked by:** [15 - Detect an inventory pagination protocol change](15-pagination-drift-detection.md).

**Status:** ready-for-agent

**Priority:** P1 - optional after P0 acceptance is stable

**Owner:** Repair and safety engineer

**Applications/packages touched:** packages/repair, packages/validation, apps/api, apps/web.

**PRD traceability:** FR-SIM-05, FR-OBS-06, FR-DET-06, FR-VAL-07.

## Acceptance criteria

- [ ] Define an explicitly approved strategy contract separately from the P0 rename/coalesce adapter DSL.
- [ ] Publish any contract extension and policy decision before implementation; never silently widen P0 operations.
- [ ] Validate exact item set, stable identity deduplication, termination, and bounded request count.
- [ ] Reject cursor loops, omissions, and repeated items; preserve prior strategy and evidence.
- [ ] Enable activation only with validated strategy hash and explicit compatible policy; otherwise present a safe migration proposal.

## Test scenarios

- Two-page and empty inventory
- Repeated cursor, duplicate item, omitted item
- Request limit and strategy modification after validation

Exercise public package seams with fixture-driven unit tests; use Fastify injection for applicable routes and a mocked API client for UI interactions. Show this ticket's observable result over the real provider HTTP boundary when relevant. Record only commands actually executed.

## API contracts

- [A10](../API_CATALOG.md#a10)
- [A11](../API_CATALOG.md#a11)
- [A12](../API_CATALOG.md#a12)
- [A13](../API_CATALOG.md#a13)

## Scope boundary

Do not start until the primary P0 acceptance test is stable. Keep this extension optional for the judge demo, and publish any required schema or policy extension before implementing it.

## Completion evidence

- [ ] Demonstrate the behavior and retain relevant API/test results.
- [ ] Run applicable typecheck, lint, build, and meaningful unit/integration checks.
- [ ] Record requirement IDs, model/fallback/stub source, files changed, commands/results, and remaining gaps.
- [ ] Update this ticket status and the index only after its criteria pass.
