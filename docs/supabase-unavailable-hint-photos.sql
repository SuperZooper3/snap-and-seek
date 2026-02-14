-- Add column to store which hint photo types the hider marked as "I don't have this option".
-- These are returned as hints to seekers: "No [tree/building/path] near this spot."
-- Run in Supabase SQL Editor.

ALTER TABLE players
  ADD COLUMN IF NOT EXISTS unavailable_hint_photo_types text[] DEFAULT '{}';

COMMENT ON COLUMN players.unavailable_hint_photo_types IS 'Hint photo types (tree, building, path) the player had no option for; absence is shown as a hint to seekers.';
