-- ALIVE schema alignment for the already-approved alive-dev identity and memory tables.
-- Apply manually to alive-dev after owner review; never apply automatically at runtime.

ALTER TABLE public.alive_personal_identity
  ADD COLUMN IF NOT EXISTS appearance_profile JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.alive_personal_identity
  ADD COLUMN IF NOT EXISTS grants JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.alive_memory_entry
  ADD COLUMN IF NOT EXISTS share_with_development BOOLEAN NOT NULL DEFAULT false;

-- Companion-suggested memories must remain private until the owner approves them.
-- Explicit development sharing is a separate owner action and cannot be smuggled
-- into a pending proposal.
DO $alive_proposal_privacy$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname = 'alive_memory_entry_companion_proposal_private'
       AND conrelid = 'public.alive_memory_entry'::regclass
  ) THEN
    ALTER TABLE public.alive_memory_entry
      ADD CONSTRAINT alive_memory_entry_companion_proposal_private
      CHECK (
        state <> 'proposed'
        OR source <> 'companion-suggested'
        OR share_with_development = false
      );
  END IF;
END $alive_proposal_privacy$;

CREATE TABLE IF NOT EXISTS public.alive_companion_preferences (
  owner_id TEXT NOT NULL,
  identity_id TEXT NOT NULL,
  preference_key TEXT NOT NULL,
  record JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (owner_id, identity_id, preference_key),
  CONSTRAINT alive_companion_preferences_identity_owner_fk
    FOREIGN KEY (identity_id, owner_id)
    REFERENCES public.alive_personal_identity (identity_id, owner_id)
    ON DELETE CASCADE,
  CONSTRAINT alive_companion_preferences_record_object
    CHECK (jsonb_typeof(record) = 'object'),
  CONSTRAINT alive_companion_preferences_key_matches
    CHECK (record->>'key' = preference_key),
  CONSTRAINT alive_companion_preferences_identity_matches
    CHECK (record->>'identityId' = identity_id),
  CONSTRAINT alive_companion_preferences_owner_matches
    CHECK (record->>'ownerId' = owner_id),
  CONSTRAINT alive_companion_preferences_private
    CHECK (record->'privacy'->>'visibility' = 'private'),
  CONSTRAINT alive_companion_preferences_no_training
    CHECK (record->'privacy'->>'trainingUse' = 'false'),
  CONSTRAINT alive_companion_preferences_no_cross_world
    CHECK (record->'privacy'->>'crossWorldSharing' = 'false')
);
