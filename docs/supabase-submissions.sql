-- Run this in Supabase SQL Editor.
-- Creates the submissions table and adds winner columns to games.

-- 1. Create submissions table
CREATE TABLE public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES public.games(id),
  seeker_id INTEGER NOT NULL REFERENCES public.players(id),
  hider_id INTEGER NOT NULL REFERENCES public.players(id),
  photo_id BIGINT REFERENCES public.photos(id),
  status TEXT NOT NULL DEFAULT 'success'
    CHECK (status IN ('pending', 'success', 'fail')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Index for querying submissions by game
CREATE INDEX submissions_game_id_idx ON public.submissions(game_id);

-- 3. Unique constraint: one successful submission per (game, seeker, hider)
CREATE UNIQUE INDEX submissions_unique_success_idx
  ON public.submissions(game_id, seeker_id, hider_id)
  WHERE status = 'success';

-- 4. Add winner columns to games table
ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS winner_id INTEGER REFERENCES public.players(id),
  ADD COLUMN IF NOT EXISTS finished_at TIMESTAMPTZ;
