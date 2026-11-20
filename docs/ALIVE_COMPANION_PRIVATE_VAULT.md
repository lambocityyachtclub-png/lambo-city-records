# ALIVE Companion Private Memory and Preference Vault

## Purpose

This is the owner-controlled data boundary for the Companion side of ALIVE. ALIVE remains a reusable platform engine; LAMBO CITY is its first host integration, not its only intended world.

The vault is independent of Three.js and any particular world. It supports identities backed by realistic digital humans or stylized characters because it addresses the person's identity and permissions, not the character's visual representation.

## Ownership and access

Every operation requires an authenticated actor ID and a personal identity ID. Before reading or changing data, the vault asks the existing owner-scoped identity service for the identity with `requiredRole: "owner"`.

A delegated character editor or viewer does not receive memory or preference access. Character permissions do not silently grant Companion memory access. The returned identity must match both the requested identity ID and the authenticated owner ID.

The vault fails closed if the identity's memory policy is not owner-controlled, private, owner-only, and excluded from model training.

## Stored records

### Memories

A memory record contains:
- Stable memory ID.
- Personal identity ID and immutable owner ID.
- The owner as creator for owner-stated memories.
- A database-approved category: `fact`, `preference`, `goal`, `relationship`, `project`, or `experience`.
- Plain-text content, bounded tags, and timestamps.
- Fixed private visibility, no model-training use, and no cross-world sharing.
- An explicit `shareWithDevelopment` choice, which defaults to false.

Memory content is limited to 2,000 characters to match the existing database constraint; tags are limited to 12 entries. Listing is bounded to 500 records per call.

Owner-stated memories are written as approved because the owner explicitly created them. Companion-suggested rows remain in the database as `proposed` until a separate owner-approval workflow accepts them. The ordinary Companion memory list returns only `approved` rows; proposed content is not treated as an accepted memory and is not included in development context.

Deleting a memory is an archive operation. It sets the existing row's state to `archived` and records `archived_at`; it does not hard-delete the historical record.

### Preferences

A preference record contains:
- Personal identity ID and owner ID.
- A stable key.
- A JSON-compatible value, limited to 4 KiB.
- An update timestamp.
- Fixed private/no-training/no-cross-world-sharing metadata.

Listing is bounded to 200 records per call. Values are copied through JSON serialization and returned as immutable snapshots so callers cannot mutate stored objects through shared references.

## Persistence boundary

The PostgreSQL adapters map the domain contracts to the already-existing ALIVE development schema:
- `public.alive_personal_identity` stores relational identity fields, appearance profile, grants, and privacy policy.
- `public.alive_memory_entry` stores owner/identity-scoped memory entries, approval state, archive state, and the explicit development-sharing flag.
- `public.alive_companion_preferences` stores private preferences under the composite owner/identity/key scope.

The memory and preference queries scope reads and writes by both `owner_id` and `identity_id`. The database's composite foreign keys and check constraints reinforce that scope. The identity service additionally checks the authenticated actor's owner or delegated role before returning an identity.

The repository migration at `development/storage/migrations/003_alive_identity_companion.sql` is an additive compatibility migration. It uses `ADD COLUMN IF NOT EXISTS` and `CREATE TABLE IF NOT EXISTS` against the approved table names; it does not create competing pluralized identity or memory tables. It must be reviewed and applied manually to the isolated `alive-dev` database. Application code never applies it automatically.

A read-only schema inspection of the connected `alive-dev` branch on 2026-11-20 confirmed the table names, columns, composite owner/identity constraints, memory category/content limits, approval/archive states, and preference constraints described above. That inspection read schema metadata only. This PR does not apply a migration, read personal row contents, or write to any database.

## Explicit development sharing

A memory remains private by default. The owner may explicitly set `privacy.shareWithDevelopment: true` for an individual memory. Only that flag allows the ALIVE development-context selector to include the approved memory, and the selector still applies a small bounded projection.

This permission is separate from model-training use and cross-world sharing: both remain false. No broad memory export, automatic conversation ingestion, or silent sharing is enabled.

## LAMBO CITY first integration

The existing HERO identity continues to reference `existing:hero-model`. The vault stores personal Companion memories and preferences against that identity; it does not construct, clone, replace, or visually modify HERO. It does not change Records HQ access, world layout, camera, movement, stage/Jumbotron, Studio, or audio/session workflows.

Other players' access to the character remains governed by invitation and role permissions. This vault deliberately keeps their access separate from the owner's private Companion data.

## Verification and remaining work

Focused tests cover owner access, editor/viewer denial, private defaults, explicit per-memory development sharing, preference snapshot immutability, archive-only deletion, malformed and oversized input, approved category/content limits, identity-policy mismatch, cross-owner repository leakage, and exclusion of proposed memories from the normal memory list.

Remaining work includes an explicit owner approval/review workflow for Companion-suggested memories, authenticated owner UI controls for export/retention, backup/restore acceptance, and an end-to-end hosted worker task. No production data is read or written by this module.
