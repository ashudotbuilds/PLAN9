# 19 - Stream actual recovery events to the dashboard

**What to build:** An operator sees incident and recovery progress update from actual server events while polling remains a fallback.

**Blocked by:** [13 - Prove and rehearse the complete three-minute demo](13-golden-demo-release.md).

**Status:** ready-for-agent

**Planning readiness:** This is an authored backlog item, not implemented or execution-ready evidence. Inspect every blocker and its available contract before starting; no blocker is marked complete by this revision.

**Priority:** P1 - optional after P0 acceptance is stable

**Owner:** `chandrabhan-kushwaha`

**GitHub issue:** [#19](https://github.com/ashudotbuilds/PLAN9/issues/19)

**Applications/packages touched:** apps/api, apps/web, packages/contracts.

**PRD traceability:** FR-UI-08, NFR-20. Sections 13.1–13.2, 16 of [DRIFTGUARD_PRD.md](../../../DRIFTGUARD_PRD.md).

## Acceptance criteria

- [ ] Implement typed SSE events derived from persisted run/audit updates.
- [ ] Bound connection lifetime and cleanup; correlate session, incident, run, and event identifiers.
- [ ] Reconnect and deduplicate events; retrieve current projection to resolve gaps.
- [ ] Retain polling when the stream disconnects; events never invent success.
- [ ] Respect reduced motion for stage transitions.

- [ ] Authenticate SSE with operator session and scope filters; client-supplied incident/run IDs cannot cross projects, environments, or archived sessions.

## Test scenarios

- Disconnect/reconnect and duplicate event
- Reset invalidates old-session view
- No leaked connections/listeners

- Scope switch and cookie expiry close stream and clear obsolete view

Exercise public package seams with fixture-driven unit tests; use Fastify injection for applicable routes and a mocked API client for UI interactions. Show this ticket's observable result over the real provider HTTP boundary when relevant. Record only commands actually executed.

## API contracts

- [A19](../API_CATALOG.md#a19)
- [A02](../API_CATALOG.md#a02)
- [A17](../API_CATALOG.md#a17)

## Scope boundary

Do not start until ticket 13 verifies both the original section 21 recovery test and all connected SDK gates in section 21.1, with remaining time before the hour-19 freeze. Keep this extension optional for the judge demo, and publish any required schema or policy extension before implementing it.

## Completion evidence

- [ ] Demonstrate the behavior and retain relevant API/test results.
- [ ] Run applicable typecheck, lint, build, and meaningful unit/integration checks.
- [ ] Record requirement IDs, model/fallback/stub source, files changed, commands/results, and remaining gaps.
- [ ] Update this ticket status and the index only after its criteria pass.
