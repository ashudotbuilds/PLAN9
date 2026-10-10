# 38 - Compare a bounded local OpenAPI import with observed behavior

**What to build:** An operator imports a local specification snapshot and sees documented deltas separately from evidence of runtime provider changes.

**Blocked by:** Ticket 13.

**Status:** optional-after-P0 (freeze additive contracts within this ticket before implementation)

**Priority:** P1

**Owner:** `soumya240806`

**Applications/packages touched:** apps/api, packages/contracts, packages/detector.

**PRD traceability:** FR-DIS-01, FR-MON-01, NFR-21, NFR-22.

**GitHub issue:** [#38](https://github.com/ashudotbuilds/PLAN9/issues/38)

## Acceptance criteria

- [ ] Freeze a minimal operator import/detail contract and update PRD/catalog before exposing any optional endpoint.
- [ ] Accept only bounded local OpenAPI input within256KiB; reject remote references, executable examples/plugins and unsafe parse depth.
- [ ] Version by content hash/source/timestamp and relate endpoint records without claiming spec completeness or proven runtime usage.
- [ ] Compare documented structural deltas independently; no auto-repair or known-good baseline promotion from a specification alone.

## Test scenarios

- Valid/same/changed snapshot and deterministic version hash
- Oversized/malformed document, remote$ref, hostile descriptions and secret values
- Documentation-runtime conflict and unobserved route coverage
- Cross-scope import/read denial

Use public-seam fixture tests, Fastify injection for route cases, and real local HTTP for the observable integration. Run only commands available in the implementation; record actual results.

## API contracts

No new P0 network API. Freeze any optional additive contract in the PRD/API catalog as part of this scope before implementation.

## Scope boundary

PRD13.3/22; optional after13.

One ticket per implementation run; no universal discovery/interception, production tenancy, arbitrary code, or safety-gate bypass. FR-REP-07/08 stays authoritative.

## Completion evidence

- [ ] Retain observable backend/test results, scope, provenance, and requirement IDs.
- [ ] Run relevant tests, typecheck, lint, and build; explain unavailable checks.
- [ ] Preserve other owners' changes and explicitly review staged paths.
- [ ] After authorized feature push, append and separately push its log entry.
- [ ] Mark complete only when acceptance criteria and verified blockers pass.
