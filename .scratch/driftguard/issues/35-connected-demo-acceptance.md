# 35 - Verify connected SDK security and both recovery scenarios together

**What to build:** A teammate demonstrates all 17 connected SDK gates alongside the unchanged field-rename recovery and semantic refusal tests using only local mocks.

**Blocked by:** Ticket 10, Ticket 11, Ticket 12, Ticket 33, Ticket 34.

**Status:** ready-for-agent (authoring status; verify blockers before execution)

**Priority:** P0

**Owner:** `AnushkaBhardwaj15`

**Applications/packages touched:** tests/integration, apps/sample-consumer, apps/web, docs.

**PRD traceability:** FR-ING-01, FR-ING-02, FR-SDK-01, FR-SDK-03, FR-LIN-01, FR-MON-01, NFR-19, NFR-20, NFR-21, NFR-22.

**GitHub issue:** [#35](https://github.com/ashudotbuilds/PLAN9/issues/35)

## Acceptance criteria

- [ ] Execute and retain real results for AT-SDK-01 through AT-SDK-17, including key/scope negative tests, default/local redaction, actual sample and diagnostics.
- [ ] Run exact original primary acceptance, invalid/modified patch, no-review-bypass, deterministic fallback, unchanged-shape Shipping hold and replay-failure rollback.
- [ ] Prove reset/session fencing, concurrent ingestion atomicity, pinned mock scope, host outage isolation and independent baseline/latest evidence.
- [ ] Document full SDK quickstart, safe disposable demo keys, measured rehearsal evidence and limitations; do not fabricate missing passes. Ticket13 owns final combined release/rehearsal.

## Test scenarios

- All 17 SDK acceptance gates and original recovery regression suite
- No live model, no provider credentials, no production traffic
- Stale batch after reset, duplicate retry, key rotation and wrong-scope ingestion
- Persistence outage/queuebounds and original demo frontend polling regression

Use public-seam fixture tests, Fastify injection for route cases, and real local HTTP for the observable integration. Run only commands available in the implementation; record actual results.

## API contracts

- [A20](../API_CATALOG.md#a20)
- [A21](../API_CATALOG.md#a21)
- [A24](../API_CATALOG.md#a24)
- [A25](../API_CATALOG.md#a25)
- [A26](../API_CATALOG.md#a26)
- [A27](../API_CATALOG.md#a27)
- [A28](../API_CATALOG.md#a28)
- [A29](../API_CATALOG.md#a29)
- [A30](../API_CATALOG.md#a30)
- [A31](../API_CATALOG.md#a31)
- [A03](../API_CATALOG.md#a03)
- [A04](../API_CATALOG.md#a04)
- [A16](../API_CATALOG.md#a16)
- [A17](../API_CATALOG.md#a17)

## Scope boundary

PRD20,21,21.1,25,27. This ticket must not depend on13:13depends35.

One ticket per implementation run; no universal discovery/interception, production tenancy, arbitrary code, or safety-gate bypass. FR-REP-07/08 stays authoritative.

## Completion evidence

- [ ] Retain observable backend/test results, scope, provenance, and requirement IDs.
- [ ] Run relevant tests, typecheck, lint, and build; explain unavailable checks.
- [ ] Preserve other owners' changes and explicitly review staged paths.
- [ ] After authorized feature push, append and separately push its log entry.
- [ ] Mark complete only when acceptance criteria and verified blockers pass.
