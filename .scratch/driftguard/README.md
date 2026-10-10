# DriftGuard feature tickets

Source: [DRIFTGUARD_PRD.md](../../DRIFTGUARD_PRD.md). Local tracker requested by the user; one feature slice per file. These are planned work, not implemented features. Ticket creation does not publish GitHub issues or run application implementation.

27 tickets: 13 P0 demo slices, 8 optional P1 extensions, and 6 deferred P2 feature briefs. P0/P1 tickets use ready-for-agent as their authoring status; only tickets whose blockers are complete are executable. P2 requires further scope definition. No blockers are currently recorded complete, so ticket 01 is the initial frontier.

## Feature breakdown

1. [Start a healthy demo across three applications](issues/01-healthy-demo-startup.md) (P0). **Blocked by:** none. **Delivers:** An operator starts the web app, control plane, and three simulated dependencies with one documented command and sees their actual readiness.

2. [Capture a healthy baseline and trace workflow reads](issues/02-healthy-baseline-and-lineage.md) (P0). **Blocked by:** 01. **Delivers:** An operator captures actual provider responses and workflow results into a versioned baseline, with evidence showing which canonical fields each workflow read.

3. [Inject and detect a user field rename](issues/03-inject-and-detect-user-drift.md) (P0). **Blocked by:** 02. **Delivers:** An operator injects users.field-rename and sees a deduplicated incident supported by before/after HTTP evidence across three identities.

4. [Explain affected and unaffected workflows](issues/04-explain-impact.md) (P0). **Blocked by:** 03. **Delivers:** A judge follows the changed provider field through its canonical mapping to only the workflows that actually consumed it.

5. [Propose a constrained compatible adapter](issues/05-bounded-repair-proposal.md) (P0). **Blocked by:** 04. **Delivers:** An operator requests a proposal and sees a typed, evidence-backed mapping that works with either old or renamed provider data.

6. [Validate candidate semantics and automatic eligibility](issues/06-shadow-validation-and-policy.md) (P0). **Blocked by:** 05. **Delivers:** A judge sees an isolated candidate preserve baseline workflow outcomes before any activation is possible.

7. [Activate validated adapters and replay safely](issues/07-activation-replay-and-rollback.md) (P0). **Blocked by:** 06. **Delivers:** An operator activates a proven adapter, sees real workflow recovery, and can restore the recorded parent version.

8. [Run recovery through one backend command](issues/08-backend-recovery-run.md) (P0). **Blocked by:** 07. **Delivers:** One operator command executes impact, proposal, validation, activation, replay, and any required rollback while exposing pollable progress.

9. [Operate and inspect recovery from the dashboard](issues/09-operational-recovery-dashboard.md) (P0). **Blocked by:** 08. **Delivers:** A judge runs safe recovery and inspects evidence, impact, patch, checks, and results within one coherent dashboard.

10. [Detect unchanged-schema shipping drift and hold repair](issues/10-shipping-semantic-refusal.md) (P0). **Blocked by:** 04, 06. **Delivers:** An operator sees a shipping meaning change detected by an approved canary and understands why automatic repair is held.

11. [Reset to a fresh session and preserve completed evidence](issues/11-archive-reset-and-recapture.md) (P0). **Blocked by:** 08, 10. **Delivers:** An operator resets the demo, retains the completed session audit, and captures a new healthy baseline without restarting processes.

12. [Keep failures bounded and explainable across the demo](issues/12-error-evidence-and-bounds.md) (P0). **Blocked by:** 08, 11. **Delivers:** Operators get useful evidence and stable errors even when a provider, model, or recovery stage fails.

13. [Prove and rehearse the complete three-minute demo](issues/13-golden-demo-release.md) (P0). **Blocked by:** 09, 10, 11, 12. **Delivers:** A teammate starts the project from documented setup and completes two repeatable judge demos with executed evidence.

14. [Generate proposals through an optional live model](issues/14-optional-live-repair-model.md) (P1). **Blocked by:** 13. **Delivers:** An operator optionally selects live proposal generation while the same evidence, DSL, and safety policy remain authoritative.

15. [Detect an inventory pagination protocol change](issues/15-pagination-drift-detection.md) (P1). **Blocked by:** 13. **Delivers:** An operator switches inventory from page-number to cursor responses and sees a behavior finding with only inventory_sync affected.

16. [Validate an optional bounded pagination strategy](issues/16-pagination-strategy-repair.md) (P1). **Blocked by:** 15. **Delivers:** An operator reviews a bounded pagination strategy and proves that inventory synchronization retrieves the exact expected item set once.

17. [Detect rate limits and propose safe bounded handling](issues/17-rate-limit-evidence.md) (P1). **Blocked by:** 13. **Delivers:** An operator sees new 429 behavior and a retry recommendation that respects replay risk.

18. [Export a version-consistent evidence passport](issues/18-export-evidence-passport.md) (P1). **Blocked by:** 13. **Delivers:** An operator downloads one incident's complete evidence and decisions for a judge or teammate.

19. [Stream actual recovery events to the dashboard](issues/19-live-event-updates.md) (P1). **Blocked by:** 13. **Delivers:** An operator sees incident and recovery progress update from actual server events while polling remains a fallback.

20. [Add an impact graph only when it improves comprehension](issues/20-optional-impact-graph.md) (P1). **Blocked by:** 13. **Delivers:** A judge can optionally explore a larger dependency graph while preserving the clear causal impact trace.

21. [Extend the adapter DSL with explicitly validated operations](issues/21-extended-adapter-operations.md) (P1). **Blocked by:** 13. **Delivers:** After the golden demo is stable, assess and implement a narrowly approved extension such as copy, default, enum_map, or bounded cast with independent semantic tests.

22. [Observe real providers through a proxy or SDK](issues/22-real-provider-instrumentation.md) (P2). **Blocked by:** 13. **Delivers:** Route approved sandbox traffic through explicit proxy or SDK instrumentation, preserving correlation, redaction, and observed behavior.

23. [Observe webhook and MCP behavior](issues/23-webhook-and-mcp-adapters.md) (P2). **Blocked by:** 13. **Delivers:** Extend observation to webhook payloads and MCP tool outcomes using the same evidence and validation vocabulary.

24. [Learn statistical baselines from larger traffic samples](issues/24-statistical-behavior-baselines.md) (P2). **Blocked by:** 13. **Delivers:** Detect meaningful population changes in presence, ordering, latency, and rates while keeping deterministic scenario evidence available.

25. [Stage production activation and connect approval workflows](issues/25-production-canary-and-approvals.md) (P2). **Blocked by:** 13. **Delivers:** Roll a validated adapter through bounded canary traffic with an approval workflow and automatic rollback.

26. [Isolate organizations and enforce scoped policy](issues/26-organization-policy-and-tenancy.md) (P2). **Blocked by:** 13. **Delivers:** Give separate organizations isolated provider evidence, policies, adapters, and audit access.

27. [Reuse domain probes with privacy-aware sampling](issues/27-privacy-sampling-and-probe-library.md) (P2). **Blocked by:** 13. **Delivers:** Use reusable approved probe libraries and bounded traffic sampling to gather semantic evidence for real domains.

## Build order and parallel work

The initial sequence is 01 -> 02 -> 03 -> 04 -> 05 -> 06 -> 07 -> 08. Ticket 10 can start alongside 07 after 04 and 06 pass. After 08, ticket 09 can proceed while 11 completes once 10 is available. Ticket 12 hardens completed paths and must not delay applying basic correlation, redaction, bounds, and error contracts in the first owning ticket. Ticket 13 closes the complete demonstration.

Ticket 09 finishes cross-dashboard composition and accessibility; earlier slices each include their own small UI action or evidence view, so visual delivery begins before 09. Owners can prepare mocks, fixtures, and contract tests before a blocker lands, but completion claims require integration with completed blockers.

P1 tickets declare 13 as a release gate to protect the 24-hour demo. This is a scheduling gate, not a claim that every P1 implementation technically depends on rehearsal. Start optional work only when P0 is stable and the remaining hackathon window allows it. Ticket 16 additionally depends on 15 because its evidence and protocol contract are required. Freeze features at hour 19.

## Supporting documents

- [API catalog](API_CATALOG.md): all 19 control-plane and 6 simulator endpoints, inputs, results, errors, consumers, and owning tickets.
- [Requirement coverage](REQUIREMENT_COVERAGE.md): all 75 declared functional/non-functional requirements mapped to tickets.

## Ticket working agreement

Read the referenced PRD requirements before implementation. PRD FR-REP-07/08 remains the policy source of truth. Work the frontier, use one fresh context per ticket, and retain backend-confirmed evidence. Keep incomplete acceptance checkboxes unchecked. Record intentional deviations against the PRD instead of silently widening scope.

The concrete breakdown is saved for review as requested. Granularity and blocking edges can be adjusted in these local files without restarting the planning process.
