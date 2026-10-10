# 24 - Learn statistical baselines from larger traffic samples

**What to build:** Detect meaningful population changes in presence, ordering, latency, and rates while keeping deterministic scenario evidence available.

**Blocked by:** [13 - Prove and rehearse the complete three-minute demo](13-golden-demo-release.md).

**Status:** deferred - scope definition required

**Priority:** P2 - outside the 24-hour demo

**Owner:** Integration lead

**Applications/packages touched:** packages/observer, packages/detector.

**PRD traceability:** Sections 8 (P2) and 28 (future direction); no approved P0/P1 requirement IDs..

## Acceptance criteria

- [ ] Define sample requirements, windows, significance rules, and false-positive budget.
- [ ] Separate learned estimates from deterministic oracle results.
- [ ] Handle warmup, seasonality, sparse observations, and baseline contamination.
- [ ] Evaluate recall and false positives against independently labelled datasets.

## Test scenarios

- Warmup and insufficient samples
- Stable population vs known drift
- Distribution changes and baseline contamination

Exercise public package seams with fixture-driven unit tests; use Fastify injection for applicable routes and a mocked API client for UI interactions. Show this ticket's observable result over the real provider HTTP boundary when relevant. Record only commands actually executed.

## API contracts

No additional approved API route. Define the required contract within this deferred scope before implementation; reuse the evidence and validation vocabulary.

## Scope boundary

This is a future feature brief, not an executable hackathon promise. First settle provider scope, public contracts, policy, resource budgets, and independent validation data; then split implementation if it exceeds one context window.

## Completion evidence

- [ ] Demonstrate the behavior and retain relevant API/test results.
- [ ] Run applicable typecheck, lint, build, and meaningful unit/integration checks.
- [ ] Record requirement IDs, model/fallback/stub source, files changed, commands/results, and remaining gaps.
- [ ] Update this ticket status and the index only after its criteria pass.
