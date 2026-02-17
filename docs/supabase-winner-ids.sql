-- Support multiple winners (e.g. after a withdraw causes a tie).
-- Run in Supabase SQL Editor.

ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS winner_ids integer[] DEFAULT NULL;

COMMENT ON COLUMN public.games.winner_ids IS 'All player IDs who won (ties). When set, winner_id is the first of these for backward compat.';
