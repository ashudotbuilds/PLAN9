# DriftGuard

**DriftGuard** is an autonomous dependency resilience platform that helps mission-critical applications survive undocumented, upstream API contract drift without service outages.

It learns live behavior from runtime telemetry, maps causal workflow impact via canonical field lineage, generates constrained adapter rules, validates them in an isolated 9-gate shadow sandbox, and coordinates automated activation, rollback, or semantic canary review holds.

---

## 1. Quickstart & Service Orchestration

### Prerequisites
- Node.js >= 20.0.0
- pnpm >= 9.0.0

### Installation
```bash
# Clone the repository
git clone https://github.com/ashudotbuilds/PLAN9.git
cd PLAN9

# Install dependencies across all monorepo workspaces
pnpm install

# Build all packages and applications
pnpm build
```

### Running the Services Locally
To boot the full local environment (Control Plane API, Mock Providers, and React Web Dashboard):

```bash
# Concurrently boots:
# - Control Plane API on http://127.0.0.1:4000
# - Mock Providers on http://127.0.0.1:4001
# - Web Dashboard on http://127.0.0.1:3000
pnpm dev
```

### Verification & Smoke Tests
```bash
# Validate planning integrity and traceability matrix (41 tickets, 97 requirements, 37 routes, 17 SDK gates)
pnpm validate:planning

# Run full monorepo test suite (147 tests across 8 packages)
pnpm test

# Run provider smoke tests against live mock endpoints
pnpm smoke
```

---

## 2. Architecture & Monorepo Topology

```
├── apps/
│   ├── api/                 # Fastify Control Plane API (Port 4000)
│   ├── mock-providers/      # Mock upstream APIs: Users, Inventory, Shipping (Port 4001)
│   ├── sample-consumer/     # Realistic Node.js consumer using @driftguard/sdk
│   └── web/                 # High-end React 19 / Vite Control Plane Dashboard (Port 3000)
├── packages/
│   ├── contracts/           # Strict Zod DTO schemas, route matrix & error envelopes
│   ├── observer/            # Non-blocking telemetry collectors & secret redactors
│   └── sdk/                 # @driftguard/sdk client library for host applications
├── tests/
│   └── integration/         # Connected SDK (AT-SDK-01..17) and Golden Rehearsal suites
└── scripts/
    ├── dev-runner.ts        # Service bootstrapper
    ├── demo-smoke.ts        # Provider smoke verification
    └── validate-planning.mjs # Planning & traceability validator
```

---

## 3. The 3-Minute Golden Demo Walkthrough

The demo proves automated recovery across two distinct, real-world failure patterns:

### Scenario 1: Users API Field-Rename (`name` → `display_name`)
1. **Baseline Capture (`POST /api/baselines/capture`)**:
   - Observes healthy responses across stable test identities (`u-123`, `u-456`, `u-789`).
   - Produces immutable baseline fingerprint and links canonical fields (`name`, `id`).
2. **Drift Injection (`POST /api/scenarios/users.field-rename/inject`)**:
   - Mock provider renames payload property `name` to `display_name`.
3. **Observation & Detection (`POST /api/observations/run`)**:
   - Drift detector identifies `field_removed` on canonical field `name`.
   - Traces impact to `welcome_email` and `customer_profile` workflows (`inventory_sync` unaffected).
4. **Autonomous Recovery (`POST /api/incidents/:id/recover`)**:
   - Deterministic fallback engine generates coalesce adapter rule (`name = display_name ?? name`).
   - Executes 9-gate shadow validation without leaking mutations.
   - Activates adapter patch `v2` and verifies post-activation replay.
   - Incident transitions to `recovered`.

### Scenario 2: Shipping Calendar vs. Business-Days Semantic Hold
1. **Drift Injection (`POST /api/scenarios/shipping.business-days/inject`)**:
   - Mock provider switches calculation from calendar days to business days without altering JSON schema shape.
2. **Semantic Detection (`POST /api/observations/run`)**:
   - Invariant verifier flags mismatch in delivery date calculations.
3. **Review-Required Hold (`POST /api/patches/:id/validate`)**:
   - Repair engine proposes candidate adapter but flags `recommendation: 'review_required'`.
   - Semantic canary refuses automatic activation, holding patch for operator confirmation.
4. **Safety Verification**:
   - Tampered or modified patch hashes are rejected with `409 PATCH_HASH_MISMATCH`.
   - Adapters can be rolled back to parent with `POST /api/patches/:id/rollback`.
   - Fresh session reset is invoked via `POST /api/demo/reset`.

---

## 4. Security Bounds & Production Invariants

1. **Local Loopback Security**:
   - All services bind strictly to loopback (`127.0.0.1`).
   - Control plane rejects non-loopback requests and unapproved origins.
2. **Ephemeral Ingestion Keys**:
   - Cryptographically random keys (`dg_ing_...`) delivered plaintext strictly once upon issuance.
   - Control plane stores only SHA-256 digests; dashboard never persists plaintext keys.
3. **Automatic Data Redaction**:
   - Authorization headers, cookies, API tokens, and URL credentials are sanitized before leaving the process.
4. **Host Application Isolation**:
   - Control plane network failures or rate limits never crash or block host consumer threads.

---

## 5. Verification Evidence

- **All 17 SDK Acceptance Gates Verified**: `tests/integration/connected-demo.test.ts` (AT-SDK-01 through AT-SDK-17).
- **Two Consecutive Rehearsal Cycles Passed**: `tests/integration/golden-demo.test.ts` (Clean reset and repeat execution under 1 second).
- **100% Monorepo Test Coverage**: 147 Vitest tests passing with 0 failures.
- **Traceability Guarantee**: 100% conformance with [DRIFTGUARD_PRD.md](DRIFTGUARD_PRD.md).
