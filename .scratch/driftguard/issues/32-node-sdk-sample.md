# 32 - Connect the Node SDK and sample through real metadata ingestion

**What to build:** A developer initializes the Node-only SDK, explicitly registers Users, runs a real local sample, and sees acknowledged metadata arrive in DriftGuard.

**Blocked by:** Ticket 31.

**Status:** ready-for-agent (authoring status; verify blockers before execution)

**Priority:** P0

**Owner:** `chandrabhan-kushwaha`

**Applications/packages touched:** packages/sdk, apps/sample-consumer, packages/contracts.

**PRD traceability:** FR-SDK-01, FR-SDK-02, FR-INV-01, FR-INV-02, NFR-19, NFR-21.

**GitHub issue:** [#32](https://github.com/ashudotbuilds/PLAN9/issues/32)

## Acceptance criteria

- [ ] Implement the specified initialization/registerDependency/trackRequest/flush/diagnostics/shutdown public seam using native transport and shared contracts, with no detector/model dependency.
- [ ] Default to metadata-only; derive status/duration/time from actual sample Users requests, never literal synthetic success counters.
- [ ] Basic SDK network work is asynchronous and bounded from its first version; SDK absence/failure never changes provider responses or host workflow outcomes.
- [ ] Document server-side key/endpoint/environment setup, explicit registration, reset re-registration, workspace import, and sample invocation without a paid API.

## Test scenarios

- Real sample registration plus all three fixture requests and acknowledged flush
- Invalid config and unavailable registration/server yield safe results with no host crash
- Manual tracking does not intercept HTTP; missing registration cannot queue
- Public exports, Node build/import, basic deadlines, shutdown cleanup and metadata-only serialization

Use public-seam fixture tests, Fastify injection for route cases, and real local HTTP for the observable integration. Run only commands available in the implementation; record actual results.

## API contracts

- [A27](../API_CATALOG.md#a27)
- [A28](../API_CATALOG.md#a28)
- [A29](../API_CATALOG.md#a29)
- [M01](../API_CATALOG.md#m01)

## Scope boundary

PRD 12.5 and 18; AT-SDK-04/06/08/17. Ticket33 deepens security/bounds; it is not permission to omit basic safety here.

One ticket per implementation run; no universal discovery/interception, production tenancy, arbitrary code, or safety-gate bypass. FR-REP-07/08 stays authoritative.

## Completion evidence

- [ ] Retain observable backend/test results, scope, provenance, and requirement IDs.
- [ ] Run relevant tests, typecheck, lint, and build; explain unavailable checks.
- [ ] Preserve other owners' changes and explicitly review staged paths.
- [ ] After authorized feature push, append and separately push its log entry.
- [ ] Mark complete only when acceptance criteria and verified blockers pass.
