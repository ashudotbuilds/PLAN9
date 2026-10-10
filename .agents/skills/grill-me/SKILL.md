---
name: grill-me
description: A relentless interview to sharpen a plan or design.
disable-model-invocation: true
---

Run a `/grilling` session.

Use `DRIFTGUARD_PRD.md` as the default answer. Cover only unresolved topics that materially affect the requested scope:

1. **Evidence boundary** — what is observed, normalized, simulator ground truth, or inferred?
2. **Contract mapping** — which provider behavior maps to which canonical field and workflow?
3. **Repair policy** — which DSL operations are permitted, and what requires review?
4. **Validation** — which fixture, invariant, and patch hash proves the candidate?
5. **State and recovery** — legal transitions, activation, post-activation replay, and rollback.
6. **Side effects** — idempotency, stubbing, timeouts, and bounded retries.
7. **Authority and presentation** — backend decision versus React display and user intent.
8. **Test seam** — the public seam and scenario list that falsify the behavior.

Keep the frontier compact. Resume work when blocking decisions are resolved; make reversible choices for non-blocking implementation detail.
