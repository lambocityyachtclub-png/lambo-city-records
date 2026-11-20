# ALIVE Owner-Controlled Memory Contract — v1

## Purpose

Define the domain rules for what ALIVE may retain about a person before connecting memory to a database, model provider, or companion runtime. Memory is a private owner-controlled asset, not an unrestricted transcript archive.

## Memory lifecycle

Every proposed memory is a concise statement linked to one ALIVE identity and its personal owner. Supported categories are fact, preference, goal, relationship, project, and experience.

A memory begins in the `proposed` state. A companion may suggest that something is worth remembering, but suggestion is not approval. Only the authenticated personal owner may approve a proposed memory. Approval records the owner and timestamp. The owner may archive a memory; archive state preserves its approval audit metadata when it was previously approved.

The companion must use approved memories only as persistent personal context. Proposed memories are not approved long-term knowledge. Archived memories are no longer active memory context. The companion-context eligibility rule is explicit in code: only an approved memory for the matching identity can be used. Proposed and archived entries are excluded.

## Privacy and ownership

- Memory is owner-only by default. Editor/viewer grants and world integrations do not grant memory access.
- The companion, a collaborator, or an environment cannot approve memory on the owner's behalf.
- Memory is not used for model training by default.
- Memory records are not raw conversation transcripts. Store concise, purpose-specific statements only.
- The owner is the only actor who can approve or archive memory through this domain contract.
- Retention, export, correction, and deletion must be implemented in a future persistence service and remain owner-controlled.

## Code and tests

- `alive/memory/memoryContract.js` — memory construction, lifecycle validation, owner-only read rule, explicit owner approval, and archive behavior.
- `development/tests/aliveMemoryContract.test.js` — tests for proposal defaults, owner-only access, approval boundaries, archive audit metadata, and privacy invariants.

Run the existing Development Engine suite:

```sh
node --experimental-default-type=module --test development/tests/*.test.js
```

## Trusted owner-session boundary

- `alive/memory/ownerAccess.js` converts a verified server-authentication result into a request-scoped ALIVE owner context.
- The expected session shape is the trusted auth provider's `{ user, session }` result. The owner ID is derived from `user.id`; callers must never accept an owner ID from request JSON, query parameters, or browser state.
- The context is module-branded and cannot be recreated by passing a plain object with an `ownerId` property.
- Owner-only memory reads, approval, archive, and companion-context checks have context-based wrappers.
- `development/tests/aliveOwnerAccess.test.js` covers expired/incomplete sessions, forged context objects, owner isolation, and owner-only lifecycle actions.

**Important:** this helper does not verify cookies, tokens, signatures, or credentials. The server route must first call the trusted authentication provider's session lookup and pass only its verified result. This repository currently has no ALIVE API route wired to that provider, so this is a tested security boundary, not yet live authentication or a deployed service.

## Deliberate implementation boundary

This is a pure domain contract. It does not yet write to PostgreSQL, synchronize across devices, encrypt stored memory, authenticate a session, connect to an AI model, or expose an API. Those are separate milestones. Do not treat passing these domain tests as proof of persistent or production-ready memory.

Before durable storage is implemented, verify the existing account/session provider and development database branch. Enforce owner authorization on the server side, keep private data out of browser bundles and logs, and test owner isolation against real authenticated sessions.
