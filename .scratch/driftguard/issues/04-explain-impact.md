# 04 - Explain affected and unaffected workflows

**What to build:** A judge follows the changed provider field through its canonical mapping to only the workflows that actually consumed it.

**Blocked by:** [03 - Inject and detect a user field rename](03-inject-and-detect-user-drift.md).

**Status:** ready-for-agent

**Planning readiness:** This is an authored backlog item, not implemented or execution-ready evidence. Inspect every blocker and its available contract before starting; no blocker is marked complete by this revision.

**Priority:** P0

**Owner:** `saransh-sh`

**GitHub issue:** [#4](https://github.com/ashudotbuilds/PLAN9/issues/4)

**Applications/packages touched:** apps/api, apps/web, packages/lineage.

**PRD traceability:** FR-IMP-03, FR-IMP-04, FR-IMP-05, FR-UI-04, FR-LIN-01, FR-MON-01. Sections 13, 13.3, 21.1 (AT-SDK-11) of [DRIFTGUARD_PRD.md](../../../DRIFTGUARD_PRD.md).

## Acceptance criteria

- [ ] Analyze impact from stored runtime read edges and adapter mappings.
- [ ] Identify welcome_email and customer_profile for the rename; exclude inventory_sync and delivery_estimate.
- [ ] Each relationship shows changed behavior, canonical field, workflow, and invariant.
- [ ] Display a readable three-column trace with affected and unaffected results.

- [ ] Render provider→endpoint→declared client→canonical adapter→workflow paths with immutable evidence refs and runtime_read/declared/inferred/manually_configured provenance.
- [ ] Only runtime field reads prove consumed-field impact; manual SDK registration/metadata gives potential or unknown impact, never automatic-repair eligibility. Resolve every edge within the incident scope.

## Test scenarios

- Missing edges produce insufficient evidence rather than fabricated impact
- Nested reads map correctly
- Unrelated workflows remain excluded

- Declared and inferred edges cannot masquerade as confirmed consumed fields
- Cross-project/environment/session edges are excluded
- Missing lineage reads unknown rather than zero affected workflows

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
