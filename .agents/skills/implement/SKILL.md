---
name: implement
description: "Implement a piece of work based on a spec or set of tickets."
disable-model-invocation: true
---

Implement the work described by the user in the spec or tickets.

**Read first:** `DRIFTGUARD_PRD.md`, `AGENTS.md`, `.cursor/rules/`, and the `driftguard-delivery` skill.

**Mandatory standards:**

- **Requirement trace** — name the PRD requirement IDs and acceptance criteria satisfied by the task.
- **Targeted clarification** — use `/grill-me` only when an unresolved decision changes the API, safety policy, state machine, or user-visible behavior. Make reversible choices for ordinary implementation detail.
- **Architecture layers:**
  - Applications compose packages; packages never import applications.
  - Observer, detector, lineage, adapter runtime, repair, and validation remain focused modules.
  - React displays backend-authoritative lifecycle state and sends user intent through the API client.
- **Trust boundary** — detection is model-independent; proposals are schema-validated data; adapters interpret the DSL; activation requires the exact passing patch hash; rollback is preserved.
- **YAGNI / DRY / SOLID** — implement the smallest P0 vertical slice; add interfaces only for real variation seams.
- **Tests** — list scenarios first and ship public-seam tests with the behavior. The golden flow crosses the real mock-provider HTTP boundary.

Use `/tdd` where possible, at pre-agreed seams.

Run the narrow test during each slice, then the repository's typecheck, lint, build, and relevant integration suite. Never invent a command; inspect `package.json` scripts first.

Once done, use `/code-review` to review the work.

Do not push, create a pull request, or merge unless the user asks.
