# Contributing to DriftGuard

[agent.md](agent.md) is the authoritative execution policy. Read it and the
[PRD](DRIFTGUARD_PRD.md) before work. The following is a navigation checklist;
the detailed policy resolves ownership, prerequisites, safety, and publication.

1. Inspect branch, upstream, changes, instructions, and relevant skills. Preserve
   teammate work. Use an isolated ticket branch/worktree when appropriate.
2. Verify the authenticated GitHub login using `gh auth status` and
   `gh api user --jq .login`, or an authorized connector if the CLI is unavailable.
   Use the same verified authentication context for identity-dependent issue work.
3. Select exactly one authorized issue. In “my task only” mode, you must be an
   assignee. Read its body, comments, requirements, and blockers. Inspect each
   prerequisite's actual contract; an authored ticket does not prove completion.
4. After investigating scope, perform the mandatory second instruction/skill pass
   from agent.md before editing. List affected callers, tests, fixtures, contracts,
   and verification commands actually present in the repository.
5. Deliver the smallest complete observable slice. Keep evidence honest, validate
   trust boundaries, and preserve PRD repair gates. Stop at a missing prerequisite
   rather than implementing another owner's ticket under your issue.
6. Execute applicable checks and review the diff. Stage explicit reviewed paths.
   Publication requires user authorization and must respect branch protections and
   review requirements. Never force-push or absorb unrelated changes.
7. After a successful authorized feature/setup push, inspect current `log.md` and
   remote state, append the confirmed result, then publish a separate log commit.
   Follow agent.md's ordering and self-reference rules. Return control after this
   one scope; report any incomplete verification or failed log synchronization.

Use the [ticket index](.scratch/driftguard/README.md) to find the eligible frontier.
P1 depends on both recovery and connected SDK P0 release acceptance. P2 briefs need
narrower designs and production security review before implementation.

For planning-only changes, run `node scripts/validate-planning.mjs` and
`git diff --check`. Application commands are added by the startup ticket; do not
claim runtime tests from a documentation check. Update relevant API and requirement
coverage documents when a ticket changes a shared contract.
