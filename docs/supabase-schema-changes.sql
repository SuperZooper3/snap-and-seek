-- Run this in Supabase SQL Editor to support the game management flow.
-- Assumes public.games and public.players already exist.

-- 1. Default new games to "lobby" so join link works as expected
ALTER TABLE public.games
  ALTER COLUMN status SET DEFAULT 'lobby';

-- 2. Index for listing players by game (lobby page)
CREATE INDEX IF NOT EXISTS players_game_id_idx ON public.players (game_id);

-- 3. Add columns to photos table for game/player association (setup page)
ALTER TABLE public.photos
  ADD COLUMN IF NOT EXISTS game_id UUID REFERENCES public.games(id),
  ADD COLUMN IF NOT EXISTS player_id INTEGER REFERENCES public.players(id),
  ADD COLUMN IF NOT EXISTS label TEXT,
  ADD COLUMN IF NOT EXISTS is_main BOOLEAN DEFAULT false;
