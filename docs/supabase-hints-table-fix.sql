-- FIX: Recreate hints table with correct constraint
-- The original UNIQUE(game_id, seeker_id, hider_id, status) only allows ONE row per
-- (game, seeker, hider, status), so you could only have one "completed" hint ever.
-- We need: only one CASTING hint per pair; multiple completed/cancelled are allowed.

-- 1. Drop existing hints table (any data in it will be lost)
DROP TABLE IF EXISTS hints CASCADE;

-- 2. Create hints table WITHOUT the bad unique constraint
CREATE TABLE hints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  seeker_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  hider_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('radar', 'thermometer', 'photo')),
  note TEXT,
  casting_duration_seconds INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'casting' CHECK (status IN ('casting', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 3. Only one active (casting) hint per seeker-hider pair; multiple completed/cancelled allowed
CREATE UNIQUE INDEX one_casting_hint_per_pair
  ON hints (game_id, seeker_id, hider_id)
  WHERE (status = 'casting');

-- 4. Indexes for queries
CREATE INDEX hints_game_seeker_idx ON hints(game_id, seeker_id);
CREATE INDEX hints_game_status_idx ON hints(game_id, status);
CREATE INDEX hints_created_at_idx ON hints(created_at DESC);

-- 5. Games column (ignore error if it already exists)
ALTER TABLE games ADD COLUMN IF NOT EXISTS powerup_casting_duration_seconds INTEGER DEFAULT 60;
