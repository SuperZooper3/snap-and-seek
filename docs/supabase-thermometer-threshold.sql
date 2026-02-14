-- Add thermometer distance threshold to games
-- Run in Supabase SQL Editor.

ALTER TABLE games ADD COLUMN IF NOT EXISTS thermometer_threshold_meters INTEGER DEFAULT 100;

COMMENT ON COLUMN public.games.thermometer_threshold_meters IS 'Minimum distance in meters seeker must move from start point to complete thermometer hint';
