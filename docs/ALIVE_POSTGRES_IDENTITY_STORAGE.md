# ALIVE PostgreSQL Identity Storage — v1

## What this adds

This milestone defines a PostgreSQL persistence adapter for ALIVE personal identities and a separate SQL migration. The adapter accepts an existing `pg.Pool`; it does not read environment variables, create a database, apply migrations, or expose an HTTP endpoint.

## Ownership and record integrity

- Each row has a stable `identity_id` and personal `owner_id`.
- The owner ID is intentionally not tied to a particular authentication vendor or LAMBO CITY account-table schema.
- SQL checks require the JSON record's identity and owner IDs to match the indexed columns.
- SQL checks enforce owner-only memory access, no model-training use by default, owner-controlled/private memory, and an array of delegated grants.
- Identity updates use a database transaction and `SELECT ... FOR UPDATE`.
- The adapter rejects changes to identity ID or personal owner ID and increments a record version on successful updates.

## Files

- `alive/identity/postgresIdentityRepository.js` — adapter implementing `insert`, `getById`, and atomic `update`.
- `migrations/002_alive_personal_identities.sql` — table, integrity checks, index, and comments.
- `development/tests/postgresIdentityRepository.test.js` — adapter tests using a deterministic fake PostgreSQL pool.

## Deployment and data safety

The migration has not been applied to a database. The adapter has not been connected to a live Neon branch, player account session, or API route. Do not apply it to production as part of this PR.

Before connecting it to a real database:
1. Review and apply the migration to an isolated development branch.
2. Verify the account provider's authenticated subject ID is used server-side.
3. Connect the repository to the identity service in an authenticated API route.
4. Test owner isolation, concurrent updates, backups, and recovery.
5. Keep private memory content in a separate consent-governed storage layer; this table stores identity/profile contract data, not conversation history.

This is a persistence implementation, not yet a live identity product or companion runtime.
