# 21 - Extend the adapter DSL with explicitly validated operations

**What to build:** After the golden demo is stable, assess and implement a narrowly approved extension such as copy, default, enum_map, or bounded cast with independent semantic tests.

**Blocked by:** [13 - Prove and rehearse the complete three-minute demo](13-golden-demo-release.md).

**Status:** ready-for-agent

**Priority:** P1 - optional after P0 acceptance is stable

**Owner:** Repair and safety engineer

**Applications/packages touched:** packages/contracts, packages/adapter-runtime, packages/repair, packages/validation.

**PRD traceability:** FR-REP-03, FR-REP-07, FR-REP-08.

## Acceptance criteria

- [ ] Choose only an operation required by an observed scenario and document its deterministic semantics before implementation.
- [ ] Version the extended contract; retain P0 rename/coalesce rejection behavior.
- [ ] Each operation has a bounded interpreter and independent canonical/workflow invariants.
- [ ] Do not broaden FR-REP-07 automatic eligibility silently; additional operations require an explicit new policy contract.
- [ ] No unchecked defaults or casts hide semantic drift; uncertain conversions remain held.

## Test scenarios

- Finite enum-map misses
- Null vs absent default/coalesce behavior
- Cast overflow/type ambiguity
- Unknown operation and version compatibility

Exercise public package seams with fixture-driven unit tests; use Fastify injection for applicable routes and a mocked API client for UI interactions. Show this ticket's observable result over the real provider HTTP boundary when relevant. Record only commands actually executed.

## API contracts

- [A10](../API_CATALOG.md#a10)
- [A11](../API_CATALOG.md#a11)

## Scope boundary

Do not start until the primary P0 acceptance test is stable. Keep this extension optional for the judge demo, and publish any required schema or policy extension before implementing it.

## Completion evidence

- [ ] Demonstrate the behavior and retain relevant API/test results.
- [ ] Run applicable typecheck, lint, build, and meaningful unit/integration checks.
- [ ] Record requirement IDs, model/fallback/stub source, files changed, commands/results, and remaining gaps.
- [ ] Update this ticket status and the index only after its criteria pass.
