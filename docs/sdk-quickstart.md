# DriftGuard SDK Quickstart & Acceptance Verification

This guide documents the local setup, security model, and rehearsal verification evidence for the DriftGuard SDK and sample consumer integration.

---

## 1. Quickstart: Connecting an Application

### Installation & Prerequisites
DriftGuard SDK is designed for zero-overhead, asynchronous, non-blocking telemetry collection in Node.js applications.

```bash
# In your Node.js application directory
npm install @driftguard/sdk
```

### Configuration & Initialization

```typescript
import { DriftGuard } from '@driftguard/sdk';

const driftguard = new DriftGuard({
  apiKey: process.env.DRIFTGUARD_API_KEY,      // Ephemeral ingestion key issued by operator
  projectId: process.env.DRIFTGUARD_PROJECT_ID,  // Bound project identifier
  endpoint: 'http://127.0.0.1:4000',            // Local loopback control plane
  environment: 'development',                  // 'development' | 'production'
  allowInsecureLoopback: true,                  // Only permitted for localhost/127.0.0.1
  autoBatchFlush: true
});
```

### Dependency Registration

Before sending telemetry, register external service dependencies:

```typescript
const registration = await driftguard.registerDependency({
  name: 'users-api',
  type: 'rest-api',
  baseUrl: 'http://127.0.0.1:4001'
});

if (registration.ok) {
  console.log(`Registered dependency: ${registration.dependencyId} for session: ${registration.sessionId}`);
}
```

### Manual Request Tracking & Flushing

Track telemetry events after outgoing HTTP calls to dependencies:

```typescript
// Perform outbound request to dependent provider
const res = await fetch('http://127.0.0.1:4001/users/u-123');
const data = await res.json();

// Record telemetry in DriftGuard buffer (non-blocking, bounded queue)
driftguard.trackRequest({
  dependencyId: registration.dependencyId,
  method: 'GET',
  routeTemplate: '/users/:id',
  statusCode: res.status,
  durationMs: 4,
  fixtureKey: 'user:u-123'
});

// Explicit flush (e.g. before shutdown)
const flushResult = await driftguard.flush();
console.log(`Flushed: accepted=${flushResult.accepted}, dropped=${flushResult.dropped}`);
```

---

## 2. Disposable Demo Keys & Security Invariants

DriftGuard enforces strict credential boundary invariants:

1. **One-Time Plaintext Delivery**:
   - Ingestion keys are cryptographically generated (`dg_ing_...`).
   - Plaintext is returned exactly once during issuance (`POST /api/projects/:id/keys`) with `Cache-Control: no-store`.
   - The control plane stores only the SHA-256 digest (`secretDigest`).
2. **Safe Metadata Read**:
   - Operator endpoints (`GET /api/projects/:id`) return only key prefix, label, creation timestamp, and status.
   - Plaintext and raw secret digests are never exposed in any read response or frontend state.
3. **No Frontend Persistence**:
   - The web UI maintains zero persistence for ingestion keys across page refreshes or route changes.
4. **Scope Binding & Enforcement**:
   - Ingestion keys are strictly bound to a single `(projectId, environment)` tuple.
   - Using an ingestion key for another project or environment is rejected with `401` or `403`.
   - Ingestion keys have zero operator privileges and cannot call administrative or recovery endpoints.
5. **Key Lifecycle Limits**:
   - Maximum 3 active keys per environment.
   - Atomic rotation (`POST /api/projects/:id/keys/:keyId/rotate`) revokes the old key and issues a replacement.

---

## 3. Two Recovery Scenarios & Oracle Gates

DriftGuard proves automated detection and dual recovery paths side-by-side using local mock providers:

### Scenario A: Users API Field-Rename Drift (`name` → `display_name`)
1. **Baseline**: Captured under healthy Users mock provider (`A03`).
2. **Injection**: Scenario `users.field-rename` alters provider responses (`A05`).
3. **Detection**: Detector flags schema diff `field_removed` on `name` and creates incident (`A06`, `A07`).
4. **Impact**: Lineage engine traces `name` to `welcome_email` workflow; `inventory_sync` remains unaffected (`A09`).
5. **Deterministic Repair**: Proposes fallback adapter rule coalescing `display_name` to `name` (`A10`).
6. **Shadow Validation**: Validates all 9 safety gates without leaking mutations (`A11`).
7. **Activation & Recovery**: Patch activates and restores `welcome_email` workflow (`A12`).

### Scenario B: Shipping Calendar vs. Business-Days Semantic Drift
1. **Injection**: Scenario `shipping.business-days` alters delivery calculation without modifying JSON schema shape (`M04`).
2. **Detection**: Observed response delivery dates mismatch calendar expectations (`A06`).
3. **Repair Proposal**: Engine proposes repair with `recommendation: 'review_required'` (`A10`).
4. **Semantic Canary Hold**: Shadow validation halts automatic activation because the change requires human semantic review (`A11`).
5. **Safety Invariant**: Unvalidated or modified patch hashes are rejected with `409 PATCH_HASH_MISMATCH` or `409 PATCH_NOT_VALIDATED` (`A12`).

---

## 4. Rehearsal Verification Evidence (AT-SDK-01 through AT-SDK-17)

All 17 acceptance gates are implemented and verified via automated integration tests in `tests/integration/connected-demo.test.ts`:

| Gate | Title | Verification Status | Evidence Summary |
|---|---|---|---|
| **AT-SDK-01** | Operator creates project & issues dev key | **PASSED** | Key issued with `dg_ing_` prefix; safe metadata read returns prefix/status only. |
| **AT-SDK-02** | Valid bound key registers Users & submits traffic | **PASSED** | Users dependency registered; batch ingested with accepted count = 1. |
| **AT-SDK-03** | Negative credential tests (revoked, rotated, wrong scope) | **PASSED** | 401 on invalid/rotated key; ingestion key blocked from operator admin routes. |
| **AT-SDK-04** | Sample consumer executes 3 real requests & flushes | **PASSED** | Real HTTP requests to mock Users succeed; tracked=true; batch flush accepted=3. |
| **AT-SDK-05** | Redaction of auth, cookies, keys, credentials | **PASSED** | Redactor strips authorization, cookie, and apikey fields; URL credentials sanitized. |
| **AT-SDK-06** | Host isolation when control plane unavailable | **PASSED** | SDK gracefully buffers and drops without crashing host application requests. |
| **AT-SDK-07** | Idempotent batch retry & conflicting event conflict | **PASSED** | Exact batch retries return duplicates count; conflicting event IDs return 409. |
| **AT-SDK-08** | Inventory dashboard lists dependencies & status | **PASSED** | Dependencies query lists health, confidence, and observation metrics. |
| **AT-SDK-09** | Baseline capture & immutable evidence separation | **PASSED** | Baseline capture returns 201; fingerprint matches state projection. |
| **AT-SDK-10** | Field-rename drift detection | **PASSED** | Ingested scenario produces incident with `field_removed` finding. |
| **AT-SDK-11** | Canonical field-read lineage & workflow impact | **PASSED** | Impact analysis identifies `welcome_email` as affected and `inventory_sync` as unaffected. |
| **AT-SDK-12** | Complete field-rename repair & shadow activation | **PASSED** | Deterministic fallback proposed, validated against 9 gates, activated to recovered. |
| **AT-SDK-13** | Shipping calendar→business-days semantic canary refusal | **PASSED** | Semantic canary holds patch activation under `review_required`. |
| **AT-SDK-14** | Patch hash tampering rejection | **PASSED** | Modifying validated patch hash causes 409 `PATCH_HASH_MISMATCH`. |
| **AT-SDK-15** | Demo reset & stale session rejection | **PASSED** | Reset returns status `awaiting_baseline`; batches with old sessionId rejected with 409 `STALE_SESSION`. |
| **AT-SDK-16** | Deterministic fallback engine without AI credentials | **PASSED** | Local deterministic repair proposal generates valid coalesce rule without external API. |
| **AT-SDK-17** | Complete local fixture execution with no cloud dependencies | **PASSED** | All services run on 127.0.0.1 loopback; zero production network calls or paid APIs. |

---

## 5. Scope Boundaries & Limitations

- **Local Mock Scope**: Telemetry and provider calls are bound to local loopback mocks (ports 4000 and 4001).
- **Session Fencing**: Reset clears runtime session evidence while preserving project keys and baseline policies.
- **Ticket 13 Milestone**: Ticket 13 owns the final end-to-end golden demo release packaging.
