# ALIVE persistent personal identity and Companion API

## Purpose

This milestone connects ALIVE's owner-scoped personal identity and private Companion memory services to the isolated ALIVE PostgreSQL database and verified owner session. The first owner identity is created on the first authenticated personal-storage request using a stable, non-secret ID derived from the authenticated owner subject.

## API

All routes require the verified ALIVE owner session cookie. The server derives the owner ID from that session; callers cannot supply or override it.

- GET /api/alive/personal/identity — return or initialize the owner's private ALIVE identity.
- POST /api/alive/personal/identity — update permitted display, character-form, appearance, and personality fields.
- GET /api/alive/personal/memories — list private memories for the owner identity.
- POST /api/alive/personal/memories — create a bounded private memory.
- DELETE /api/alive/personal/memories — delete one memory by ID.
- GET /api/alive/personal/preferences — list private preferences.
- POST /api/alive/personal/preferences — set one JSON-compatible preference.
- DELETE /api/alive/personal/preferences — delete one preference by key.

State-changing requests require a same-origin browser request. Request bodies are limited to 16 KB. Every vault operation rechecks owner access through the identity service.

## Persistence

Apply `development/storage/migrations/003_alive_identity_companion.sql` manually to the isolated ALIVE development database after review. The migration creates:

- `alive_personal_identities` — personal identity records with immutable owner scope.
- `alive_companion_memories` — private memories scoped by both owner and identity.
- `alive_companion_preferences` — private preferences scoped by both owner and identity.

Composite foreign keys and record/column consistency checks prevent memory or preference rows from being attached to another owner's identity. Application code does not apply the migration automatically.

## Privacy and runtime boundaries

- The authenticated owner subject is assigned server-side from Better Auth.
- Identity records default to private discovery, owner-only memory, and no model-training use.
- Companion memory and preferences are private, excluded from training, and not shared across worlds.
- Delegated character editors/viewers cannot access the owner's Companion vault.
- The runtime adapter can resolve an existing host character object by reference; it does not clone or replace the existing HERO model.
- This API does not ingest chat history automatically, call an AI model, speak, animate a character, or perform external actions.
- No production database, player account, game runtime, or world layout is modified.

## Owner activation

No migration is applied, owner account is not created, and no secret is configured by this code change. These steps remain deferred until the Preview and owner setup checklist is ready.
