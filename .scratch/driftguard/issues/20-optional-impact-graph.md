# 20 - Add an impact graph only when it improves comprehension

**What to build:** A judge can optionally explore a larger dependency graph while preserving the clear causal impact trace.

**Blocked by:** [13 - Prove and rehearse the complete three-minute demo](13-golden-demo-release.md).

**Status:** ready-for-agent

**Planning readiness:** This is an authored backlog item, not implemented or execution-ready evidence. Inspect every blocker and its available contract before starting; no blocker is marked complete by this revision.

**Priority:** P1 - optional after P0 acceptance is stable

**Owner:** `soumya240806`

**GitHub issue:** [#20](https://github.com/ashudotbuilds/PLAN9/issues/20)

**Applications/packages touched:** apps/web.

**PRD traceability:** FR-UI-04, FR-UI-09, NFR-10, NFR-18, FR-LIN-01. Sections 13.3, 17 of [DRIFTGUARD_PRD.md](../../../DRIFTGUARD_PRD.md).

## Acceptance criteria

- [ ] Add graph only after P0 stability and only if it makes relationships easier to understand.
- [ ] Use real provider/canonical/workflow nodes and evidence edges.
- [ ] Keep keyboard-accessible trace fallback, readable labels, and clear affected/unaffected states.
- [ ] Use state-triggered motion only and run anti-slop review.
- [ ] Do not replace the golden demo with decorative graph animation.

- [ ] Include actual endpoint/client provenance where available; distinguish runtime_read, declared, inferred, and manually_configured edges and potential/unknown impact within selected scope.

## Test scenarios

- Graph matches API impact set
- Keyboard fallback and reduced motion
- Responsive readability

- Missing runtime evidence never appears as confirmed consumed-field edge

Exercise public package seams with fixture-driven unit tests; use Fastify injection for applicable routes and a mocked API client for UI interactions. Show this ticket's observable result over the real provider HTTP boundary when relevant. Record only commands actually executed.

## API contracts

- [A08](../API_CATALOG.md#a08)
- [A09](../API_CATALOG.md#a09)

## Scope boundary

Do not start until ticket 13 verifies both the original section 21 recovery test and all connected SDK gates in section 21.1, with remaining time before the hour-19 freeze. Keep this extension optional for the judge demo, and publish any required schema or policy extension before implementing it.

## Completion evidence

- [ ] Demonstrate the behavior and retain relevant API/test results.
- [ ] Run applicable typecheck, lint, build, and meaningful unit/integration checks.
- [ ] Record requirement IDs, model/fallback/stub source, files changed, commands/results, and remaining gaps.
- [ ] Update this ticket status and the index only after its criteria pass.
