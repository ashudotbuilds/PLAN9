# 11 - Reset to a fresh session and preserve completed evidence

**What to build:** An operator resets the demo, retains the completed session audit, and captures a new healthy baseline without restarting processes.

**Blocked by:** [08 - Run recovery through one backend command](08-backend-recovery-run.md); [10 - Detect unchanged-schema shipping drift and hold repair](10-shipping-semantic-refusal.md).

**Status:** ready-for-agent

**Priority:** P0

**Owner:** Integration lead

**Applications/packages touched:** apps/api, apps/mock-providers, apps/web.

**PRD traceability:** FR-SIM-04, NFR-03, NFR-14, NFR-16.

## Acceptance criteria

- [ ] Restore provider defaults and adapter v1; clear active observations, incidents, patches, workflow runs, and recovery runs.
- [ ] Archive the completed session and create a new awaiting_baseline session.
- [ ] UI next action is Capture baseline; no stale baseline appears current.
- [ ] Reset during a running action returns 409 DEMO_BUSY and makes no partial reset.
- [ ] Repeat golden capture/recovery after reset with equivalent fingerprints and distinct session identifiers.

## Test scenarios

- Reset after successful recovery, rejected candidate, and semantic hold
- Busy reset refusal
- Read-only archived audit survives reset
- Two successive sessions show no active state leakage

Exercise public package seams with fixture-driven unit tests; use Fastify injection for applicable routes and a mocked API client for UI interactions. Show this ticket's observable result over the real provider HTTP boundary when relevant. Record only commands actually executed.

## API contracts

- [A02](../API_CATALOG.md#a02)
- [A03](../API_CATALOG.md#a03)
- [A04](../API_CATALOG.md#a04)
- [M05](../API_CATALOG.md#m05)

## Scope boundary

Deliver the acceptance criteria as one observable slice. Preserve the PRD safety gates and keep speculative P1/P2 behavior outside this ticket.

## Completion evidence

- [ ] Demonstrate the behavior and retain relevant API/test results.
- [ ] Run applicable typecheck, lint, build, and meaningful unit/integration checks.
- [ ] Record requirement IDs, model/fallback/stub source, files changed, commands/results, and remaining gaps.
- [ ] Update this ticket status and the index only after its criteria pass.
