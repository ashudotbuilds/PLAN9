# 01 - Start a healthy demo across three applications

**What to build:** An operator starts the web app, control plane, and three simulated dependencies with one documented command and sees their actual readiness.

**Blocked by:** None - can start immediately.

**Status:** ready-for-agent

**Planning readiness:** This is an authored backlog item, not implemented or execution-ready evidence. Inspect every blocker and its available contract before starting; no blocker is marked complete by this revision.

**Priority:** P0

**Owner:** `ashudotbuilds`

**GitHub issue:** [#1](https://github.com/ashudotbuilds/PLAN9/issues/1)

**Applications/packages touched:** apps/web, apps/api, apps/mock-providers, packages/contracts.

**PRD traceability:** FR-SIM-01, FR-OPS-02, FR-OPS-03, NFR-08, NFR-11, NFR-12, NFR-20, NFR-23. Sections 12.1, 13.1, 16, 18 of [DRIFTGUARD_PRD.md](../../../DRIFTGUARD_PRD.md).

## Acceptance criteria

- [ ] All three applications start with environment placeholders and no model credentials.
- [ ] Users exposes the three stable identities; Inventory and Shipping return deterministic defaults over HTTP.
- [ ] Shared strict DTOs, error envelope, correlation header, and run/incident enums compile across consumers.
- [ ] Health checks report real readiness; the web shell displays loading, offline, and ready states.

- [ ] Freeze additive project/environment/session DTOs alongside existing recovery contracts; keep three always-on applications plus the on-demand Node sample boundary.
- [ ] Bind local API/UI proxy/mock controls to loopback; public health contains minimal readiness only. Configure the backend-only operator token as a placeholder, never a frontend secret. Operator/project behavior lands in ticket 28.
- [ ] Before ticket 28, do not expose unauthenticated demo-state/provider projections. Startup UI uses minimal public health; scoped A02/A14 are completed in 28 and otherwise remain unavailable or fail closed.

## Test scenarios

- Healthy and unavailable readiness
- Malformed route input returns the shared error envelope
- Secrets absent from frontend configuration

- Minimal public health leaks no provider details or secret values
- Package ownership still isolates mock scenario state from detector and SDK

Exercise public package seams with fixture-driven unit tests; use Fastify injection for applicable routes and a mocked API client for UI interactions. Show this ticket's observable result over the real provider HTTP boundary when relevant. Record only commands actually executed.

## API contracts

- [A01](../API_CATALOG.md#a01)
- [A02](../API_CATALOG.md#a02)
- [M01](../API_CATALOG.md#m01)
- [M02](../API_CATALOG.md#m02)
- [M03](../API_CATALOG.md#m03)
- [M06](../API_CATALOG.md#m06)
- [A14](../API_CATALOG.md#a14)

## Scope boundary

Deliver the acceptance criteria as one observable slice. Preserve the PRD safety gates and keep speculative P1/P2 behavior outside this ticket.

## Completion evidence

- [ ] Demonstrate the behavior and retain relevant API/test results.
- [ ] Run applicable typecheck, lint, build, and meaningful unit/integration checks.
- [ ] Record requirement IDs, model/fallback/stub source, files changed, commands/results, and remaining gaps.
- [ ] Update this ticket status and the index only after its criteria pass.
