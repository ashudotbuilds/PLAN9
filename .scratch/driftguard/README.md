# DriftGuard feature tickets

Source: [PRD](../../DRIFTGUARD_PRD.md). Planned work, not completed implementation.
41 tickets: 21 P0 slices, 14 optional P1 extensions, 6 deferred P2 briefs.
Ashutosh has 9; Saransh, Anushka, Chandrabhan and Soumya have 8 each. Equal counts do not imply equal effort.

## Ticket index

IDs are preserved; follow blocking edges, not numeric order. Authoring status
`ready-for-agent` does not prove execution readiness. No product ticket is completed;
**01 is the initial frontier**.

| Ticket | Priority | Owner | Blocked by | GitHub |
|---|---|---|---|---|
| [01 — Start a healthy demo across three applications](issues/01-healthy-demo-startup.md) | P0 | `ashudotbuilds` | None | [#1](https://github.com/ashudotbuilds/PLAN9/issues/1) |
| [02 — Capture a healthy baseline and trace workflow reads](issues/02-healthy-baseline-and-lineage.md) | P0 | `saransh-sh` | 01, 28 | [#2](https://github.com/ashudotbuilds/PLAN9/issues/2) |
| [03 — Inject and detect a user field rename](issues/03-inject-and-detect-user-drift.md) | P0 | `ashudotbuilds` | 02 | [#3](https://github.com/ashudotbuilds/PLAN9/issues/3) |
| [04 — Explain affected and unaffected workflows](issues/04-explain-impact.md) | P0 | `saransh-sh` | 03 | [#4](https://github.com/ashudotbuilds/PLAN9/issues/4) |
| [05 — Propose a constrained compatible adapter](issues/05-bounded-repair-proposal.md) | P0 | `saransh-sh` | 04 | [#5](https://github.com/ashudotbuilds/PLAN9/issues/5) |
| [06 — Validate candidate semantics and automatic eligibility](issues/06-shadow-validation-and-policy.md) | P0 | `ashudotbuilds` | 05 | [#6](https://github.com/ashudotbuilds/PLAN9/issues/6) |
| [07 — Activate validated adapters and replay safely](issues/07-activation-replay-and-rollback.md) | P0 | `saransh-sh` | 06 | [#7](https://github.com/ashudotbuilds/PLAN9/issues/7) |
| [08 — Run recovery through one backend command](issues/08-backend-recovery-run.md) | P0 | `ashudotbuilds` | 07 | [#8](https://github.com/ashudotbuilds/PLAN9/issues/8) |
| [09 — Operate and inspect recovery from the dashboard](issues/09-operational-recovery-dashboard.md) | P0 | `AnushkaBhardwaj15` | 08, 28 | [#9](https://github.com/ashudotbuilds/PLAN9/issues/9) |
| [10 — Detect unchanged-schema shipping drift and hold repair](issues/10-shipping-semantic-refusal.md) | P0 | `ashudotbuilds` | 04, 06 | [#10](https://github.com/ashudotbuilds/PLAN9/issues/10) |
| [11 — Reset to a fresh session and preserve completed evidence](issues/11-archive-reset-and-recapture.md) | P0 | `AnushkaBhardwaj15` | 08, 10, 31 | [#11](https://github.com/ashudotbuilds/PLAN9/issues/11) |
| [12 — Keep failures bounded and explainable across the demo](issues/12-error-evidence-and-bounds.md) | P0 | `AnushkaBhardwaj15` | 08, 11, 33 | [#12](https://github.com/ashudotbuilds/PLAN9/issues/12) |
| [13 — Prove and rehearse the complete three-minute demo](issues/13-golden-demo-release.md) | P0 | `soumya240806` | 09, 10, 11, 12, 35 | [#13](https://github.com/ashudotbuilds/PLAN9/issues/13) |
| [14 — Generate proposals through an optional live model](issues/14-optional-live-repair-model.md) | P1 | `saransh-sh` | 13 | [#14](https://github.com/ashudotbuilds/PLAN9/issues/14) |
| [15 — Detect an inventory pagination protocol change](issues/15-pagination-drift-detection.md) | P1 | `soumya240806` | 13 | [#15](https://github.com/ashudotbuilds/PLAN9/issues/15) |
| [16 — Validate an optional bounded pagination strategy](issues/16-pagination-strategy-repair.md) | P1 | `saransh-sh` | 15 | [#16](https://github.com/ashudotbuilds/PLAN9/issues/16) |
| [17 — Detect rate limits and propose safe bounded handling](issues/17-rate-limit-evidence.md) | P1 | `ashudotbuilds` | 13 | [#17](https://github.com/ashudotbuilds/PLAN9/issues/17) |
| [18 — Export a version-consistent evidence passport](issues/18-export-evidence-passport.md) | P1 | `soumya240806` | 13 | [#18](https://github.com/ashudotbuilds/PLAN9/issues/18) |
| [19 — Stream actual recovery events to the dashboard](issues/19-live-event-updates.md) | P1 | `chandrabhan-kushwaha` | 13 | [#19](https://github.com/ashudotbuilds/PLAN9/issues/19) |
| [20 — Add an impact graph only when it improves comprehension](issues/20-optional-impact-graph.md) | P1 | `soumya240806` | 13 | [#20](https://github.com/ashudotbuilds/PLAN9/issues/20) |
| [21 — Extend the adapter DSL with explicitly validated operations](issues/21-extended-adapter-operations.md) | P1 | `AnushkaBhardwaj15` | 13 | [#21](https://github.com/ashudotbuilds/PLAN9/issues/21) |
| [22 — Design an opt-in production compatibility proxy or gateway](issues/22-real-provider-instrumentation.md) | P2 | `chandrabhan-kushwaha` | 13 | [#22](https://github.com/ashudotbuilds/PLAN9/issues/22) |
| [23 — Observe webhook and MCP behavior](issues/23-webhook-and-mcp-adapters.md) | P2 | `soumya240806` | 13 | [#23](https://github.com/ashudotbuilds/PLAN9/issues/23) |
| [24 — Learn statistical baselines from larger traffic samples](issues/24-statistical-behavior-baselines.md) | P2 | `AnushkaBhardwaj15` | 13 | [#24](https://github.com/ashudotbuilds/PLAN9/issues/24) |
| [25 — Stage production activation and connect approval workflows](issues/25-production-canary-and-approvals.md) | P2 | `chandrabhan-kushwaha` | 13 | [#25](https://github.com/ashudotbuilds/PLAN9/issues/25) |
| [26 — Isolate production organizations and enforce tenant policy](issues/26-organization-policy-and-tenancy.md) | P2 | `chandrabhan-kushwaha` | 13 | [#26](https://github.com/ashudotbuilds/PLAN9/issues/26) |
| [27 — Reuse domain probes with privacy-aware sampling](issues/27-privacy-sampling-and-probe-library.md) | P2 | `chandrabhan-kushwaha` | 13 | [#27](https://github.com/ashudotbuilds/PLAN9/issues/27) |
| [28 — Create a scoped local project through operator onboarding](issues/28-local-project-onboarding.md) | P0 | `ashudotbuilds` | 01 | [#28](https://github.com/ashudotbuilds/PLAN9/issues/28) |
| [29 — Issue rotate and revoke environment-scoped ingestion keys](issues/29-project-ingestion-keys.md) | P0 | `saransh-sh` | 28 | [#29](https://github.com/ashudotbuilds/PLAN9/issues/29) |
| [30 — Register dependencies and inspect evidence-backed scoped inventory](issues/30-dependency-registration-inventory.md) | P0 | `ashudotbuilds` | 29 | [#30](https://github.com/ashudotbuilds/PLAN9/issues/30) |
| [31 — Ingest scoped SDK evidence through the existing detector](issues/31-sdk-observation-ingestion.md) | P0 | `saransh-sh` | 30, 03 | [#31](https://github.com/ashudotbuilds/PLAN9/issues/31) |
| [32 — Connect the Node SDK and sample through real metadata ingestion](issues/32-node-sdk-sample.md) | P0 | `chandrabhan-kushwaha` | 31 | [#32](https://github.com/ashudotbuilds/PLAN9/issues/32) |
| [33 — Prove bounded private SDK delivery and opt-in fixture evidence](issues/33-sdk-privacy-failure-isolation.md) | P0 | `chandrabhan-kushwaha` | 32 | [#33](https://github.com/ashudotbuilds/PLAN9/issues/33) |
| [34 — Operate SDK setup keys inventory and diagnostics from the dashboard](issues/34-sdk-onboarding-dashboard.md) | P0 | `AnushkaBhardwaj15` | 09, 30, 33 | [#34](https://github.com/ashudotbuilds/PLAN9/issues/34) |
| [35 — Verify connected SDK security and both recovery scenarios together](issues/35-connected-demo-acceptance.md) | P0 | `AnushkaBhardwaj15` | 10, 11, 12, 33, 34 | [#35](https://github.com/ashudotbuilds/PLAN9/issues/35) |
| [36 — Instrument one explicitly supported HTTP client](issues/36-supported-http-instrumentation.md) | P1 | `chandrabhan-kushwaha` | 13 | [#36](https://github.com/ashudotbuilds/PLAN9/issues/36) |
| [37 — Poll only explicitly approved safe dependency endpoints](issues/37-safe-configured-polling.md) | P1 | `ashudotbuilds` | 13 | [#37](https://github.com/ashudotbuilds/PLAN9/issues/37) |
| [38 — Compare a bounded local OpenAPI import with observed behavior](issues/38-local-openapi-comparison.md) | P1 | `soumya240806` | 13 | [#38](https://github.com/ashudotbuilds/PLAN9/issues/38) |
| [39 — Attach explicit package version metadata to registered integrations](issues/39-package-version-metadata.md) | P1 | `soumya240806` | 13 | [#39](https://github.com/ashudotbuilds/PLAN9/issues/39) |
| [40 — Observe authorized public identity-provider metadata](issues/40-public-auth-provider-metadata.md) | P1 | `AnushkaBhardwaj15` | 13, 37 | [#40](https://github.com/ashudotbuilds/PLAN9/issues/40) |
| [41 — Demonstrate one authorized mock MCP tool-schema change](issues/41-mock-mcp-dependency-fixture.md) | P1 | `soumya240806` | 13 | [#41](https://github.com/ashudotbuilds/PLAN9/issues/41) |

## Build order and release gates

- Bootstrap: 01 → 28. Recovery: 02 → 03 → 04 → 05 → 06 → 07 → 08.
- SDK: 28 → 29 → 30 → 31 (also 03) → 32 → 33.
- Dashboard 09 needs 08/28; shipping refusal 10 needs 04/06.
- Reset 11 needs 08/10/31; hardening 12 needs 08/11/33.
- Onboarding 34 needs 09/30/33; connected acceptance 35 needs 10/11/12/33/34.
- Combined release 13 needs 09/10/11/12/35 and proves PRD 21 and 21.1.
- All optional work is transitively gated on 13; 16 also needs 15, and 40 needs 37.

Prepare fixtures and contract agreements in parallel, but completion requires integrated
prerequisites. Basic security/bounds belong in their first slice; 12/33 verify them.
Drop optional scope if P0 slips and freeze features at H19. P1 polling/import tickets
freeze additive API contracts and update PRD/catalog before new endpoints. P2 requires design/threat review.

## Supporting documents

- [API catalog](API_CATALOG.md): 37 planned route contracts.
- [Requirement coverage](REQUIREMENT_COVERAGE.md): 97 requirements and 17 SDK gates.
- [Team policy](../../agent.md): identity, one-ticket workflow, verification and post-push logging.
- [Contribution guide](../../CONTRIBUTING.md): scoped implementation start.

Read the live assigned issue, verify blockers and execute one eligible ticket per run.
Keep unexecuted checkboxes unchecked. FR-REP-07/08 remains authoritative. Ticket creation
and planning validation never prove application behavior or production readiness.
