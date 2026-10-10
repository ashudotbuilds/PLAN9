# 28 - Create a scoped local project through operator onboarding

**What to build:** A local operator signs in, creates/selects a project and environment, and uses guarded control-plane actions with a real scoped session.

**Blocked by:** Ticket 01.

**Status:** completed

**Priority:** P0

**Owner:** `ashudotbuilds`

**Applications/packages touched:** apps/api, apps/web, packages/contracts.

**PRD traceability:** FR-PRJ-01, FR-KEY-03, NFR-08, NFR-20.

**GitHub issue:** [#28](https://github.com/ashudotbuilds/PLAN9/issues/28)

## Acceptance criteria

- [x] Implement the PRD loopback operator bootstrap, HttpOnly session, exact Origin guard, scripted operator header, session expiry, and safe login audit; ingestion credentials cannot substitute.
- [x] Create development/production environment records and labelled seeded inventory under stable project IDs; return safe project metadata only.
- [x] Bind every existing control-plane list/command/resource lookup to validated scope; public health remains minimal. Preserve exact recovery response.
- [x] Agree project/environment/session and ingestion DTOs additively with ticket 01; do not implement keys or SDK here.

## Test scenarios

- Valid/invalid operator credentials, expiry, unsafe Origin and non-loopback access
- Idempotent project creation and body conflict; project limit and malformed input
- Cross-scope resource ID rejection; ingestion key denied on operator routes
- Cookie/header/token redaction and no frontend persistent credential storage

Use public-seam fixture tests, Fastify injection for route cases, and real local HTTP for the observable integration. Run only commands available in the implementation; record actual results.

## API contracts

- [A20](../API_CATALOG.md#a20)
- [A21](../API_CATALOG.md#a21)
- [A22](../API_CATALOG.md#a22)
- [A23](../API_CATALOG.md#a23)
- [A02](../API_CATALOG.md#a02)
- [A14](../API_CATALOG.md#a14)

## Scope boundary

PRD 13.1, 16.1; AT-SDK-01 and AT-SDK-03 operator boundary

One ticket per implementation run; no universal discovery/interception, production tenancy, arbitrary code, or safety-gate bypass. FR-REP-07/08 stays authoritative.

## Completion evidence

- [x] Retain observable backend/test results, scope, provenance, and requirement IDs.
- [x] Run relevant tests, typecheck, lint, and build; explain unavailable checks.
- [x] Preserve other owners' changes and explicitly review staged paths.
- [x] After authorized feature push, append and separately push its log entry.
- [x] Mark complete only when acceptance criteria and verified blockers pass.
