# LAMBO CITY — Private Apartment System Architecture

Status: architecture contract / not yet implemented  
Branch: `feature/lambo-city-visual-engine-foundation`  
Scope: first-world resident homes, account ownership, customization, and persistence

## 1. Product requirement

Every registered LAMBO CITY resident receives one unique private apartment as part of account onboarding. The first-world supply must support at least 300 separately assignable homes and must be expandable without changing the resident-facing customization system.

The apartment is the resident's personal home and home-screen destination. Residents may customize furniture placement, rotation and removal; lighting; colors; décor; and finish selections such as marble flooring, granite or marble counters, cabinetry, and wall materials. Their exact design must be saved to their account and restored on their next visit.

The apartment system is independent of any single building façade. The world must not load 300 fully furnished interiors at startup; detailed interiors load only when a resident enters their own apartment.

## 2. Repository discovery and implementation boundary

The current feature branch contains `playerAccounts.js`, which uses the existing browser account client and calls `/api/player/profile`. The tracked source tree currently has no corresponding player API route, database schema, apartment assignment service, or apartment persistence implementation.

Therefore this document defines the contract for the next backend integration. It does not pretend that account-backed apartment assignment or persistence already exists. Do not create client-only ownership or localStorage as the authoritative source of apartment ownership.

Before implementation, identify the actual deployed authentication/session and database provider, verify its server-side identity API and environment configuration, and add the backend routes and migrations in the repository's established deployment structure. Do not invent a provider, credentials, or endpoint implementation.

## 3. Core data model

The logical model should provide these records (physical table names may follow the chosen database conventions):

### Apartment inventory

- `apartment_units`: immutable apartment ID, building ID, unit code, floor/position metadata, interior template ID, availability state, and creation timestamp.
- At least 300 active, distinct unit IDs must be provisioned before public assignment is enabled.
- A unit belongs to one building shell and one interior template. The inventory is data-driven; no one-off hand-authored room code per resident.
- Unit IDs remain stable across façade and exterior visual upgrades.

### Ownership assignment

- `apartment_assignments`: authenticated account ID, apartment ID, assigned timestamp, and assignment status.
- Enforce a unique constraint on account ID and a unique constraint on apartment ID for active assignments.
- A resident has at most one active primary apartment. An apartment has at most one active owner.
- Assignment must be an atomic server-side transaction. Concurrent signups must never receive the same unit.
- Assignment is idempotent: retrying signup or the claim request returns the resident's existing assignment rather than consuming another unit.
- Do not accept a client-supplied account ID as proof of ownership. Derive the account identity from the verified server session.

### Saved apartment design

- `apartment_designs`: apartment ID, owner account ID, schema version, revision number, structured design document, and updated timestamp.
- Store a versioned, validated document containing furniture asset IDs and transforms, removals, material/finish selections, lighting settings, décor placements, and any approved room-layout options.
- Store references to approved catalog assets, not arbitrary executable content or client-provided model URLs.
- Use optimistic concurrency (revision check) so an old tab cannot silently overwrite a newer saved design.
- Save and restore the resident's exact last committed design. The server record is authoritative; browser cache may be used only as a temporary performance layer.

## 4. Server API contract

The final route names may follow the project's existing server conventions, but behavior must meet this contract:

- `GET /api/player/apartment`: return the signed-in resident's assignment, unit metadata, interior template, and own saved design. Return no other resident's design.
- `POST /api/player/apartment/claim`: atomically assign an available unit if the signed-in resident has none; otherwise return the existing assignment. Never accept a target account ID from the client.
- `PUT /api/player/apartment/design`: validate and save the signed-in resident's design only when the authenticated account owns the assigned apartment. Require the current revision and return the new revision.
- Optional inventory/availability administration endpoints must be restricted to trusted administrative authorization and must never be exposed as public client write operations.

Every endpoint must use the same verified account session as the existing LAMBO CITY identity. A successful browser sign-in alone is not proof that an apartment API exists or that an assignment has been saved.

## 5. Privacy and integrity rules

1. The server derives the resident identity from a verified session; ignore or reject client-supplied owner IDs.
2. Every read and write checks the active apartment assignment on the server.
3. Residents cannot list, open, edit, or overwrite another resident's private interior or saved design.
4. Enforce unique ownership in the database, not only in UI logic.
5. Validate catalog IDs, transform bounds, item counts, finish IDs, schema version, and payload size on the server.
6. Never evaluate saved design data as code or load arbitrary client-provided scripts/assets.
7. Do not make private interior data publicly cacheable.
8. Keep a revision history or recoverable last-known-good save so malformed or stale writes cannot destroy a resident's home.

## 6. World and runtime architecture

- Keep the building exteriors and apartment inventory separate. A façade can change without changing a resident's apartment ID or saved design.
- Use reusable building shells, unit templates, furniture definitions, and a curated material/finish catalog.
- The world loads low-cost exterior representations for residential buildings. It does not instantiate every private interior at world startup.
- On apartment entry, load only the assigned unit shell, its approved template, and that resident's saved design.
- On exit, release interior-only geometry, textures, and listeners while retaining the server-side save.
- Furniture interaction supports place, move, rotate, remove, and restore-default operations with clear touch-friendly controls for iPad and desktop.
- Materials are selected from approved options: marble and stone floors, granite or marble counters, cabinetry, wall finishes, and future catalog additions.
- Preserve stable unit identity when residents customize their room or when the exterior district is visually upgraded.

## 7. Provisioning and capacity

- The first release must have at least 300 assignable units before public signup-to-apartment assignment is enabled.
- Inventory is not capped at 300. New residential buildings add unit records through the same catalog/template system.
- Assignment must detect inventory exhaustion and fail safely with a clear service state; it must never assign an already-owned unit.
- Seed data and migrations must be repeatable and safe to run more than once.
- Unit numbering and building distribution are finalized only after the measured district parcel plan is approved. This architecture does not assign invented building coordinates or parcel counts.

## 8. Required automated and runtime tests

- Inventory provisioning creates at least 300 distinct active unit IDs.
- 300 simulated account claims produce 300 unique assignments.
- Concurrent claim requests for one account return one stable assignment.
- Concurrent claims by different accounts never allocate the same apartment.
- Retrying a claim is idempotent and does not consume another unit.
- An unauthenticated request cannot claim, read, or save a private apartment.
- Account A cannot read or overwrite Account B's assignment or design, even by guessing IDs.
- A valid design save increments revision and restores the exact saved furniture, transforms, materials, and lighting.
- A stale revision is rejected without overwriting the newer save.
- Invalid asset IDs, out-of-range transforms, oversized documents, and unsupported schema versions are rejected.
- Leaving and re-entering an apartment restores the saved design.
- Entering one apartment does not load the other 299 interiors.
- iPad Safari and desktop runtime tests verify touch/drag behavior, save feedback, private entry, and exit cleanup.

## 9. Completion gate

The apartment system is not complete when 300 doors or façades exist. It is complete only when real registered accounts receive unique private assignments, can enter only their own home, customize it, save it to account-backed storage, leave, return, and recover the exact design. Privacy, concurrency, capacity, and on-demand loading tests must pass.

Until the backend provider and server-side account integration are confirmed, keep this as an implementation contract. Do not represent client-side mock data or localStorage as production ownership or persistence.
