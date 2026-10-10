---
name: grill-with-docs
description: A relentless interview to sharpen a plan or design, which also creates docs (ADR's and glossary) as we go.
disable-model-invocation: true
---

Run a `/grilling` session, using the `/domain-modeling` skill.

Follow the DriftGuard topics in `/grill-me`: evidence boundaries, canonical mappings, repair policy, deterministic validation, lifecycle transitions, side effects, UI authority, and test seams.

Update as decisions land:

- `CONTEXT.md` — settled domain terms only, with no implementation detail
- `docs/adr/` — hard-to-reverse architectural decisions with genuine alternatives
- `DRIFTGUARD_PRD.md` — product requirements only when the user intentionally changes scope or acceptance criteria
- `AGENTS.md` or `.cursor/rules/` — execution rules only when the engineering contract changes
