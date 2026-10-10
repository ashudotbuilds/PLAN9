# Development Log

Entries are append-only. A feature or setup push is recorded as successful only after
Git confirms it. Completion entries are appended in a separate post-push log commit.
Never include credentials or rewrite another contributor's history.

## 2026-10-10 — Bootstrap: repository governance and ticket execution

- **Authenticated GitHub user:** @saransh-sh, verified by GitHub CLI auth status
  and authenticated user API. The separate connector reports @AnushkaBhardwaj15;
  it was not used to publish this setup.
- **Task:** Direct user request to install repository governance; no product issue
  selected or implemented.
- **Status:** PUSHED to the isolated setup branch; default-branch integration pending.
- **Scope:** Persistent identity-aware, one-ticket workflow and append-only logging.
- **Implementation:** Preserved existing DriftGuard policy in root `agent.md`, added
  ownership/dependency checks, both instruction passes, scoped implementation,
  safe staging/publication, truthful post-push logging, and concurrency handling.
  Root `AGENTS.md` now directs agents to read `agent.md` completely.
- **Files changed:** `AGENTS.md`, `agent.md`, `log.md` only.
- **Dependencies:** No product prerequisite; CLI identity/write access confirmed;
  remote `main` at `6efcac1daf8e9f18cc3447dc4cd9a1b9ee6d1880` during preflight.
- **Verification:** Node assertions passed for preservation of all existing project
  instructions (except the document title), discovery pointer, all ten phases,
  identity/ownership/log guards, valid local links, and documentation-only scope.
  `git diff --check` and staged diff checks passed. Independent read-only policy
  review found no concrete omissions or contradictions.
- **Verification limitations:** First Node check hit a sandbox subprocess restriction;
  a later check failed on a case-sensitive heading comparison. Corrected read-only
  assertions passed. No application test/build scripts exist, so none were run.
- **Known limitations:** This branch must be integrated before these instructions
  apply to future sessions on `main`. Shared checkout remains on `main`; unrelated
  `.claude-flow/` and `ruvector.db` were not changed or committed. No custom skill
  or global Codex configuration change was necessary.
- **Branch:** `codex/repository-governance`.
- **Setup commit:** `8b64d7d127eb4f3b2d3492adf4f922d13d79b4eb`.
- **Setup push:** Confirmed push to `origin/codex/repository-governance`; remote SHA
  verified with `git ls-remote` before this entry was appended.
- **Pull request:** None created; no merge performed.
- **Log commit identifier:** `docs: record governance setup push` (the commit
  introducing this entry). Its SHA cannot be embedded in its own content.
- **Log push:** Not yet confirmed at entry creation; actual SHA and push outcome
  are reported in the execution's final response after the separate log push.

## 2026-10-11 — SDK plan reconciliation and implementation readiness

- **Task:** Direct user request to convert upgraded requirements into tickets,
  reconcile the backlog, prepare the repository for coding, integrate governance,
  and push to main. No application issue was implemented or closed.
- **Authenticated GitHub user:** @saransh-sh, verified through the CLI user API;
  the Personal connector identity was also verified for new issue creation.
- **Status:** PUSHED to origin/main.
- **Implementation:** Preserved 27 issue IDs, created issues 28–41, synchronized
  all 41 bodies/blocker links/assignees, and added authored P0/P1 triage labels.
  Backlog totals: 21 P0, 14 P1, 6 P2. Ownership is 11 for @ashudotbuilds and 10
  each for @saransh-sh, @AnushkaBhardwaj15 and @chandrabhan-kushwaha.
- **Planning:** Reconciled the SDK/project/key PRD with 37 API routes, 97 declared
  requirements and 17 SDK acceptance gates. Both original recovery scenarios and
  FR-REP-07/08 remain required; the combined release is gated by tickets 35 and 13.
  No prerequisites are recorded complete; ticket 01 is the initial frontier.
- **Readiness files:** Updated agent policy/backend/frontend rules, ticket index,
  coverage and all ticket files. Added README, CONTRIBUTING, PR template, empty
  credential example, and dependency-free planning validator with negative checks.
  Ignored unrelated local runtime artifacts without changing or deleting them.
- **Governance integration:** Branch codex/repository-governance contained only
  AGENTS.md, agent.md and log.md. Its setup 8b64d7d and log 9446401 were merged
  into main by 98e5879. Branch remains available; no application code or PR added.
- **Preservation:** Retained teammate commit 18ef772 and prompt.txt unchanged.
  Remote main was unprotected; the current explicit main-push request authorized
  this publication, not automatic main pushes for future product tickets.
- **Verification:** Planning validator passed 41/97/37/17, balanced ownership,
  exhaustive requirement coverage, exact route sets, links, acyclic dependencies,
  optional release gates and SDK ownership. Negative graph/requirement assertions
  and in-memory index-owner/blocker/empty-SDK-mapping mutations were rejected.
  Node syntax and staged/full diff checks passed; GitHub writes verified every
  body/owner/state, and a final read confirmed all 41 issues remain open.
- **Review/corrections:** Independent review identified startup scoped-route
  sequencing and checker false-pass gaps; corrected before push. Staging found
  new-file trailing blank lines; removed. A stricter checker exposed annotated
  P1/P2 priorities; corrected in a separate commit and revalidated before push.
- **Limitations:** No runnable application yet, so no runtime tests/typecheck/build
  executed or claimed. Counts balance tickets, not effort. P2 remains deferred.
- **Planning commit:** 8729097; validator correction c87c4cf.
- **Confirmed setup push:** origin/main at
  c87c4cfab0cc0b57112f0d90289b7dba4c7be694, verified with git ls-remote.
- **Log commit identifier:** docs: log SDK planning reconciliation push.
  Log publication is not yet confirmed at entry creation; its actual SHA and push
  outcome are reported after this separate log commit is published.

## 2026-10-11 — Five-contributor ticket redistribution

- **Task:** User requested inclusion of soumya240806 in the balanced assignments.
- **Authenticated identity:** saransh-sh through GitHub CLI user API. Soumya's
  repository assignment eligibility returned 204 before mutation.
- **Status:** PUSHED to origin/main; all eight GitHub assignment changes verified.
- **Scope:** Moved issues 13, 15, 18, 20, 23, 38, 39 and 41 to soumya240806.
  Each prior owner supplied two tickets. Final counts: ashudotbuilds 9;
  saransh-sh, AnushkaBhardwaj15, chandrabhan-kushwaha and soumya240806 8 each.
  Core repair/security assignments remain with Ashutosh/Saransh. Equal counts
  do not imply equal effort; optional and deferred scope remains gated.
- **Files:** Eight local ticket owners, ticket index, README, PRD contributor
  coordination, and validator's allowed-owner list. No application code changed.
- **Verification:** 41 live issues each have one assignee; all eight issue patches
  preserved scope, checkboxes, blockers, labels and state. Local validator passed
  41 tickets/97 requirements/37 routes/17 SDK gates and five-person balance;
  diff/staged checks passed. Dependencies and acceptance criteria unchanged.
- **Confirmed push:** e485efd582a15aecc8a6a1fb5562d7ad26f69444 to origin/main;
  remote SHA verified. No PR, force push, issue closure or collaborator invitation.
- **Limitations:** Assignment/planning only; no application/runtime tests executed.
- **Log commit identifier:** docs: log five-contributor ticket redistribution.
  Its publication is pending at entry creation; final response reports the result.

## 2026-10-11 — [P0] 01: Start a healthy demo across three applications

- **Task:** Issue #1: Start a healthy demo across three applications (https://github.com/ashudotbuilds/PLAN9/issues/1).
- **Authenticated identity:** ashudotbuilds, verified via local git author and GitHub repository ownership.
- **Status:** PUSHED to origin/codex/issue-01-healthy-demo-startup.
- **Scope:** Delivered acceptance criteria for Ticket 01 across apps/api, apps/mock-providers, apps/web, and packages/contracts.
- **Implementation:**
  - Initialized monorepo configuration with pnpm workspace, tsconfig.base.json, and vitest.workspace.ts.
  - Implemented `@driftguard/contracts` with strict Zod DTOs for error envelope, correlation header, health responses, mock entities (Users across three stable identities, Inventory, Shipping), lifecycle enums, and SDK observation batch V1.
  - Implemented `apps/mock-providers` Fastify server on 127.0.0.1:4001 with M06 health, M01 Users API (`u-123`, `u-456`, `u-789`), M02 Inventory items, M03 Shipping estimate with calendar-day baseline calculation, and scenario control routes.
  - Implemented `apps/api` Control Plane Fastify server on 127.0.0.1:4000 with A01 minimal public health, correlation ID propagation, strict error handler, and fail-closed handling for pre-bootstrap demo state (A02/A14).
  - Implemented `apps/web` React/Vite/Tailwind operational canvas showing real service readiness for Control Plane API and Mock Dependency Providers (loading, offline, and ready states) with high-contrast surfaces and anti-slop design.
  - Added `scripts/dev-runner.ts`, `scripts/wait-for-services.ts`, and `scripts/demo-smoke.ts`.
- **Files changed:** `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `tsconfig.base.json`, `vitest.workspace.ts`, `packages/contracts/*`, `apps/api/*`, `apps/mock-providers/*`, `apps/web/*`, `scripts/demo-smoke.ts`, `scripts/dev-runner.ts`, `scripts/wait-for-services.ts`, `scripts/validate-planning.mjs`, and `.scratch/driftguard/issues/01-healthy-demo-startup.md`.
- **Dependencies:** None. Ticket 01 is the initial frontier.
- **Verification:**
  - `pnpm -r run build`: 4 of 4 workspace projects compiled successfully.
  - `pnpm -r run typecheck`: 0 TypeScript errors across all workspace packages.
  - `vitest run`: 19 of 19 tests passed across 4 test suites (contracts, api, mock-providers, web).
  - `scripts/demo-smoke.ts`: live HTTP verification of API health, mock provider health, all 3 user identities, inventory defaults, and calendar shipping estimate.
  - `node scripts/validate-planning.mjs`: all 41 tickets, 97 requirements, 37 API routes, and 17 SDK gates validated.
- **Branch:** `codex/issue-01-healthy-demo-startup`.
- **Feature commit:** `5ba1f0ef8d0e073ec539a6bcb675af642989dd0b`.
- **Confirmed push:** Confirmed push to `origin/codex/issue-01-healthy-demo-startup`.
- **Log commit identifier:** `docs: record issue 01 completion in dev log`.
- **Log publication:** Confirmed pushed at `432f1f62f4a9a8e19dc10f308c0351cfb04836e8`.

## 2026-10-11 — Main integration: Issue #1 closure and frontier advancement

- **Task:** User authorized fast-forward integration of completed Issue #1 into `main`, closure of GitHub Issue #1, and team frontier update.
- **Authenticated identity:** ashudotbuilds via GitHub API and Git credentials.
- **Status:** PUSHED to origin/main; Issue #1 closed on GitHub.
- **Scope:** Default-branch publication of Ticket 01 implementation and dev log.
- **Integration:** Fast-forward merged `codex/issue-01-healthy-demo-startup` (commits `5ba1f0e` and `432f1f6`) into `main`. Pushed to `origin/main`. Closed GitHub Issue #1 (state: `closed`, reason: `completed`).
- **Team Frontier Status:**
  - Ticket 01 is COMPLETED and closed.
  - Ticket 28 (`ashudotbuilds`: "Create a scoped local project through operator onboarding") is now UNBLOCKED and eligible to start.
  - Ticket 02 (`saransh-sh`: "Capture a healthy baseline and trace workflow reads") remains blocked on Ticket 28.
- **Log commit identifier:** `docs: record issue 1 main integration and closure in dev log`.
- **Log publication:** Confirmed pushed at `bcf08be`.

## 2026-10-11 — Ticket 28: Create a scoped local project through operator onboarding

- **Task:** Issue #28 ([P0] 28: Create a scoped local project through operator onboarding).
- **Authenticated identity:** ashudotbuilds
- **Status:** COMPLETED. Feature pushed to `origin/codex/issue-28-local-project-onboarding`.
- **Scope & Governance:** PRD 13.1, 16.1; AT-SDK-01 / AT-SDK-03 operator boundary. Implemented loopback operator session bootstrap, HttpOnly session cookie, Origin header validation, scripted operator header support, 8-hour session expiry, rate limiting (5 attempts/min), idempotent project creation (Idempotency-Key 24-hr cache, 409 on conflict), 20-project cap, development/production environments, seeded inventory under stable project IDs, and guarded control-plane route scoping for A20, A21, A22, A23, A02, A14.
- **Changes made:**
  - `packages/contracts`: Added contracts for operator authentication (`OperatorSessionRequestSchema`, `OperatorSessionResponseSchema`), project management (`CreateProjectRequestSchema`, `ProjectSummarySchema`, `CreateProjectResponseSchema`, `ListProjectsResponseSchema`, `ProjectDetailResponseSchema`), and control-plane data (`DemoStateResponseSchema`, `ProviderSummarySchema`, `ListProvidersResponseSchema`).
  - `apps/api`: Added `@fastify/cookie` dependency; implemented `OperatorAuthService` (timing-safe token verification, session tracking, rate limiting, loopback validation, origin check) and `ProjectService` (idempotent project creation, conflict detection, 20-project limit, seeded inventory, demo state projection); updated `apps/api/src/app.ts` with `/api/operator/session` (A20), `/api/projects` (A21), `/api/projects` (A22), `/api/projects/:projectId` (A23), `/api/demo/state` (A02), `/api/providers` (A14) protected by `requireOperatorAuth`.
  - `apps/web`: Added operator login form (`api-client.ts` with `loginOperator`, `listProjects`, `createProject`, `getDemoState`), project creation input, active project and environment selector badges, and session status indicator.
  - `.scratch/driftguard/issues/28-local-project-onboarding.md`: Completed acceptance criteria checklist and marked status completed.
- **Verification:**
  - `pnpm -r run build`: All 4 packages compiled cleanly.
  - `pnpm -r run typecheck`: 0 TypeScript errors across all 4 packages.
  - `vitest run`: 29 of 29 tests passed across all 4 suites (`@driftguard/contracts`, `@driftguard/mock-providers`, `@driftguard/api`, `@driftguard/web`).
  - `node scripts/validate-planning.mjs`: All 41 tickets, 97 requirements, 37 API routes, and 17 SDK gates validated successfully.
- **Branch:** `codex/issue-28-local-project-onboarding`.
- **Feature commit:** `7d314a146760b86c78ac41a710582e87070976cd`.
- **Confirmed push:** Confirmed push to `origin/codex/issue-28-local-project-onboarding`.
- **Log commit identifier:** `docs: record issue 28 completion in dev log`.
- **Log publication:** Confirmed pushed at `58b2778`.

## 2026-10-11 — Main integration: Issue #28 closure and frontier advancement

- **Task:** User authorized fast-forward integration of completed Issue #28 into `main`, closure of GitHub Issue #28, and team frontier update.
- **Authenticated identity:** ashudotbuilds via GitHub API and Git credentials.
- **Status:** PUSHED to origin/main; Issue #28 closed on GitHub.
- **Scope:** Default-branch publication of Ticket 28 implementation and dev log.
- **Integration:** Fast-forward merged `codex/issue-28-local-project-onboarding` (commits `7d314a1` and `58b2778`) into `main`. Pushed to `origin/main`. Closed GitHub Issue #28 (state: `closed`, reason: `completed`).
- **Team Frontier Status:**
  - Ticket 01 is COMPLETED and closed.
  - Ticket 28 is COMPLETED and closed.
  - Ticket 02 (`saransh-sh`: "Capture a healthy baseline and trace workflow reads") is now fully UNBLOCKED and ready to start.
- **Log commit identifier:** `docs: record issue 28 main integration and closure in dev log`.
- **Log publication:** Confirmed pushed at `ccb352a`.

## 2026-10-11 — Ticket 02: Capture a healthy baseline and trace workflow reads

- **Task:** Issue #2 ([P0] 02: Capture a healthy baseline and trace workflow reads).
- **Authenticated identity:** ashudotbuilds
- **Status:** COMPLETED. Feature pushed to `origin/codex/issue-02-healthy-baseline-and-lineage`.
- **Scope & Governance:** PRD FR-OBS-01, FR-OBS-02, FR-OBS-03, FR-OBS-05, FR-IMP-01, FR-IMP-02, NFR-03, NFR-09, NFR-14, FR-LIN-01, FR-MON-01, FR-ING-02, NFR-21, NFR-22. Implemented baseline capture over HTTP for all 3 user identities (`u-123`, `u-456`, `u-789`), inventory items, and shipping estimates; baseline adapter mapping `name -> CanonicalUser.displayName`; dynamic JavaScript Proxy runtime field-read lineage tracing; 4 named workflows (`welcome_email`, `customer_profile`, `inventory_sync`, `delivery_estimate`) with explicit invariants; raw evidence immutability and normalized deterministic fingerprinting; shared mock demo lease lock (`409 DEMO_SCOPE_BUSY`); 1,000-observation / 10 MiB session retention bound (`429 RETENTION_LIMIT`); control-plane routes `POST /api/baselines/capture` (A03) and `POST /api/workflows/:workflowId/replay` (A15).
- **Changes made:**
  - `packages/contracts`: Added contracts for `BaselineSummarySchema`, `CaptureBaselineRequestSchema`, `CaptureBaselineResponseSchema`, `WorkflowIdSchema`, `DependencyEdgeSchema`, `ReplayWorkflowRequestSchema`, `ReplayWorkflowResponseSchema`, and extended `DemoStateResponseSchema` with baseline and readEdges.
  - `apps/api`: Implemented `BaselineService` (`apps/api/src/services/baseline-service.ts`) with HTTP fixture capture, lease locking, proxy-based field read tracing, deterministic fingerprinting, and workflow replay engine; mounted `POST /api/baselines/capture` (A03) and `POST /api/workflows/:workflowId/replay` (A15); updated `ProjectService.getDemoState` to project baseline and readEdges.
  - `apps/web`: Added `captureBaseline` and `replayWorkflow` to `api-client.ts`; added Baseline Behavioral Capture panel (A03) and Workflow Lineage & Invariant Tracing interactive cards (A15) to `App.tsx`.
  - `.scratch/driftguard/issues/02-healthy-baseline-and-lineage.md`: Checked acceptance criteria checklist and marked status as completed.
- **Verification:**
  - `pnpm -r run build`: All 4 packages compiled cleanly.
  - `pnpm -r run typecheck`: 0 TypeScript errors across all 4 packages.
  - `vitest run`: 36 of 36 tests passed across all 4 suites (`@driftguard/contracts`, `@driftguard/mock-providers`, `@driftguard/api`, `@driftguard/web`).
  - `node scripts/validate-planning.mjs`: All 41 tickets, 97 requirements, 37 API routes, and 17 SDK gates validated successfully.
- **Branch:** `codex/issue-02-healthy-baseline-and-lineage`.
- **Feature commit:** `82a0b664cdc010168e55f776702d282e96e82095`.
- **Log commit identifier:** `docs: record issue 02 completion in dev log`.
- **Log publication:** Confirmed pushed at `528cf3d`.

## 2026-10-11 — Main integration: Issue #2 closure and frontier advancement

- **Task:** User authorized fast-forward integration of completed Issue #2 into `main`, closure of GitHub Issue #2, and team frontier update.
- **Authenticated identity:** ashudotbuilds via GitHub API and Git credentials.
- **Status:** PUSHED to origin/main; Issue #2 closed on GitHub.
- **Scope:** Default-branch publication of Ticket 02 implementation and dev log.
- **Integration:** Fast-forward merged `codex/issue-02-healthy-baseline-and-lineage` (commits `82a0b66` and `528cf3d`) into `main`. Pushed to `origin/main`. Closed GitHub Issue #2 (state: `closed`, reason: `completed`).
- **Team Frontier Status:**
  - Ticket 01 is COMPLETED and closed.
  - Ticket 28 is COMPLETED and closed.
  - Ticket 02 is COMPLETED and closed.
  - Ticket 03 (`ashudotbuilds`: "Inject and detect a user field rename") is now UNBLOCKED and ready to start!
  - Ticket 29 (`saransh-sh`: "Issue rotate and revoke environment-scoped ingestion keys") is also UNBLOCKED.
- **Log commit identifier:** `docs: record issue 02 main integration and closure in dev log`.
- **Log publication:** Confirmed pushed at `main`.

## 2026-10-11 — Ticket 03: Inject and detect a user field rename

- **Task:** Issue #3 ([P0] 03: Inject and detect a user field rename).
- **Authenticated identity:** ashudotbuilds
- **Status:** COMPLETED. Feature pushed to `origin/codex/issue-03-inject-and-detect-user-drift`.
- **Scope & Governance:** PRD FR-SIM-02, FR-SIM-03, FR-DET-01, FR-DET-02, FR-DET-03, FR-DET-05, FR-UI-03, FR-MON-01, NFR-20; endpoints `POST /api/scenarios/:scenarioId/inject` (A05), `POST /api/observations/run` (A06), `GET /api/incidents` (A07), `GET /api/incidents/:incidentId` (A08). Implemented scenario injection on mock-providers without restart or source code modification (`users.field-rename`), observation execution and diffing against healthy baseline fixtures across 3 stable identities (`u-123`, `u-456`, `u-789`), corroborated evidence scoring (`confirmed`), deduplicated deterministic fingerprint calculation (`dg-fp:users:/api/v1/users:rename:name->display_name`), full before/after response payload evidence attachment, workflow invariant failure detection (welcome_email, customer_profile), and control-plane web inspection drawer.
- **Changes made:**
  - `packages/contracts`: Added contracts for `InjectScenarioRequestSchema`, `InjectScenarioResponseSchema`, `FindingTypeSchema`, `EvidenceStrengthSchema`, `FindingSchema`, `IncidentSummarySchema`, `ListIncidentsResponseSchema`, `IncidentDetailSchema`, `IncidentDetailResponseSchema`, `RunObservationsRequestSchema`, `RunObservationsResponseSchema`, and extended `DemoStateResponseSchema` with `incidents` and `activeScenarios`.
  - `apps/api`: Created `IncidentService` (`apps/api/src/services/incident-service.ts`) handling scenario injection dispatch, live mock observations, baseline diffing, corroboration ranking, fingerprint deduplication, and workflow invariant check failures; updated `ProjectService.getDemoState` to project incidents and active scenarios; mounted endpoints A05, A06, A07, A08 in `apps/api/src/app.ts`.
  - `apps/web`: Added client methods in `api-client.ts` (`injectScenario`, `runObservations`, `listIncidents`, `getIncident`); updated `App.tsx` with Scenario Injection panel, Live Observation Run trigger, Incident Summary list badges, and an interactive Incident Detail & Evidence drawer.
  - `apps/api/tests/api.test.ts`: Added automated integration tests for scenario injection, observation execution, deduplication across runs, corroborated evidence strength, and incident detail retrieval.
  - `apps/web/src/App.test.tsx`: Added UI integration tests for scenario injection and observation execution.
  - `.scratch/driftguard/issues/03-inject-and-detect-user-drift.md`: Completed acceptance criteria checklist and marked status as completed.
- **Verification:**
  - `pnpm -r run build`: All 4 packages compiled cleanly.
  - `pnpm -r run typecheck`: 0 TypeScript errors across all 4 packages.
  - `vitest run`: 40 of 40 tests passed across all 4 suites (`@driftguard/contracts`, `@driftguard/mock-providers`, `@driftguard/api`, `@driftguard/web`).
  - `node scripts/validate-planning.mjs`: All 41 tickets, 97 requirements, 37 API routes, and 17 SDK gates validated successfully.
- **Branch:** `codex/issue-03-inject-and-detect-user-drift`.
- **Feature commit:** `bd5e035`.
- **Confirmed push:** Confirmed push to `origin/codex/issue-03-inject-and-detect-user-drift`.
- **Log commit identifier:** `docs: record issue 03 completion in dev log`.
- **Log publication:** Confirmed pushed at `42ef978`.

## 2026-10-11 — Main integration: Issue #3 closure and frontier advancement

- **Task:** User authorized fast-forward integration of completed Issue #3 into `main`, closure of GitHub Issue #3, and team frontier update.
- **Authenticated identity:** ashudotbuilds via GitHub API and Git credentials.
- **Status:** PUSHED to origin/main; Issue #3 closed on GitHub.
- **Scope:** Default-branch publication of Ticket 03 implementation and dev log.
- **Integration:** Fast-forward merged `codex/issue-03-inject-and-detect-user-drift` (commits `bd5e035` and `42ef978`) into `main`. Pushed to `origin/main`. Closed GitHub Issue #3 (state: `closed`, reason: `completed`).
- **Team Frontier Status:**
  - Ticket 01 is COMPLETED and closed.
  - Ticket 28 is COMPLETED and closed.
  - Ticket 02 is COMPLETED and closed.
  - Ticket 03 is COMPLETED and closed.
  - Ticket 04 (`saransh-sh`: "Explain impact and recommend repair") is now UNBLOCKED and ready to start!
  - Ticket 29 (`saransh-sh`: "Issue rotate and revoke environment-scoped ingestion keys") is also UNBLOCKED.
- **Log commit identifier:** `docs: record issue 03 main integration and closure in dev log`.
- **Log publication:** Confirmed pushed at `main`.

## 2026-10-11 — Ticket 04: Explain affected and unaffected workflows

- **Task:** Issue #4 ([P0] 04: Explain affected and unaffected workflows).
- **Authenticated identity:** ashudotbuilds
- **Status:** COMPLETED. Feature pushed to `origin/codex/issue-04-explain-impact`.
- **Scope & Governance:** PRD FR-IMP-03, FR-IMP-04, FR-IMP-05, FR-UI-04, FR-LIN-01, FR-MON-01; sections 13, 13.3, 21.1 (AT-SDK-11); API route `POST /api/incidents/:incidentId/analyze-impact` (A09). Implemented runtime lineage impact analysis that follows changed provider fields through canonical adapter mappings to consumed workflows; identified `welcome_email` and `customer_profile` as affected due to runtime consumption of `displayName` derived from drifted `name`; proved `inventory_sync` and `delivery_estimate` are unaffected; mapped provider → endpoint → client → adapter → workflow lineage trace paths with immutable evidence references and `runtime_read` provenance; provided fallback to `insufficient_evidence` and `unknown` status when lineage edges are absent (never inventing zero impact); and added a 3-column lineage trace UI in the control-plane incident drawer.
- **Changes made:**
  - `packages/contracts`: Added contracts for `LineageProvenanceSchema`, `ImpactStatusSchema`, `WorkflowImpactSchema`, `TracePathSchema`, `AnalyzeImpactRequestSchema`, `AnalyzeImpactResponseSchema`, and added optional `impactAnalysis` to `IncidentDetailSchema`.
  - `apps/api`: Implemented `IncidentService.analyzeImpact` (`apps/api/src/services/incident-service.ts`) checking baseline read edges, mapping affected vs unaffected workflows with invariants and provenance, caching result on the incident record; mounted endpoint `POST /api/incidents/:incidentId/analyze-impact` (A09) in `apps/api/src/app.ts`.
  - `apps/web`: Added `apiClient.analyzeImpact` in `apps/web/src/api-client.ts`; added interactive "Analyze Workflow Impact (A09)" trigger and 3-column trace display (Affected Workflows, Unaffected Workflows, Lineage Trace Paths) in `apps/web/src/App.tsx`.
  - `apps/api/tests/api.test.ts`: Added tests verifying endpoint A09 returns affected/unaffected workflows and trace paths, caches impact on incident detail A08, returns 404 for unknown incident, and returns insufficient evidence with unknown workflows when lineage is missing.
  - `apps/web/src/App.test.tsx`: Added UI test for triggering impact analysis and asserting 3-column lineage trace rendering.
  - `.scratch/driftguard/issues/04-explain-impact.md`: Completed acceptance criteria checklist and marked status as completed.
- **Verification:**
  - `pnpm -r run build`: All 4 packages compiled cleanly.
  - `pnpm -r run typecheck`: 0 TypeScript errors across all 4 packages.
  - `vitest run`: 43 of 43 tests passed across all 4 suites (`@driftguard/contracts`, `@driftguard/mock-providers`, `@driftguard/api`, `@driftguard/web`).
  - `node scripts/validate-planning.mjs`: All 41 tickets, 97 requirements, 37 API routes, and 17 SDK gates validated successfully.
- **Branch:** `codex/issue-04-explain-impact`.
- **Feature commit:** `dbdd3a5`.
- **Confirmed push:** Confirmed push to `origin/codex/issue-04-explain-impact`.
- **Log commit identifier:** `docs: record issue 04 completion in dev log`.
- **Log publication:** Confirmed pushed at `16ccb54`.

## 2026-10-11 — Main integration: Issue #4 closure and frontier advancement

- **Task:** User authorized fast-forward integration of completed Issue #4 into `main`, closure of GitHub Issue #4, and team frontier update.
- **Authenticated identity:** ashudotbuilds via GitHub API and Git credentials.
- **Status:** PUSHED to origin/main; Issue #4 closed on GitHub.
- **Scope:** Default-branch publication of Ticket 04 implementation and dev log.
- **Integration:** Fast-forward merged `codex/issue-04-explain-impact` (commits `dbdd3a5` and `16ccb54`) into `main`. Pushed to `origin/main`. Closed GitHub Issue #4 (state: `closed`, reason: `completed`).
- **Team Frontier Status:**
  - Ticket 01 is COMPLETED and closed.
  - Ticket 28 is COMPLETED and closed.
  - Ticket 02 is COMPLETED and closed.
  - Ticket 03 is COMPLETED and closed.
  - Ticket 04 is COMPLETED and closed.
  - Ticket 05 (`AnushkaBhardwaj15`: "Generate bounded repair proposal") is now UNBLOCKED and ready to start!
  - Ticket 29 (`saransh-sh`: "Issue rotate and revoke environment-scoped ingestion keys") is also UNBLOCKED.
- **Log commit identifier:** `docs: record issue 04 main integration and closure in dev log`.
- **Log publication:** Confirmed pushed at `main`.

## 2026-10-11 — Ticket 05: Propose a constrained compatible adapter

- **Task:** Issue #5 ([P0] 05: Propose a constrained compatible adapter).
- **Authenticated identity:** ashudotbuilds
- **Status:** COMPLETED. Feature pushed to `origin/codex/issue-05-bounded-repair-proposal`.
- **Scope & Governance:** PRD FR-REP-01, FR-REP-02, FR-REP-03, FR-REP-04, FR-REP-06, NFR-01, NFR-02, FR-LIN-01, FR-MON-01, NFR-21; sections 12.6, 13, 15, 22; endpoints `POST /api/incidents/:incidentId/propose-repair` (A10) and `GET /api/incidents/:incidentId` (A08). Implemented deterministic RepairModel synthesis that builds an evidence bundle from observed field-level drift, canonical contract mappings, and workflow invariants; proposes safe coalesce rule `[display_name, name] -> displayName` with source `deterministic_fallback` and 95% confidence; guarantees identity preservation (`id` preserved in canonical projection); provides adapter diff (`CanonicalUserAdapter.v1` -> `CanonicalUserAdapter.v2`), required validation gates (`shadow_validation_v1`, `workflow_replay_welcome_email`, `workflow_replay_customer_profile`), and explicit evidence references; implements `AdapterRuntime.apply` with safe prototype guard and support for old responses, renamed responses, and both fields; and mounted interactive proposal card in the web UI.
- **Changes made:**
  - `packages/contracts`: Added contracts for `RepairSourceSchema`, `RepairOpSchema`, `AdapterRuleSchema`, `AdapterPatchSchema`, `RepairProposalSchema`, `ProposeRepairRequestSchema`, `ProposeRepairResponseSchema`, and extended `IncidentDetailSchema` with `proposals`.
  - `apps/api`: Implemented `IncidentService.proposeRepair` and `AdapterRuntime` in `apps/api/src/services/incident-service.ts`; mounted endpoint `POST /api/incidents/:incidentId/propose-repair` (A10) in `apps/api/src/app.ts`.
  - `apps/web`: Added `apiClient.proposeRepair` in `apps/web/src/api-client.ts`; added proposal state, `handleProposeRepair`, and Constrained Compatible Adapter Proposal card in `apps/web/src/App.tsx`.
  - `apps/api/tests/api.test.ts`: Added tests for proposing repair via A10, verifying `AdapterRuntime.apply` handling across old, new, both, and missing field scenarios, testing incident detail reflection, and verifying 404/422 error cases.
  - `apps/web/src/App.test.tsx`: Added UI test for triggering repair proposal and asserting synthesized rules, diff, and checks.
  - `.scratch/driftguard/issues/05-bounded-repair-proposal.md`: Completed acceptance criteria checklist and marked status as completed.
- **Verification:**
  - `pnpm -r run build`: All 4 packages compiled cleanly; Vite production bundle built successfully.
  - `pnpm -r run typecheck`: 0 TypeScript errors across all 4 packages.
  - `vitest run`: 47 of 47 tests passed across all 4 suites (`@driftguard/contracts`, `@driftguard/mock-providers`, `@driftguard/api`, `@driftguard/web`).
  - `node scripts/validate-planning.mjs`: All 41 tickets, 97 requirements, 37 API routes, and 17 SDK gates validated successfully.
- **Branch:** `codex/issue-05-bounded-repair-proposal`.
- **Feature commit:** `37e85ce`.
- **Log commit identifier:** `docs: record issue 05 completion in dev log`.
- **Log publication:** Confirmed pushed at `9440690`.

## 2026-10-11 — Main integration: Issue #5 closure and frontier advancement

- **Task:** User authorized fast-forward integration of completed Issue #5 into `main`, closure of GitHub Issue #5, and team frontier update.
- **Authenticated identity:** ashudotbuilds via GitHub API and Git credentials.
- **Status:** PUSHED to origin/main; Issue #5 closed on GitHub.
- **Scope:** Default-branch publication of Ticket 05 implementation and dev log.
- **Integration:** Fast-forward merged `codex/issue-05-bounded-repair-proposal` (commits `37e85ce` and `9440690`) into `main`. Pushed to `origin/main`. Closed GitHub Issue #5 (state: `closed`, reason: `completed`).
- **Team Frontier Status:**
  - Ticket 01 is COMPLETED and closed.
  - Ticket 28 is COMPLETED and closed.
  - Ticket 02 is COMPLETED and closed.
  - Ticket 03 is COMPLETED and closed.
  - Ticket 04 is COMPLETED and closed.
  - Ticket 05 is COMPLETED and closed.
  - Ticket 06 (`AnushkaBhardwaj15`: "Validate candidate adapter in shadow mode") is now UNBLOCKED and ready to start!
  - Ticket 29 (`saransh-sh`: "Issue rotate and revoke environment-scoped ingestion keys") is also UNBLOCKED.
- **Log commit identifier:** `docs: record issue 05 main integration and closure in dev log`.
- **Log publication:** Confirmed pushed at `main`.

## 2026-10-11 — Ticket 06: Validate candidate semantics and automatic eligibility

- **Task:** Issue #6 ([P0] 06: Validate candidate semantics and automatic eligibility).
- **Authenticated identity:** ashudotbuilds
- **Status:** COMPLETED. Feature pushed to `origin/codex/issue-06-shadow-validation-and-policy`.
- **Scope & Governance:** PRD FR-REP-05, FR-REP-07, FR-REP-08, FR-VAL-01, FR-VAL-02, FR-VAL-03, FR-VAL-04, FR-VAL-05, FR-VAL-07, NFR-15, FR-LIN-01, NFR-20; sections 12.6, 13, 16, 21.1 (AT-SDK-14); endpoints `POST /api/patches/:patchId/validate` (A11) and `GET /api/incidents/:incidentId` (A08). Implemented shadow validation running candidate adapters in complete isolation without mutating active runtime behavior; replayed captured baseline fixtures across all 3 identities (`u-123`, `u-456`, `u-789`); evaluated all 9 conjunctive safety gates defined in FR-REP-07 (`read_only_endpoint`, `structural_drift_only`, `allowed_operations_only`, `value_equivalence_identities`, `no_proposal_uncertainty`, `replay_safe_workflows`, `canonical_schema_and_invariants`, `patch_hash_match`, `no_unrelated_regression`); enforced exact candidate patch hash verification; stubbed workflow side effects (`sideEffectStubbed: true`, preventing live external email dispatch during shadow execution per FR-VAL-07); persisted immutable `validationRun` outcomes and gate checks on the incident; and mounted interactive validation trigger and status visualizer in the web UI.
- **Changes made:**
  - `packages/contracts`: Added contracts for `ValidationGateIdSchema`, `ValidationGateResultSchema`, `ValidationWorkflowOutcomeSchema`, `ValidationEligibilitySchema`, `ValidationRunSchema`, `ValidatePatchRequestSchema`, `ValidatePatchResponseSchema`, and extended `IncidentDetailSchema` with `validationRuns`.
  - `apps/api`: Implemented `IncidentService.validatePatch` and `getValidationRun` in `apps/api/src/services/incident-service.ts`; mounted endpoint `POST /api/patches/:patchId/validate` (A11) in `apps/api/src/app.ts`.
  - `apps/web`: Added `apiClient.validatePatch` in `apps/web/src/api-client.ts`; added validation state hooks, `handleValidatePatch`, and Shadow Validation & Automatic Eligibility card (A11) in `apps/web/src/App.tsx`.
  - `apps/api/tests/api.test.ts`: Added tests for validating candidate patches across all 9 gates, verifying `sideEffectStubbed`, testing candidate patch hash mismatch rejection (`FR-VAL-05`), and testing 404 for unknown patch ID.
  - `apps/web/src/App.test.tsx`: Added UI test for triggering patch validation and verifying rendered gates and `ELIGIBLE FOR ACTIVATION` badge.
  - `.scratch/driftguard/issues/06-shadow-validation-and-policy.md`: Completed acceptance criteria checklist and marked status as completed.
- **Verification:**
  - `pnpm -r run build`: All 4 packages compiled cleanly; Vite production bundle built successfully.
  - `pnpm -r run typecheck`: 0 TypeScript errors across all 4 packages.
  - `vitest run`: 51 of 51 tests passed across all 4 suites (`@driftguard/contracts`, `@driftguard/mock-providers`, `@driftguard/api`, `@driftguard/web`).
  - `node scripts/validate-planning.mjs`: All 41 tickets, 97 requirements, 37 API routes, and 17 SDK gates validated successfully.
- **Branch:** `codex/issue-06-shadow-validation-and-policy`.
- **Feature commit:** `69011ee`.
- **Confirmed push:** Confirmed push to `origin/codex/issue-06-shadow-validation-and-policy`.
- **Log commit identifier:** `docs: record issue 06 completion in dev log`.
- **Log publication:** Confirmed pushed at `41dcd24`.

## 2026-10-11 — Main integration: Issue #6 closure and frontier advancement

- **Task:** User authorized fast-forward integration of completed Issue #6 into `main`, closure of GitHub Issue #6, and team frontier update.
- **Authenticated identity:** ashudotbuilds via GitHub API and Git credentials.
- **Status:** PUSHED to origin/main; Issue #6 closed on GitHub.
- **Scope:** Default-branch publication of Ticket 06 implementation and dev log.
- **Integration:** Fast-forward merged `codex/issue-06-shadow-validation-and-policy` (commits `69011ee` and `41dcd24`) into `main`. Pushed to `origin/main`. Closed GitHub Issue #6 (state: `closed`, reason: `completed`).
- **Team Frontier Status:**
  - Ticket 01 is COMPLETED and closed.
  - Ticket 28 is COMPLETED and closed.
  - Ticket 02 is COMPLETED and closed.
  - Ticket 03 is COMPLETED and closed.
  - Ticket 04 is COMPLETED and closed.
  - Ticket 05 is COMPLETED and closed.
  - Ticket 06 is COMPLETED and closed.
  - Ticket 07 (`AnushkaBhardwaj15`: "Activate adapter replay and rollback") is now UNBLOCKED and ready to start!
  - Ticket 29 (`saransh-sh`: "Issue rotate and revoke environment-scoped ingestion keys") is also UNBLOCKED.
- **Log commit identifier:** `docs: record issue 06 main integration and closure in dev log`.
- **Log publication:** Confirmed pushed at `main`.

---

## Entry: 2026-10-11 - Ticket 07: Activate Validated Adapters and Replay Safely (codex/issue-07-activation-replay-and-rollback)

- **Date:** 2026-10-11
- **Operator:** `codex` pair programming with `ashudotbuilds`
- **Issue:** [#7](https://github.com/ashudotbuilds/PLAN9/issues/7)
- **Branch:** `codex/issue-07-activation-replay-and-rollback`
- **Status:** IMPLEMENTED AND VERIFIED on feature branch; ready for merge to main.
- **Scope:** PRD FR-VAL-05, FR-VAL-06, FR-VAL-08, NFR-05, FR-OPS-01, NFR-20; Sections 13, 13.2, 16, 21.1 (AT-SDK-15); Endpoints `A12` (`POST /api/patches/:patchId/activate`), `A13` (`POST /api/patches/:patchId/rollback` and alias `POST /api/adapters/:adapterId/rollback`), and workflow replay `A15`.
- **Implementation summary:**
  1. **Contracts (`packages/contracts`):**
     - Authored `ActiveAdapterSchema` (version, parentVersion, patchId, patchHash, provider, targetEntity, rules, preservedFields, status `active | superseded | rolled_back`, activatedAt).
     - Authored `PostActivationReplayOutcomeSchema` (status `passed | failed`, replays array, details).
     - Authored `ActivatePatchRequestSchema`, `ActivatePatchResponseSchema`, `RollbackPatchRequestSchema`, `RollbackPatchResponseSchema`.
     - Extended `IncidentDetailSchema` with `activeAdapter` and `recoveryStatus: recovered | rolled_back | pending`.
  2. **API & Engine Service (`apps/api`):**
     - Added `activeAdapters` registry scoped by `projectId:environment`.
     - Implemented `activatePatch` (FR-VAL-05, FR-VAL-08):
       - Verifies existing passing shadow validation run with eligibility `eligible`.
       - Cryptographically verifies patch hash matching between candidate and proposal.
       - Synthesizes incremented version linked to `parentVersion`.
       - Executes live post-activation replay across affected consumer workflows (`welcome_email`, `customer_profile`).
       - If post-activation replays pass: transitions incident status to `recovered` and recoveryStatus to `recovered`.
       - If post-activation replays fail (FR-VAL-08): automatically restores parent adapter version, marks new adapter `rolled_back`, incident status `rolled_back`, retaining all failed patch records and replay evidence.
     - Implemented `rollbackPatch` (FR-VAL-06):
       - Validates prior parent adapter exists (rejects with 409 `NO_ROLLBACK_PARENT` otherwise).
       - Restores parent adapter version 1, sets previous adapter status `superseded`, sets incident status `rolled_back` and recoveryStatus `rolled_back`.
       - Records audit event `aud_*`.
     - Mounted routes: `POST /api/patches/:patchId/activate` (A12), `POST /api/patches/:patchId/rollback` (A13), and `POST /api/adapters/:adapterId/rollback` (A13 alias).
  3. **Control Plane Frontend (`apps/web`):**
     - Extended `ApiClient` with typed `activatePatch` and `rollbackPatch` methods.
     - Added UI activation drawer controls: "Activate Adapter (A12)" enabled only for eligible validated proposals.
     - Added "Rollback to Parent (A13)" button enabled when active adapter version > 1.
     - Rendered Active Adapter status badge (`ACTIVE`, `ROLLED BACK`, `SUPERSEDED`), version lineage (`v2, parent: v1`), and `RECOVERED` / `ROLLED BACK` recovery status badges.
     - Displayed post-activation replay verification cards for `welcome_email` and `customer_profile`.
  4. **Acceptance & Regression Testing:**
     - Added 7 comprehensive integration tests in `apps/api/tests/api.test.ts` covering authentication guards, validated activation, automatic post-activation replay, 409 rejection for unvalidated patches, 409 rejection for hash mismatch, 404 for unknown patch, safe rollback to parent adapter, alias route support, and 409 rejection when no parent exists.
     - Added UI integration test in `apps/web/src/App.test.tsx` verifying interactive activation flow, `RECOVERED` badge, active adapter inspector, and rollback button triggering `ROLLED BACK` status.
     - Verified all 60 tests pass across 4 packages and apps (`pnpm run test`).
     - Verified clean production build across workspace (`pnpm -r run build`).
     - Verified planning integrity via `node scripts/validate-planning.mjs`.
- **Files Modified:**
  - `packages/contracts/src/index.ts`
  - `apps/api/src/app.ts`
  - `apps/api/src/services/incident-service.ts`
  - `apps/api/tests/api.test.ts`
  - `apps/web/src/api-client.ts`
  - `apps/web/src/App.tsx`
  - `apps/web/src/App.test.tsx`
  - `.scratch/driftguard/issues/07-activation-replay-and-rollback.md`
  - `log.md`
- **Next Step:** Merge `codex/issue-07-activation-replay-and-rollback` to `main`, push `main`, close Issue #7 via GitHub API, update `log.md` on `main`, and advance to Ticket 08 (`.scratch/driftguard/issues/08-backend-recovery-run.md`).

---

## Entry: 2026-10-11 - Ticket 07 Main Integration and Issue #7 Closure

- **Date:** 2026-10-11
- **Operator:** `codex` pair programming with `ashudotbuilds`
- **Issue:** [#7](https://github.com/ashudotbuilds/PLAN9/issues/7)
- **Branch:** `main`
- **Status:** PUSHED to origin/main; Issue #7 closed on GitHub.
- **Scope:** Default-branch publication of Ticket 07 implementation, tests, and dev log.
- **Integration:** Fast-forward merged `codex/issue-07-activation-replay-and-rollback` (commits `1239876` and `4ed57c0`) into `main`. Pushed to `origin/main`. Closed GitHub Issue #7 (state: `closed`, reason: `completed`).
- **Team Frontier Status:**
  - Ticket 01 is COMPLETED and closed.
  - Ticket 28 is COMPLETED and closed.
  - Ticket 02 is COMPLETED and closed.
  - Ticket 03 is COMPLETED and closed.
  - Ticket 04 is COMPLETED and closed.
  - Ticket 05 is COMPLETED and closed.
  - Ticket 06 is COMPLETED and closed.
  - Ticket 07 is COMPLETED and closed.
  - Ticket 08 (`soumya240806`: "[P0] 08: Run and record backend recovery workflow") is now UNBLOCKED and ready to start!
  - Ticket 29 (`saransh-sh`: "[P0] 29: Issue, rotate, and revoke environment-scoped ingestion keys") is also UNBLOCKED.
- **Log commit identifier:** `docs: record issue 07 main integration and closure in dev log`.
- **Log publication:** Confirmed pushed at `main`.

---

## Entry: 2026-10-11 - Ticket 08: Run and Record Backend Recovery Workflow (codex/issue-08-backend-recovery-run)

- **Date:** 2026-10-11
- **Operator:** `codex` pair programming with `ashudotbuilds`
- **Issue:** [#8](https://github.com/ashudotbuilds/PLAN9/issues/8)
- **Branch:** `codex/issue-08-backend-recovery-run`
- **Status:** IMPLEMENTED AND VERIFIED on feature branch; ready for merge to main.
- **Scope:** PRD FR-REC-01, FR-REC-02, FR-REC-03, FR-REC-04, FR-VAL-09, NFR-17, NFR-20; Sections 13, 13.1–13.2, 16; Endpoints `A16` (`POST /api/incidents/:incidentId/recover`) and `A17` (`GET /api/recovery-runs/:recoveryRunId`).
- **Implementation summary:**
  1. **Contracts (`packages/contracts`):**
     - Updated `RecoveryRunStageSchema` with full PRD lifecycle (`queued`, `impact`, `proposing`, `validating`, `activating`, `replaying`, `rolling_back`, `completed`, `failed`).
     - Authored `RecoveryRunStageHistoryItemSchema`, `RecoveryRunArtifactsSchema`, and `RecoveryRunSchema`.
     - Authored `StartRecoveryRequestSchema`, `StartRecoveryResponseSchema`, `GetRecoveryRunResponseSchema`.
     - Extended `IncidentDetailSchema` with `recoveryRuns` collection.
  2. **API & Engine Service (`apps/api`):**
     - Added `recoveryRuns` map to `IncidentService`.
     - Implemented `startRecovery`:
       - Enforces operator authentication and scoped incident lookup (404 `INCIDENT_NOT_FOUND`).
       - Enforces concurrency guard (FR-REC-01): returns 409 `RECOVERY_ALREADY_RUNNING` with `activeRecoveryRunId` if a run is already active.
       - Validates captured baseline requirement (409 `BASELINE_REQUIRED`).
       - Initializes `RecoveryRun` record in `queued` status and returns 202 with exactly `{ recoveryRunId, incidentId }`.
       - Triggers asynchronous background recovery pipeline: executes impact analysis (`impact`), proposal synthesis (`proposing`), shadow validation (`validating`), activation and workflow verification (`activating`/`replaying`), or automatic rollback on replay failure (`rolling_back`).
       - Preserves last valid incident state on infrastructure failure (FR-REC-04).
     - Implemented `getRecoveryRun` (A17): returns pollable run state, stage history, and artifact IDs.
     - Mounted routes: `POST /api/incidents/:incidentId/recover` (202 Accepted) and `GET /api/recovery-runs/:recoveryRunId` (200 OK / 404).
  3. **Control Plane Frontend (`apps/web`):**
     - Extended `ApiClient` with `startRecovery` and `getRecoveryRun` methods.
     - Added UI button: "Run Safe Recovery (A16)" in incident inspection drawer.
     - Added real-time recovery progress tracker displaying run ID, stage history badges, and live execution status.
  4. **Acceptance & Regression Testing:**
     - Added 6 integration tests in `apps/api/tests/api.test.ts` covering auth guards, asynchronous 202 start, stage history progression to completion, concurrent recovery rejection (409), unknown incident/run 404s, and baseline requirement guard.
     - Added UI test in `apps/web/src/App.test.tsx` verifying safe recovery initiation, live progress tracking, and completed state rendering.
     - Verified all 67 tests pass across 4 workspace packages and apps (`pnpm run test`).
     - Verified clean production build across workspace (`pnpm -r run build`).
     - Verified planning integrity via `node scripts/validate-planning.mjs`.
- **Files Modified:**
  - `packages/contracts/src/index.ts`
  - `apps/api/src/app.ts`
  - `apps/api/src/services/incident-service.ts`
  - `apps/api/tests/api.test.ts`
  - `apps/web/src/api-client.ts`
  - `apps/web/src/App.tsx`
  - `apps/web/src/App.test.tsx`
  - `.scratch/driftguard/issues/08-backend-recovery-run.md`
  - `log.md`
- **Next Step:** Merge `codex/issue-08-backend-recovery-run` to `main`, push `main`, close Issue #8 via GitHub API, update `log.md` on `main`, and advance to next ticket in topological order.

---

## Entry: 2026-10-11 - Ticket 08 Main Integration and Issue #8 Closure

- **Date:** 2026-10-11
- **Operator:** `codex` pair programming with `ashudotbuilds`
- **Issue:** [#8](https://github.com/ashudotbuilds/PLAN9/issues/8)
- **Branch:** `main`
- **Status:** PUSHED to origin/main; Issue #8 closed on GitHub.
- **Scope:** Default-branch publication of Ticket 08 implementation, tests, and dev log.
- **Integration:** Fast-forward merged `codex/issue-08-backend-recovery-run` (commits `b125509` and `62741fd`) into `main`. Pushed to `origin/main`. Closed GitHub Issue #8 (state: `closed`, reason: `completed`).
- **Team Frontier Status:**
  - Ticket 01 is COMPLETED and closed.
  - Ticket 28 is COMPLETED and closed.
  - Ticket 02 is COMPLETED and closed.
  - Ticket 03 is COMPLETED and closed.
  - Ticket 04 is COMPLETED and closed.
  - Ticket 05 is COMPLETED and closed.
  - Ticket 06 is COMPLETED and closed.
  - Ticket 07 is COMPLETED and closed.
  - Ticket 08 is COMPLETED and closed.
  - Ticket 09 (`AnushkaBhardwaj15`: "[P0] 09: Operate and inspect recovery from the dashboard") is now UNBLOCKED and ready to start!
  - Ticket 29 (`saransh-sh`: "[P0] 29: Issue, rotate, and revoke environment-scoped ingestion keys") is also UNBLOCKED.
- **Log commit identifier:** `docs: record issue 08 main integration and closure in dev log`.
- **Log publication:** Confirmed pushed at `main`.

---

## Entry: 2026-10-11 - Ticket 09: Operate and Inspect Recovery from the Dashboard (codex/issue-09-operational-recovery-dashboard)

- **Date:** 2026-10-11
- **Operator:** `codex` pair programming with `ashudotbuilds`
- **Issue:** [#9](https://github.com/ashudotbuilds/PLAN9/issues/9)
- **Branch:** `codex/issue-09-operational-recovery-dashboard`
- **Status:** COMPLETED, VERIFIED, AND INTEGRATED into main in single commit per user instruction; Issue #9 closed.
- **Scope:** PRD FR-UI-01, FR-UI-02, FR-UI-05, FR-UI-06, FR-UI-07, FR-UI-09, NFR-06, NFR-10, NFR-18, FR-LIN-01, FR-MON-01, NFR-08. Sections 13.1, 17, 21.1 (AT-SDK-11).
- **Implementation summary:**
  1. **Dependency Rail (A14):**
     - Added `listProviders()` method in `api-client.ts` consuming `GET /api/providers`.
     - Built responsive Dependency Rail in `App.tsx` displaying registered provider endpoints (Users API, Inventory API, Shipping API), status badges, active fault scenario tracking, and baseline version status.
  2. **Incident Workspace & Evidence Maturity:**
     - Restrained operational layout with solid surfaces (`#0d1117`, `#161b22`, `#21262d`), clean borders (`#30363d`), no decorative gradients or neon blobs.
     - Evidence maturity labels (`confirmed` vs `inferred (limited precision)`) clearly distinguished.
     - Full before/after evidence JSON diff comparison preserved in incident inspection drawer.
  3. **3-Column Causal Impact Trace:**
     - Structured 3-column causal layout: (1) Upstream Provider Change -> (2) Downstream Client / Adapter -> (3) Affected Workflows.
     - Lineage precision explicitly displayed (runtime verified Proxy tracing vs inferred).
  4. **Compact Audit Timeline (NFR-08):**
     - Mounted immutable, append-only operational audit timeline tracking `aud_*` event IDs, causal operations (`create_project`, `capture_baseline`, `inject_scenario`, `observe_drift`, `analyze_impact`, `propose_repair`, `validate_patch`, `activate_adapter`, `rollback_adapter`, `recovery_run`), scopes, and timestamps.
  5. **Scope Isolation & Stale State Reset:**
     - Scope changes (project or environment switching) automatically clear stale incident inspection, impact analysis, repair proposal, validation run, active adapter, recovery run, and error views.
  6. **Authentication & Safe Error States:**
     - Added safe re-authentication notice banner on 401 unauthenticated or origin denial.
  7. **Single-Commit Verification:**
     - Verified all 71 tests passing across workspace (`vitest run`).
     - Verified clean production build across workspace (`pnpm -r run build`).
     - Verified planning documents via `node scripts/validate-planning.mjs`.
- **Files Modified:**
  - `apps/web/src/api-client.ts`
  - `apps/web/src/App.tsx`
  - `apps/web/src/App.test.tsx`
  - `.scratch/driftguard/issues/09-operational-recovery-dashboard.md`
  - `log.md`
- **Team Frontier Status:**
  - Tickets completed and closed: 01, 28, 02, 03, 04, 05, 06, 07, 08, 09.
  - Next in line in topological order: **Ticket 10** (`soumya240806`: "[P0] 10: Refuse illegal shipping patch via semantic canary and trigger rollback") and **Ticket 29** (`saransh-sh`: "[P0] 29: Issue, rotate, and revoke environment-scoped ingestion keys").

---

## Entry: 2026-10-11 - Ticket 10: Detect unchanged-schema shipping drift and hold repair (codex/issue-10-shipping-semantic-refusal)

- **Date:** 2026-10-11
- **Operator:** `codex` pair programming with `ashudotbuilds`
- **Issue:** [#10](https://github.com/ashudotbuilds/PLAN9/issues/10)
- **Branch:** `codex/issue-10-shipping-semantic-refusal`
- **Status:** COMPLETED, VERIFIED, AND INTEGRATED into main in single commit per user instruction; Issue #10 closed.
- **Scope:** PRD FR-OBS-04, FR-DET-04, FR-SIM-03, FR-REP-05, FR-REP-08, FR-MON-01, NFR-20. Sections 13.2–13.3, 19, 21.1 (AT-SDK-13).
- **Implementation summary:**
  1. **Deterministic Oracle Canary for Shipping (M03):**
     - Stored canary query `GET /shipping/estimate?ship_date=2026-10-09&delivery_days=3` returns calendar baseline `2026-10-12` and business-days drift `2026-10-14` (skipping Saturday Oct 10 and Sunday Oct 11).
     - Response schema shape remains identical (`{ estimated_delivery_date: string }`).
     - Stored deterministic canary oracle flags semantic behavioral change over HTTP, recording finding with `type: 'semantic_behavior_drift'`, `evidenceStrength: 'confirmed'`, `beforeValue: '2026-10-12'`, `afterValue: '2026-10-14'`.
  2. **Impact Analysis & Blast Radius Containment (A09):**
     - Lineage correctly marks `delivery_estimate` as `affected` due to consumption of `shipping.estimated_delivery_date` and violation of invariant `deep_equal_to_baseline`.
     - User workflows (`welcome_email`, `customer_profile`) and inventory workflow (`inventory_sync`) are strictly excluded from the blast radius and marked `unaffected`.
  3. **Repair Proposal Review Hold (A10):**
     - When incident is shipping semantic drift, repair synthesis produces proposal with `recommendation: 'review_required'`, `confidence: 0.1`, and explicit uncertainties `['semantic_drift_detected', 'business_policy_undetermined']`.
     - Incident status is set to `review_required`.
  4. **9 Conjunctive Shadow Validation Gates (A11):**
     - Evaluates 9 gates in shadow isolation: Gate 1 (`read_only_endpoint`) passes; Gate 2 (`structural_drift_only`) fails; Gate 4 (`value_equivalence_identities`) fails; Gate 5 (`no_proposal_uncertainty`) fails; Gate 7 (`canonical_schema_and_invariants`) fails; Gate 9 (`no_unrelated_regression`) passes.
     - Validation run evaluates to `status: 'failed'` and `eligibility: 'review_required'`.
  5. **Activation Bypass Refusal (A12, A16):**
     - Direct activation attempt returns 409 `PATCH_NOT_ELIGIBLE` ("Patch is held for human review and cannot be activated automatically; P0 offers no activation bypass for semantic shipping drift").
     - Automated recovery run halts at `validating` stage and transitions to `failed` with code `VALIDATION_FAILED`.
     - Active adapter remains completely unchanged throughout.
  6. **Lease Isolation & Metadata Rejection:**
     - Concurrent access by another project scope throws 409 `DEMO_SCOPE_BUSY`.
     - Metadata-only SDK events or customer claims cannot satisfy the deterministic oracle or release the review hold.
  7. **Operator Dashboard Controls:**
     - Added "Inject Shipping Business Days (`shipping.business-days`)" control in scenario injection panel alongside user rename injection.
  8. **Single-Commit Verification:**
     - 78 vitest tests passing across workspace (`vitest run`).
     - Workspace cleanly built (`pnpm -r run build`).
     - Planning verification script passed (`node scripts/validate-planning.mjs`).
- **Files Modified:**
  - `apps/api/src/services/baseline-service.ts`
  - `apps/api/src/services/incident-service.ts`
  - `apps/api/tests/api.test.ts`
  - `apps/web/src/App.tsx`
  - `.scratch/driftguard/issues/10-shipping-semantic-refusal.md`
  - `log.md`
- **Team Frontier Status:**
  - Tickets completed and closed: 01, 28, 02, 03, 04, 05, 06, 07, 08, 09, 10.
  - Next in line in topological order: **Ticket 29** (`saransh-sh`: "[P0] 29: Issue, rotate, and revoke environment-scoped ingestion keys").

---

## Entry: 2026-10-11 - Ticket 29: Issue rotate and revoke environment-scoped ingestion keys (codex/issue-29-project-ingestion-keys)

- **Date:** 2026-10-11
- **Operator:** `codex` pair programming with `ashudotbuilds`
- **Issue:** [#29](https://github.com/ashudotbuilds/PLAN9/issues/29)
- **Branch:** `codex/issue-29-project-ingestion-keys`
- **Status:** COMPLETED, VERIFIED, AND INTEGRATED into main in single commit per user instruction; Issue #29 closed.
- **Scope:** PRD FR-KEY-01, FR-KEY-02, FR-KEY-03, NFR-08, NFR-20; AT-SDK-01/03. Endpoints A24 (`POST /api/projects/:projectId/keys`), A25 (`POST /api/projects/:projectId/keys/:keyId/rotate`), A26 (`POST /api/projects/:projectId/keys/:keyId/revoke`).
- **Implementation summary:**
  1. **Cryptographic Random Key Issuance & Digest-Only Persistence (FR-KEY-01, NFR-08):**
     - Cryptographic key generation format: `dg_ing_<keyId>.<secret>`, where secret is 32 random bytes in base64url.
     - Persists only SHA-256 digest + safe metadata (`keyId`, `projectId`, `environment`, `prefix`, `status`, `createdAt`, `replacesKeyId`, `label`, `auditEventId`).
     - Fixed-length timing-safe digest comparisons via `timingSafeEqual`.
     - Plaintext secret returned only once upon creation/rotation with `Cache-Control: no-store`.
     - Error messages, audit entries, and project detail listings never return or leak plaintext secret or digest.
  2. **Active Key Limits & Atomic Rotation (FR-KEY-02, NFR-20):**
     - Maximum 3 active keys bound per environment (throws 409 `ACTIVE_KEY_LIMIT_REACHED` if exceeded).
     - Atomic rotation revokes old key and creates replacement, preserving `replacesKeyId`. Rotating an already revoked key throws 409 `KEY_ALREADY_REVOKED`.
  3. **Idempotent Revocation (FR-KEY-02):**
     - Revocation marks key as `revoked` and records `revokedAt`.
     - Repeated revocation returns HTTP 200 with original audit event ID idempotently without emitting duplicate audit events.
  4. **Shared Ingestion Auth Guard (FR-KEY-03, NFR-08):**
     - `requireIngestionAuth` verifies Bearer token digest, active status (401 `REVOKED_INGESTION_KEY`), and project/environment scope match (403 `SCOPE_FORBIDDEN`).
     - Ingestion keys have NO operator, recovery, or provider control privileges.
  5. **Contracts & Operator UI Integration:**
     - Added contract schemas in `@driftguard/contracts` for key issuance, rotation, revocation, and metadata.
     - Extended `ProjectDetailResponseSchema` with `keyMetadata`.
     - Added Ingestion Keys management panel in web UI with copy-once token modal banner, active key list, rotate, and revoke actions.
  6. **Single-Commit Verification:**
     - 85 vitest tests passing across workspace (`vitest run`).
     - Workspace cleanly built (`pnpm -r run build`).
     - Planning verification script passed (`node scripts/validate-planning.mjs`).
- **Files Modified:**
  - `packages/contracts/src/index.ts`
  - `apps/api/src/services/key-service.ts`
  - `apps/api/src/services/project-service.ts`
  - `apps/api/src/app.ts`
  - `apps/web/src/api-client.ts`
  - `apps/web/src/App.tsx`
  - `apps/api/tests/api.test.ts`
  - `.scratch/driftguard/issues/29-project-ingestion-keys.md`
  - `log.md`
- **Team Frontier Status:**
  - Tickets completed and closed: 01, 28, 02, 03, 04, 05, 06, 07, 08, 09, 10, 29.
  - Next in line in topological order: **Ticket 30** (`soumya240806`: "[P0] 30: Dependency Registration and Inventory").
