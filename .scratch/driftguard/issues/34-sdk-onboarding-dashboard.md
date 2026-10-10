# 34 - Operate SDK setup keys inventory and diagnostics from the dashboard

**What to build:** A developer connects the sample from a project/environment setup strip and inspects real inventory/evidence while the original recovery canvas stays usable.

**Blocked by:** Ticket 09, Ticket 30, Ticket 33.

**Status:** completed

**Priority:** P0

**Owner:** `AnushkaBhardwaj15`

**Applications/packages touched:** apps/web, packages/contracts.

**PRD traceability:** FR-UI-10, FR-INV-02, FR-LIN-01, FR-KEY-01, FR-KEY-02, NFR-10, NFR-18, NFR-21.

**GitHub issue:** [#34](https://github.com/ashudotbuilds/PLAN9/issues/34)

## Acceptance criteria

- [x] Provide operator sign-in, project/environment selector, SDK setup, issue/rotate/revoke actions and transient one-time key display; no secrets in build config/storage/logs.
- [x] Render actual scope/provenance/last-acknowledged ingestion, baseline/latest versions, safe failures and unknown coverage; seeded activity is labelled.
- [x] Navigate inventory changes to existing incident/evidence/impact trace; declared/inferred links are not proof of zero/proven affected workflows.
- [x] Preserve backend-owned recovery polling, loading/error/empty/offline handling, keyboard focus and anti-slop layout; no decorative graph required.

## Test scenarios

- API-mocked UI create/configure/issue/rotate/revoke flows and safe missing-key retry
- Clear plaintext on dismissal/navigation, cross-environment data refetch and no frontend persistence
- Registered-not-observed, stale diagnostics, missing lineage, and real backend projection
- Keyboard/reduced-motion/contrast smoke and original recovery controls regression

Use public-seam fixture tests, Fastify injection for route cases, and real local HTTP for the observable integration. Run only commands available in the implementation; record actual results.

## API contracts

- [A20](../API_CATALOG.md#a20)
- [A21](../API_CATALOG.md#a21)
- [A22](../API_CATALOG.md#a22)
- [A23](../API_CATALOG.md#a23)
- [A24](../API_CATALOG.md#a24)
- [A25](../API_CATALOG.md#a25)
- [A26](../API_CATALOG.md#a26)
- [A30](../API_CATALOG.md#a30)
- [A31](../API_CATALOG.md#a31)
- [A02](../API_CATALOG.md#a02)

## Scope boundary

PRD17 and21.1; AT-SDK-01/08/11; run dashboard anti-slop quality gate.

One ticket per implementation run; no universal discovery/interception, production tenancy, arbitrary code, or safety-gate bypass. FR-REP-07/08 stays authoritative.

## Completion evidence

- [x] Retain observable backend/test results, scope, provenance, and requirement IDs.
- [x] Run relevant tests, typecheck, lint, and build; explain unavailable checks.
- [x] Preserve other owners' changes and explicitly review staged paths.
- [x] After authorized feature push, append and separately push its log entry.
- [x] Mark complete only when acceptance criteria and verified blockers pass.
