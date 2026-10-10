# 41 - Demonstrate one authorized mock MCP tool-schema change

**What to build:** A labelled mock MCP integration exposes a versioned tool/schema snapshot and potential consumer impact through the same evidence vocabulary.

**Blocked by:** Ticket 13.

**Status:** optional-after-P0 (freeze additive contracts within this ticket before implementation)

**Priority:** P1

**Owner:** `soumya240806`

**Applications/packages touched:** fixtures, apps/api, packages/contracts, packages/lineage.

**PRD traceability:** FR-DIS-02, FR-LIN-01, FR-MON-01.

**GitHub issue:** [#41](https://github.com/ashudotbuilds/PLAN9/issues/41)

## Acceptance criteria

- [ ] Freeze one fixture/local mock tool metadata and observation contract; no universal transport or tool enumeration claim.
- [ ] Explicitly register server identity/type while hiding connection secrets; version advertised tool/schema fingerprints and record permitted call metadata.
- [ ] Show added/removed/changed tool/schema evidence and declared versus proven consumer links.
- [ ] Keep existing repair/validation/risk safeguards; do not execute untrusted tool descriptions or repair auth/permissions.

## Test scenarios

- Stable/changed/removed fixture tool schema and deterministic fingerprints
- Unauthorized server/tool access, malformed schema and hostile instructions
- Proven versus inferred workflow impact and no unsupported transport success claim

Use public-seam fixture tests, Fastify injection for route cases, and real local HTTP for the observable integration. Run only commands available in the implementation; record actual results.

## API contracts

- [A27](../API_CATALOG.md#a27)
- [A31](../API_CATALOG.md#a31)

## Scope boundary

PRD13.3/22; generalized provider/MCP support remains ticket23P2.

One ticket per implementation run; no universal discovery/interception, production tenancy, arbitrary code, or safety-gate bypass. FR-REP-07/08 stays authoritative.

## Completion evidence

- [ ] Retain observable backend/test results, scope, provenance, and requirement IDs.
- [ ] Run relevant tests, typecheck, lint, and build; explain unavailable checks.
- [ ] Preserve other owners' changes and explicitly review staged paths.
- [ ] After authorized feature push, append and separately push its log entry.
- [ ] Mark complete only when acceptance criteria and verified blockers pass.
