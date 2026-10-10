# 03 - Inject and detect a user field rename

**What to build:** An operator injects users.field-rename and sees a deduplicated incident supported by before/after HTTP evidence across three identities.

**Blocked by:** [02 - Capture a healthy baseline and trace workflow reads](02-healthy-baseline-and-lineage.md).

**Status:** ready-for-agent

**Planning readiness:** This is an authored backlog item, not implemented or execution-ready evidence. Inspect every blocker and its available contract before starting; no blocker is marked complete by this revision.

**Priority:** P0

**Owner:** `ashudotbuilds`

**GitHub issue:** [#3](https://github.com/ashudotbuilds/PLAN9/issues/3)

**Applications/packages touched:** apps/mock-providers, apps/api, apps/web, packages/observer, packages/detector.

**PRD traceability:** FR-SIM-02, FR-SIM-03, FR-DET-01, FR-DET-02, FR-DET-03, FR-DET-05, FR-UI-03, FR-MON-01, NFR-20. Sections 12.6, 13.2–13.3, 16 of [DRIFTGUARD_PRD.md](../../../DRIFTGUARD_PRD.md).

## Acceptance criteria

- [ ] Injection changes subsequent HTTP responses without restart or source edits.
- [ ] Observe u-123/Aarav, u-456/Meera, and u-789/Kabir with display_name replacing name.
- [ ] Classify removed/added fields with deterministic evidence and separate evidence strength from repair confidence.
- [ ] Repeating equivalent observations reuses the active incident fingerprint.
- [ ] Existing user workflows visibly fail through their required-field invariants.
- [ ] Detector cannot import scenario controls or require a model.

- [ ] Scope findings, deduplication, before/after references, and incident lookup by project/environment/session; guarded scenario and observe actions require the owning demo lease.
- [ ] Persist detected/suspected/confirmed evidence maturity independently from incident lifecycle. Three controlled identity fixtures corroborate rename; one sample remains limited evidence.
- [ ] Compare only compatible endpoint/policy/fixture context. Accept the observer seam used later by ticket 31; metadata-only inputs cannot invent removed/added fields, and historical late events cannot reopen active incidents.

## Test scenarios

- Added, removed, moved, type-changed fields
- Duplicate observations
- Provider unavailable and malformed JSON are classified without invented shape changes
- One identity disagrees with rename evidence

- Same finding across two scopes does not collapse their incident identity
- Metadata-only and incompatible cohort events yield limitations instead of field drift
- One timeout remains scoped/suspected, never provider-wide confirmed failure

Exercise public package seams with fixture-driven unit tests; use Fastify injection for applicable routes and a mocked API client for UI interactions. Show this ticket's observable result over the real provider HTTP boundary when relevant. Record only commands actually executed.

## API contracts

- [A05](../API_CATALOG.md#a05)
- [A06](../API_CATALOG.md#a06)
- [A07](../API_CATALOG.md#a07)
- [A08](../API_CATALOG.md#a08)
- [M04](../API_CATALOG.md#m04)

## Scope boundary

Deliver the acceptance criteria as one observable slice. Preserve the PRD safety gates and keep speculative P1/P2 behavior outside this ticket.

## Completion evidence

- [ ] Demonstrate the behavior and retain relevant API/test results.
- [ ] Run applicable typecheck, lint, build, and meaningful unit/integration checks.
- [ ] Record requirement IDs, model/fallback/stub source, files changed, commands/results, and remaining gaps.
- [ ] Update this ticket status and the index only after its criteria pass.
