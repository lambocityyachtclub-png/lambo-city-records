-- Public ALIVE Companion Studio storage, isolated to verified LAMBO CITY accounts.
-- Apply manually to the player-accounts-dev database after owner review.
-- Application code never runs this migration automatically.
BEGIN;
CREATE TABLE IF NOT EXISTS public.alive_personal_identities (
  identity_id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES public."user" (id) ON DELETE CASCADE,
  record JSONB NOT NULL,
  version BIGINT NOT NULL DEFAULT 1 CHECK (version >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT alive_public_identity_record_object CHECK (jsonb_typeof(record) = 'object'),
  CONSTRAINT alive_public_identity_id_matches CHECK (record->>'identityId' = identity_id),
  CONSTRAINT alive_public_identity_owner_matches CHECK (record->>'ownerId' = owner_id),
  CONSTRAINT alive_public_identity_private_memory CHECK (record->'privacy'->>'memoryAccess' = 'owner-only'),
  CONSTRAINT alive_public_identity_no_training CHECK (record->'privacy'->>'trainingUse' = 'false'),
  CONSTRAINT alive_public_identity_owner_controlled CHECK (record->'memoryPolicy'->>'ownerControlled' = 'true'),
  CONSTRAINT alive_public_identity_private_sharing CHECK (record->'memoryPolicy'->>'sharing' = 'private'),
  CONSTRAINT alive_public_identity_grants_array CHECK (jsonb_typeof(record->'grants') = 'array'),
  CONSTRAINT alive_public_identity_owner_scope_unique UNIQUE (identity_id, owner_id)
);
CREATE INDEX IF NOT EXISTS alive_personal_identities_owner_updated_idx ON public.alive_personal_identities (owner_id, updated_at DESC);
CREATE TABLE IF NOT EXISTS public.alive_public_api_rate_limits (
  owner_id TEXT PRIMARY KEY REFERENCES public."user" (id) ON DELETE CASCADE,
  window_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  request_count INTEGER NOT NULL DEFAULT 0 CHECK (request_count >= 0)
);
COMMENT ON TABLE public.alive_personal_identities IS 'Portable ALIVE personal identities owned by verified public accounts, not by a world or storefront.';
COMMENT ON TABLE public.alive_public_api_rate_limits IS 'Per-account rate limits for the public ALIVE Companion API.';
COMMIT;
