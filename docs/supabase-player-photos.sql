-- Run this in Supabase SQL Editor.
-- Adds photo reference columns to the players table and removes
-- the label/is_main tag system from photos.

-- 1. Add photo columns to players (all nullable bigint FKs to photos.id)
ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS hiding_photo BIGINT REFERENCES public.photos(id),
  ADD COLUMN IF NOT EXISTS tree_photo BIGINT REFERENCES public.photos(id),
  ADD COLUMN IF NOT EXISTS building_photo BIGINT REFERENCES public.photos(id),
  ADD COLUMN IF NOT EXISTS path_photo BIGINT REFERENCES public.photos(id);

-- 2. Drop the label/is_main columns from photos (no longer needed)
ALTER TABLE public.photos
  DROP COLUMN IF EXISTS label,
  DROP COLUMN IF EXISTS is_main;
