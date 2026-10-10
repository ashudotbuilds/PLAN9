# 27 - Reuse domain probes with privacy-aware sampling

**What to build:** Use reusable approved probe libraries and bounded traffic sampling to gather semantic evidence for real domains.

**Blocked by:** [13 - Prove and rehearse the complete three-minute demo](13-golden-demo-release.md).

**Status:** deferred - scope definition required

**Planning readiness:** This is an authored backlog item, not implemented or execution-ready evidence. Inspect every blocker and its available contract before starting; no blocker is marked complete by this revision.

**Priority:** P2 - outside the 24-hour demo

**Owner:** `chandrabhan-kushwaha`

**GitHub issue:** [#27](https://github.com/ashudotbuilds/PLAN9/issues/27)

**Applications/packages touched:** packages/observer, packages/detector, packages/contracts.

**PRD traceability:** FR-DIS-03, NFR-21, NFR-22, NFR-23. Sections 8 (P2), 12.5, 13.2–13.4, 22, 28 of [DRIFTGUARD_PRD.md](../../../DRIFTGUARD_PRD.md).

## Acceptance criteria

- [ ] Define probe approval, oracle provenance, safe endpoint scope, privacy budgets, and sampling policy.
- [ ] Record probe and oracle versions with evidence.
- [ ] Exclude sensitive fields before persistence or model use.
- [ ] Demonstrate reusable probes in two distinct domain fixtures without unrestricted model-generated requests.

- [ ] Keep reusable production probe libraries, retention/deletion/regional policy and broad language/feed/scanning sources behind separate authorization/threat models. P0 local redaction/bounds and fixed Shipping oracle remain required elsewhere.

## Test scenarios

- Versioned oracle reproducibility
- Sensitive-data sampling exclusion
- Probe budget and unsafe endpoint refusal

- Sampling preserves source/policy/cohort and explicitly approved oracle
- Deletion/retention design accounts for linked export/model evidence

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
