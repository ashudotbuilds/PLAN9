# 02 - Capture a healthy baseline and trace workflow reads

**What to build:** An operator captures actual provider responses and workflow results into a versioned baseline, with evidence showing which canonical fields each workflow read.

**Blocked by:** [01 - Start a healthy demo across three applications](01-healthy-demo-startup.md).

**Status:** ready-for-agent

**Priority:** P0

**Owner:** Simulation and lineage engineer

**Applications/packages touched:** apps/api, apps/web, packages/observer, packages/lineage, packages/adapter-runtime.

**PRD traceability:** FR-OBS-01, FR-OBS-02, FR-OBS-03, FR-OBS-05, FR-IMP-01, FR-IMP-02, NFR-03, NFR-09, NFR-14.

## Acceptance criteria

- [ ] Capture all three user identities and the inventory/shipping fixtures over HTTP.
- [ ] Baseline adapter maps name to CanonicalUser.displayName; canonical user contains id and displayName.
- [ ] welcome_email records a stubbed intent with a nonempty baseline-equal recipientName; customer_profile returns baseline-equal id and displayName.
- [ ] inventory_sync and delivery_estimate also have explicit inputs and invariants; runtime reads persist dependency edges.
- [ ] Raw evidence stays immutable; redaction occurs before persistence, and normalization creates a separate derived record.
- [ ] A second equivalent capture produces equivalent fingerprints despite approved volatile fields.

## Test scenarios

- Missing or malformed provider response
- Nested field reads and untouched workflows
- Volatile-field normalization and redaction
- Partial capture never claims a complete baseline

Exercise public package seams with fixture-driven unit tests; use Fastify injection for applicable routes and a mocked API client for UI interactions. Show this ticket's observable result over the real provider HTTP boundary when relevant. Record only commands actually executed.

## API contracts

- [A02](../API_CATALOG.md#a02)
- [A03](../API_CATALOG.md#a03)
- [A15](../API_CATALOG.md#a15)

## Scope boundary

Deliver the acceptance criteria as one observable slice. Preserve the PRD safety gates and keep speculative P1/P2 behavior outside this ticket.

## Completion evidence

- [ ] Demonstrate the behavior and retain relevant API/test results.
- [ ] Run applicable typecheck, lint, build, and meaningful unit/integration checks.
- [ ] Record requirement IDs, model/fallback/stub source, files changed, commands/results, and remaining gaps.
- [ ] Update this ticket status and the index only after its criteria pass.
