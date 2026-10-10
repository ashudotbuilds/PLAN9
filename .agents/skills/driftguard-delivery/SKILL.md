---
name: driftguard-delivery
description: Implement or verify DriftGuard observation, detection, lineage, repair, validation, recovery-run, rollback, semantic-canary, or demo behavior.
---

# DriftGuard Delivery

Read `DRIFTGUARD_PRD.md` for product contracts and acceptance criteria, then `AGENTS.md` for execution and safety policy. Keep decisions authoritative there; this skill defines the delivery loop.

## Start from evidence

1. Identify the relevant PRD requirement IDs and exact acceptance criteria.
2. Inspect the current repository state and the real public seams involved.
3. State the smallest vertical slice that produces observable evidence.
4. List the scenarios that will prove or falsify the behavior.

Completion: every planned edit maps to a requirement, seam, and test scenario.

## Bind the safety policy

1. Treat PRD requirements `FR-REP-07` and `FR-REP-08`, plus the `AGENTS.md` non-negotiable product invariants, as an executable checklist.
2. Map each state-changing step to its validating evidence and resulting audit record.
3. Use the PRD incident and recovery-run state machines exactly; do not invent transitions for convenience.

Completion: every relevant policy item has a check, test, or explicit not-applicable reason.

## Orchestrate recovery in the backend

- The API creates a `RecoveryRun` for the PRD recovery endpoint and returns immediately with its identifier.
- A backend service advances impact, proposal, validation, activation, replay, and rollback stages.
- The web app polls the recovery-run endpoint and renders backend state; it does not chain stages.
- Evaluate and record every `FR-REP-07` result before activation.
- A policy hold updates the incident as specified by the PRD. An infrastructure failure fails only the run and leaves the incident at its last valid state.

Completion: run state, incident state, and audit evidence remain distinct and reconstruct the attempted recovery.

## Build in recovery order

Prefer this sequence unless the task is narrower:

1. Define or reuse contracts and fixtures.
2. Make the mock provider expose the behavior over HTTP.
3. Capture and normalize the observation.
4. Detect and classify the change.
5. Resolve provider behavior to canonical fields and affected workflows.
6. Generate a typed proposal through the labelled deterministic fallback or optional live `RepairModel` implementation.
7. Apply the candidate in the isolated adapter runtime.
8. Replay fixtures and affected workflow invariants.
9. Apply the complete automatic recovery gate.
10. Activate the exact validated version and replay the workflow.
11. Record recovery-run and incident evidence; roll back on a failed live replay.

Completion: the real flow crosses the same boundaries shown in the UI; no stage is a hard-coded success.

## Test the claim

At minimum, select applicable cases from this set:

- Known-good baseline
- Expected structural or behavioral drift
- Volatile-field normalization
- Duplicate observation and incident deduplication
- Correct affected workflows and unrelated-workflow exclusion
- Invalid model output and unavailable model
- Unsupported DSL operation or unknown path
- Any failed automatic-recovery gate
- Candidate invariant failure
- Activation before validation
- Patch modification after validation
- Ambiguous semantics and conflicting evidence
- Infrastructure failure with the incident left at its last valid state
- Post-activation replay failure with automatic rollback
- Reset repeatability

Use fixture-driven unit tests for packages, Fastify injection for API contracts, mocked API-client tests for React, and real HTTP between the golden integration test and mock-provider process.

Completion: the narrow test, relevant integration test, typecheck, lint, and build have executed successfully, or the final report names the exact blocker.

## Keep the demo honest

Apply the evidence-labeling and frontend rules in `AGENTS.md`. For dashboard work, run `saransh_custom_antislop` after functional verification and fix every material issue it identifies before handoff.

Completion: the demonstrated state is backed by an executed API path or check, and every simulated, fallback, or model-produced result is labelled at its source.

## Final report

Report:

- Requirement IDs completed
- Implemented path and trust boundaries crossed
- Tests and verification commands actually executed
- Model, fallback, simulator, or stubbed behavior
- Remaining P0 gaps before any P1 recommendation
