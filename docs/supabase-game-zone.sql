-- Game zone columns for public.games
-- Run in Supabase SQL Editor. Adds zone center (lat/lng) and radius in meters.
-- Zone is required before starting a game.

ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS zone_center_lat double precision NULL,
  ADD COLUMN IF NOT EXISTS zone_center_lng double precision NULL,
  ADD COLUMN IF NOT EXISTS zone_radius_meters double precision NULL;

COMMENT ON COLUMN public.games.zone_center_lat IS 'Latitude of game zone center (set in Set game zone modal)';
COMMENT ON COLUMN public.games.zone_center_lng IS 'Longitude of game zone center';
COMMENT ON COLUMN public.games.zone_radius_meters IS 'Radius of play zone in meters';
