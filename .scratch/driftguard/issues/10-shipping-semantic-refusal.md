# 10 - Detect unchanged-schema shipping drift and hold repair

**What to build:** An operator sees a shipping meaning change detected by an approved canary and understands why automatic repair is held.

**Blocked by:** [04 - Explain affected and unaffected workflows](04-explain-impact.md); [06 - Validate candidate semantics and automatic eligibility](06-shadow-validation-and-policy.md).

**Status:** ready-for-agent

**Priority:** P0

**Owner:** Detection engineer

**Applications/packages touched:** apps/mock-providers, apps/api, apps/web, packages/detector, packages/lineage.

**PRD traceability:** FR-OBS-04, FR-DET-04, FR-SIM-03, FR-REP-05, FR-REP-08.

## Acceptance criteria

- [ ] GET estimate for ship_date 2026-10-09 and delivery_days 3 returns baseline 2026-10-12 and business-day drift 2026-10-14.
- [ ] Schema remains identical; stored deterministic oracle detects the changed result over HTTP.
- [ ] Impact identifies delivery_estimate using baseline reads.
- [ ] Set review_required with failing invariant and missing evidence; keep active adapter unchanged.
- [ ] Review can resume only with new evidence or revised fully validated proposal; P0 offers no activation bypass.

## Test scenarios

- Exact literal baseline/drift dates
- Unchanged shape still yields behavioral finding
- Shipping impact excludes user workflows
- Recovery attempt remains held and cannot activate

Exercise public package seams with fixture-driven unit tests; use Fastify injection for applicable routes and a mocked API client for UI interactions. Show this ticket's observable result over the real provider HTTP boundary when relevant. Record only commands actually executed.

## API contracts

- [A03](../API_CATALOG.md#a03)
- [A05](../API_CATALOG.md#a05)
- [A06](../API_CATALOG.md#a06)
- [A08](../API_CATALOG.md#a08)
- [A09](../API_CATALOG.md#a09)
- [A10](../API_CATALOG.md#a10)
- [A16](../API_CATALOG.md#a16)
- [M03](../API_CATALOG.md#m03)
- [M04](../API_CATALOG.md#m04)

## Scope boundary

Deliver the acceptance criteria as one observable slice. Preserve the PRD safety gates and keep speculative P1/P2 behavior outside this ticket.

## Completion evidence

- [ ] Demonstrate the behavior and retain relevant API/test results.
- [ ] Run applicable typecheck, lint, build, and meaningful unit/integration checks.
- [ ] Record requirement IDs, model/fallback/stub source, files changed, commands/results, and remaining gaps.
- [ ] Update this ticket status and the index only after its criteria pass.
