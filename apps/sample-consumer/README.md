# DriftGuard Sample Consumer (`@driftguard/sample-consumer`)

A minimal, realistic Node application demonstrating explicit integration with the `@driftguard/sdk` without paid third-party APIs or invasive HTTP proxying.

## Overview

The sample consumer demonstrates the four core phases of the DriftGuard Node SDK lifecycle:
1. **SDK Initialization:** Local configuration validation with memory-only key management and loopback security controls.
2. **Explicit Dependency Registration:** Registration of external service boundaries (`users-api`) via `POST /api/dependencies/register` (A27) before traffic starts.
3. **Manual Request Tracking:** Transparent telemetry capture derived from actual HTTP requests for stable fixture identities (`u-123`, `u-456`, `u-789`), preserving host execution outcomes on SDK failure.
4. **Bounded Delivery & Graceful Shutdown:** Asynchronous batch flushing (`POST /api/ingest/observations`) and clean shutdown with zero dangling intervals.

---

## Configuration & Environment Variables

| Variable | Description | Default |
|---|---|---|
| `DRIFTGUARD_API_KEY` | Environment-scoped ingestion Bearer token issued by DriftGuard | `dg_key_dev_default` |
| `DRIFTGUARD_PROJECT_ID` | Application project boundary identifier | `proj-local-01` |
| `DRIFTGUARD_ENDPOINT` | Control plane ingestion API endpoint URL | `http://127.0.0.1:4000` |
| `DRIFTGUARD_ENVIRONMENT` | Target scope environment (`development` or `production`) | `development` |
| `USERS_API_BASE_URL` | Upstream mock Users provider service URL | `http://127.0.0.1:4001` |

---

## How to Run Locally

### 1. Start the Local DriftGuard Services
Ensure the Control Plane API and Mock Providers are running:
```bash
pnpm dev
# Or start separately:
# npx tsx apps/mock-providers/src/index.ts (port 4001)
# npx tsx apps/api/src/index.ts (port 4000)
```

### 2. Issue an Ingestion Key (if not using dev default)
Issue a cryptographically random key via `POST /api/projects/:projectId/keys`:
```bash
curl -X POST http://127.0.0.1:4000/api/projects/proj-local-01/keys \
  -H "Content-Type: application/json" \
  -H "x-driftguard-operator-token: <operator-token>" \
  -d '{"environment": "development"}'
```

### 3. Run the Sample Consumer
Run the consumer via tsx:
```bash
pnpm --filter @driftguard/sample-consumer start
```

### Expected Output
```text
[sample-consumer] Initializing DriftGuard SDK for project: proj-local-01 (development)
[sample-consumer] Registering dependency 'users-api' at http://127.0.0.1:4001...
[sample-consumer] Registered dependency successfully: id=dep_..., session=sess_...
[sample-consumer] Request GET /users/u-123 -> 200 (12ms, tracked=true)
[sample-consumer] Request GET /users/u-456 -> 200 (8ms, tracked=true)
[sample-consumer] Request GET /users/u-789 -> 200 (7ms, tracked=true)
[sample-consumer] Flushing telemetry to DriftGuard...
[sample-consumer] Flush result: accepted=3, duplicates=0, dropped=0
[sample-consumer] Shutdown complete.
```

---

## Workspace Import & Programmatic Usage

You can also import and execute the consumer programmatically:
```typescript
import { runSampleConsumer } from '@driftguard/sample-consumer';

const result = await runSampleConsumer({
  apiKey: 'dg_key_...',
  projectId: 'proj-local-01',
  endpoint: 'http://127.0.0.1:4000',
  environment: 'development',
  usersApiBaseUrl: 'http://127.0.0.1:4001'
});

console.log('Accepted observations:', result.flush.accepted);
```

---

## Failure Isolation Contract

The SDK is strictly non-interfering:
- **No HTTP Monkey-Patching:** Telemetry is passed explicitly after requests complete.
- **Resilience:** If DriftGuard is unreachable, down, or returns errors, host requests to `users-api` complete uninterrupted.
- **Bounded Resource Consumption:** Enforces an in-memory limit of 100 queued events and drops oldest/newest on overflow without crashing host processes.
