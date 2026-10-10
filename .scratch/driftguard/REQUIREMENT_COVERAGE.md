# Requirement coverage

Source: PRD sections 10/11 and 21.1. All 97 declared requirements are mapped.
Planning traceability is not executed tests or completed features. Production requirements
are deferred release gates, not loopback-demo claims.

| Requirement | Implementing or verifying tickets |
|---|---|
| FR-SIM-01 | [01](issues/01-healthy-demo-startup.md) |
| FR-SIM-02 | [03](issues/03-inject-and-detect-user-drift.md) |
| FR-SIM-03 | [03](issues/03-inject-and-detect-user-drift.md), [10](issues/10-shipping-semantic-refusal.md) |
| FR-SIM-04 | [11](issues/11-archive-reset-and-recapture.md) |
| FR-SIM-05 | [15](issues/15-pagination-drift-detection.md), [16](issues/16-pagination-strategy-repair.md) |
| FR-SIM-06 | [17](issues/17-rate-limit-evidence.md) |
| FR-OBS-01 | [02](issues/02-healthy-baseline-and-lineage.md) |
| FR-OBS-02 | [02](issues/02-healthy-baseline-and-lineage.md) |
| FR-OBS-03 | [02](issues/02-healthy-baseline-and-lineage.md) |
| FR-OBS-04 | [10](issues/10-shipping-semantic-refusal.md) |
| FR-OBS-05 | [02](issues/02-healthy-baseline-and-lineage.md) |
| FR-OBS-06 | [15](issues/15-pagination-drift-detection.md), [16](issues/16-pagination-strategy-repair.md), [17](issues/17-rate-limit-evidence.md), [24](issues/24-statistical-behavior-baselines.md) |
| FR-DET-01 | [03](issues/03-inject-and-detect-user-drift.md) |
| FR-DET-02 | [03](issues/03-inject-and-detect-user-drift.md) |
| FR-DET-03 | [03](issues/03-inject-and-detect-user-drift.md), [31](issues/31-sdk-observation-ingestion.md) |
| FR-DET-04 | [10](issues/10-shipping-semantic-refusal.md) |
| FR-DET-05 | [03](issues/03-inject-and-detect-user-drift.md) |
| FR-DET-06 | [15](issues/15-pagination-drift-detection.md), [16](issues/16-pagination-strategy-repair.md), [17](issues/17-rate-limit-evidence.md) |
| FR-IMP-01 | [02](issues/02-healthy-baseline-and-lineage.md) |
| FR-IMP-02 | [02](issues/02-healthy-baseline-and-lineage.md) |
| FR-IMP-03 | [04](issues/04-explain-impact.md) |
| FR-IMP-04 | [04](issues/04-explain-impact.md) |
| FR-IMP-05 | [04](issues/04-explain-impact.md) |
| FR-REP-01 | [05](issues/05-bounded-repair-proposal.md) |
| FR-REP-02 | [05](issues/05-bounded-repair-proposal.md), [14](issues/14-optional-live-repair-model.md) |
| FR-REP-03 | [05](issues/05-bounded-repair-proposal.md), [21](issues/21-extended-adapter-operations.md) |
| FR-REP-04 | [05](issues/05-bounded-repair-proposal.md), [14](issues/14-optional-live-repair-model.md) |
| FR-REP-05 | [06](issues/06-shadow-validation-and-policy.md), [10](issues/10-shipping-semantic-refusal.md) |
| FR-REP-06 | [05](issues/05-bounded-repair-proposal.md), [14](issues/14-optional-live-repair-model.md) |
| FR-REP-07 | [06](issues/06-shadow-validation-and-policy.md), [21](issues/21-extended-adapter-operations.md) |
| FR-REP-08 | [06](issues/06-shadow-validation-and-policy.md), [10](issues/10-shipping-semantic-refusal.md), [21](issues/21-extended-adapter-operations.md) |
| FR-VAL-01 | [06](issues/06-shadow-validation-and-policy.md) |
| FR-VAL-02 | [06](issues/06-shadow-validation-and-policy.md) |
| FR-VAL-03 | [06](issues/06-shadow-validation-and-policy.md) |
| FR-VAL-04 | [06](issues/06-shadow-validation-and-policy.md) |
| FR-VAL-05 | [06](issues/06-shadow-validation-and-policy.md), [07](issues/07-activation-replay-and-rollback.md) |
| FR-VAL-06 | [07](issues/07-activation-replay-and-rollback.md) |
| FR-VAL-07 | [06](issues/06-shadow-validation-and-policy.md), [16](issues/16-pagination-strategy-repair.md) |
| FR-VAL-08 | [07](issues/07-activation-replay-and-rollback.md) |
| FR-VAL-09 | [08](issues/08-backend-recovery-run.md) |
| FR-REC-01 | [08](issues/08-backend-recovery-run.md) |
| FR-REC-02 | [08](issues/08-backend-recovery-run.md) |
| FR-REC-03 | [08](issues/08-backend-recovery-run.md) |
| FR-REC-04 | [08](issues/08-backend-recovery-run.md) |
| FR-UI-01 | [09](issues/09-operational-recovery-dashboard.md) |
| FR-UI-02 | [09](issues/09-operational-recovery-dashboard.md) |
| FR-UI-03 | [03](issues/03-inject-and-detect-user-drift.md) |
| FR-UI-04 | [04](issues/04-explain-impact.md), [20](issues/20-optional-impact-graph.md) |
| FR-UI-05 | [09](issues/09-operational-recovery-dashboard.md) |
| FR-UI-06 | [09](issues/09-operational-recovery-dashboard.md) |
| FR-UI-07 | [09](issues/09-operational-recovery-dashboard.md) |
| FR-UI-08 | [19](issues/19-live-event-updates.md) |
| FR-UI-09 | [09](issues/09-operational-recovery-dashboard.md), [20](issues/20-optional-impact-graph.md) |
| FR-OPS-01 | [07](issues/07-activation-replay-and-rollback.md), [12](issues/12-error-evidence-and-bounds.md) |
| FR-OPS-02 | [01](issues/01-healthy-demo-startup.md) |
| FR-OPS-03 | [01](issues/01-healthy-demo-startup.md), [13](issues/13-golden-demo-release.md) |
| FR-OPS-04 | [18](issues/18-export-evidence-passport.md) |
| FR-PRJ-01 | [28](issues/28-local-project-onboarding.md), [30](issues/30-dependency-registration-inventory.md) |
| FR-KEY-01 | [29](issues/29-project-ingestion-keys.md), [34](issues/34-sdk-onboarding-dashboard.md) |
| FR-KEY-02 | [29](issues/29-project-ingestion-keys.md), [34](issues/34-sdk-onboarding-dashboard.md) |
| FR-KEY-03 | [28](issues/28-local-project-onboarding.md), [29](issues/29-project-ingestion-keys.md) |
| FR-SDK-01 | [13](issues/13-golden-demo-release.md), [32](issues/32-node-sdk-sample.md), [35](issues/35-connected-demo-acceptance.md), [36](issues/36-supported-http-instrumentation.md) |
| FR-SDK-02 | [32](issues/32-node-sdk-sample.md), [33](issues/33-sdk-privacy-failure-isolation.md) |
| FR-SDK-03 | [33](issues/33-sdk-privacy-failure-isolation.md), [35](issues/35-connected-demo-acceptance.md), [36](issues/36-supported-http-instrumentation.md) |
| FR-ING-01 | [31](issues/31-sdk-observation-ingestion.md), [35](issues/35-connected-demo-acceptance.md) |
| FR-ING-02 | [02](issues/02-healthy-baseline-and-lineage.md), [11](issues/11-archive-reset-and-recapture.md), [31](issues/31-sdk-observation-ingestion.md), [33](issues/33-sdk-privacy-failure-isolation.md), [35](issues/35-connected-demo-acceptance.md) |
| FR-INV-01 | [30](issues/30-dependency-registration-inventory.md), [32](issues/32-node-sdk-sample.md) |
| FR-INV-02 | [30](issues/30-dependency-registration-inventory.md), [31](issues/31-sdk-observation-ingestion.md), [32](issues/32-node-sdk-sample.md), [34](issues/34-sdk-onboarding-dashboard.md), [39](issues/39-package-version-metadata.md), [40](issues/40-public-auth-provider-metadata.md) |
| FR-LIN-01 | [02](issues/02-healthy-baseline-and-lineage.md), [04](issues/04-explain-impact.md), [05](issues/05-bounded-repair-proposal.md), [06](issues/06-shadow-validation-and-policy.md), [09](issues/09-operational-recovery-dashboard.md), [11](issues/11-archive-reset-and-recapture.md), [15](issues/15-pagination-drift-detection.md), [18](issues/18-export-evidence-passport.md), [20](issues/20-optional-impact-graph.md), [30](issues/30-dependency-registration-inventory.md), [34](issues/34-sdk-onboarding-dashboard.md), [35](issues/35-connected-demo-acceptance.md), [41](issues/41-mock-mcp-dependency-fixture.md) |
| FR-MON-01 | [02](issues/02-healthy-baseline-and-lineage.md), [03](issues/03-inject-and-detect-user-drift.md), [04](issues/04-explain-impact.md), [05](issues/05-bounded-repair-proposal.md), [09](issues/09-operational-recovery-dashboard.md), [10](issues/10-shipping-semantic-refusal.md), [14](issues/14-optional-live-repair-model.md), [15](issues/15-pagination-drift-detection.md), [17](issues/17-rate-limit-evidence.md), [18](issues/18-export-evidence-passport.md), [24](issues/24-statistical-behavior-baselines.md), [31](issues/31-sdk-observation-ingestion.md), [35](issues/35-connected-demo-acceptance.md), [37](issues/37-safe-configured-polling.md), [38](issues/38-local-openapi-comparison.md), [39](issues/39-package-version-metadata.md), [40](issues/40-public-auth-provider-metadata.md), [41](issues/41-mock-mcp-dependency-fixture.md) |
| FR-UI-10 | [13](issues/13-golden-demo-release.md), [34](issues/34-sdk-onboarding-dashboard.md) |
| FR-DIS-01 | [36](issues/36-supported-http-instrumentation.md), [37](issues/37-safe-configured-polling.md), [38](issues/38-local-openapi-comparison.md) |
| FR-DIS-02 | [39](issues/39-package-version-metadata.md), [40](issues/40-public-auth-provider-metadata.md), [41](issues/41-mock-mcp-dependency-fixture.md) |
| FR-DIS-03 | [22](issues/22-real-provider-instrumentation.md), [23](issues/23-webhook-and-mcp-adapters.md), [27](issues/27-privacy-sampling-and-probe-library.md) |
| NFR-01 | [05](issues/05-bounded-repair-proposal.md) |
| NFR-02 | [05](issues/05-bounded-repair-proposal.md), [13](issues/13-golden-demo-release.md) |
| NFR-03 | [02](issues/02-healthy-baseline-and-lineage.md), [11](issues/11-archive-reset-and-recapture.md) |
| NFR-04 | [12](issues/12-error-evidence-and-bounds.md), [13](issues/13-golden-demo-release.md) |
| NFR-05 | [07](issues/07-activation-replay-and-rollback.md) |
| NFR-06 | [09](issues/09-operational-recovery-dashboard.md) |
| NFR-07 | [12](issues/12-error-evidence-and-bounds.md), [14](issues/14-optional-live-repair-model.md) |
| NFR-08 | [01](issues/01-healthy-demo-startup.md), [09](issues/09-operational-recovery-dashboard.md), [12](issues/12-error-evidence-and-bounds.md), [14](issues/14-optional-live-repair-model.md), [28](issues/28-local-project-onboarding.md), [29](issues/29-project-ingestion-keys.md) |
| NFR-09 | [02](issues/02-healthy-baseline-and-lineage.md), [12](issues/12-error-evidence-and-bounds.md) |
| NFR-10 | [09](issues/09-operational-recovery-dashboard.md), [13](issues/13-golden-demo-release.md), [20](issues/20-optional-impact-graph.md), [34](issues/34-sdk-onboarding-dashboard.md) |
| NFR-11 | [01](issues/01-healthy-demo-startup.md) |
| NFR-12 | [01](issues/01-healthy-demo-startup.md) |
| NFR-13 | [12](issues/12-error-evidence-and-bounds.md) |
| NFR-14 | [02](issues/02-healthy-baseline-and-lineage.md), [11](issues/11-archive-reset-and-recapture.md), [12](issues/12-error-evidence-and-bounds.md) |
| NFR-15 | [06](issues/06-shadow-validation-and-policy.md) |
| NFR-16 | [11](issues/11-archive-reset-and-recapture.md), [13](issues/13-golden-demo-release.md) |
| NFR-17 | [08](issues/08-backend-recovery-run.md) |
| NFR-18 | [09](issues/09-operational-recovery-dashboard.md), [20](issues/20-optional-impact-graph.md), [34](issues/34-sdk-onboarding-dashboard.md) |
| NFR-19 | [12](issues/12-error-evidence-and-bounds.md), [13](issues/13-golden-demo-release.md), [17](issues/17-rate-limit-evidence.md), [32](issues/32-node-sdk-sample.md), [33](issues/33-sdk-privacy-failure-isolation.md), [35](issues/35-connected-demo-acceptance.md), [36](issues/36-supported-http-instrumentation.md) |
| NFR-20 | [01](issues/01-healthy-demo-startup.md), [03](issues/03-inject-and-detect-user-drift.md), [06](issues/06-shadow-validation-and-policy.md), [07](issues/07-activation-replay-and-rollback.md), [08](issues/08-backend-recovery-run.md), [10](issues/10-shipping-semantic-refusal.md), [11](issues/11-archive-reset-and-recapture.md), [12](issues/12-error-evidence-and-bounds.md), [13](issues/13-golden-demo-release.md), [16](issues/16-pagination-strategy-repair.md), [18](issues/18-export-evidence-passport.md), [19](issues/19-live-event-updates.md), [21](issues/21-extended-adapter-operations.md), [28](issues/28-local-project-onboarding.md), [29](issues/29-project-ingestion-keys.md), [30](issues/30-dependency-registration-inventory.md), [31](issues/31-sdk-observation-ingestion.md), [35](issues/35-connected-demo-acceptance.md) |
| NFR-21 | [02](issues/02-healthy-baseline-and-lineage.md), [05](issues/05-bounded-repair-proposal.md), [12](issues/12-error-evidence-and-bounds.md), [13](issues/13-golden-demo-release.md), [14](issues/14-optional-live-repair-model.md), [18](issues/18-export-evidence-passport.md), [27](issues/27-privacy-sampling-and-probe-library.md), [32](issues/32-node-sdk-sample.md), [33](issues/33-sdk-privacy-failure-isolation.md), [34](issues/34-sdk-onboarding-dashboard.md), [35](issues/35-connected-demo-acceptance.md), [36](issues/36-supported-http-instrumentation.md), [38](issues/38-local-openapi-comparison.md), [40](issues/40-public-auth-provider-metadata.md) |
| NFR-22 | [02](issues/02-healthy-baseline-and-lineage.md), [11](issues/11-archive-reset-and-recapture.md), [12](issues/12-error-evidence-and-bounds.md), [13](issues/13-golden-demo-release.md), [27](issues/27-privacy-sampling-and-probe-library.md), [30](issues/30-dependency-registration-inventory.md), [31](issues/31-sdk-observation-ingestion.md), [33](issues/33-sdk-privacy-failure-isolation.md), [35](issues/35-connected-demo-acceptance.md), [37](issues/37-safe-configured-polling.md), [38](issues/38-local-openapi-comparison.md) |
| NFR-23 | [01](issues/01-healthy-demo-startup.md), [12](issues/12-error-evidence-and-bounds.md), [13](issues/13-golden-demo-release.md), [22](issues/22-real-provider-instrumentation.md), [23](issues/23-webhook-and-mcp-adapters.md), [24](issues/24-statistical-behavior-baselines.md), [25](issues/25-production-canary-and-approvals.md), [26](issues/26-organization-policy-and-tenancy.md), [27](issues/27-privacy-sampling-and-probe-library.md), [37](issues/37-safe-configured-polling.md), [40](issues/40-public-auth-provider-metadata.md) |

## Connected SDK acceptance

Ticket 35 executes every AT-SDK-01 through AT-SDK-17; ticket 13 rehearses the combined release.
Owning slices supply evidence before integration.

| Acceptance gate | Owning slices and final verification |
|---|---|
| AT-SDK-01 | [28](issues/28-local-project-onboarding.md), [29](issues/29-project-ingestion-keys.md), [34](issues/34-sdk-onboarding-dashboard.md), [35](issues/35-connected-demo-acceptance.md), [13](issues/13-golden-demo-release.md) |
| AT-SDK-02 | [30](issues/30-dependency-registration-inventory.md), [31](issues/31-sdk-observation-ingestion.md), [32](issues/32-node-sdk-sample.md), [35](issues/35-connected-demo-acceptance.md), [13](issues/13-golden-demo-release.md) |
| AT-SDK-03 | [28](issues/28-local-project-onboarding.md), [29](issues/29-project-ingestion-keys.md), [31](issues/31-sdk-observation-ingestion.md), [35](issues/35-connected-demo-acceptance.md), [13](issues/13-golden-demo-release.md) |
| AT-SDK-04 | [32](issues/32-node-sdk-sample.md), [35](issues/35-connected-demo-acceptance.md), [13](issues/13-golden-demo-release.md) |
| AT-SDK-05 | [31](issues/31-sdk-observation-ingestion.md), [33](issues/33-sdk-privacy-failure-isolation.md), [35](issues/35-connected-demo-acceptance.md), [13](issues/13-golden-demo-release.md) |
| AT-SDK-06 | [32](issues/32-node-sdk-sample.md), [33](issues/33-sdk-privacy-failure-isolation.md), [35](issues/35-connected-demo-acceptance.md), [13](issues/13-golden-demo-release.md) |
| AT-SDK-07 | [30](issues/30-dependency-registration-inventory.md), [31](issues/31-sdk-observation-ingestion.md), [35](issues/35-connected-demo-acceptance.md), [13](issues/13-golden-demo-release.md) |
| AT-SDK-08 | [30](issues/30-dependency-registration-inventory.md), [34](issues/34-sdk-onboarding-dashboard.md), [35](issues/35-connected-demo-acceptance.md), [13](issues/13-golden-demo-release.md) |
| AT-SDK-09 | [02](issues/02-healthy-baseline-and-lineage.md), [31](issues/31-sdk-observation-ingestion.md), [35](issues/35-connected-demo-acceptance.md), [13](issues/13-golden-demo-release.md) |
| AT-SDK-10 | [03](issues/03-inject-and-detect-user-drift.md), [31](issues/31-sdk-observation-ingestion.md), [33](issues/33-sdk-privacy-failure-isolation.md), [35](issues/35-connected-demo-acceptance.md), [13](issues/13-golden-demo-release.md) |
| AT-SDK-11 | [04](issues/04-explain-impact.md), [09](issues/09-operational-recovery-dashboard.md), [35](issues/35-connected-demo-acceptance.md), [13](issues/13-golden-demo-release.md) |
| AT-SDK-12 | [06](issues/06-shadow-validation-and-policy.md), [07](issues/07-activation-replay-and-rollback.md), [08](issues/08-backend-recovery-run.md), [35](issues/35-connected-demo-acceptance.md), [13](issues/13-golden-demo-release.md) |
| AT-SDK-13 | [10](issues/10-shipping-semantic-refusal.md), [35](issues/35-connected-demo-acceptance.md), [13](issues/13-golden-demo-release.md) |
| AT-SDK-14 | [06](issues/06-shadow-validation-and-policy.md), [07](issues/07-activation-replay-and-rollback.md), [35](issues/35-connected-demo-acceptance.md), [13](issues/13-golden-demo-release.md) |
| AT-SDK-15 | [07](issues/07-activation-replay-and-rollback.md), [11](issues/11-archive-reset-and-recapture.md), [31](issues/31-sdk-observation-ingestion.md), [35](issues/35-connected-demo-acceptance.md), [13](issues/13-golden-demo-release.md) |
| AT-SDK-16 | [05](issues/05-bounded-repair-proposal.md), [12](issues/12-error-evidence-and-bounds.md), [35](issues/35-connected-demo-acceptance.md), [13](issues/13-golden-demo-release.md) |
| AT-SDK-17 | [12](issues/12-error-evidence-and-bounds.md), [33](issues/33-sdk-privacy-failure-isolation.md), [35](issues/35-connected-demo-acceptance.md), [13](issues/13-golden-demo-release.md) |

Both original PRD 21 scenarios stay mandatory. SDK evidence never lowers the recovery gate.
