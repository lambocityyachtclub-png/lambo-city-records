-- ALIVE persistent task and owner-review storage.
-- Apply explicitly to the isolated alive-dev branch before enabling a hosted
-- worker. Application requests never run migrations automatically.

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

DO $migration$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.lambo_alive_reviews'::regclass
      AND conname = 'lambo_alive_reviews_status_check'
  ) THEN
    ALTER TABLE public.lambo_alive_reviews
      ADD CONSTRAINT lambo_alive_reviews_status_check
      CHECK (status IN (
        'awaiting_owner_review',
        'approved',
        'rejected'
      ));
  END IF;
END
$migration$;

CREATE INDEX IF NOT EXISTS lambo_alive_reviews_status_created
  ON public.lambo_alive_reviews (status, created_at DESC);

CREATE INDEX IF NOT EXISTS lambo_alive_reviews_task
  ON public.lambo_alive_reviews (task_id);
