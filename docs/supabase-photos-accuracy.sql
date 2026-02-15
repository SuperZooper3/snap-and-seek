-- Add accuracy (meters) to photos for circle-overlap matching and viz.
-- Run in Supabase SQL editor or via migration tool.

alter table public.photos
  add column if not exists accuracy double precision null;

comment on column public.photos.accuracy is 'GPS accuracy in meters when photo was taken (radius of uncertainty circle).';
