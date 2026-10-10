# 01 - Start a healthy demo across three applications

**What to build:** An operator starts the web app, control plane, and three simulated dependencies with one documented command and sees their actual readiness.

**Blocked by:** None - can start immediately.

**Status:** ready-for-agent

**Priority:** P0

**Owner:** Integration lead

**Applications/packages touched:** apps/web, apps/api, apps/mock-providers, packages/contracts.

**PRD traceability:** FR-SIM-01, FR-OPS-02, FR-OPS-03, NFR-08, NFR-11, NFR-12.

## Acceptance criteria

- [ ] All three applications start with environment placeholders and no model credentials.
- [ ] Users exposes the three stable identities; Inventory and Shipping return deterministic defaults over HTTP.
- [ ] Shared strict DTOs, error envelope, correlation header, and run/incident enums compile across consumers.
- [ ] Health checks report real readiness; the web shell displays loading, offline, and ready states.

## Test scenarios

- Healthy and unavailable readiness
- Malformed route input returns the shared error envelope
- Secrets absent from frontend configuration

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
