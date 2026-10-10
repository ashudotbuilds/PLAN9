# 30 - Register dependencies and inspect evidence-backed scoped inventory

**What to build:** A valid SDK key explicitly registers Users and the operator sees a versioned inventory distinguishing declared registration from actual runtime evidence.

**Blocked by:** Ticket 29.

**Status:** completed

**Priority:** P0

**Owner:** `ashudotbuilds`

**Applications/packages touched:** apps/api, packages/contracts, packages/lineage.

**PRD traceability:** FR-INV-01, FR-INV-02, FR-PRJ-01, FR-LIN-01, NFR-20, NFR-22.

**GitHub issue:** [#30](https://github.com/ashudotbuilds/PLAN9/issues/30)

## Acceptance criteria

- [x] Upsert stable project/environment/name/origin identities; seeded Users registration joins the existing provider, while origin/type conflicts fail.
- [x] Return active session and server-assigned collection policy; permit only reviewed synthetic Users fixture keys/paths, metadata-only elsewhere.
- [x] Inventory list/detail exposes safe source/confidence, coverage, scoped endpoints, history pointers, policy, and absent runtime metrics honestly.
- [x] Declared/inferred/manual edges remain separate from recorded runtime-read proof. Registration never fetches a supplied URL or starts polling.

## Test scenarios

- Repeated upsert, changed registration revision, conflict and unknown scoped ID
- Seeded records versus observed records; stable bounded cursor pagination
- Wrong key scope and malformed/credential URL metadata; unsupported category marked metadata-only
- Server policy/effective collection contract and declared-versus-runtime provenance

Use public-seam fixture tests, Fastify injection for route cases, and real local HTTP for the observable integration. Run only commands available in the implementation; record actual results.

## API contracts

- [A27](../API_CATALOG.md#a27)
- [A30](../API_CATALOG.md#a30)
- [A31](../API_CATALOG.md#a31)

## Scope boundary

PRD 12.6, 13, 13.3, 16.1; AT-SDK-02/07/08/11

One ticket per implementation run; no universal discovery/interception, production tenancy, arbitrary code, or safety-gate bypass. FR-REP-07/08 stays authoritative.

## Completion evidence

- [x] Retain observable backend/test results, scope, provenance, and requirement IDs.
- [x] Run relevant tests, typecheck, lint, and build; explain unavailable checks.
- [x] Preserve other owners' changes and explicitly review staged paths.
- [x] After authorized feature push, append and separately push its log entry.
- [x] Mark complete only when acceptance criteria and verified blockers pass.
