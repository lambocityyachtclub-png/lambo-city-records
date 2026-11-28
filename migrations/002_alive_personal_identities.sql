-- Durable ALIVE personal identities attached to player accounts.
-- Apply only to the isolated player-accounts-dev Neon branch.
CREATE TABLE IF NOT EXISTS alive_personal_identities (
  identity_id text PRIMARY KEY,
  owner_id text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  record jsonb NOT NULL,
  version bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT alive_personal_identities_version_check CHECK (version >= 1),
  CONSTRAINT alive_personal_identities_record_object CHECK (jsonb_typeof(record) = 'object'),
  CONSTRAINT alive_personal_identities_id_matches CHECK (record ->> 'identityId' = identity_id),
  CONSTRAINT alive_personal_identities_owner_matches CHECK (record ->> 'ownerId' = owner_id),
  CONSTRAINT alive_personal_identities_grants_array CHECK (jsonb_typeof(record -> 'grants') = 'array'),
  CONSTRAINT alive_personal_identities_private_memory CHECK (record -> 'privacy' ->> 'memoryAccess' = 'owner-only'),
  CONSTRAINT alive_personal_identities_no_training CHECK (record -> 'privacy' ->> 'trainingUse' = 'false'),
  CONSTRAINT alive_personal_identities_owner_controlled CHECK (record -> 'memoryPolicy' ->> 'ownerControlled' = 'true'),
  CONSTRAINT alive_personal_identities_private_sharing CHECK (record -> 'memoryPolicy' ->> 'sharing' = 'private'),
  CONSTRAINT alive_personal_identities_owner_scope_unique UNIQUE (identity_id, owner_id)
);
CREATE INDEX IF NOT EXISTS alive_personal_identities_owner_updated_idx
  ON alive_personal_identities (owner_id, updated_at DESC);
