# 23 - Observe webhook and MCP behavior

**What to build:** Extend observation to webhook payloads and MCP tool outcomes using the same evidence and validation vocabulary.

**Blocked by:** [13 - Prove and rehearse the complete three-minute demo](13-golden-demo-release.md).

**Status:** deferred - scope definition required

**Planning readiness:** This is an authored backlog item, not implemented or execution-ready evidence. Inspect every blocker and its available contract before starting; no blocker is marked complete by this revision.

**Priority:** P2 - outside the 24-hour demo

**Owner:** `soumya240806`

**GitHub issue:** [#23](https://github.com/ashudotbuilds/PLAN9/issues/23)

**Applications/packages touched:** packages/contracts, packages/observer, packages/detector.

**PRD traceability:** FR-DIS-03, NFR-23. Sections 8 (P2), 13.3–13.4, 22, 28 of [DRIFTGUARD_PRD.md](../../../DRIFTGUARD_PRD.md).

## Acceptance criteria

- [ ] Specify supported webhook events and MCP transport/tool boundaries before implementation.
- [ ] Represent payload, error, ordering, and tool behavior in versioned observations.
- [ ] Define canonical consumer invariants and demonstrate one safe compatibility scenario.
- [ ] Preserve authentication and replay semantics; hold side-effecting tool repair.

- [ ] Generalized authenticated webhook/MCP production transports need a separate design/threat model; ticket 41's optional mock MCP fixture is excluded from this P2 implementation scope.

## Test scenarios

- Webhook duplicates and event ordering
- MCP schema-valid behavioral drift
- Authentication and unsafe replay refusal

- Generalized transport authorization and egress limits independent of mock fixture

Exercise public package seams with fixture-driven unit tests; use Fastify injection for applicable routes and a mocked API client for UI interactions. Show this ticket's observable result over the real provider HTTP boundary when relevant. Record only commands actually executed.

## API contracts

No additional approved API route. Define the required contract within this deferred scope before implementation; reuse the evidence and validation vocabulary.

## Scope boundary

This is a future feature brief, not an executable hackathon promise. Ticket 13 gates it on complete recovery plus connected SDK P0 acceptance; production release prerequisites remain separate. First settle provider scope, public contracts, policy, resource budgets, and independent validation data; then split implementation if it exceeds one context window.

## Completion evidence

- [ ] Demonstrate the behavior and retain relevant API/test results.
- [ ] Run applicable typecheck, lint, build, and meaningful unit/integration checks.
- [ ] Record requirement IDs, model/fallback/stub source, files changed, commands/results, and remaining gaps.
- [ ] Update this ticket status and the index only after its criteria pass.
