# ALIVE Companion Private Memory and Preference Vault

## Purpose

This is the first owner-only data boundary for the Companion side of ALIVE. ALIVE remains a reusable platform engine; LAMBO CITY is only its first host integration.

The vault is independent of Three.js and of any particular world. It can be used by realistic digital humans or stylized characters because it addresses the personal identity, not the visual representation.

## Ownership and access

Every operation requires an authenticated actor ID and a personal identity ID. Before reading or changing data, the vault asks the existing owner-scoped identity service for the identity with `requiredRole: "owner"`.

A delegated character editor or viewer does not receive memory or preference access. Character permissions do not silently grant Companion memory access. The returned identity must match both the requested identity ID and the authenticated owner ID.

The vault fails closed if the identity's memory policy is not owner-controlled, private, owner-only, and excluded from model training.

## Stored records

### Memories

A memory record contains:
- Stable memory ID.
- Personal identity ID and immutable owner ID.
- The owner as creator.
- A small category, plain-text content, and bounded tags.
- Creation and update timestamps.
- Fixed privacy metadata: private visibility, no model-training use, and no cross-world sharing.

Memory content is limited to 4,000 characters; tags are limited to 12 entries. Listing is bounded to 500 records per call.

### Preferences

A preference record contains:
- Personal identity ID and owner ID.
- A stable key.
- A JSON-compatible value, limited to 4 KiB.
- An update timestamp.
- Fixed private/no-training/no-cross-world-sharing metadata.

Listing is bounded to 200 records per call. Values are copied through JSON serialization and returned as immutable snapshots so callers cannot mutate stored objects through shared references.

## Persistence boundary

The service accepts an injected repository. The repository must implement:
- `insertMemory(record)`
- `listMemories({ identityId, ownerId })`
- `deleteMemory({ identityId, ownerId, memoryId })`
- `upsertPreference(record)`
- `listPreferences({ identityId, ownerId })`
- `deletePreference({ identityId, ownerId, key })`

This PR does not add a database connection, schema migration, API route, credential, AI provider, automatic conversation ingestion, external action, or background process. A future persistence adapter must enforce the same composite owner/identity scope in its database queries and uniqueness constraints.

## LAMBO CITY first integration

The existing HERO identity continues to reference `existing:hero-model`. The vault stores personal Companion memories and preferences against that identity ID; it does not construct, clone, replace, or visually modify HERO. It does not change Records HQ access, the world layout, camera, movement, stage/Jumbotron, Studio, or audio/session workflows.

Other players' access to the character remains governed by invitation and role permissions. This vault deliberately keeps their access separate from the owner's private Companion data.

## Verification and remaining work

The focused test suite covers owner access, editor/viewer denial, private defaults, preference snapshot immutability, deletion, malformed/oversized input, identity-policy mismatch, and cross-owner repository leakage.

This is a service-layer foundation, not a complete memory product. Remaining work includes a reviewed persistent repository/schema, authenticated API integration, owner-facing export/retention controls, backup/restore coverage, and an explicit owner-approved memory capture workflow. No production data is read or written by this module.
