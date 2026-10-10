# 14 - Generate proposals through an optional live model

**What to build:** An operator optionally selects live proposal generation while the same evidence, DSL, and safety policy remain authoritative.

**Blocked by:** [13 - Prove and rehearse the complete three-minute demo](13-golden-demo-release.md).

**Status:** ready-for-agent

**Planning readiness:** This is an authored backlog item, not implemented or execution-ready evidence. Inspect every blocker and its available contract before starting; no blocker is marked complete by this revision.

**Priority:** P1 - optional after P0 acceptance is stable

**Owner:** `saransh-sh`

**GitHub issue:** [#14](https://github.com/ashudotbuilds/PLAN9/issues/14)

**Applications/packages touched:** packages/repair, apps/api, apps/web.

**PRD traceability:** FR-REP-02, FR-REP-04, FR-REP-06, NFR-07, NFR-08, FR-MON-01, NFR-21. Sections 12.6, 13, 22 of [DRIFTGUARD_PRD.md](../../../DRIFTGUARD_PRD.md).

## Acceptance criteria

- [ ] Add one provider-neutral RepairModel implementation only after credentials and schedule permit.
- [ ] Send minimal redacted evidence; keep credentials server-side.
- [ ] Label live_model and fallback sources distinctly.
- [ ] Malformed/unsupported output is rejected; timeout is recorded and only the supported rename scenario can use fallback.
- [ ] Live proposals undergo the identical FR-REP-07/08 and immutable-hash checks.

- [ ] Preserve scoped source/policy/context and evidence limitations in minimal model input; omit project keys, operator tokens, private auth data, and arbitrary environment values.

## Test scenarios

- Missing key, timeout, malformed JSON, forbidden operation
- Prompt/data content cannot execute code
- Live source label and supported fallback transition

- SDK customer claims cannot override controlled proof or policy
- Model prompt capture contains no secrets

Exercise public package seams with fixture-driven unit tests; use Fastify injection for applicable routes and a mocked API client for UI interactions. Show this ticket's observable result over the real provider HTTP boundary when relevant. Record only commands actually executed.

## API contracts

- [A10](../API_CATALOG.md#a10)
- [A16](../API_CATALOG.md#a16)

## Scope boundary

Do not start until ticket 13 verifies both the original section 21 recovery test and all connected SDK gates in section 21.1, with remaining time before the hour-19 freeze. Keep this extension optional for the judge demo, and publish any required schema or policy extension before implementing it.

## Completion evidence

- [ ] Demonstrate the behavior and retain relevant API/test results.
- [ ] Run applicable typecheck, lint, build, and meaningful unit/integration checks.
- [ ] Record requirement IDs, model/fallback/stub source, files changed, commands/results, and remaining gaps.
- [ ] Update this ticket status and the index only after its criteria pass.
