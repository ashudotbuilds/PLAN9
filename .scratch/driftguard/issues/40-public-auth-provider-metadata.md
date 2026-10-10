# 40 - Observe authorized public identity-provider metadata

**What to build:** An explicitly registered identity integration shows authorized public issuer/discovery/JWKS metadata and safe failure patterns without collecting credentials.

**Blocked by:** Ticket 13, Ticket 37.

**Status:** optional-after-P0 (freeze additive contracts within this ticket before implementation)

**Priority:** P1

**Owner:** `AnushkaBhardwaj15`

**Applications/packages touched:** apps/api, packages/observer, apps/web.

**PRD traceability:** FR-DIS-02, FR-INV-02, FR-MON-01, NFR-21, NFR-23.

**GitHub issue:** [#40](https://github.com/ashudotbuilds/PLAN9/issues/40)

## Acceptance criteria

- [ ] Use ticket37's approved egress/probe seam for one declared public metadata integration; freeze any additive DTOs before implementation.
- [ ] Collect only permitted issuer/package/public endpoint/key-ID fingerprints and explicitly available authorized expiry/rotation metadata.
- [ ] Never collect tokens/passwords/cookies/privatekeys/clientsecrets/environment values, enumerate hidden credentials, or claim credential validity.
- [ ] Changes enter source-labelled evidence/review; no autonomous authentication,authorization,key or policy changes.

## Test scenarios

- Authorized safe public metadata versus private/credential-bearing configuration
- Malformed/unavailable metadata and changed fingerprints without blind repair
- No credential collection, cross-scope denial, inherited SSRF/timeout bounds

Use public-seam fixture tests, Fastify injection for route cases, and real local HTTP for the observable integration. Run only commands available in the implementation; record actual results.

## API contracts

- [A27](../API_CATALOG.md#a27)
- [A31](../API_CATALOG.md#a31)

## Scope boundary

PRD13.3/22; advanced identity integrationsP2.

One ticket per implementation run; no universal discovery/interception, production tenancy, arbitrary code, or safety-gate bypass. FR-REP-07/08 stays authoritative.

## Completion evidence

- [ ] Retain observable backend/test results, scope, provenance, and requirement IDs.
- [ ] Run relevant tests, typecheck, lint, and build; explain unavailable checks.
- [ ] Preserve other owners' changes and explicitly review staged paths.
- [ ] After authorized feature push, append and separately push its log entry.
- [ ] Mark complete only when acceptance criteria and verified blockers pass.
