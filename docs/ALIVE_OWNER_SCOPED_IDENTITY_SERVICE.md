# ALIVE Owner-Scoped Identity Service — v1

## Purpose

This milestone adds the first application-service boundary on top of the personal identity contract. It defines how an authenticated account may create, read, update, and delegate access to a personal ALIVE identity without transferring ownership to a world, company, collaborator, or companion.

## Security and ownership rules

- The authenticated actor ID is supplied separately from identity input and becomes the owner ID at creation.
- A caller cannot create an identity for another account by supplying a different owner ID.
- Reads are denied unless the caller is the owner or has an explicit viewer/editor grant.
- Only the personal owner can update identity data or create/revoke delegated grants.
- Delegated grants are limited to editor and viewer; owner elevation is rejected.
- Owner ID, privacy defaults, memory policy, and model reference are preserved through ordinary updates unless the owner explicitly changes an allowed character field.
- The service validates stored records before returning or changing them and fails closed on malformed records.

## Persistence adapter boundary

The service receives a repository adapter with three operations:

- `insert(record)`
- `getById(identityId)`
- `update(identityId, mutate)`

The repository's `update` implementation must run the mutation atomically, such as inside a database transaction or row lock. The service does not pretend that an in-memory mock is durable storage.

## Deliberate limitations

This milestone is an application-service boundary plus unit tests. It does not yet include:

- A Neon/Postgres repository implementation or SQL migration.
- An HTTP API route or authenticated request binding.
- Encryption-at-rest, cross-device sync, backups, or account recovery integration.
- AI inference, companion execution, speech, animation, or avatar runtime registration.

Those are separate steps. In particular, the account foundation PR must be merged and its real preview authentication/recovery flow verified before an identity API is bound to its session implementation. The owner ID used by this service is an authenticated subject identifier, not an email address or a client-provided profile field.

## Validation

Run the Development Engine test suite, including:

- Creation binds the authenticated actor as owner.
- Private reads reject unrelated accounts.
- Explicit editor/viewer grants work without transferring ownership.
- Delegated users cannot mutate owner-controlled identity data.
- Only the owner can grant or revoke access.
- Owner ID, private memory policy, and training-use defaults remain protected.
- Invalid identity and role inputs fail closed.
