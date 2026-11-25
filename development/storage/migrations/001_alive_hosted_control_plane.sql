-- ALIVE hosted control plane schema.
-- Apply manually to the isolated lambo-city-alive / alive-dev database.
-- This migration is intentionally not executed automatically by application code.

CREATE TABLE IF NOT EXISTS public.lambo_alive_task_state (
  state_key TEXT PRIMARY KEY,
  tasks JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.lambo_alive_reviews (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  status TEXT NOT NULL,
  review JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.lambo_alive_reviews
  DROP CONSTRAINT IF EXISTS lambo_alive_reviews_status_check;

ALTER TABLE public.lambo_alive_reviews
  ADD CONSTRAINT lambo_alive_reviews_status_check
  CHECK (status IN (
    'awaiting_owner_review',
    'approved',
    'rejected',
    'revision_requested'
  ));

CREATE INDEX IF NOT EXISTS lambo_alive_reviews_status_created
  ON public.lambo_alive_reviews (status, created_at DESC);

CREATE INDEX IF NOT EXISTS lambo_alive_reviews_task
  ON public.lambo_alive_reviews (task_id);
