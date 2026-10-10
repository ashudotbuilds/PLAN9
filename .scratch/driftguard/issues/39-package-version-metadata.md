# 39 - Attach explicit package version metadata to registered integrations

**What to build:** A developer records a known integration package/version and the inventory shows version history without claiming that a version bump proves runtime breakage.

**Blocked by:** Ticket 13.

**Status:** optional-after-P0 (freeze additive contracts within this ticket before implementation)

**Priority:** P1

**Owner:** `soumya240806`

**Applications/packages touched:** apps/api, packages/contracts, apps/web.

**PRD traceability:** FR-DIS-02, FR-INV-02, FR-MON-01.

**GitHub issue:** [#39](https://github.com/ashudotbuilds/PLAN9/issues/39)

## Acceptance criteria

- [ ] Define minimal explicit package/version DTO extension and review it against registration and history contracts.
- [ ] Preserve declared/observed provenance, version snapshot and workflow relationships only when supplied/evidenced.
- [ ] A package version change is labelled metadata evidence, not a provider-wide confirmed behavioral failure.
- [ ] No broad lockfile scanner, registry credential upload or new unapproved network calls.

## Test scenarios

- Same/new version snapshot, unsupported package and malformedversion
- Declared package versus proven runtime evidence
- Inventory/history scope and no automatic repair triggered by version alone

Use public-seam fixture tests, Fastify injection for route cases, and real local HTTP for the observable integration. Run only commands available in the implementation; record actual results.

## API contracts

- [A27](../API_CATALOG.md#a27)
- [A31](../API_CATALOG.md#a31)

## Scope boundary

PRD13.3; broad scanning remainsP2.

One ticket per implementation run; no universal discovery/interception, production tenancy, arbitrary code, or safety-gate bypass. FR-REP-07/08 stays authoritative.

## Completion evidence

- [ ] Retain observable backend/test results, scope, provenance, and requirement IDs.
- [ ] Run relevant tests, typecheck, lint, and build; explain unavailable checks.
- [ ] Preserve other owners' changes and explicitly review staged paths.
- [ ] After authorized feature push, append and separately push its log entry.
- [ ] Mark complete only when acceptance criteria and verified blockers pass.
