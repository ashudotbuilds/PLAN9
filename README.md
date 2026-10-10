# DriftGuard

DriftGuard helps applications survive undocumented dependency changes. It learns
behavior from observations, traces workflow impact, proposes a constrained adapter,
and validates it before activation. The required demo recovers from Users
`name → display_name` and holds Shipping's calendar-to-business-day change for review.

This repository contains the implementation plan and team governance. Application
code and a runnable demo are still to be built; document validation does not prove
product acceptance.

## Start implementation

Read [agent.md](agent.md) and the [PRD](DRIFTGUARD_PRD.md), then use the
[ticket index](.scratch/driftguard/README.md). The backlog has 41 tickets:
21 P0, 14 P1, and 6 P2. Its initial implementation frontier is
[01 — healthy demo startup](.scratch/driftguard/issues/01-healthy-demo-startup.md).
Ticket numbers are local planning IDs; each ticket records its actual GitHub issue.
Verify live issue ownership and every blocker before starting.

The plan assigns 11 tickets to Ashutosh (`ashudotbuilds`) and 10 each to Saransh
(`saransh-sh`), Anushka (`AnushkaBhardwaj15`), and Chandrabhan
(`chandrabhan-kushwaha`). Counts balance backlog ownership, not effort or simultaneous
readiness. P2 remains deferred.

## Product contracts

The [API catalog](.scratch/driftguard/API_CATALOG.md) describes 37 specified routes.
The [coverage map](.scratch/driftguard/REQUIREMENT_COVERAGE.md) maps 97 requirement
IDs to tickets. The PRD remains authoritative for semantics, bounds, and release gates.

The target stack is a pnpm TypeScript monorepo with React/Vite, a Fastify control
plane, separate HTTP mocks, Zod contracts, Lowdb demo persistence, and Vitest.
The Node SDK and sample CLI add a real connection path; the sample runs on demand.
PRD sections 12 and 18 define the architecture and target file structure.

The connected release requires
[35 — connected acceptance](.scratch/driftguard/issues/35-connected-demo-acceptance.md)
and [13 — complete demo rehearsal](.scratch/driftguard/issues/13-golden-demo-release.md):
the exact recovery test in PRD section 21 plus every SDK gate in section 21.1.
P1 starts only after those P0 gates pass and time remains. Freeze features at hour 19.

## Validate the plan

Run from the repository root with Node:

```sh
node scripts/validate-planning.mjs
```

This checks planning consistency, not services, workflow execution, or security
implementation. Runtime startup, lint, typecheck, build, and application test commands
will be documented by ticket 01 after real scripts exist.

## Local configuration

[.env.example](.env.example) contains empty credential placeholders. Operator
credentials belong only in the API process; project ingestion keys belong only in
the Node sample/SDK process. Never expose either as `VITE_*` configuration. API,
web proxy, and mock control bindings must use loopback for the local demo.
The SDK must explicitly enable `allowInsecureLoopback` for its local HTTP endpoint.

P0 is a local single-operator prototype. Production TLS, operator identity/RBAC,
durable tenant isolation, retention/deletion, and authorized egress remain separate
release gates. Follow [CONTRIBUTING.md](CONTRIBUTING.md) for ticket delivery and
append-only publication logging in [log.md](log.md).
