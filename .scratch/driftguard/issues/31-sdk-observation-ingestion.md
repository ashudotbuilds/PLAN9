# 31 - Ingest scoped SDK evidence through the existing detector

**What to build:** Real authenticated SDK batches update the correct inventory and create evidence-linked findings through the existing observer/detector without overwriting baselines.

**Blocked by:** Ticket 30, Ticket 03.

**Status:** ready-for-agent (authoring status; verify blockers before execution)

**Priority:** P0

**Owner:** `saransh-sh`

**Applications/packages touched:** apps/api, packages/contracts, packages/observer, packages/detector.

**PRD traceability:** FR-ING-01, FR-ING-02, FR-MON-01, FR-INV-02, FR-DET-03, NFR-20, NFR-22.

**GitHub issue:** [#31](https://github.com/ashudotbuilds/PLAN9/issues/31)

## Acceptance criteria

- [ ] Validate the exact V1 batch schema and policy, normalize route/timestamps, server-redact and fingerprint allowed evidence; metadata-only events cannot claim field semantics.
- [ ] Use serialized atomic write, scoped stable event/batch IDs and content digests; exact retries do not increment counts/audit/incidents, conflicts have no partial writes.
- [ ] Reject stale sessions, cross-scope/unknown dependencies, excessive size/rate/retention, and timestamps outside policy; late events are historical only.
- [ ] Maintain independently immutable baseline and latest pointers, compatible fixture/policy contexts, safe diagnostics and correlated audit; no ingestion-authorized recovery or outbound registration fetch.

## Test scenarios

- Valid batch through real HTTP to existing finding/incident service
- Duplicate and conflicting batch/event IDs, partial malformed batch, persistence failure atomicity
- 401/403/404/409/413/429/503 envelope and correlation; rate/depth/size/retention bounds
- Late/stale session and policy context mismatch, missing baseline, controlled fixture versus metadata-only
- SDK diagnostics last-acknowledged counts and timestamps without secret exposure

Use public-seam fixture tests, Fastify injection for route cases, and real local HTTP for the observable integration. Run only commands available in the implementation; record actual results.

## API contracts

- [A28](../API_CATALOG.md#a28)
- [A29](../API_CATALOG.md#a29)

## Scope boundary

PRD 12.6, 13.2, 16.1; AT-SDK-02/03/07/09/10/15

One ticket per implementation run; no universal discovery/interception, production tenancy, arbitrary code, or safety-gate bypass. FR-REP-07/08 stays authoritative.

## Completion evidence

- [ ] Retain observable backend/test results, scope, provenance, and requirement IDs.
- [ ] Run relevant tests, typecheck, lint, and build; explain unavailable checks.
- [ ] Preserve other owners' changes and explicitly review staged paths.
- [ ] After authorized feature push, append and separately push its log entry.
- [ ] Mark complete only when acceptance criteria and verified blockers pass.
