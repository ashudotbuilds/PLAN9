# 15 - Detect an inventory pagination protocol change

**What to build:** An operator switches inventory from page-number to cursor responses and sees a behavior finding with only inventory_sync affected.

**Blocked by:** [13 - Prove and rehearse the complete three-minute demo](13-golden-demo-release.md).

**Status:** ready-for-agent

**Priority:** P1 - optional after P0 acceptance is stable

**Owner:** Detection engineer

**Applications/packages touched:** apps/mock-providers, packages/observer, packages/detector, apps/api, apps/web.

**PRD traceability:** FR-SIM-05, FR-OBS-06, FR-DET-06.

## Acceptance criteria

- [ ] Inject inventory.cursor-pagination over HTTP controls.
- [ ] Observe ordering, page metadata, cursor termination, and request-response evidence.
- [ ] Classify pagination drift independently of a model.
- [ ] Trace only inventory_sync through its canonical read edges.
- [ ] Keep automatic adaptation held because P0 DSL cannot express request pagination changes.

## Test scenarios

- Stable page baseline vs cursor transition
- Repeated/empty cursor, missing metadata
- No user/shipping false positive

Exercise public package seams with fixture-driven unit tests; use Fastify injection for applicable routes and a mocked API client for UI interactions. Show this ticket's observable result over the real provider HTTP boundary when relevant. Record only commands actually executed.

## API contracts

- [A05](../API_CATALOG.md#a05)
- [A06](../API_CATALOG.md#a06)
- [A08](../API_CATALOG.md#a08)
- [A09](../API_CATALOG.md#a09)
- [M02](../API_CATALOG.md#m02)
- [M04](../API_CATALOG.md#m04)

## Scope boundary

Do not start until the primary P0 acceptance test is stable. Keep this extension optional for the judge demo, and publish any required schema or policy extension before implementing it.

## Completion evidence

- [ ] Demonstrate the behavior and retain relevant API/test results.
- [ ] Run applicable typecheck, lint, build, and meaningful unit/integration checks.
- [ ] Record requirement IDs, model/fallback/stub source, files changed, commands/results, and remaining gaps.
- [ ] Update this ticket status and the index only after its criteria pass.
