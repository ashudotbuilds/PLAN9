# 24 - Learn statistical baselines from larger traffic samples

**What to build:** Detect meaningful population changes in presence, ordering, latency, and rates while keeping deterministic scenario evidence available.

**Blocked by:** [13 - Prove and rehearse the complete three-minute demo](13-golden-demo-release.md).

**Status:** deferred - scope definition required

**Planning readiness:** This is an authored backlog item, not implemented or execution-ready evidence. Inspect every blocker and its available contract before starting; no blocker is marked complete by this revision.

**Priority:** P2 - outside the 24-hour demo

**Owner:** `AnushkaBhardwaj15`

**GitHub issue:** [#24](https://github.com/ashudotbuilds/PLAN9/issues/24)

**Applications/packages touched:** packages/observer, packages/detector.

**PRD traceability:** FR-OBS-06, FR-MON-01, NFR-23. Sections 8 (P2), 13.3, 28 of [DRIFTGUARD_PRD.md](../../../DRIFTGUARD_PRD.md).

## Acceptance criteria

- [ ] Define sample requirements, windows, significance rules, and false-positive budget.
- [ ] Separate learned estimates from deterministic oracle results.
- [ ] Handle warmup, seasonality, sparse observations, and baseline contamination.
- [ ] Evaluate recall and false positives against independently labelled datasets.

- [ ] P2 statistical population baselines remain distinct from P0 SDK duration/status capture and P1 bounded scenario analysis. Require compatible scope/cohort/policy and explain sampling/visibility shifts.

## Test scenarios

- Warmup and insufficient samples
- Stable population vs known drift
- Distribution changes and baseline contamination

- Changed collection policy/cohort does not masquerade as population drift

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
