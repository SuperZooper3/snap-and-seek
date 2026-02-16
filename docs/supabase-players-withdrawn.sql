-- Allow withdrawing a player during play (their photo is no longer a target, they don't count toward win).
-- Run in Supabase SQL editor or via migration tool.

alter table public.players
  add column if not exists withdrawn_at timestamp with time zone null;

comment on column public.players.withdrawn_at is 'When set, player is withdrawn from the current round: not a find target, not counted in win condition.';
