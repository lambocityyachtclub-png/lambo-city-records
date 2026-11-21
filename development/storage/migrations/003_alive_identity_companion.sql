-- ALIVE personal identity and private Companion storage.
-- Apply only to the isolated ALIVE development database after owner review.
-- This migration is never applied automatically by application code.

BEGIN;

CREATE TABLE IF NOT EXISTS public.alive_personal_identities (
  identity_id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  record JSONB NOT NULL,
  version BIGINT NOT NULL DEFAULT 1 CHECK (version >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT alive_identity_record_object CHECK (jsonb_typeof(record) = 'object'),
  CONSTRAINT alive_identity_id_matches_record CHECK (record->>'identityId' = identity_id),
  CONSTRAINT alive_identity_owner_matches_record CHECK (record->>'ownerId' = owner_id),
  CONSTRAINT alive_identity_private_memory CHECK (record->'privacy'->>'memoryAccess' = 'owner-only'),
  CONSTRAINT alive_identity_no_training CHECK (record->'privacy'->>'trainingUse' = 'false'),
  CONSTRAINT alive_identity_owner_controlled_memory CHECK (record->'memoryPolicy'->>'ownerControlled' = 'true'),
  CONSTRAINT alive_identity_private_memory_sharing CHECK (record->'memoryPolicy'->>'sharing' = 'private'),
  CONSTRAINT alive_identity_grants_array CHECK (jsonb_typeof(record->'grants') = 'array'),
  CONSTRAINT alive_identity_owner_scope_unique UNIQUE (identity_id, owner_id)
);

CREATE INDEX IF NOT EXISTS alive_personal_identities_owner_updated_idx
  ON public.alive_personal_identities (owner_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS public.alive_companion_memories (
  memory_id TEXT NOT NULL,
  identity_id TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  record JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (owner_id, identity_id, memory_id),
  CONSTRAINT alive_companion_memory_identity_owner_fk
    FOREIGN KEY (identity_id, owner_id)
    REFERENCES public.alive_personal_identities (identity_id, owner_id)
    ON DELETE CASCADE,
  CONSTRAINT alive_companion_memory_record_object CHECK (jsonb_typeof(record) = 'object'),
  CONSTRAINT alive_companion_memory_id_matches CHECK (record->>'memoryId' = memory_id),
  CONSTRAINT alive_companion_memory_identity_matches CHECK (record->>'identityId' = identity_id),
  CONSTRAINT alive_companion_memory_owner_matches CHECK (record->>'ownerId' = owner_id),
  CONSTRAINT alive_companion_memory_private CHECK (record->'privacy'->>'visibility' = 'private'),
  CONSTRAINT alive_companion_memory_no_training CHECK (record->'privacy'->>'trainingUse' = 'false'),
  CONSTRAINT alive_companion_memory_no_cross_world CHECK (record->'privacy'->>'crossWorldSharing' = 'false')
);

CREATE INDEX IF NOT EXISTS alive_companion_memories_owner_identity_created_idx
  ON public.alive_companion_memories (owner_id, identity_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.alive_companion_preferences (
  owner_id TEXT NOT NULL,
  identity_id TEXT NOT NULL,
  preference_key TEXT NOT NULL,
  record JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (owner_id, identity_id, preference_key),
  CONSTRAINT alive_companion_preference_identity_owner_fk
    FOREIGN KEY (identity_id, owner_id)
    REFERENCES public.alive_personal_identities (identity_id, owner_id)
    ON DELETE CASCADE,
  CONSTRAINT alive_companion_preference_record_object CHECK (jsonb_typeof(record) = 'object'),
  CONSTRAINT alive_companion_preference_key_matches CHECK (record->>'key' = preference_key),
  CONSTRAINT alive_companion_preference_identity_matches CHECK (record->>'identityId' = identity_id),
  CONSTRAINT alive_companion_preference_owner_matches CHECK (record->>'ownerId' = owner_id),
  CONSTRAINT alive_companion_preference_private CHECK (record->'privacy'->>'visibility' = 'private'),
  CONSTRAINT alive_companion_preference_no_training CHECK (record->'privacy'->>'trainingUse' = 'false'),
  CONSTRAINT alive_companion_preference_no_cross_world CHECK (record->'privacy'->>'crossWorldSharing' = 'false')
);

-- Existing ALIVE development databases may already have a legacy
-- alive_companion_preferences table whose composite FK points to the old
-- alive_personal_identity table. Rebind it to the versioned identity table
-- only when every existing preference already has a matching new identity.
-- Never silently orphan legacy preferences during this migration.
DO $
DECLARE
  orphaned_preferences BIGINT := 0;
BEGIN
  IF to_regclass('public.alive_companion_preferences') IS NOT NULL THEN
    SELECT COUNT(*) INTO orphaned_preferences
      FROM public.alive_companion_preferences preference
      LEFT JOIN public.alive_personal_identities identity
        ON identity.identity_id = preference.identity_id
       AND identity.owner_id = preference.owner_id
     WHERE identity.identity_id IS NULL;

    IF orphaned_preferences > 0 THEN
      RAISE EXCEPTION 'ALIVE preferences exist without matching versioned identities; reconcile legacy identity records before migration';
    END IF;

    ALTER TABLE public.alive_companion_preferences
      DROP CONSTRAINT IF EXISTS alive_companion_preferences_identity_owner_fk;
    ALTER TABLE public.alive_companion_preferences
      DROP CONSTRAINT IF EXISTS alive_companion_preference_identity_owner_fk;
    ALTER TABLE public.alive_companion_preferences
      ADD CONSTRAINT alive_companion_preference_identity_owner_fk
      FOREIGN KEY (identity_id, owner_id)
      REFERENCES public.alive_personal_identities (identity_id, owner_id)
      ON DELETE CASCADE;
  END IF;
END $;

COMMENT ON TABLE public.alive_personal_identities IS
  'Portable personal ALIVE identities. A world or company does not own these records.';
COMMENT ON TABLE public.alive_companion_memories IS
  'Private Companion memories scoped by both authenticated personal owner and identity.';
COMMENT ON TABLE public.alive_companion_preferences IS
  'Private Companion preferences scoped by both authenticated personal owner and identity.';

COMMIT;
