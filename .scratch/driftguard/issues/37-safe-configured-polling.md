# 37 - Poll only explicitly approved safe dependency endpoints

**What to build:** An operator configures bounded read-only polling of a reviewed endpoint and sees source-labelled observations without exposing an arbitrary URL-fetch service.

**Blocked by:** Ticket 13.

**Status:** optional-after-P0 (freeze additive contracts within this ticket before implementation)

**Priority:** P1

**Owner:** `ashudotbuilds`

**Applications/packages touched:** apps/api, packages/observer, packages/contracts.

**PRD traceability:** FR-DIS-01, FR-MON-01, NFR-22, NFR-23.

**GitHub issue:** [#37](https://github.com/ashudotbuilds/PLAN9/issues/37)

## Acceptance criteria

- [ ] First specify/freeze minimal operator-only job create/list/disable contracts and update PRD/API catalog; these are not existing P0 APIs.
- [ ] Apply the PRD fixed origin/route/method,interval/rate/timeout,approved fixture and no-redirect egress rules, including DNS and connected-IP checks.
- [ ] Reuse existing observer/detector/scoped dedup and explicit baseline policy; registration alone never starts a job.
- [ ] Disable jobs/reset behavior coherently and never replay non-idempotent operations or secret-bearing URLs.

## Test scenarios

- Configured allowed endpoint versus arbitrary URL/private/linklocal/metadata and redirect
- DNS/connection policy change, overlap, timeout,jobdisabled and rate/bounds
- Source/context-compatible findings and no implicit baseline promotion

Use public-seam fixture tests, Fastify injection for route cases, and real local HTTP for the observable integration. Run only commands available in the implementation; record actual results.

## API contracts

No new P0 network API. Freeze any optional additive contract in the PRD/API catalog as part of this scope before implementation.

## Scope boundary

PRD13.3/22; optional future APIs must be added only after contract review.

One ticket per implementation run; no universal discovery/interception, production tenancy, arbitrary code, or safety-gate bypass. FR-REP-07/08 stays authoritative.

## Completion evidence

- [ ] Retain observable backend/test results, scope, provenance, and requirement IDs.
- [ ] Run relevant tests, typecheck, lint, and build; explain unavailable checks.
- [ ] Preserve other owners' changes and explicitly review staged paths.
- [ ] After authorized feature push, append and separately push its log entry.
- [ ] Mark complete only when acceptance criteria and verified blockers pass.
