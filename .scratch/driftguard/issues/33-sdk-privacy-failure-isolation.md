# 33 - Prove bounded private SDK delivery and opt-in fixture evidence

**What to build:** The sample safely submits explicitly enabled synthetic response evidence and continues working when telemetry is invalid, oversized, stale, or unavailable.

**Blocked by:** Ticket 32.

**Status:** completed

**Priority:** P0

**Owner:** `chandrabhan-kushwaha`

**Applications/packages touched:** packages/sdk, packages/observer, apps/sample-consumer, tests/integration.

**PRD traceability:** FR-SDK-02, FR-SDK-03, FR-ING-02, NFR-19, NFR-21, NFR-22.

**GitHub issue:** [#33](https://github.com/ashudotbuilds/PLAN9/issues/33)

## Acceptance criteria

- [x] Apply effective intersection of local opt-in and server policy; redact before serialization, cap JSON shape, remove forbidden URL/header/environment data, and attach server-assigned policy version.
- [x] Enforce every numeric queue/batch/event/depth/deadline/retry bound from PRD12.5; single-flight flush and unreferenced timer, stable IDs on retry, counted drops and bounded shutdown.
- [x] Retry only allowed transient outcomes with capped Retry-After; permanent auth disables sending, stale session drops old events and requires fresh registration.
- [x] Enable only approved three-identity response fixture evidence in the sample; detector evidence links preserve source/context and do not bypass controlled auto-eligibility proof.

## Test scenarios

- Transport boundary auth/cookie/configured nested-field redaction and forbidden direct submission
- Queue count/byte overflow, event/batch limits, cyclic/non-JSON input, flush concurrency
- Network/timeout/429/5xx versus permanent4xx, retry ID stability, timeout and shutdown cleanup
- Control-plane outage leaves host workflow unchanged; no unhandled rejection
- Reset between queueing and sending, baseline/latest independence and changed-fixture finding

Use public-seam fixture tests, Fastify injection for route cases, and real local HTTP for the observable integration. Run only commands available in the implementation; record actual results.

## API contracts

- [A27](../API_CATALOG.md#a27)
- [A28](../API_CATALOG.md#a28)
- [A29](../API_CATALOG.md#a29)
- [M01](../API_CATALOG.md#m01)

## Scope boundary

PRD12.5/12.6/13.2; AT-SDK-05/06/09/10/15

One ticket per implementation run; no universal discovery/interception, production tenancy, arbitrary code, or safety-gate bypass. FR-REP-07/08 stays authoritative.

## Completion evidence

- [x] Retain observable backend/test results, scope, provenance, and requirement IDs.
- [x] Run relevant tests, typecheck, lint, and build; explain unavailable checks.
- [x] Preserve other owners' changes and explicitly review staged paths.
- [x] After authorized feature push, append and separately push its log entry.
- [x] Mark complete only when acceptance criteria and verified blockers pass.
