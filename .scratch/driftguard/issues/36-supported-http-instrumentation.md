# 36 - Instrument one explicitly supported HTTP client

**What to build:** An opt-in wrapper for one named Node HTTP client records permitted telemetry while preserving the host client's response and error behavior.

**Blocked by:** Ticket 13.

**Status:** optional-after-P0 (freeze additive contracts within this ticket before implementation)

**Priority:** P1

**Owner:** `chandrabhan-kushwaha`

**Applications/packages touched:** packages/sdk, apps/sample-consumer.

**PRD traceability:** FR-DIS-01, FR-SDK-01, FR-SDK-03, NFR-19, NFR-21.

**GitHub issue:** [#36](https://github.com/ashudotbuilds/PLAN9/issues/36)

## Acceptance criteria

- [ ] Freeze one client/version/public seam and its reversible opt-in contract before implementation; no global/universal interception claim.
- [ ] Reuse SDK registration/collection policy/queue rather than adding a separate collector.
- [ ] Keep original response/error/body-consumption semantics unchanged and obey local redaction and request bounds.
- [ ] Show actual wrapper-origin evidence separately from manual observations; extend SDK quickstart.

## Test scenarios

- Client success/error/abort/stream or body consumption compatibility
- Wrapper disabled, SDK unavailable, no duplicate tracking
- Privacy/queue bounds and source/route coverage labels

Use public-seam fixture tests, Fastify injection for route cases, and real local HTTP for the observable integration. Run only commands available in the implementation; record actual results.

## API contracts

- [A27](../API_CATALOG.md#a27)
- [A28](../API_CATALOG.md#a28)

## Scope boundary

PRD8/13.3; optional only after combined release13.

One ticket per implementation run; no universal discovery/interception, production tenancy, arbitrary code, or safety-gate bypass. FR-REP-07/08 stays authoritative.

## Completion evidence

- [ ] Retain observable backend/test results, scope, provenance, and requirement IDs.
- [ ] Run relevant tests, typecheck, lint, and build; explain unavailable checks.
- [ ] Preserve other owners' changes and explicitly review staged paths.
- [ ] After authorized feature push, append and separately push its log entry.
- [ ] Mark complete only when acceptance criteria and verified blockers pass.
