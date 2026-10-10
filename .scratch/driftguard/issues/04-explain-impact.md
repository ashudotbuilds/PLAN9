# 04 - Explain affected and unaffected workflows

**What to build:** A judge follows the changed provider field through its canonical mapping to only the workflows that actually consumed it.

**Blocked by:** [03 - Inject and detect a user field rename](03-inject-and-detect-user-drift.md).

**Status:** ready-for-agent

**Priority:** P0

**Owner:** Simulation and lineage engineer

**Applications/packages touched:** apps/api, apps/web, packages/lineage.

**PRD traceability:** FR-IMP-03, FR-IMP-04, FR-IMP-05, FR-UI-04.

## Acceptance criteria

- [ ] Analyze impact from stored runtime read edges and adapter mappings.
- [ ] Identify welcome_email and customer_profile for the rename; exclude inventory_sync and delivery_estimate.
- [ ] Each relationship shows changed behavior, canonical field, workflow, and invariant.
- [ ] Display a readable three-column trace with affected and unaffected results.

## Test scenarios

- Missing edges produce insufficient evidence rather than fabricated impact
- Nested reads map correctly
- Unrelated workflows remain excluded

Exercise public package seams with fixture-driven unit tests; use Fastify injection for applicable routes and a mocked API client for UI interactions. Show this ticket's observable result over the real provider HTTP boundary when relevant. Record only commands actually executed.

## API contracts

- [A09](../API_CATALOG.md#a09)
- [A08](../API_CATALOG.md#a08)

## Scope boundary

Deliver the acceptance criteria as one observable slice. Preserve the PRD safety gates and keep speculative P1/P2 behavior outside this ticket.

## Completion evidence

- [ ] Demonstrate the behavior and retain relevant API/test results.
- [ ] Run applicable typecheck, lint, build, and meaningful unit/integration checks.
- [ ] Record requirement IDs, model/fallback/stub source, files changed, commands/results, and remaining gaps.
- [ ] Update this ticket status and the index only after its criteria pass.
