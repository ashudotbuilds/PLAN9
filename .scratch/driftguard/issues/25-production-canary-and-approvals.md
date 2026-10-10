# 25 - Stage production activation and connect approval workflows

**What to build:** Roll a validated adapter through bounded canary traffic with an approval workflow and automatic rollback.

**Blocked by:** [13 - Prove and rehearse the complete three-minute demo](13-golden-demo-release.md).

**Status:** deferred - scope definition required

**Planning readiness:** This is an authored backlog item, not implemented or execution-ready evidence. Inspect every blocker and its available contract before starting; no blocker is marked complete by this revision.

**Priority:** P2 - outside the 24-hour demo

**Owner:** `chandrabhan-kushwaha`

**GitHub issue:** [#25](https://github.com/ashudotbuilds/PLAN9/issues/25)

**Applications/packages touched:** apps/api, packages/validation, packages/repair.

**PRD traceability:** NFR-23. Sections 8 (P2), 13.4, 22, 28 of [DRIFTGUARD_PRD.md](../../../DRIFTGUARD_PRD.md).

## Acceptance criteria

- [ ] Specify traffic routing, rollout limits, health oracle, approval actors, and recovery ownership.
- [ ] Approval remains unable to bypass deterministic validation.
- [ ] Bind canary, approval, and activation to immutable patch/evidence versions.
- [ ] Rollback on health regression; preserve audit and prior active version.

- [ ] Production release requires durable tenant/operator authorization, TLS, permitted egress and retention/deletion design before traffic rollout; passing the local P0 demo is insufficient.

## Test scenarios

- Stale approval/hash
- Canary failure and rollback
- Timeout and partial rollout

- Production gate refusal when deployment security prerequisites absent

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
