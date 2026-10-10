# 18 - Export a version-consistent evidence passport

**What to build:** An operator downloads one incident's complete evidence and decisions for a judge or teammate.

**Blocked by:** [13 - Prove and rehearse the complete three-minute demo](13-golden-demo-release.md).

**Status:** ready-for-agent

**Planning readiness:** This is an authored backlog item, not implemented or execution-ready evidence. Inspect every blocker and its available contract before starting; no blocker is marked complete by this revision.

**Priority:** P1 - optional after P0 acceptance is stable

**Owner:** `soumya240806`

**GitHub issue:** [#18](https://github.com/ashudotbuilds/PLAN9/issues/18)

**Applications/packages touched:** apps/api, apps/web, packages/contracts.

**PRD traceability:** FR-OPS-04, FR-LIN-01, FR-MON-01, NFR-20, NFR-21. Sections 13, 13.3, 16, 22 of [DRIFTGUARD_PRD.md](../../../DRIFTGUARD_PRD.md).

## Acceptance criteria

- [ ] Export redacted JSON with observations, findings, impact, proposal/source, gate results, immutable hashes, validation, audit, and parent adapter.
- [ ] Use one consistent incident/patch snapshot; never mix run versions.
- [ ] Expose missing incident as stable 404; avoid exposing archived-session secrets.
- [ ] UI downloads actual API content and labels incident/session/version.

- [ ] Passport authorization and snapshot preserve project/environment/session, source/context/policy, baseline/latest versions, and declared/inferred/runtime edge labels; include only permitted sanitized evidence.

## Test scenarios

- Export for recovered, held, rejected, and rolled-back incidents
- Version consistency and redaction
- Unknown incident

- Cross-scope passport denied
- Export preserves maturity/limitations and contains no keys/digests

Exercise public package seams with fixture-driven unit tests; use Fastify injection for applicable routes and a mocked API client for UI interactions. Show this ticket's observable result over the real provider HTTP boundary when relevant. Record only commands actually executed.

## API contracts

- [A18](../API_CATALOG.md#a18)

## Scope boundary

Do not start until ticket 13 verifies both the original section 21 recovery test and all connected SDK gates in section 21.1, with remaining time before the hour-19 freeze. Keep this extension optional for the judge demo, and publish any required schema or policy extension before implementing it.

## Completion evidence

- [ ] Demonstrate the behavior and retain relevant API/test results.
- [ ] Run applicable typecheck, lint, build, and meaningful unit/integration checks.
- [ ] Record requirement IDs, model/fallback/stub source, files changed, commands/results, and remaining gaps.
- [ ] Update this ticket status and the index only after its criteria pass.
