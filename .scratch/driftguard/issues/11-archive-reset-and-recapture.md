# 11 - Reset to a fresh session and preserve completed evidence

**What to build:** An operator resets the demo, retains the completed session audit, and captures a new healthy baseline without restarting processes.

**Blocked by:** [08 - Run recovery through one backend command](08-backend-recovery-run.md); [10 - Detect unchanged-schema shipping drift and hold repair](10-shipping-semantic-refusal.md); [31 - Ingest scoped SDK observations through the existing detector](31-sdk-observation-ingestion.md).

**Status:** ready-for-agent

**Planning readiness:** This is an authored backlog item, not implemented or execution-ready evidence. Inspect every blocker and its available contract before starting; no blocker is marked complete by this revision.

**Priority:** P0

**Owner:** `AnushkaBhardwaj15`

**GitHub issue:** [#11](https://github.com/ashudotbuilds/PLAN9/issues/11)

**Applications/packages touched:** apps/api, apps/mock-providers, apps/web.

**PRD traceability:** FR-SIM-04, NFR-03, NFR-14, NFR-16, FR-ING-02, FR-LIN-01, NFR-20, NFR-22. Sections 13.2, 16, 21.1 (AT-SDK-15) of [DRIFTGUARD_PRD.md](../../../DRIFTGUARD_PRD.md).

## Acceptance criteria

- [ ] Restore provider defaults and adapter v1; clear active observations, incidents, patches, workflow runs, and recovery runs.
- [ ] Archive the completed session and create a new awaiting_baseline session.
- [ ] UI next action is Capture baseline; no stale baseline appears current.
- [ ] Reset during a running action returns 409 DEMO_BUSY and makes no partial reset.
- [ ] Repeat golden capture/recovery after reset with equivalent fingerprints and distinct session identifiers.

- [ ] Scoped owner reset preserves project identity, key lifecycle, registration identities, declared edges, and collection policy; archive session evidence/runtime reads/dedup and reset active counters/latest/baselines.
- [ ] Serialize reset with ingestion writes; issue a new session ID and reject queued old-session batches as 409 STALE_SESSION instead of relabelling them.
- [ ] Release the shared mock lease only after owner reset completes; non-owner reset returns DEMO_SCOPE_BUSY. Preserve lifetime counts separately and require SDK re-registration plus runtime lineage recapture.

## Test scenarios

- Reset after successful recovery, rejected candidate, and semantic hold
- Busy reset refusal
- Read-only archived audit survives reset
- Two successive sessions show no active state leakage

- Reset raced against atomic ingest has no mixed-session writes
- Old key still valid but stale event rejected; fresh registration enables new tracking
- Non-owner reset cannot alter shared providers or release the lease
- Declared edges survive while runtime read evidence must be recaptured

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
