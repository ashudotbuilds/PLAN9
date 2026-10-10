# DriftGuard API catalog

Source: PRD section 16 and FR-REC-01/02. This catalog lists planned contracts; endpoints are not implemented yet. All 25 PRD routes are included. Endpoint names, P0/P1 separation, exact recovery body, correlation header, shared error envelope, and required conflict behavior come from the PRD. Other success status choices, response field groupings, input defaults, and additional reason codes below are proposed implementation conventions to freeze in shared Zod contracts during ticket 01, not claims that the PRD already specifies them.

## Boundaries

The browser calls only the control-plane API through its typed client. The control plane calls mock-provider HTTP routes. Mock control routes are demo controls, never data exposed to detector logic. Core detector/impact/repair/validation/interpreter functions and RepairModel are internal interfaces, not extra network APIs.

The P0 demo has no required external paid API, model key, real email service, or database service. Email is a recorded intent. A live model provider is optional in ticket 14; its URL/model/auth contract must be selected then, so this catalog does not invent a provider API.

## Common contract

- Every response carries X-Correlation-Id. Errors include the same correlation identifier in the body.
- Error shape: error containing code (stable), message (safe), details (bounded non-secret object), and correlationId.
- Ordinary completed mutations return an auditEventId. POST recover returns exactly recoveryRunId and incidentId with HTTP 202; audit is available through run/incident evidence.
- Parameters, bodies, outputs, persisted records, and proposals use shared strict Zod contracts. Reject unsupported fields rather than interpreting arbitrary input.
- Invariant failure is a recorded domain result, not necessarily an HTTP infrastructure error. Distinguish rejected/review_required from unavailable dependencies.
- P0 bodies default to an empty object and seeded fixtures. No broad caller-supplied provider URLs, code, or unchecked paths.
- P0 mutations conflicting with an active recovery run are refused; the orchestrator invokes shared domain services internally rather than looping through guarded HTTP endpoints.
- Same-incident concurrent recovery uses 409 RECOVERY_ALREADY_RUNNING and details.recoveryRunId. Reset during any running action uses 409 DEMO_BUSY and leaves state intact.
- Resource IDs are opaque identifiers. Path placeholder :id on recover means incidentId; :incidentId elsewhere denotes the same resource.

## Route inventory

| ID | Priority | Method | Route | Owning ticket |
|---|---|---|---|---|
| [A01](#a01) | P0 | GET | /api/health | [01](issues/01-healthy-demo-startup.md) |
| [A02](#a02) | P0 | GET | /api/demo/state | [01](issues/01-healthy-demo-startup.md) |
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
| [A14](#a14) | P0 | GET | /api/providers | [01](issues/01-healthy-demo-startup.md) |
| [A15](#a15) | P0 | POST | /api/workflows/:workflowId/replay | [02](issues/02-healthy-baseline-and-lineage.md) |
| [A16](#a16) | P0 | POST | /api/incidents/:id/recover | [08](issues/08-backend-recovery-run.md) |
| [A17](#a17) | P0 | GET | /api/recovery-runs/:recoveryRunId | [08](issues/08-backend-recovery-run.md) |
| [A18](#a18) | P1 | GET | /api/incidents/:incidentId/passport | [18](issues/18-export-evidence-passport.md) |
| [A19](#a19) | P1 | GET | /api/events | [19](issues/19-live-event-updates.md) |
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

**Result:** 200 readiness, service identity, safe dependency status.

**Failure behavior:** 503 CONTROL_PLANE_UNAVAILABLE.

**Consumer:** Startup script and UI.

**First implemented by:** [Ticket 01](issues/01-healthy-demo-startup.md).

### A02

**GET /api/demo/state** (P0)

**Input:** None.

**Result:** 200 active session, baseline state, provider/scenario status, incidents, adapter versions, recent runs, and legal action reasons.

**Failure behavior:** 500 STATE_READ_FAILED.

**Consumer:** Dashboard initial load and refresh.

**First implemented by:** [Ticket 01](issues/01-healthy-demo-startup.md).

### A03

**POST /api/baselines/capture** (P0)

**Input:** Empty object for seeded P0 fixtures.

**Result:** 201 baseline IDs/versions, observations, workflow/read-edge results, auditEventId.

**Failure behavior:** 409 DEMO_BUSY; 502 BASELINE_CAPTURE_FAILED.

**Consumer:** Capture baseline action.

**First implemented by:** [Ticket 02](issues/02-healthy-baseline-and-lineage.md).

### A04

**POST /api/demo/reset** (P0)

**Input:** Empty object.

**Result:** 200 new sessionId, awaiting_baseline, adapter v1, auditEventId.

**Failure behavior:** 409 DEMO_BUSY.

**Consumer:** Reset demo action.

**First implemented by:** [Ticket 11](issues/11-archive-reset-and-recapture.md).

### A05

**POST /api/scenarios/:scenarioId/inject** (P0)

**Input:** Scenario ID in path; empty body.

**Result:** 200 active scenario/provider state and auditEventId.

**Failure behavior:** 404 SCENARIO_NOT_FOUND; 409 DEMO_BUSY.

**Consumer:** Scenario launcher.

**First implemented by:** [Ticket 03](issues/03-inject-and-detect-user-drift.md).

### A06

**POST /api/observations/run** (P0)

**Input:** Empty object for enabled seeded endpoints.

**Result:** 200 observation IDs, findings, deduplicated incident IDs, auditEventId.

**Failure behavior:** 409 BASELINE_REQUIRED or DEMO_BUSY; bounded provider findings on partial failure.

**Consumer:** Observe action.

**First implemented by:** [Ticket 03](issues/03-inject-and-detect-user-drift.md).

### A07

**GET /api/incidents** (P0)

**Input:** None for P0 active-session list.

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

**Input:** None.

**Result:** 200 provider readiness, active scenario, baseline version, safe endpoint summaries.

**Failure behavior:** 500 STATE_READ_FAILED.

**Consumer:** Dependency rail.

**First implemented by:** [Ticket 01](issues/01-healthy-demo-startup.md).

### A15

**POST /api/workflows/:workflowId/replay** (P0)

**Input:** Workflow ID; seeded inputs by default.

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

**Input:** Optional last-event ID on reconnect; active session.

**Result:** 200 text/event-stream of typed audit/run updates with IDs and correlation.

**Failure behavior:** Stream loss triggers client polling fallback.

**Consumer:** Live update subscription.

**First implemented by:** [Ticket 19](issues/19-live-event-updates.md).

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

Passport export and SSE are the only additional P1 control-plane routes required by the PRD. Optional live-model, pagination strategy, retry policy, or extended DSL configuration should reuse the existing proposal/evidence paths where practical; any necessary new schema or route must be explicitly defined in its owning ticket before coding. P2 briefs intentionally have no fabricated endpoints.

## Contract verification checklist

- [ ] All 25 routes appear in shared schemas and their owning tickets.
- [ ] Representative 400/404/409 and infrastructure errors match the envelope/header.
- [ ] Recovery creation and polling follow the PRD status/stage distinction.
- [ ] Browser uses no simulator-control or model-provider route directly.
- [ ] Unsafe activation, modified hash, concurrent recovery, busy reset, and semantic hold have deterministic outcomes.
- [ ] P1 transport failure preserves the P0 polling path.
