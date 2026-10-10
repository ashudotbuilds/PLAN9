# 09 - Operate and inspect recovery from the dashboard

**What to build:** A judge runs safe recovery and inspects evidence, impact, patch, checks, and results within one coherent dashboard.

**Blocked by:** [08 - Run recovery through one backend command](08-backend-recovery-run.md); [28 - Establish local operator and project onboarding](28-local-project-onboarding.md).

**Status:** ready-for-agent

**Planning readiness:** This is an authored backlog item, not implemented or execution-ready evidence. Inspect every blocker and its available contract before starting; no blocker is marked complete by this revision.

**Priority:** P0

**Owner:** `AnushkaBhardwaj15`

**GitHub issue:** [#9](https://github.com/ashudotbuilds/PLAN9/issues/9)

**Applications/packages touched:** apps/web, packages/contracts.

**PRD traceability:** FR-UI-01, FR-UI-02, FR-UI-05, FR-UI-06, FR-UI-07, FR-UI-09, NFR-06, NFR-10, NFR-18, FR-LIN-01, FR-MON-01, NFR-08. Sections 13.1, 17, 21.1 (AT-SDK-11) of [DRIFTGUARD_PRD.md](../../../DRIFTGUARD_PRD.md).

## Acceptance criteria

- [ ] Use dependency rail, incident workspace, impact trace, repair lab, and compact audit timeline.
- [ ] Run safe recovery issues one command and polls backend progress; guided actions remain available.
- [ ] All status, checks, counts, durations, and eligibility reasons come from backend results.
- [ ] Use solid surfaces, compact evidence rows, clear typography, restrained operational color, and causal column ordering.
- [ ] No decorative gradients, glass, neon, bento collage, blobs, nested-card clutter, or continuous animation.
- [ ] Handle loading, empty, unavailable, rejected, review, recovered, and rolled-back states; provide focus, contrast, keyboard use, and reduced motion.
- [ ] Run saransh_custom_antislop and fix material findings after functional verification.

- [ ] Use the authenticated operator session from ticket 28 with selected project/environment/session on existing control-plane calls. Handle 401 expiry and Origin rejection; public health never implies operator access.
- [ ] Render source/context, baseline versus latest, evidence maturity, and declared/inferred/runtime lineage accurately. Missing lineage remains unknown. Compose the later ticket 34 setup strip without moving recovery orchestration into React.

## Test scenarios

- Mocked API-client user interactions and errors
- Poll lifecycle and prevent duplicate clicks
- Illegal action explanation
- Manual keyboard and responsive smoke
- API/browser rehearsal against actual backend

- Expired cookie and denied Origin render safe reauthentication state
- Project/environment changes clear stale incident/run views
- Inferred lineage and metadata-only evidence are visibly limited

Exercise public package seams with fixture-driven unit tests; use Fastify injection for applicable routes and a mocked API client for UI interactions. Show this ticket's observable result over the real provider HTTP boundary when relevant. Record only commands actually executed.

## API contracts

- [A01](../API_CATALOG.md#a01)
- [A02](../API_CATALOG.md#a02)
- [A03](../API_CATALOG.md#a03)
- [A04](../API_CATALOG.md#a04)
- [A05](../API_CATALOG.md#a05)
- [A06](../API_CATALOG.md#a06)
- [A07](../API_CATALOG.md#a07)
- [A08](../API_CATALOG.md#a08)
- [A09](../API_CATALOG.md#a09)
- [A10](../API_CATALOG.md#a10)
- [A11](../API_CATALOG.md#a11)
- [A12](../API_CATALOG.md#a12)
- [A13](../API_CATALOG.md#a13)
- [A15](../API_CATALOG.md#a15)
- [A16](../API_CATALOG.md#a16)
- [A17](../API_CATALOG.md#a17)
- [A14](../API_CATALOG.md#a14)

## Scope boundary

Deliver the acceptance criteria as one observable slice. Preserve the PRD safety gates and keep speculative P1/P2 behavior outside this ticket.

## Completion evidence

- [ ] Demonstrate the behavior and retain relevant API/test results.
- [ ] Run applicable typecheck, lint, build, and meaningful unit/integration checks.
- [ ] Record requirement IDs, model/fallback/stub source, files changed, commands/results, and remaining gaps.
- [ ] Update this ticket status and the index only after its criteria pass.
