# 05 - Propose a constrained compatible adapter

**What to build:** An operator requests a proposal and sees a typed, evidence-backed mapping that works with either old or renamed provider data.

**Blocked by:** [04 - Explain affected and unaffected workflows](04-explain-impact.md).

**Status:** ready-for-agent

**Planning readiness:** This is an authored backlog item, not implemented or execution-ready evidence. Inspect every blocker and its available contract before starting; no blocker is marked complete by this revision.

**Priority:** P0

**Owner:** `saransh-sh`

**GitHub issue:** [#5](https://github.com/ashudotbuilds/PLAN9/issues/5)

**Applications/packages touched:** apps/api, apps/web, packages/repair, packages/adapter-runtime, packages/contracts.

**PRD traceability:** FR-REP-01, FR-REP-02, FR-REP-03, FR-REP-04, FR-REP-06, NFR-01, NFR-02, FR-LIN-01, FR-MON-01, NFR-21. Sections 12.6, 13, 15, 22 of [DRIFTGUARD_PRD.md](../../../DRIFTGUARD_PRD.md).

## Acceptance criteria

- [ ] Build an evidence bundle containing observations, canonical contract, workflows, fixtures, invariants, and allowed operations.
- [ ] Required deterministic RepairModel proposes coalesce [display_name, name] to displayName and labels source deterministic_fallback.
- [ ] P0 permits only rename/coalesce over known source and canonical paths; reject extra keys and every other operation.
- [ ] Show evidence references, uncertainties, required checks, recommendation, and adapter diff.
- [ ] Preserve id in the canonical projection; candidate execution cannot mutate active behavior or raw evidence.

- [ ] Bundle only compatible, scoped sanitized evidence, preserving control-plane versus customer-reported SDK sources, policy versions, maturity, and limitations.
- [ ] Metadata-only SDK fingerprints or inferred lineage cannot supply value-equivalence proof. Controlled three-identity HTTP evidence and existing workflow invariants remain required for the deterministic proposal.

## Test scenarios

- Old response, renamed response, both fields, missing fields
- Unknown operations and paths, malformed model output
- No arbitrary code, external calls, or prototype pollution through paths
- Unsupported drift gets a hold instead of a fabricated proposal

- Client-submitted fingerprint cannot become trusted equivalence evidence
- Foreign scope references and secret-bearing evidence fail before model submission

Exercise public package seams with fixture-driven unit tests; use Fastify injection for applicable routes and a mocked API client for UI interactions. Show this ticket's observable result over the real provider HTTP boundary when relevant. Record only commands actually executed.

## API contracts

- [A10](../API_CATALOG.md#a10)
- [A08](../API_CATALOG.md#a08)

## Scope boundary

Deliver the acceptance criteria as one observable slice. Preserve the PRD safety gates and keep speculative P1/P2 behavior outside this ticket.

## Completion evidence

- [ ] Demonstrate the behavior and retain relevant API/test results.
- [ ] Run applicable typecheck, lint, build, and meaningful unit/integration checks.
- [ ] Record requirement IDs, model/fallback/stub source, files changed, commands/results, and remaining gaps.
- [ ] Update this ticket status and the index only after its criteria pass.
