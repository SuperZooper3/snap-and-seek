-- Migration: add hiding and seeking phase fields to games
-- Run this in Supabase SQL Editor (or your migration workflow).

-- 1) Hiding duration in seconds (default 1 min = 60, min 30)
ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS hiding_duration_seconds integer NOT NULL DEFAULT 60;

-- Optional: constrain in app (30–86400); DB check if you want:
-- ALTER TABLE public.games
--   ADD CONSTRAINT games_hiding_duration_check
--   CHECK (hiding_duration_seconds >= 30 AND hiding_duration_seconds <= 86400);

-- 2) When the hiding phase started (set when status becomes 'hiding')
ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS hiding_started_at timestamp with time zone NULL;

-- 3) When the seeking phase started (set when status becomes 'seeking')
ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS seeking_started_at timestamp with time zone NULL;

-- No RLS changes required if you're not using RLS on games.
-- If you use RLS, ensure your existing policies still allow read/update as before.
