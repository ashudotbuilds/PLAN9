# DriftGuard API catalog

Source: PRD sections 12.5–13.4 and 16, plus FR-REC-01/02. This catalog lists planned contracts; endpoints are not implemented yet. All 37 PRD routes are included. IDs A01–A19 and M01–M06 are preserved; A20–A31 cover the project/SDK upgrade. Endpoint names, scope/authentication, exact recovery body, error envelope, ingestion limits, and key lifecycle come from the PRD. Additional success status choices, response groupings, and reason codes are implementation conventions to freeze in shared Zod contracts in their owning tickets, not additional PRD requirements.

## Boundaries

The browser calls only the control-plane API through its typed client. The control plane calls mock-provider HTTP routes. Mock control routes are demo controls, never data exposed to detector logic. Core detector/impact/repair/validation/interpreter functions and RepairModel are internal interfaces, not extra network APIs.

The P0 demo requires a project ingestion key for the Node SDK and a separate backend-configured operator token. Neither is a provider credential. It needs no external paid API, model key, real email service, or database service. Email is a recorded intent. A live model provider is optional in ticket 14; its URL/model/auth contract must be selected then.

## Common contract

- Every response carries X-Correlation-Id. Errors include the same correlation identifier in the body.
- Error shape: error containing code (stable), message (safe), details (bounded non-secret object), and correlationId.
- Ordinary completed mutations return an auditEventId. POST recover returns exactly recoveryRunId and incidentId with HTTP 202; audit is available through run/incident evidence.
- Parameters, bodies, outputs, persisted records, and proposals use shared strict Zod contracts. Reject unsupported fields rather than interpreting arbitrary input.
- Invariant failure is a recorded domain result, not necessarily an HTTP infrastructure error. Distinguish rejected/review_required from unavailable dependencies.
- Existing capture/run/inject/reset/replay commands require `{ projectId, environment, sessionId }`; they use controlled seeded fixtures, never arbitrary registered origins. Other domain mutations use their recorded resource scope and an empty body unless stated otherwise. Reject supplied mismatching scope.
- P0 mutations conflicting with an active recovery run are refused; the orchestrator invokes shared domain services internally rather than looping through guarded HTTP endpoints.
- Same-incident concurrent recovery uses 409 RECOVERY_ALREADY_RUNNING and details.recoveryRunId. Reset during any running action uses 409 DEMO_BUSY and leaves state intact.
- Resource IDs are opaque identifiers. Path placeholder :id on recover means incidentId; :incidentId elsewhere denotes the same resource.

## Authentication, scope, bounds, and replay rules

These shared rules are part of every detailed contract below; route-specific overrides are explicit.

- **Operator:** A02–A19 and A21–A26/A30–A31 require the local operator session; A20 bootstraps it. Bind API/proxy to loopback and reject non-local access. Sessions are random, in-memory, expire after 8 hours, and use `HttpOnly; SameSite=Strict; Path=/api` cookies. State-changing routes, including bootstrap, require the exact configured UI Origin. Origin-less loopback scripts instead use `X-DriftGuard-Operator-Token`; bootstrap also supplies the matching body token. Redact token/header/cookie before logging. A01 exposes only minimal public readiness; detailed dependency health is operator-only.
- **SDK:** A27–A29 accept only an active `Authorization: Bearer <ingestionKey>`. Operator credentials cannot authorize ingestion; ingestion keys cannot authorize control-plane reads/mutations. Resolve project/environment from the key; caller IDs only check equality. Failed auth returns generic safe errors without scope/diagnostics disclosure.
- **Scoped resources:** Lists/demo projections select validated project/environment. Evidence, incident, patch, adapter, run, workflow and audit reads resolve project/environment/session from the recorded resource, never a bare ID across scope. Reject mismatches; cross-scope IDs return a safe not-found response. SDK registration/diagnostics bind to the active session; observation batches must carry that exact session. Stale queued events are rejected, never relabelled after reset.
- **Demo lease:** First controlled capture atomically pins the shared mock demo to one project/environment until its owner resets. Capture, observe, inject, recover and replay in another scope return `409 DEMO_SCOPE_BUSY`; non-owner reset also conflicts. Passive SDK registration/ingestion never takes or releases the lease. Busy reset preserves all state. Reset archives session evidence/dedup/runtime lineage and clears latest/baseline/session counters, retaining inventory identity, declared edges, project/keys/policy and lifetime metadata.
- **Bounds:** PRD limits apply wherever relevant: 1,000 observations or 10 MiB sanitized evidence/session; refusal is `429 RETENTION_LIMIT`, never silent deletion. Strict Zod input/output and safe bounded responses/history; no arbitrary provider fetch, code, probe or repair instructions. Detailed SDK limits are under A28. Numeric caps on unspecified legacy request/response sizes, probe/retry counts and execution deadlines remain contract decisions for tickets 01/12; do not treat unspecified values as PRD facts.
- **Read/replay/audit:** GETs are read-only and produce no mutation audit. Legacy POSTs have no promised general idempotency-key cache: repeat actions obey their state guards and produce their actual audited domain results. Recovery's existing same-incident guard is preserved. Completed legacy mutations return `auditEventId`; A16 retains the exact asynchronous exception. New route idempotency and audit behavior is specified individually. Mock controls are only loopback demo calls by the backend; corresponding control-plane actions supply scoped audit/correlation, while mock GETs have no audit.
- **Failure envelope:** All control-plane failures use the common envelope and correlation header. Unauthenticated operator routes return `401` and unsafe origin/non-local access `403` (numeric statuses from PRD; additional operator reason-code names are contract conventions). SDK stable codes are `400 INVALID_INPUT`, `401 INVALID_INGESTION_KEY`, `403 INGESTION_SCOPE_MISMATCH`, `409 STALE_SESSION/EVENT_ID_CONFLICT/BATCH_ID_CONFLICT`, `413 PAYLOAD_TOO_LARGE`, `429 INGESTION_RATE_LIMITED/RETENTION_LIMIT`, and `503 INGESTION_UNAVAILABLE`. `429` has safe `Retry-After`. Authentication failure auditing uses a bounded aggregate security log; tokens/digests are excluded.

## Route inventory

| ID | Priority | Method | Route | Owning ticket |
|---|---|---|---|---|
| [A01](#a01) | P0 | GET | /api/health | [01](issues/01-healthy-demo-startup.md) |
| [A02](#a02) | P0 | GET | /api/demo/state | [28](issues/28-local-project-onboarding.md) |
| [A03](#a03) | P0 | POST | /api/baselines/capture | [02](issues/02-healthy-baseline-and-lineage.md) |
| [A04](#a04) | P0 | POST | /api/demo/reset | [11](issues/11-archive-reset-and-recapture.md) |
| [A05](#a05) | P0 | POST | /api/scenarios/:scenarioId/inject | [03](issues/03-inject-and-detect-user-drift.md) |
| [A06](#a06) | P0 | POST | /api/observations/run | [03](issues/03-inject-and-detect-user-drift.md) |
| [A07](#a07) | P0 | GET | /api/incidents | [03](issues/03-inject-and-detect-user-drift.md) |
| [A08](#a08) | P0 | GET | /api/incidents/:incidentId | [03](issues/03-inject-and-detect-user-drift.md) |
| [A09](#a09) | P0 | POST | /api/incidents/:incidentId/analyze-impact | [04](issues/04-explain-impact.md) |
| [A10](#a10) | P0 | POST | /api/incidents/:incidentId/propose-repair | [05](issues/05-bounded-repair-proposal.md) |
| [A11](#a11) | P0 | POST | /api/patches/:patchId/validate | [06](issues/06-shadow-validation-and-policy.md) |
| [A12](#a12) | P0 | POST | /api/patches/:patchId/activate | [07](issues/07-activation-replay-and-rollback.md) |
| [A13](#a13) | P0 | POST | /api/patches/:patchId/rollback | [07](issues/07-activation-replay-and-rollback.md) |
| [A14](#a14) | P0 | GET | /api/providers | [28](issues/28-local-project-onboarding.md) |
| [A15](#a15) | P0 | POST | /api/workflows/:workflowId/replay | [02](issues/02-healthy-baseline-and-lineage.md) |
| [A16](#a16) | P0 | POST | /api/incidents/:id/recover | [08](issues/08-backend-recovery-run.md) |
| [A17](#a17) | P0 | GET | /api/recovery-runs/:recoveryRunId | [08](issues/08-backend-recovery-run.md) |
| [A18](#a18) | P1 | GET | /api/incidents/:incidentId/passport | [18](issues/18-export-evidence-passport.md) |
| [A19](#a19) | P1 | GET | /api/events | [19](issues/19-live-event-updates.md) |
| [A20](#a20) | P0 | POST | /api/operator/session | [28](issues/28-local-project-onboarding.md) |
| [A21](#a21) | P0 | POST | /api/projects | [28](issues/28-local-project-onboarding.md) |
| [A22](#a22) | P0 | GET | /api/projects | [28](issues/28-local-project-onboarding.md) |
| [A23](#a23) | P0 | GET | /api/projects/:projectId | [28](issues/28-local-project-onboarding.md) |
| [A24](#a24) | P0 | POST | /api/projects/:projectId/keys | [29](issues/29-project-ingestion-keys.md) |
| [A25](#a25) | P0 | POST | /api/projects/:projectId/keys/:keyId/rotate | [29](issues/29-project-ingestion-keys.md) |
| [A26](#a26) | P0 | POST | /api/projects/:projectId/keys/:keyId/revoke | [29](issues/29-project-ingestion-keys.md) |
| [A27](#a27) | P0 | POST | /api/ingest/dependencies | [30](issues/30-dependency-registration-inventory.md) |
| [A28](#a28) | P0 | POST | /api/ingest/observations | [31](issues/31-sdk-observation-ingestion.md) |
| [A29](#a29) | P0 | GET | /api/sdk/diagnostics | [31](issues/31-sdk-observation-ingestion.md) |
| [A30](#a30) | P0 | GET | /api/projects/:projectId/dependencies | [30](issues/30-dependency-registration-inventory.md) |
| [A31](#a31) | P0 | GET | /api/projects/:projectId/dependencies/:dependencyId | [30](issues/30-dependency-registration-inventory.md) |
| [M01](#m01) | P0 | GET | /users/:id | [01](issues/01-healthy-demo-startup.md) |
| [M02](#m02) | P0/P1 | GET | /inventory | [01](issues/01-healthy-demo-startup.md) |
| [M03](#m03) | P0 | GET | /shipping/estimate | [01](issues/01-healthy-demo-startup.md) |
| [M04](#m04) | P0/P1 | POST | /__control/scenarios/:scenarioId | [03](issues/03-inject-and-detect-user-drift.md) |
| [M05](#m05) | P0 | POST | /__control/reset | [11](issues/11-archive-reset-and-recapture.md) |
| [M06](#m06) | P0 | GET | /health | [01](issues/01-healthy-demo-startup.md) |

## Detailed contracts

### A01

**GET /api/health** (P0)

**Input:** None.

**Result:** 200 minimal readiness/service identity; detailed dependency status only for an authenticated operator.

**Failure behavior:** 503 CONTROL_PLANE_UNAVAILABLE.

**Consumer:** Startup script and UI.

**First implemented by:** [Ticket 01](issues/01-healthy-demo-startup.md).

### A02

**GET /api/demo/state** (P0)

**Input:** Validated projectId/environment selectors.

**Result:** 200 selected active session, baseline state, provider/scenario status, incidents, adapter versions, recent runs, legal action reasons, scoped inventory and ingestion diagnostics.

**Failure behavior:** 500 STATE_READ_FAILED.

**Consumer:** Dashboard initial load and refresh.

**First implemented by:** [Ticket 28](issues/28-local-project-onboarding.md). Ticket 01 uses minimal health only; this projection stays unavailable or fails closed until scoped operator authorization exists.

### A03

**POST /api/baselines/capture** (P0)

**Input:** `{ projectId, environment, sessionId }` for controlled seeded fixtures.

**Result:** 201 baseline IDs/versions, observations, workflow/read-edge results, auditEventId.

**Failure behavior:** 409 DEMO_BUSY; 502 BASELINE_CAPTURE_FAILED.

**Consumer:** Capture baseline action.

**First implemented by:** [Ticket 02](issues/02-healthy-baseline-and-lineage.md).

### A04

**POST /api/demo/reset** (P0)

**Input:** `{ projectId, environment, sessionId }` for selected active session.

**Result:** 200 new sessionId, awaiting_baseline, adapter v1, auditEventId.

**Failure behavior:** 409 DEMO_BUSY.

**Consumer:** Reset demo action.

**First implemented by:** [Ticket 11](issues/11-archive-reset-and-recapture.md).

### A05

**POST /api/scenarios/:scenarioId/inject** (P0)

**Input:** Scenario ID in path; `{ projectId, environment, sessionId }` body.

**Result:** 200 active scenario/provider state and auditEventId.

**Failure behavior:** 404 SCENARIO_NOT_FOUND; 409 DEMO_BUSY.

**Consumer:** Scenario launcher.

**First implemented by:** [Ticket 03](issues/03-inject-and-detect-user-drift.md).

### A06

**POST /api/observations/run** (P0)

**Input:** `{ projectId, environment, sessionId }` for enabled controlled seeded endpoints.

**Result:** 200 observation IDs, findings, deduplicated incident IDs, auditEventId.

**Failure behavior:** 409 BASELINE_REQUIRED or DEMO_BUSY; bounded provider findings on partial failure.

**Consumer:** Observe action.

**First implemented by:** [Ticket 03](issues/03-inject-and-detect-user-drift.md).

### A07

**GET /api/incidents** (P0)

**Input:** Validated projectId/environment selectors; selected active-session list.

**Result:** 200 incident summaries with status, severity, fingerprint, provider and time.

**Failure behavior:** 500 STATE_READ_FAILED.

**Consumer:** Incident selector.

**First implemented by:** [Ticket 03](issues/03-inject-and-detect-user-drift.md).

### A08

**GET /api/incidents/:incidentId** (P0)

**Input:** Incident ID.

**Result:** 200 incident evidence, impact, proposals, validation, active adapter, recovery runs, reasons and timeline.

**Failure behavior:** 404 INCIDENT_NOT_FOUND.

**Consumer:** Incident workspace.

**First implemented by:** [Ticket 03](issues/03-inject-and-detect-user-drift.md).

### A09

**POST /api/incidents/:incidentId/analyze-impact** (P0)

**Input:** Incident ID; empty object.

**Result:** 200 canonical/workflow impact relationships and auditEventId.

**Failure behavior:** 404 INCIDENT_NOT_FOUND; 409 DEMO_BUSY or ILLEGAL_INCIDENT_STATE.

**Consumer:** Guided impact action; internal recovery service.

**First implemented by:** [Ticket 04](issues/04-explain-impact.md).

### A10

**POST /api/incidents/:incidentId/propose-repair** (P0)

**Input:** Incident ID; empty object selects deterministic model in P0.

**Result:** 200 typed proposal with source, patch ID/hash, evidence, uncertainties, required checks, recommendation and auditEventId.

**Failure behavior:** 404 INCIDENT_NOT_FOUND; 409 ILLEGAL_INCIDENT_STATE or DEMO_BUSY; 422 INVALID_PROPOSAL.

**Consumer:** Guided proposal action; internal recovery service.

**First implemented by:** [Ticket 05](issues/05-bounded-repair-proposal.md).

### A11

**POST /api/patches/:patchId/validate** (P0)

**Input:** Patch ID; empty object.

**Result:** 200 immutable validationRun/checks/result/hash, individual gate outcomes, auditEventId; failed validation is an executed result.

**Failure behavior:** 404 PATCH_NOT_FOUND; 409 DEMO_BUSY; infrastructure failure uses error envelope.

**Consumer:** Guided validation action; internal recovery service.

**First implemented by:** [Ticket 06](issues/06-shadow-validation-and-policy.md).

### A12

**POST /api/patches/:patchId/activate** (P0)

**Input:** Patch ID; empty object.

**Result:** 200 active adapter/version/parent, post-activation replay outcome and incident state, auditEventId.

**Failure behavior:** 404 PATCH_NOT_FOUND; 409 PATCH_NOT_VALIDATED, PATCH_HASH_MISMATCH, PATCH_NOT_ELIGIBLE or DEMO_BUSY.

**Consumer:** Guided activation action; internal recovery service.

**First implemented by:** [Ticket 07](issues/07-activation-replay-and-rollback.md).

### A13

**POST /api/patches/:patchId/rollback** (P0)

**Input:** Patch ID; empty object.

**Result:** 200 restored parent adapter/version, incident outcome and auditEventId.

**Failure behavior:** 404 PATCH_NOT_FOUND; 409 NO_ROLLBACK_PARENT, PATCH_NOT_ACTIVE or DEMO_BUSY.

**Consumer:** Rollback action; internal recovery service.

**First implemented by:** [Ticket 07](issues/07-activation-replay-and-rollback.md).

### A14

**GET /api/providers** (P0)

**Input:** Validated projectId/environment selectors.

**Result:** 200 provider readiness, active scenario, baseline version, safe endpoint summaries.

**Failure behavior:** 500 STATE_READ_FAILED.

**Consumer:** Dependency rail.

**First implemented by:** [Ticket 28](issues/28-local-project-onboarding.md). Ticket 01 uses minimal health only; this projection stays unavailable or fails closed until scoped operator authorization exists.

### A15

**POST /api/workflows/:workflowId/replay** (P0)

**Input:** Workflow ID; `{ projectId, environment, sessionId }`; controlled seeded inputs.

**Result:** 200 workflowRun with actual checks/output or stubbed intents, read edges, adapter version, result and auditEventId; invariant failure is a result.

**Failure behavior:** 404 WORKFLOW_NOT_FOUND; 409 BASELINE_REQUIRED or DEMO_BUSY; bounded execution failure.

**Consumer:** Run/replay workflow action; internal recovery service.

**First implemented by:** [Ticket 02](issues/02-healthy-baseline-and-lineage.md).

### A16

**POST /api/incidents/:id/recover** (P0)

**Input:** Incident ID; empty object.

**Result:** 202 exactly { recoveryRunId, incidentId }.

**Failure behavior:** 404 INCIDENT_NOT_FOUND; 409 RECOVERY_ALREADY_RUNNING with active run ID, ILLEGAL_INCIDENT_STATE, BASELINE_REQUIRED or DEMO_BUSY.

**Consumer:** Run safe recovery.

**First implemented by:** [Ticket 08](issues/08-backend-recovery-run.md).

### A17

**GET /api/recovery-runs/:recoveryRunId** (P0)

**Input:** RecoveryRun ID.

**Result:** 200 id, incidentId, status, stage, timestamps, correlation, failure reason and relevant artifact IDs.

**Failure behavior:** 404 RECOVERY_RUN_NOT_FOUND.

**Consumer:** Recovery progress polling.

**First implemented by:** [Ticket 08](issues/08-backend-recovery-run.md).

### A18

**GET /api/incidents/:incidentId/passport** (P1)

**Input:** Incident ID.

**Result:** 200 redacted evidence JSON snapshot with incident/session/patch/hash provenance.

**Failure behavior:** 404 INCIDENT_NOT_FOUND.

**Consumer:** Download evidence passport.

**First implemented by:** [Ticket 18](issues/18-export-evidence-passport.md).

### A19

**GET /api/events** (P1)

**Input:** Validated projectId/environment selectors and optional last-event ID on reconnect; selected active session.

**Result:** 200 text/event-stream of typed audit/run updates with IDs and correlation.

**Failure behavior:** Stream loss triggers client polling fallback.

**Consumer:** Live update subscription.

**First implemented by:** [Ticket 19](issues/19-live-event-updates.md).

### A20

**POST /api/operator/session** (P0)

**Auth/scope:** Local operator bootstrap with the shared Origin/script guard; no ingestion key.

**Input → result:** `{ token }` → `200 { expiresAt, auditEventId }` and random HttpOnly session cookie.

**Bounds/errors/idempotency/audit:** PRD 1 KiB body and 5 attempts/minute; invalid token `401`, unsafe origin/non-loopback `403`. No idempotency cache; a successful login creates its actual session. Audit login success/failure safely; bounded failure aggregation, no token logging. Cookie expires after 8 hours.

**Consumer/owner:** Dashboard login or scripted bootstrap; [Ticket 28](issues/28-local-project-onboarding.md).

### A21

**POST /api/projects** (P0)

**Auth/scope:** Operator; creates a new project with development/production environments, active sessions and server-owned versioned demo collection policy.

**Input → result:** `{ name }` → `201 { project: { id, name, environments }, auditEventId }`; seed labelled demo inventory without claiming observed traffic.

**Bounds/errors/idempotency/audit:** Name 1–80 characters, ≤8 KiB body and at most 20 demo projects. Required `Idempotency-Key`: same key/body returns the original project for 24 hours without duplicate audit; different body conflicts `409`. Strict malformed input `400`; audit create. Limit exhaustion reason/status must be frozen in ticket 28 (PRD specifies the count but not a dedicated code).

**Consumer/owner:** Project onboarding; [Ticket 28](issues/28-local-project-onboarding.md).

### A22

**GET /api/projects** (P0)

**Auth/scope:** Operator; local single-operator project list.

**Input → result:** No body → `200 { projects: ProjectSummary[] }` with safe metadata only.

**Bounds/errors/idempotency/audit:** At most 20 demo projects; ordinary safe read error envelope, no secrets/digests. Read-only, no mutation or read audit required.

**Consumer/owner:** Project selector; [Ticket 28](issues/28-local-project-onboarding.md).

### A23

**GET /api/projects/:projectId** (P0)

**Auth/scope:** Operator; path project and optional validated environment.

**Input → result:** Optional `environment` query → `200 { project, environmentState, keyMetadata, collectionPolicy }`.

**Bounds/errors/idempotency/audit:** Unknown scope `404`; bounded safe metadata, no plaintext key or digest. Read-only/no read audit. Key metadata listing reuses this route rather than adding a key-list endpoint.

**Consumer/owner:** Project detail/key settings; [Ticket 28](issues/28-local-project-onboarding.md), key DTO contributed by ticket 29.

### A24

**POST /api/projects/:projectId/keys** (P0)

**Auth/scope:** Operator; selected project/environment, independent of provider credentials.

**Input → result:** `{ environment, label? }` → `201 { keyId, apiKey, prefix, environment, auditEventId }`; response is `Cache-Control: no-store`.

**Bounds/errors/idempotency/audit:** ≤8 KiB body; maximum 3 active keys/environment (`409`); malformed input `400`, unknown scope `404`. Explicit issuance always creates a new key; no plaintext replay/cache. Generate `dg_ing_<keyId>.<secret>` using 32 random secret bytes/base64url; persist only SHA-256 of the complete key and safe metadata. Return plaintext once after successful persistence; never return digest in any DTO. Audit issuance with safe IDs, never token/digest.

**Consumer/owner:** One-time copy-key panel; [Ticket 29](issues/29-project-ingestion-keys.md).

### A25

**POST /api/projects/:projectId/keys/:keyId/rotate** (P0)

**Auth/scope:** Operator; recorded key's project/environment must match path.

**Input → result:** `{}` → `201 { keyId, apiKey, prefix, replacesKeyId, auditEventId }`; `Cache-Control: no-store`.

**Bounds/errors/idempotency/audit:** ≤8 KiB body; nonexistent/wrong-project key `404`, revoked key `409`. Atomically persist replacement and revoke old key, returning plaintext only afterward. No plaintext cache/replay; if response is lost, obtain active ID from project detail and explicitly rotate that ID. Old key fails subsequent requests; an already accepted batch may finish. Audit rotation without token/digest.

**Consumer/owner:** Key rotation action; [Ticket 29](issues/29-project-ingestion-keys.md).

### A26

**POST /api/projects/:projectId/keys/:keyId/revoke** (P0)

**Auth/scope:** Operator; recorded key's scope matches project path.

**Input → result:** `{}` → `200 { keyId, status: "revoked", auditEventId }`.

**Bounds/errors/idempotency/audit:** ≤8 KiB body; unknown/wrong-project ID `404`. Idempotent state action: repeat returns original event ID and creates no duplicate audit. Subsequent new ingestion requests fail authentication; no token/digest in audit.

**Consumer/owner:** Key revoke action; [Ticket 29](issues/29-project-ingestion-keys.md).

### A27

**POST /api/ingest/dependencies** (P0)

**Auth/scope:** SDK bearer key; body project/environment are equality checks against server-bound scope. Return active server session; never fetch the submitted URL.

**Input → result:** `{ schemaVersion: "1", projectId, environment, sdkVersion, dependency: { name, type, baseUrl?, packageId? } }` → `200 { dependencyId, providerId?, sessionId, inventoryVersion, collectionPolicy, auditEventId }`.

**Bounds/errors/idempotency/audit:** ≤8 KiB body; ≤20 dependencies/demo scope; shared 60 ingestion requests/minute/project/environment, burst 10. Natural-key upsert by project/environment/name and normalized origin; type/origin mismatch `409 DEPENDENCY_CONFLICT`. Unknown/secret/malformed fields `400`; auth `401/403`; size `413`, rate `429`, store outage `503`. Normalize origin by stripping userinfo/query/fragment; reserved seeded mapping is server-owned. Non-REST categories register metadata with `unsupported` collection status. New/changed registration increments inventoryVersion and audits; unchanged upsert reuses original audit event. Declared registration alone changes neither baseline nor observed health/counts.

**Consumer/owner:** SDK `registerDependency`; [Ticket 30](issues/30-dependency-registration-inventory.md).

### A28

**POST /api/ingest/observations** (P0)

**Auth/scope:** SDK bearer key; project/environment equality checks, registered dependency IDs and exact active session. Recheck key before each newly accepted request.

**Input → result:** Strict `ObservationBatchV1` from PRD 16.1 → `200 { batchId, accepted, duplicates, findings: [{ id, evidenceStatus }], auditEventId }`. Required top-level fields: schemaVersion `"1"`, batchId UUID, projectId, environment (`development | production`), sessionId, sdkVersion, events. Each event has eventId UUID, dependencyId, method, routeTemplate, statusCode, durationMs, observedAt, collectionPolicyVersion; only optional fixtureKey/responseEvidence/schemaFingerprint are permitted.

**Bounds/errors:** ≤20 events/128 KiB per batch; ≤16 KiB/event and optional ≤8 KiB response subset. JSON depth ≤8, ≤100 keys, strings ≤1 KiB; strict JSON and no cycles. Route template ≤256 characters without query/concrete user IDs; status integer 100–599, duration finite 0–60000 ms, approved HTTP method enum. Timestamp is valid UTC ISO, at most 5 minutes future and 24 hours old. Rate is 60 ingestion requests/minute/scope, burst 10; retention 1,000 observations/10 MiB/session. Use stable shared SDK codes, plus unknown dependency `404`; reject the entire invalid batch, never partially accept. Persistence failure `503 INGESTION_UNAVAILABLE` leaves no counters/event/incident fragments. Network failures without a response status are SDK-local diagnostics, not fabricated events.

**Idempotency/audit:** Dedup namespace is project/environment/session/event ID and digest. Equal event ID/content is duplicate; conflicting content `409 EVENT_ID_CONFLICT`. Same batch ID must preserve immutable event list/digest (`409 BATCH_ID_CONFLICT` otherwise); exact retries return the original acknowledgement without repeating counters/audit. Compute/validate then publish one serialized copy-on-write Lowdb document via atomic file writer; observations, dedup, latest, findings and counters commit together. One audit for a newly accepted batch. This is single-process atomicity, not distributed transactionality.

**Evidence semantics:** Server redacts and recomputes fingerprints; SDK claims are untrusted metadata. Compare only compatible endpoint/policy/fixture context; newer observations update latest, in-window older events are historical only and cannot create/reopen active incidents or alter eligibility. Registration/ingest never promote known-good baselines. Metadata-only is default; explicit local evidence opt-in intersects server policy allowing only reviewed Users fixture keys/paths. Customer-reported evidence never replaces controlled three-identity HTTP evidence plus workflow validation for automatic repair. No candidate execution or host-source mutation.

**Consumer/owner:** SDK `flush`; [Ticket 31](issues/31-sdk-observation-ingestion.md), privacy/failure-isolation integration in ticket 33.

### A29

**GET /api/sdk/diagnostics** (P0)

**Auth/scope:** SDK bearer key only; returns bound scope, never caller-selected project diagnostics.

**Input → result:** No body → `200 { projectId, environment, sessionId, lastIngestAt?, acceptedCount, rejectionCount, status }`; status `awaiting_observations | receiving | stale`.

**Bounds/errors/idempotency/audit:** Bounded metadata response, shared auth/rate guard. Last seen >60 seconds means stale SDK connectivity, never a provider outage. Authentication failures `401/403` disclose no project state; infrastructure error uses safe envelope. Read-only/no read audit required; queued client events are not ingested counts.

**Consumer/owner:** SDK connectivity check and onboarding status; [Ticket 31](issues/31-sdk-observation-ingestion.md).

### A30

**GET /api/projects/:projectId/dependencies** (P0)

**Auth/scope:** Operator; selected project/environment.

**Input → result:** `environment`, `limit` 1–100 (default 50), optional opaque `cursor` → `200 { dependencies: DependencySummary[], nextCursor? }` in stable name/ID order.

**Bounds/errors/idempotency/audit:** `400` invalid query, `404` unknown scope. Bounded page/safe inventory metadata; no secrets/digests. Read-only/no read audit required. Confidence (`declared | observed | corroborated`) and health (`unknown | healthy | degraded | unavailable | unsupported`) remain separate with source/reason/time.

**Consumer/owner:** Inventory list/dependency rail; [Ticket 30](issues/30-dependency-registration-inventory.md).

### A31

**GET /api/projects/:projectId/dependencies/:dependencyId** (P0)

**Auth/scope:** Operator; project/environment/dependency and inherited evidence-session scope.

**Input → result:** `environment`, optional history cursor/limit ≤100 → `200 { dependency, endpoints, baseline, latest, evidenceHistory, graphEdges, nextCursor? }`.

**Bounds/errors/idempotency/audit:** Bounded history reuses persisted evidence; no duplicate history API. `400` invalid query, cross-scope ID `404`; read-only/no read audit. Evidence-only endpoint/workflow/version fields, source/time/limitations and `runtime_read | declared | inferred | manually_configured` graph provenance prevent claimed runtime coverage from declared inventory. Immutable baseline and latest remain independent.

**Consumer/owner:** Inventory detail/history/impact context; [Ticket 30](issues/30-dependency-registration-inventory.md).

### M01

**GET /users/:id** (P0)

**Input:** u-123, u-456, or u-789.

**Result:** 200 { id, name } baseline or { id, display_name } after drift.

**Failure behavior:** 404 USER_NOT_FOUND.

**Consumer:** Backend capture and workflows.

**First implemented by:** [Ticket 01](issues/01-healthy-demo-startup.md).

### M02

**GET /inventory** (P0/P1)

**Input:** P0 page/limit; P1 cursor only in named scenario.

**Result:** 200 deterministic items and page metadata; P1 cursor/next_cursor protocol.

**Failure behavior:** 400 INVALID_PAGINATION.

**Consumer:** Backend inventory_sync and capture.

**First implemented by:** [Ticket 01](issues/01-healthy-demo-startup.md).

### M03

**GET /shipping/estimate** (P0)

**Input:** ship_date=2026-10-09&delivery_days=3.

**Result:** 200 estimated_delivery_date 2026-10-12 baseline or 2026-10-14 business-days drift, same schema.

**Failure behavior:** 400 INVALID_SHIPPING_QUERY.

**Consumer:** Shipping workflow and approved canary.

**First implemented by:** [Ticket 01](issues/01-healthy-demo-startup.md).

### M04

**POST /__control/scenarios/:scenarioId** (P0/P1)

**Input:** Registered scenario ID.

**Result:** 200 simulated provider state.

**Failure behavior:** 404 SCENARIO_NOT_FOUND.

**Consumer:** Control-plane scenario service only.

**First implemented by:** [Ticket 03](issues/03-inject-and-detect-user-drift.md).

### M05

**POST /__control/reset** (P0)

**Input:** Empty object.

**Result:** 200 restored provider defaults.

**Failure behavior:** 500 SIMULATOR_RESET_FAILED.

**Consumer:** Control-plane reset service only.

**First implemented by:** [Ticket 11](issues/11-archive-reset-and-recapture.md).

### M06

**GET /health** (P0)

**Input:** None.

**Result:** 200 mock-provider readiness.

**Failure behavior:** 503 PROVIDER_UNAVAILABLE.

**Consumer:** Startup/control-plane health checks.

**First implemented by:** [Ticket 01](issues/01-healthy-demo-startup.md).


## Recovery and review semantics

RecoveryRun status is queued, running, succeeded, or failed. Stage is impact, proposing, validating, activating, replaying, or rolling_back. Store start/finish timestamps and a safe failure reason. An executed review hold or rejected candidate ends the run failed with a domain reason while the incident enters review_required/rejected; this terminal run convention fills a PRD detail and must be frozen in ticket 01/08.

Infrastructure failure ends the run failed while the incident remains at its last valid state. If an adapter has already activated and replay cannot establish success, run rollback as required by FR-VAL-08 rather than leaving an unproven active adapter. Successful automatic restoration ends the run failed at rolling_back and the incident rolled_back. If restoration itself fails, retain the actual adapter state and failure evidence; never claim rolled_back until restoration is confirmed.

Policy requires every FR-REP-07 gate before automatic activation. P0 human review is a hold with no approval-only activation endpoint. New evidence or a revised candidate goes through the same validation; review acknowledgements never bypass it.

## Canonical data and seeded fixtures

CanonicalUser contains id and displayName. Baseline maps name to displayName; preferred repair coalesces display_name then name. Capture u-123/Aarav, u-456/Meera, and u-789/Kabir separately over HTTP. Preserve identity and verify baseline-equivalent welcome-email recipientName and customer profile output.

Shipping request uses ship_date=2026-10-09 and delivery_days=3. The baseline estimated_delivery_date is 2026-10-12; changed business-day behavior returns 2026-10-14 with identical shape. Date arithmetic uses date-only deterministic fixtures; tests must not derive expected values with the implementation under test.

## Optional extensions

Passport export and SSE are the only specified P1 control-plane routes. P1 polling/import routes remain deferred to their feature tickets with PRD 13.3 input/egress limits; there are no P0 polling, specification-import or collection-policy administration APIs. Optional live-model, pagination strategy, retry policy, or extended DSL configuration should reuse existing paths; any additional route must be defined in its owning ticket before coding. P2 briefs have no fabricated endpoints.

## Contract verification checklist

- [ ] All 37 routes appear in shared schemas and their owning tickets.
- [ ] Representative 400/404/409 and infrastructure errors match the envelope/header.
- [ ] Recovery creation and polling follow the PRD status/stage distinction.
- [ ] Browser uses no simulator-control or model-provider route directly.
- [ ] Unsafe activation, modified hash, concurrent recovery, busy reset, and semantic hold have deterministic outcomes.
- [ ] P1 transport failure preserves the P0 polling path.
- [ ] Operator/SDK credential classes, cookie/Origin/script guards and scoped resource lookup are enforced.
- [ ] One-time key responses are no-store; project/metadata/audit/export DTOs exclude plaintext/digests.
- [ ] Ingestion schema/size/rate/session/policy/dedup guards and injected write failures preserve atomicity.
- [ ] Reset keeps project/key/inventory identity, archives evidence, fences stale events and releases only the owner's demo lease.
- [ ] SDK/customer observations stay distinct from controlled evidence and never promote baselines or bypass FR-REP-07.
