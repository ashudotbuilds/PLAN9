# Requirement coverage

Source: the 75 explicitly declared requirements in PRD sections 10 and 11. This is a planning coverage map, not a claim of completed implementation or tests. The PRD remains authoritative for acceptance wording. Ticket 13 also verifies PRD sections 7.3, 20, 21, 25, and 27. P2 briefs map to sections 8 and 28 without inventing new requirement IDs.

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
| FR-OBS-06 | [15](issues/15-pagination-drift-detection.md), [16](issues/16-pagination-strategy-repair.md), [17](issues/17-rate-limit-evidence.md) |
| FR-DET-01 | [03](issues/03-inject-and-detect-user-drift.md) |
| FR-DET-02 | [03](issues/03-inject-and-detect-user-drift.md) |
| FR-DET-03 | [03](issues/03-inject-and-detect-user-drift.md) |
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
| NFR-01 | [05](issues/05-bounded-repair-proposal.md) |
| NFR-02 | [05](issues/05-bounded-repair-proposal.md), [13](issues/13-golden-demo-release.md) |
| NFR-03 | [02](issues/02-healthy-baseline-and-lineage.md), [11](issues/11-archive-reset-and-recapture.md) |
| NFR-04 | [12](issues/12-error-evidence-and-bounds.md), [13](issues/13-golden-demo-release.md) |
| NFR-05 | [07](issues/07-activation-replay-and-rollback.md) |
| NFR-06 | [09](issues/09-operational-recovery-dashboard.md) |
| NFR-07 | [12](issues/12-error-evidence-and-bounds.md), [14](issues/14-optional-live-repair-model.md) |
| NFR-08 | [01](issues/01-healthy-demo-startup.md), [12](issues/12-error-evidence-and-bounds.md), [14](issues/14-optional-live-repair-model.md) |
| NFR-09 | [02](issues/02-healthy-baseline-and-lineage.md), [12](issues/12-error-evidence-and-bounds.md) |
| NFR-10 | [09](issues/09-operational-recovery-dashboard.md), [13](issues/13-golden-demo-release.md), [20](issues/20-optional-impact-graph.md) |
| NFR-11 | [01](issues/01-healthy-demo-startup.md) |
| NFR-12 | [01](issues/01-healthy-demo-startup.md) |
| NFR-13 | [12](issues/12-error-evidence-and-bounds.md) |
| NFR-14 | [02](issues/02-healthy-baseline-and-lineage.md), [11](issues/11-archive-reset-and-recapture.md), [12](issues/12-error-evidence-and-bounds.md) |
| NFR-15 | [06](issues/06-shadow-validation-and-policy.md) |
| NFR-16 | [11](issues/11-archive-reset-and-recapture.md), [13](issues/13-golden-demo-release.md) |
| NFR-17 | [08](issues/08-backend-recovery-run.md) |
| NFR-18 | [09](issues/09-operational-recovery-dashboard.md), [20](issues/20-optional-impact-graph.md) |

## Cross-cutting obligations

All relevant slices apply safe input/output validation, immutable evidence, correlation, backend state authority, and meaningful public-seam tests from their first implementation. Ticket 12 verifies these across the completed demo; it is not permission to postpone them. Ticket 01 freezes shared contracts; additive updates require cross-owner coordination.

## Coverage verification

Planned requirements: 75. Mapped requirements: 75. Unmapped: 0. P0/P1 endpoint inventory: 25, each assigned one first implementing ticket. Dependency numbers precede dependent tickets. Re-run coverage and link checks after changing the PRD or ticket breakdown.
