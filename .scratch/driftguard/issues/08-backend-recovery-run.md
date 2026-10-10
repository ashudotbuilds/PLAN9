# 08 - Run recovery through one backend command

**What to build:** One operator command executes impact, proposal, validation, activation, replay, and any required rollback while exposing pollable progress.

**Blocked by:** [07 - Activate validated adapters and replay safely](07-activation-replay-and-rollback.md).

**Status:** ready-for-agent

**Priority:** P0

**Owner:** Integration lead

**Applications/packages touched:** apps/api, packages/contracts, packages/repair, packages/validation.

**PRD traceability:** FR-REC-01, FR-REC-02, FR-REC-03, FR-REC-04, FR-VAL-09, NFR-17.

## Acceptance criteria

- [ ] POST recover returns 202 with exactly recoveryRunId and incidentId; correlation metadata is a response header.
- [ ] Backend persists queued/running/succeeded/failed status and the PRD stage enum; clients only poll.
- [ ] Concurrent recovery on the same incident returns 409 RECOVERY_ALREADY_RUNNING with active run ID.
- [ ] Infrastructure failure marks only the run failed and preserves the last valid incident state.
- [ ] Successful restoration after replay failure ends run failed at rolling_back and incident rolled_back.
- [ ] Guided actions share the same services, guards, and audit events; prevent conflicting mutations during an active run.

## Test scenarios

- Poll status and timestamps throughout successful execution
- Concurrent recovery, stage failure, infrastructure failure
- Review hold, invalid proposal, automatic rollback
- Guided and automatic paths have equivalent safety results

Exercise public package seams with fixture-driven unit tests; use Fastify injection for applicable routes and a mocked API client for UI interactions. Show this ticket's observable result over the real provider HTTP boundary when relevant. Record only commands actually executed.

## API contracts

- [A16](../API_CATALOG.md#a16)
- [A17](../API_CATALOG.md#a17)
- [A09](../API_CATALOG.md#a09)
- [A10](../API_CATALOG.md#a10)
- [A11](../API_CATALOG.md#a11)
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
