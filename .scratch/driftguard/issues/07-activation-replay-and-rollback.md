# 07 - Activate validated adapters and replay safely

**What to build:** An operator activates a proven adapter, sees real workflow recovery, and can restore the recorded parent version.

**Blocked by:** [06 - Validate candidate semantics and automatic eligibility](06-shadow-validation-and-policy.md).

**Status:** ready-for-agent

**Priority:** P0

**Owner:** Repair and safety engineer

**Applications/packages touched:** apps/api, apps/web, packages/adapter-runtime, packages/validation.

**PRD traceability:** FR-VAL-05, FR-VAL-06, FR-VAL-08, NFR-05, FR-OPS-01.

## Acceptance criteria

- [ ] Activation refuses missing, failed, stale, or mismatched-hash validation.
- [ ] Activation creates a version linked to its parent and executes post-activation workflow replay.
- [ ] Only passing post-activation replay marks recovered.
- [ ] Replay failure automatically restores the parent, sets rolled_back, and retains failed patch and evidence.
- [ ] Manual rollback restores the recorded parent and records an audit event.
- [ ] A rollback restores adapter version, not provider behavior; UI reports subsequent workflow outcomes honestly.

## Test scenarios

- Activation before validation and hash mismatch return 409
- Successful recovery for all identities
- Forced replay failure records activation and rollback
- Manual rollback selects exact parent, not synthesized mappings

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
