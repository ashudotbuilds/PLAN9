# 29 - Issue rotate and revoke environment-scoped ingestion keys

**What to build:** An authenticated operator issues a one-time project ingestion key, rotates or revokes it, and can verify that old or wrong-scope credentials are denied.

**Blocked by:** Ticket 28.

**Status:** completed

**Priority:** P0

**Owner:** `saransh-sh`

**Applications/packages touched:** apps/api, packages/contracts.

**PRD traceability:** FR-KEY-01, FR-KEY-02, FR-KEY-03, NFR-08, NFR-20.

**GitHub issue:** [#29](https://github.com/ashudotbuilds/PLAN9/issues/29)

## Acceptance criteria

- [x] Generate cryptographically random keys and persist only digests plus safe metadata; compare fixed-length digests safely.
- [x] Issue plaintext only once with no-store; list/audit/errors never return plaintext or digest; no lost-response credential recovery.
- [x] Serialize rotation/revocation, enforce active-key bounds, preserve replacesKeyId and safe audit; repeated revoke does not repeat its state event.
- [x] Expose one shared ingestion-auth guard bound to project/environment for later routes; keys have no operator, recovery, or provider privileges.

## Test scenarios

- Valid key, invalid token, unknown key ID, revoked/rotated key
- Wrong-project/environment key rejected before writes
- One-time response lost, rotate replacement via safe metadata; concurrent rotation/revoke
- Digest-only persistence, redacted errors/audit, active-key limit and exact revoke idempotency

Use public-seam fixture tests, Fastify injection for route cases, and real local HTTP for the observable integration. Run only commands available in the implementation; record actual results.

## API contracts

- [A24](../API_CATALOG.md#a24)
- [A25](../API_CATALOG.md#a25)
- [A26](../API_CATALOG.md#a26)

## Scope boundary

PRD 13.1, 16.1; AT-SDK-01/03

One ticket per implementation run; no universal discovery/interception, production tenancy, arbitrary code, or safety-gate bypass. FR-REP-07/08 stays authoritative.

## Completion evidence

- [x] Retain observable backend/test results, scope, provenance, and requirement IDs.
- [x] Run relevant tests, typecheck, lint, and build; explain unavailable checks.
- [x] Preserve other owners' changes and explicitly review staged paths.
- [x] After authorized feature push, append and separately push its log entry.
- [x] Mark complete only when acceptance criteria and verified blockers pass.
