# 26 - Isolate production organizations and enforce tenant policy

**What to build:** Give separate organizations isolated provider evidence, policies, adapters, and audit access.

**Blocked by:** [13 - Prove and rehearse the complete three-minute demo](13-golden-demo-release.md).

**Status:** deferred - scope definition required

**Planning readiness:** This is an authored backlog item, not implemented or execution-ready evidence. Inspect every blocker and its available contract before starting; no blocker is marked complete by this revision.

**Priority:** P2 - outside the 24-hour demo

**Owner:** `chandrabhan-kushwaha`

**GitHub issue:** [#26](https://github.com/ashudotbuilds/PLAN9/issues/26)

**Applications/packages touched:** apps/api, packages/contracts, packages/repair.

**PRD traceability:** NFR-23. Sections 8 (P2), 13.1–13.2, 22, 28 of [DRIFTGUARD_PRD.md](../../../DRIFTGUARD_PRD.md).

## Acceptance criteria

- [ ] Specify authentication, tenant identity, storage isolation, roles, and retention.
- [ ] Every read/write enforces organization scope.
- [ ] Apply organization policy without weakening validation or interpreter constraints.
- [ ] Test cross-tenant denial and audit access explicitly.

- [ ] This brief covers production organizations, operator identity/RBAC, durable tenant storage and audited policy administration. P0 local operator/project/environment key guards are mandatory tickets 28–35, excluded from this deferred scope.

## Test scenarios

- Cross-tenant read/write denial
- Role-based action refusal
- Policy conflict and data retention

- Production membership/tenant isolation independent of local-demo key scope

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
