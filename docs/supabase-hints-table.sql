-- Create hints table for power-ups casting system
-- Only one CASTING hint per (game, seeker, hider); multiple completed/cancelled allowed.

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

-- Only one active (casting) hint per seeker-hider pair
CREATE UNIQUE INDEX one_casting_hint_per_pair
  ON hints (game_id, seeker_id, hider_id)
  WHERE (status = 'casting');

-- Indexes for efficient querying
CREATE INDEX hints_game_seeker_idx ON hints(game_id, seeker_id);
CREATE INDEX hints_game_status_idx ON hints(game_id, status);
CREATE INDEX hints_created_at_idx ON hints(created_at DESC);

-- Add casting duration to games (safe if column already exists)
ALTER TABLE games ADD COLUMN IF NOT EXISTS powerup_casting_duration_seconds INTEGER DEFAULT 60;
