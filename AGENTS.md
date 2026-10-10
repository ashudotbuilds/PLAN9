# Agent Instructions for DriftGuard

Instructions for AI agents working in this repository.

## Source of truth

- Read [`DRIFTGUARD_PRD.md`](./DRIFTGUARD_PRD.md) before architecture or implementation work.
- Trace implementation work to a PRD requirement ID such as `FR-DET-02` or `NFR-01`.
- The PRD defines product scope and acceptance criteria. This file defines execution rules.
- When code and the PRD disagree, report the conflict and resolve it before changing behavior.

## Project context

- **Product:** DriftGuard, a resilience control plane for external dependency drift.
- **Primary demo:** `name` changes to `display_name`; detect, trace impact, propose, validate, activate, and replay.
- **Safety demo:** `delivery_days` keeps its schema but changes from calendar to business days; hold for review.
- **Build constraint:** 24-hour hackathon. Complete the P0 vertical slice before P1 work.
- **Target stack:** pnpm TypeScript monorepo, React and Vite web app, Fastify control-plane API, separate Fastify mock-provider process, Zod contracts, Lowdb demo persistence, Vitest, and optional Playwright.
- **Architecture:** three applications plus focused packages. See PRD sections 12 and 18.

## Non-negotiable product invariants

1. **Observe the dependency.** Detection consumes HTTP observations, never the mock provider's scenario state.
2. **Keep detection deterministic.** Baseline capture, diffing, impact analysis, validation, and reset work without an LLM.
3. **Constrain repair.** Parse every proposal with Zod. P0 executes only `rename` and `coalesce`; unknown operations and paths fail closed.
4. **Validate before activation.** Apply `FR-REP-07` without exceptions; human approval cannot substitute for any gate.
5. **Preserve last known good.** Every activation records its parent adapter. A failed post-activation replay restores that parent, retains the failed evidence, and moves the incident to `rolled_back`.
6. **Escalate semantic uncertainty.** Ambiguous meaning changes enter `review_required`; they never auto-activate.
7. **Protect side effects.** Shadow replay uses fixtures, stubs, or recorded intents for non-idempotent actions.
8. **Report evidence honestly.** Distinguish observed evidence, simulator ground truth, model output, fallback output, and executed test results.
9. **Keep raw evidence immutable.** Normalize and redact into derived records without rewriting the captured observation.
10. **Keep the demo repeatable.** Reset starts a clean demo session while retaining the completed session audit archive.

## Automatic recovery gate

`DRIFTGUARD_PRD.md` requirement `FR-REP-07` is the single source of truth for automatic eligibility. Implement it as one conjunctive policy decision and persist each gate result. `FR-REP-08` defines review behavior: approval alone never activates a patch. Do not copy the gate list into another instruction file; point to these requirement IDs so policy cannot drift.

## Architecture boundaries

```text
apps/web            React control plane; presentation and user actions
apps/api            Fastify orchestration, workflows, incidents, and state transitions
apps/mock-providers Separate HTTP dependency simulator and scenario controls

packages/contracts       Shared Zod schemas and DTOs
packages/observer        Capture, redaction, normalization, fingerprints
packages/detector        Structural and behavioral comparison; no LLM dependency
packages/lineage         Runtime field-read tracing and impact mapping
packages/adapter-runtime Constrained DSL interpreter and adapter versioning
packages/repair          Evidence bundles, model boundary, fallback, policy
packages/validation      Shadow replay, invariants, and patch hashing
```

Dependency rules:

- Applications may depend on packages; packages never depend on applications.
- Core packages may depend on `packages/contracts`.
- `packages/detector` never imports model code or mock-provider scenario state.
- `packages/validation` executes candidate mappings only through `packages/adapter-runtime`.
- `apps/web` consumes API contracts and never imports backend services.
- `apps/api` owns `RecoveryRun` orchestration. The web app starts a run and polls backend state; it never chains repair stages itself.
- Route handlers validate and translate HTTP. Domain orchestration belongs in focused services or packages.
- Repository interfaces exist only where both persistent and in-memory implementations are used.

## Execution workflow

For implementation tasks:

1. Inspect the repository and preserve existing work.
2. Identify the relevant PRD requirement IDs and acceptance criteria.
3. Choose the smallest end-to-end vertical slice that proves them.
4. List test scenarios before production code.
5. Implement one observable slice at a time.
6. Run the narrow test after each slice, then typecheck, lint, build, and run the relevant integration suite.
7. Review the result against the invariants above and the PRD definition of done.
8. Report exactly what was implemented, mocked, deferred, and executed.

Ask questions only when a missing decision would materially change the API, safety policy, state machine, or user-visible behavior. Otherwise, use the PRD and make a reversible decision. Do not let clarification ceremonies consume the hackathon window.

## Testing contract

Every behavior change ships with tests. Test public seams rather than private helpers.

| Area | Required test seam |
|---|---|
| Observer and detector | Pure fixture-driven unit tests |
| Lineage and impact | Workflow read-set and graph results |
| Adapter runtime | DSL input to canonical output |
| Repair policy | Evidence and risk input to decision |
| Validation | Candidate patch plus fixtures to immutable result |
| API | Fastify injection at HTTP contracts |
| React | User-visible behavior with the API client mocked |
| Golden recovery | Integration test across mock HTTP provider and control plane |

Always cover applicable happy paths, malformed input, missing fields, duplicates, timeouts, provider errors, conflicting evidence, illegal state transitions, patch-hash mismatch, model unavailability, infrastructure failure, automatic-gate refusal, rollback, and reset repeatability.

Never mark work complete while required tests, typechecks, or builds are failing. Never claim a command passed unless it was executed in this workspace.

## Scope discipline

- P0 recovery and safe refusal outrank UI animation, generalized frameworks, or extra providers.
- Use a clear three-column impact view before adding a graph library.
- Use Lowdb behind repositories for the demo; do not introduce PostgreSQL, Redis, Kafka, Kubernetes, or a service mesh.
- Implement the deterministic repair fallback first. Add a live model only behind the provider-neutral `RepairModel` seam; credentials are optional.
- Add an interface only at a real variation seam, such as `RepairModel` implementations or persistent and in-memory repositories.
- Omit speculative stubs. Add P1 behavior only after the primary acceptance test passes.

## Frontend rules

- Build one evidence-first operational canvas: dependency rail, incident workspace, three-column impact trace, repair lab, and audit timeline.
- All HTTP goes through the frontend API client.
- TanStack Query owns server state if introduced; local state owns transient UI only.
- The backend is authoritative for incidents and recovery runs. The UI may offer guided stage actions and a single safe-recovery action, but it never orchestrates stages locally.
- Show the source of every proposal (`live_model` or `deterministic_fallback`).
- Disable illegal actions and explain why; do not simulate success in the browser.
- Preserve keyboard access, visible focus, readable contrast, loading states, empty states, and failure recovery.
- Use solid surfaces, semantic typography, restrained operational color, and motion tied to user actions or real state changes.

## Backend and safety rules

- Validate all external input, stored records, and model output with Zod.
- Use stable error codes and correlation IDs across observation, incident, proposal, validation, and replay.
- Redact secrets before persistence or model submission.
- Bound request size, observation time, probe count, pagination count, and retry count.
- Reject unknown DSL operations and unknown source or canonical paths.
- Activation requires a passing validation result for the exact patch hash.
- Infrastructure failures fail the `RecoveryRun` without inventing an incident transition.

## Domain language

Use these terms consistently:

| Term | Meaning |
|---|---|
| Observation | Raw evidence from one provider request and response |
| Behavioral twin | Versioned known-good fingerprint, examples, probes, and invariants for an endpoint |
| Finding | One detected structural or behavioral difference |
| Incident | Lifecycle record grouping related findings and recovery work |
| Canonical contract | Stable internal shape consumed by application workflows |
| Dependency edge | Recorded workflow read of a canonical field |
| Repair proposal | Untrusted structured hypothesis for a compatibility change |
| Adapter version | Versioned set of constrained provider-to-canonical operations |
| Validation run | Immutable checks tied to a patch hash |
| Recovery run | Backend-owned execution record for impact, proposal, validation, activation, replay, and rollback stages |
| Semantic canary | Approved probe with a deterministic oracle for a behavior meaning |
| Evidence passport | Incident evidence, impact, proposal, validation, and decision record |

## Project skills

- Use `driftguard-delivery` for implementation, review, or demo work involving observations, incidents, adapters, repair proposals, semantic canaries, validation, activation, or rollback.
- Use `tdd` for red-green work at the seams defined above.
- Use `code-review` after a meaningful implementation batch.
- Use `diagnosing-bugs` for failures and regressions.
- Use `design-taste-frontend` and `saransh_custom_antislop` for dashboard implementation and its final visual quality gate.
- Use `grill-me` only when a genuine product or safety decision is unresolved.

## Project subagents

Reusable project profiles live in `.cursor/agents/`:

| Agent | Delegate when |
|---|---|
| `driftguard-integration-lead` | Contracts, orchestration, package wiring, or full recovery integration |
| `driftguard-detection-engineer` | Observation, normalization, fingerprints, diffs, or semantic canaries |
| `driftguard-repair-safety-engineer` | Repair proposals, DSL, policy, validation, activation, or rollback |
| `driftguard-simulation-lineage-engineer` | Mock providers, workflows, fixtures, runtime reads, or impact analysis |
| `driftguard-frontend-demo-engineer` | React control plane, guided demo, evidence presentation, or accessibility |
| `driftguard-qa-reliability-engineer` | Acceptance testing, offline behavior, reset reliability, or rehearsal |

Delegate by ownership and give each agent a bounded requirement or failing acceptance criterion. Require a handoff containing requirement IDs, files changed, commands run, results, and blockers. The integration lead resolves cross-owner contract changes.

## Git and external actions

- The repository may not yet be initialized as a functional Git checkout. Verify before running Git workflows.
- Do not push, open a pull request, merge, or modify external issue trackers unless the user asks.
- Preserve user changes and avoid destructive Git commands.
