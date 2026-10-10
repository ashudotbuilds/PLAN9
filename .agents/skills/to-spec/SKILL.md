---
name: to-spec
description: Turn the current DriftGuard conversation into a local implementation spec with PRD traceability. Publish externally only when the user explicitly requests it.
disable-model-invocation: true
---

This skill takes the current conversation context, `DRIFTGUARD_PRD.md`, and codebase understanding and produces a local spec. Do not interview the user; synthesize settled information.

**Prerequisite:** The feature has explicit acceptance criteria. Use `/grill-me` only for unresolved decisions that materially change safety, lifecycle, API, or user-visible behavior. Do not publish a spec with blocking TBDs.

Write the spec to `docs/specs/<feature-slug>.md`. Create the directory lazily. Publish to an external tracker only when the user asks and authorizes it.

## Process

1. Explore the repo to understand the current state of the codebase, if you haven't already. Use the project's domain glossary vocabulary throughout the spec, and respect any ADRs in the area you're touching.

2. Sketch out the seams at which you're going to test the feature. Existing seams should be preferred to new ones. Use the highest seam possible. If new seams are needed, propose them at the highest point you can. The fewer seams across the codebase, the better - the ideal number is one.

Check with the user that these seams match their expectations.

3. Write the spec using the template below. Include the relevant PRD requirement IDs and save it locally.

<spec-template>

## Problem Statement

The problem that the user is facing, from the user's perspective.

## PRD Traceability

The `FR-*` and `NFR-*` requirements and acceptance criteria this spec implements.

## Solution

The solution to the problem, from the user's perspective.

## User Stories

A LONG, numbered list of user stories. Each user story should be in the format of:

1. As an <actor>, I want a <feature>, so that <benefit>

<user-story-example>
1. As a mobile bank customer, I want to see balance on my accounts, so that I can make better informed decisions about my spending
</user-story-example>

This list of user stories should be extremely extensive and cover all aspects of the feature.

## Implementation Decisions

A list of implementation decisions that were made. This can include:

- The modules that will be built or modified (observer, detector, lineage, adapter runtime, repair, validation, Fastify routes/orchestration, or React API/hooks/components)
- The interfaces of those modules that will be modified
- Technical clarifications from the developer
- Architectural decisions (must align with `DRIFTGUARD_PRD.md` sections 12 and 18 plus `AGENTS.md`)
- Schema changes
- API contracts (request/response JSON shapes, error codes)
- Which decisions remain backend-authoritative versus what React displays or requests
- Specific interactions

Do NOT include specific file paths or code snippets. They may end up being outdated very quickly.

Exception: if a prototype produced a snippet that encodes a decision more precisely than prose can (state machine, reducer, schema, type shape), inline it within the relevant decision and note briefly that it came from a prototype. Trim to the decision-rich parts — not a working demo, just the important bits.

## Testing Decisions

A list of testing decisions that were made. Include:

- A description of what makes a good test (only test external behavior, not implementation details)
- Which public seams will be tested (packages with fixtures/fakes, routes with Fastify injection, React with a mocked API client, and the golden mock-provider HTTP integration)
- Full scenario list per `AGENTS.md` (happy path, invalid, boundaries, errors, domain edges)
- Prior art for the tests (i.e. similar types of tests in the codebase)

## Out of Scope

A description of the things that are out of scope for this spec.

## Further Notes

Any further notes about the feature.

</spec-template>
