# 18 - Export a version-consistent evidence passport

**What to build:** An operator downloads one incident's complete evidence and decisions for a judge or teammate.

**Blocked by:** [13 - Prove and rehearse the complete three-minute demo](13-golden-demo-release.md).

**Status:** ready-for-agent

**Priority:** P1 - optional after P0 acceptance is stable

**Owner:** Integration lead

**Applications/packages touched:** apps/api, apps/web, packages/contracts.

**PRD traceability:** FR-OPS-04.

## Acceptance criteria

- [ ] Export redacted JSON with observations, findings, impact, proposal/source, gate results, immutable hashes, validation, audit, and parent adapter.
- [ ] Use one consistent incident/patch snapshot; never mix run versions.
- [ ] Expose missing incident as stable 404; avoid exposing archived-session secrets.
- [ ] UI downloads actual API content and labels incident/session/version.

## Test scenarios

- Export for recovered, held, rejected, and rolled-back incidents
- Version consistency and redaction
- Unknown incident

Exercise public package seams with fixture-driven unit tests; use Fastify injection for applicable routes and a mocked API client for UI interactions. Show this ticket's observable result over the real provider HTTP boundary when relevant. Record only commands actually executed.

## API contracts

- [A18](../API_CATALOG.md#a18)

## Scope boundary

Do not start until the primary P0 acceptance test is stable. Keep this extension optional for the judge demo, and publish any required schema or policy extension before implementing it.

## Completion evidence

- [ ] Demonstrate the behavior and retain relevant API/test results.
- [ ] Run applicable typecheck, lint, build, and meaningful unit/integration checks.
- [ ] Record requirement IDs, model/fallback/stub source, files changed, commands/results, and remaining gaps.
- [ ] Update this ticket status and the index only after its criteria pass.
