# 07 - Activate validated adapters and replay safely

**What to build:** An operator activates a proven adapter, sees real workflow recovery, and can restore the recorded parent version.

**Blocked by:** [06 - Validate candidate semantics and automatic eligibility](06-shadow-validation-and-policy.md).

**Status:** ready-for-agent

**Planning readiness:** This is an authored backlog item, not implemented or execution-ready evidence. Inspect every blocker and its available contract before starting; no blocker is marked complete by this revision.

**Priority:** P0

**Owner:** `saransh-sh`

**GitHub issue:** [#7](https://github.com/ashudotbuilds/PLAN9/issues/7)

**Applications/packages touched:** apps/api, apps/web, packages/adapter-runtime, packages/validation.

**PRD traceability:** FR-VAL-05, FR-VAL-06, FR-VAL-08, NFR-05, FR-OPS-01, NFR-20. Sections 13, 13.2, 16, 21.1 (AT-SDK-15) of [DRIFTGUARD_PRD.md](../../../DRIFTGUARD_PRD.md).

## Acceptance criteria

- [ ] Activation refuses missing, failed, stale, or mismatched-hash validation.
- [ ] Activation creates a version linked to its parent and executes post-activation workflow replay.
- [ ] Only passing post-activation replay marks recovered.
- [ ] Replay failure automatically restores the parent, sets rolled_back, and retains failed patch and evidence.
- [ ] Manual rollback restores the recorded parent and records an audit event.
- [ ] A rollback restores adapter version, not provider behavior; UI reports subsequent workflow outcomes honestly.

- [ ] Resolve activation/rollback/replay within operator-authorized recorded scope and the owning demo lease; reject mismatching selectors and ingestion credentials.
- [ ] Retain parent, failed patch, validation hash, and replay evidence in the same session; later reset archives these records rather than rewriting or deleting their provenance.

## Test scenarios

- Activation before validation and hash mismatch return 409
- Successful recovery for all identities
- Forced replay failure records activation and rollback
- Manual rollback selects exact parent, not synthesized mappings

- Cross-scope activation/rollback and wrong lease are denied without adapter changes
- Rollback audit/evidence survives subsequent archive reset

Exercise public package seams with fixture-driven unit tests; use Fastify injection for applicable routes and a mocked API client for UI interactions. Show this ticket's observable result over the real provider HTTP boundary when relevant. Record only commands actually executed.

## API contracts

- [A12](../API_CATALOG.md#a12)
- [A13](../API_CATALOG.md#a13)
- [A15](../API_CATALOG.md#a15)

## Scope boundary

Deliver the acceptance criteria as one observable slice. Preserve the PRD safety gates and keep speculative P1/P2 behavior outside this ticket.

## Completion evidence

- [ ] Demonstrate the behavior and retain relevant API/test results.
- [ ] Run applicable typecheck, lint, build, and meaningful unit/integration checks.
- [ ] Record requirement IDs, model/fallback/stub source, files changed, commands/results, and remaining gaps.
- [ ] Update this ticket status and the index only after its criteria pass.
