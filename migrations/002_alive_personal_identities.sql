-- ALIVE personal identity persistence.
-- Apply only to an isolated development database after reviewing this migration.
-- Account authentication remains a separate boundary; owner_id is an authenticated
-- subject identifier and intentionally has no foreign key to a specific account schema.

BEGIN;

CREATE TABLE IF NOT EXISTS alive_personal_identities (
  identity_id text PRIMARY KEY,
  owner_id text NOT NULL,
  record jsonb NOT NULL,
  version bigint NOT NULL DEFAULT 1 CHECK (version >= 1),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT alive_identity_record_object CHECK (jsonb_typeof(record) = 'object'),
  CONSTRAINT alive_identity_id_matches_record CHECK (record->>'identityId' = identity_id),
  CONSTRAINT alive_identity_owner_matches_record CHECK (record->>'ownerId' = owner_id),
  CONSTRAINT alive_identity_private_memory CHECK (record->'privacy'->>'memoryAccess' = 'owner-only'),
  CONSTRAINT alive_identity_no_training CHECK (record->'privacy'->>'trainingUse' = 'false'),
  CONSTRAINT alive_identity_owner_controlled_memory CHECK (record->'memoryPolicy'->>'ownerControlled' = 'true'),
  CONSTRAINT alive_identity_private_memory_sharing CHECK (record->'memoryPolicy'->>'sharing' = 'private'),
  CONSTRAINT alive_identity_grants_array CHECK (jsonb_typeof(record->'grants') = 'array')
);

CREATE INDEX IF NOT EXISTS alive_personal_identities_owner_updated_idx
  ON alive_personal_identities (owner_id, updated_at DESC);

COMMENT ON TABLE alive_personal_identities IS
  'Portable personal ALIVE identities. A world or company does not own these records.';
COMMENT ON COLUMN alive_personal_identities.owner_id IS
  'Authenticated personal subject ID; deliberately independent of a particular account provider schema.';
COMMENT ON COLUMN alive_personal_identities.record IS
  'Validated identity contract JSON. Raw companion memory and provider credentials are not stored here.';

COMMIT;
