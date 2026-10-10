# 19 - Stream actual recovery events to the dashboard

**What to build:** An operator sees incident and recovery progress update from actual server events while polling remains a fallback.

**Blocked by:** [13 - Prove and rehearse the complete three-minute demo](13-golden-demo-release.md).

**Status:** ready-for-agent

**Priority:** P1 - optional after P0 acceptance is stable

**Owner:** Frontend and demo engineer

**Applications/packages touched:** apps/api, apps/web, packages/contracts.

**PRD traceability:** FR-UI-08.

## Acceptance criteria

- [ ] Implement typed SSE events derived from persisted run/audit updates.
- [ ] Bound connection lifetime and cleanup; correlate session, incident, run, and event identifiers.
- [ ] Reconnect and deduplicate events; retrieve current projection to resolve gaps.
- [ ] Retain polling when the stream disconnects; events never invent success.
- [ ] Respect reduced motion for stage transitions.

## Test scenarios

- Disconnect/reconnect and duplicate event
- Reset invalidates old-session view
- No leaked connections/listeners

Exercise public package seams with fixture-driven unit tests; use Fastify injection for applicable routes and a mocked API client for UI interactions. Show this ticket's observable result over the real provider HTTP boundary when relevant. Record only commands actually executed.

## API contracts

- [A19](../API_CATALOG.md#a19)
- [A02](../API_CATALOG.md#a02)
- [A17](../API_CATALOG.md#a17)

## Scope boundary

Do not start until the primary P0 acceptance test is stable. Keep this extension optional for the judge demo, and publish any required schema or policy extension before implementing it.

## Completion evidence

- [ ] Demonstrate the behavior and retain relevant API/test results.
- [ ] Run applicable typecheck, lint, build, and meaningful unit/integration checks.
- [ ] Record requirement IDs, model/fallback/stub source, files changed, commands/results, and remaining gaps.
- [ ] Update this ticket status and the index only after its criteria pass.
