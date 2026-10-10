# DriftGuard team policy

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
- **Architecture:** three service applications, a Node sample client, and focused packages including the thin manual SDK. See PRD sections 12 and 18.

## Non-negotiable product invariants

1. **Observe the dependency.** Detection consumes HTTP observations, never the mock provider's scenario state.
2. **Keep detection deterministic.** Baseline capture, diffing, impact analysis, validation, and reset work without an LLM.
3. **Constrain repair.** Parse every proposal with Zod. P0 executes only `rename` and `coalesce`; unknown operations and paths fail closed.
4. **Validate before activation.** Apply `FR-REP-07` without exceptions; human approval cannot substitute for any gate.
5. **Preserve last known good.** Every activation records its parent adapter. A failed post-activation replay restores that parent, retains the failed evidence, and moves the incident to `rolled_back`.
6. **Escalate semantic uncertainty.** Ambiguous meaning changes enter `review_required`; they never auto-activate.
7. **Protect side effects.** Shadow replay uses fixtures, stubs, or recorded intents for non-idempotent actions.
8. **Report evidence honestly.** Distinguish observed evidence, simulator ground truth, model output, fallback output, and executed test results.
9. **Keep sanitized evidence immutable.** Redact before transport, logging, persistence or model submission; preserve the sanitized captured observation and derive normalization without rewriting it.
10. **Keep the demo repeatable.** Scoped reset archives session evidence and fences stale SDK events while preserving project, key and inventory identity, as specified in PRD 13.2.

## Automatic recovery gate

`DRIFTGUARD_PRD.md` requirement `FR-REP-07` is the single source of truth for automatic eligibility. Implement it as one conjunctive policy decision and persist each gate result. `FR-REP-08` defines review behavior: approval alone never activates a patch. Do not copy the gate list into another instruction file; point to these requirement IDs so policy cannot drift.

## Architecture boundaries

```text
apps/web            React control plane; presentation and user actions
apps/api            Fastify orchestration, workflows, incidents, and state transitions
apps/mock-providers Separate HTTP dependency simulator and scenario controls

packages/contracts       Shared Zod schemas and DTOs
packages/sdk             Node registration, manual telemetry, bounded delivery and diagnostics
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
- `packages/sdk` uses shared public contracts and pure observer redaction only; it has no backend/model dependency and never executes repairs or alters host responses. The sample reports actual HTTP traffic. See PRD 12.5 for its public API and failure isolation.

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
| SDK and ingestion | Fake transport/clock failure isolation and scoped atomic acceptance at HTTP boundaries |

Always cover applicable happy paths, malformed input, missing fields, duplicates, timeouts, provider errors, conflicting evidence, illegal state transitions, patch-hash mismatch, model unavailability, infrastructure failure, automatic-gate refusal, rollback, and reset repeatability.

Never mark work complete while required tests, typechecks, or builds are failing. Never claim a command passed unless it was executed in this workspace.

## Scope discipline

- P0 recovery and safe refusal outrank UI animation, generalized frameworks, or extra providers.
- Use a clear three-column impact view before adding a graph library.
- Use Lowdb behind repositories for the demo; do not introduce PostgreSQL, Redis, Kafka, Kubernetes, or a service mesh.
- Implement the deterministic repair fallback first. Add a live model only behind the provider-neutral `RepairModel` seam; credentials are optional.
- Add an interface only at a real variation seam, such as `RepairModel` implementations or persistent and in-memory repositories.
- Omit speculative stubs. Add P1 behavior only after both PRD section 21's original acceptance test and all section 21.1 connected SDK gates pass.
- P0 provides explicit Node registration/manual telemetry. Client instrumentation and polling/import are P1; production proxy/gateway interception and broad discovery are P2 (PRD 13.3–13.4).

## Frontend rules

- Build one evidence-first operational canvas: dependency rail, incident workspace, three-column impact trace, repair lab, and audit timeline.
- All HTTP goes through the frontend API client.
- Include project/environment onboarding, one-time key display and inventory/ingestion status in the existing canvas. Follow PRD 13.1/17 for operator sessions and secret handling; keep credentials out of frontend configuration, persistent browser storage and logs.
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
- For projects/keys/ingestion, read PRD 12.5–13.3 and 16.1 before coding. Keep operator authentication separate from SDK bearer ingestion; persist key digests only, return plaintext once after persistence, and omit plaintext/digests from metadata and audit DTOs.
- Derive ingestion scope from the active key; validate recorded resource scope and active session. Preserve PRD 13.2's shared demo lease, archive/reset behavior and session fencing; registration does not authorize arbitrary origin fetching.
- Validate/redact whole batches before a serialized atomic store update of dedup, evidence, latest, findings and counters. SDK observations are untrusted source evidence, never automatic baseline promotion or substitutes for FR-REP-07 controlled HTTP/workflow gates. Keep declared/inferred graph edges separate from proven field reads.

## Domain language

Use these terms consistently:

| Term | Meaning |
|---|---|
| Observation | Immutable sanitized evidence from one provider request and response, with scope and source |
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

## Repository governance and ticket execution

This section is the detailed team workflow. Root `AGENTS.md` directs Codex here before
acting. Follow applicable ancestor and nested `AGENTS.md` / `AGENTS.override.md`,
platform instructions, and security restrictions. An override is not permission to
bypass stronger instructions. Preserve the project constraints above.

### Scope and authorization

Handle exactly one authorized feature ticket per execution and return control after
its verification, publication, and log update, or after recording a blocker.
Never process the rest of an assignee's backlog automatically. A direct user setup,
documentation, or diagnostic request is its own scope; it does not authorize starting
a product issue. For independently shippable items within one issue, deliver the
smallest authorized item unless its acceptance criteria require them together, and
report remaining criteria as incomplete.

Publishing requires current or continuing user authorization. A request for this
workflow's setup authorizes its branch publication, subject to permissions. Future
execution must verify publication authority; installing this policy alone does not
grant it. Changes to assignments, GitHub settings, issue closure, merging, production
deployment, and messages to teammates require the appropriate separate authorization.
A requested push targets the authorized ticket branch, respecting protections,
approvals, sandbox restrictions, and the established review process.

### Phase 0 — Collaboration preflight

1. Confirm repository root, branch, upstream, status, and recent commits.
2. Inspect tracked modifications and untracked files, identifying other owners'
   work. Read README, CONTRIBUTING, relevant development docs, and existing log
   when present; record missing documents without inventing conventions.
3. Determine branch, commit, review, and push conventions. Inspect permissions and
   applicable protection before publishing.
4. Use a dedicated ticket branch or isolated worktree. Default branch naming is
   `codex/issue-123-short-description` when no convention exists; direct setup uses
   a descriptive `codex/` branch. Keep a shared or dirty checkout on its current
   branch. If isolation is unsafe, report the exact blocker before risky changes.

Never discard others' work, reset a checkout to clean it, rewrite shared history,
force-push, or absorb unrelated changes into a commit.

### Phase 1 — Initial instruction and skill pass

Before retrieving an issue or implementing application code, read root and applicable
nested instructions, contribution rules, and relevant architecture. Discover skills
through this environment's catalog and repository `.agents/skills/*/SKILL.md`.
Read descriptions and activation requirements, then read each applicable skill and
required references completely. Announce first use and apply the actual instructions;
mentioning a skill is not using it. Consult only relevant skills. A missing required
skill is a recorded limitation, never a claimed activation.

Use the project skill routing above. Maintain a concise plan of applicable rules,
skills, and affected contracts; reading alone does not authorize unrelated doc edits.

### Phase 2 — Verify the authenticated GitHub identity

Prefer `gh auth status` followed by `gh api user --jq .login` through the available
authenticated CLI. If CLI verification is unavailable, use an authorized connector
that reports its authenticated login. Match owner/name to the intended Git remote.
Never log credentials or raw token output.

When CLI and connector accounts differ, identify the authentication context used for
this execution and use it consistently for identity-dependent issue queries and writes.
Verify the context used for Git publication rather than assuming a connector supplies
the CLI's credentials. Do not switch accounts or change authentication to make a
ticket eligible. A network or sandbox error is not proof that a credential is invalid;
use the permitted approval mechanism before reaching that conclusion.

Commit author configuration, local email, teammate names, old session assumptions,
and the first returned assignee are not authenticated identity evidence. If identity
cannot be verified, stop before application implementation and report needed access.

### Phase 3 — Select exactly one authorized issue

- Explicit issue number, URL, or unambiguous ticket: retrieve that issue. In
  "my task only" mode, the verified identity must be an assignee. Outside that mode,
  explicit authorization can permit the specified ticket; check ownership and
  repository restrictions without silently changing its assignment.
- "Solve only my task": query open issues assigned to the authenticated identity.
  Select one eligible unstarted issue by explicit priority, dependency readiness,
  explicit milestone/deadline, then oldest issue as tie-breaker. Evaluate linked
  prerequisites before calling it eligible. Team membership or a mention is not
  assignment. If none qualify, report why; do not substitute someone else's work.
- Direct task outside GitHub: retain its explicit scope. Do not invent an issue or
  select an additional backlog ticket. Bootstrap is this mode and changes workflow
  documents only.

### Phase 4 — Investigate scope and dependencies

Read the full issue body, acceptance criteria, labels, priority, assignees, milestone,
comments, linked issues/PRs, and related designs, code, and tests. Distinguish explicit
requirements, conventions, reversible choices, and material unknowns.

For every mandatory blocker, inspect issue/PR state and the actual required contract
in the authorized checkout. An issue's existence, an unchecked claim, or another
agent's progress message does not prove completion. Separate scheduling gates from
technical prerequisites; P0/P1 release gates in the ticket plan still apply.

If a prerequisite is unfinished and required, stop implementation, record the missing
contract and issue, and report the blocker. Do not reassign yourself to it or build
a speculative duplicate. Clarify only decisions that prevent safe completion.

### Phase 5 — Mandatory second instruction and skill pass

After understanding the issue and before implementation, deliberately revisit root
and applicable nested instructions; re-read the relevant sections of Phase 1 skills.
Add skills required by the actual task (API, frontend, migration, security, testing,
accessibility). Read relevant architecture and neighboring implementations/tests.
Re-check scope, acceptance criteria, prerequisite status, working tree, and file
ownership. This second pass is not satisfied by remembering the first pass.

For direct setup work, perform the same targeted second pass against its user scope
and relevant documentation skill before editing workflow files.

### Phase 6 — Small implementation and verification plan

State the one issue/direct task, verified identity, expected behavior, minimum changed
files, compatibility contracts, test scenarios, risks, dependencies, verification
commands, and intended commit/push sequence. Use scripts and tooling actually present;
do not invent commands from the proposed stack. Prefer one complete vertical slice.

### Phase 7 — Implement one slice

Reuse existing architecture and naming, preserve error handling and interfaces, and
implement only the selected acceptance criteria. Add tests with behavior changes,
following the project testing contract. Avoid unrelated refactoring, speculative
stubs, future tickets, unnecessary dependencies, or fake integration success.
Validate trust boundaries and keep secrets outside code, persisted evidence, and logs.
If a newly discovered prerequisite blocks completion, stop at a safe boundary and
record the limitation instead of substituting another feature.

Subagents, when delegation is authorized, remain inside the selected ticket or direct
task. Assign bounded, non-overlapping files or read-only review; share contracts and
require the handoff defined above. Subagent delivery does not permit starting a second
ticket or messaging another user-owned chat without authorization.

### Phase 8 — Verify and stage

Review the complete diff and acceptance criteria. Run relevant tests, lint, typecheck,
build, and static checks from actual repository scripts when applicable. Separate
pre-existing failures from regressions and name unavailable tools/services/credentials.
Documentation-only setup needs discovery, preservation, link, protocol, and diff
checks; it does not require inventing application tests.

Stage explicit reviewed paths only; never default to `git add .` or `git add -A`.
Inspect staged filenames and the staged diff separately from unstaged changes.
Fix introduced failures and re-run affected checks before publishing. Record executed
results only; missing required verification leaves a ticket incomplete.

### Phase 9 — Focused commit and authorized push

Use the established convention or `feat(#123): ...` / `fix(#123): ...`; direct
setup can use `docs: ...`. Commit only this scope. Push the dedicated branch through
the authorized context and confirm success and the exact resulting SHA.
Never bypass protection, required PRs, approvals, or sandbox restrictions.
Create/update a PR only when authorized and supported; attach any created PR to the
calling Codex task. Do not merge without separate authorization.

On push failure, diagnose the actual reason and preserve work. Synchronize only when
safe; report an unresolved conflict rather than rewriting history.

### Post-push logging — Order is mandatory

1. Implement, verify, commit, and successfully push the feature/setup changes.
2. Capture the pushed commit SHA and target. Immediately inspect current `log.md`
   and repository state, preserving concurrent entries.
3. Append one distinct entry describing that actual work and confirmed push.
4. Review the append-only diff, create a separate log commit, and push it to the
   same authorized branch (and PR when present).
5. Verify the log push and report its SHA/result. Stop this execution.

An explicit repository atomic-log convention can supersede the separate-commit order,
but no entry may claim a push before success. If the feature push succeeds and log
push fails, report the feature as pushed and the log as unsynchronized.

Use the existing log format or the following fields for each entry:

- Date; issue number/title/URL or explicit direct setup scope.
- Authenticated login and authentication mechanism.
- Status: PUSHED, BLOCKED, FAILED, or PARTIAL, grounded in actual results.
- Scope, implementation, changed files, and verified dependencies.
- Executed verification and results; known limitations.
- Branch, feature/setup commit SHA, confirmed push target/result, and PR if present.
- Log commit identifier and log publication status.

A log entry cannot contain the SHA or confirmed push of the commit that first records
that same entry. Identify that log commit by its unique subject in the entry; report
its actual SHA and push result in the final response, or append confirmation during
a later execution. Do not amend history, rewrite the entry, or start an infinite
series of log-confirmation commits to manufacture a self-reference.

`log.md` is append-only: preserve all old entries and ordering. Before each append
read the current file and inspect the latest authorized remote state. Reconcile
concurrent edits by retaining every entry, appending only missing records, and
reviewing the diff; never replace the file with a stale local version.

For a meaningful blocked/failed execution, append the actual issue, identity, checks,
actions, blocker, and push state. Publish that record only with authority. Never mark
an unpushed feature PUSHED. Keep safe work intact and disclose the exact limitation.

### Completion and final report

A delivered ticket has verified identity/ownership, both instruction passes, satisfied
dependencies, one scoped implementation, reviewed code/tests, executed checks, a
focused successful push, and a subsequent log commit/push. Otherwise report incomplete,
blocked, or partial with the exact missing condition. No unrelated work is discarded
or included, and no next ticket begins automatically.

Report the following, concisely and factually:

- Ticket/direct task: title, issue link when applicable, authenticated login,
  confirmation that only this scope was handled.
- Implementation: actual changes, files, limitations/dependencies.
- Verification: executed checks, results, and unavailable checks with reasons.
- Git status: branch, feature/setup SHA, push result, PR URL if applicable.
- Logging: entry added, log SHA, log push result, any synchronization discrepancy.
- Next step: complete, blocked, or waiting for a named prerequisite; return control.
