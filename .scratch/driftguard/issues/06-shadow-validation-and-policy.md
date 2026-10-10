# 06 - Validate candidate semantics and automatic eligibility

**What to build:** A judge sees an isolated candidate preserve baseline workflow outcomes before any activation is possible.

**Blocked by:** [05 - Propose a constrained compatible adapter](05-bounded-repair-proposal.md).

**Status:** ready-for-agent

**Priority:** P0

**Owner:** Repair and safety engineer

**Applications/packages touched:** apps/api, apps/web, packages/validation, packages/repair, packages/adapter-runtime.

**PRD traceability:** FR-REP-05, FR-REP-07, FR-REP-08, FR-VAL-01, FR-VAL-02, FR-VAL-03, FR-VAL-04, FR-VAL-05, FR-VAL-07, NFR-15.

## Acceptance criteria

- [ ] Replay captured fixtures in isolation through the constrained interpreter.
- [ ] Canonical schema and both affected workflow invariants pass for all three identities; unrelated workflows remain unchanged.
- [ ] Persist checks against the exact immutable candidate patch hash.
- [ ] Evaluate every FR-REP-07 gate as one conjunctive policy and persist individual outcomes.
- [ ] Semantic/conflicting/high-risk/insufficient evidence yields review_required; invalid proposals or failed validation yield rejected.
- [ ] Acknowledgement or approval never bypasses validation; side-effecting steps use intents or stubs.

## Test scenarios

- Independently falsify each FR-REP-07 gate
- Wrong display_name-to-id mapping fails
- Modified patch invalidates prior validation
- Validation timeout, missing fields, wrong types
- Shadow execution never emits real email

Exercise public package seams with fixture-driven unit tests; use Fastify injection for applicable routes and a mocked API client for UI interactions. Show this ticket's observable result over the real provider HTTP boundary when relevant. Record only commands actually executed.

## API contracts

- [A11](../API_CATALOG.md#a11)
- [A08](../API_CATALOG.md#a08)

## Scope boundary

Deliver the acceptance criteria as one observable slice. Preserve the PRD safety gates and keep speculative P1/P2 behavior outside this ticket.

## Completion evidence

- [ ] Demonstrate the behavior and retain relevant API/test results.
- [ ] Run applicable typecheck, lint, build, and meaningful unit/integration checks.
- [ ] Record requirement IDs, model/fallback/stub source, files changed, commands/results, and remaining gaps.
- [ ] Update this ticket status and the index only after its criteria pass.
