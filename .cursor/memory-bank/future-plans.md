# Future Implementation Plan

## Immediate Next Steps

### 1. ~~Enhance Photos Table Schema~~ (DONE)
`latitude`, `longitude`, `location_name` columns added. Camera capture + geolocation tagging + reverse geocoding implemented.
`game_id`, `player_id`, `label`, `is_main` columns added for setup page. Migration SQL in `docs/supabase-schema-changes.sql`.

**IMPORTANT — Photo labeling concern:**
Currently non-main photos use a simple text `label` field (e.g., "Tree", "Rock") to distinguish categories. When the "Visible from" items become dynamic (not hardcoded), this system needs to be made more robust:
- Consider a dedicated `item_id` foreign key referencing a new `game_items` or `setup_items` table.
- Or add a unique constraint on `(game_id, player_id, label)` to prevent duplicates.
- Need reliable per-category queries: "get all photos for player X in game Y, grouped by item."
- Current text-label approach works for the hardcoded demo but will break down with user-defined items (duplicates, renames, etc.).

### 2. Game Lobby System
**Priority: HIGH**

**Database:**
- Enhance `games` table with:
  - `join_code` (6-char unique code)
  - `center_lat`, `center_lng` (game boundary center)
  - `radius_meters` (boundary size)
  - `duration_minutes`
  - `status` (waiting/setup/active/finished)
  - `max_teams`

**API Routes:**
- `/api/games/create` - Create new game, generate join code
- `/api/games/join` - Join game with code
- `/api/games/[id]` - Get game details
- `/api/games/[id]/start` - Start game (move to setup phase)

**UI Pages:**
- `/` - Landing page with Create/Join buttons
- `/lobby/[gameId]` - Lobby screen showing joined players

### 3. Teams System
**Priority: HIGH**

**Database:**
```sql
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id),
  name TEXT,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id),
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**API Routes:**
- `/api/teams/create` - Create team within game
- `/api/teams/join` - Join existing team

### 4. GPS Tracking
**Priority: HIGH**

**Client-Side:**
- Use browser Geolocation API
- Poll user position every 2-5 seconds
- Update player position in real-time

**Database:**
```sql
CREATE TABLE player_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  game_id UUID REFERENCES games(id),
  latitude FLOAT,
  longitude FLOAT,
  accuracy FLOAT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);
```

**API Routes:**
- `/api/position/update` - Update player position
- `/api/position/[gameId]` - Get all positions for game

**Maps Implementation:**
- Install: `npm install @react-google-maps/api` (already installed)
- Create client-only map component (e.g. `MapDisplay.tsx`)
  - Takes `lat`, `lng` as props
  - Uses `useJsApiLoader` + `GoogleMap` + `Marker`
  - Container: `width: 100%` and `min-height: 300px` or `50vh`
- Load with `next/dynamic(..., { ssr: false })` to avoid SSR issues

**Libraries:**
- `@react-google-maps/api` for Google Maps (already installed)
- Turf.js for distance calculations

### 5. ~~Camera Integration~~ (DONE)
Implemented via `getUserMedia` with `facingMode: "environment"` (rear camera). `CameraCapture` shared component with viewfinder, shutter, preview, retake, `autoStart`/`fullScreen` props. Wrapped in `CameraModal` for full-screen overlay use. Geolocation captured at time of photo. Reverse geocoding server-side.

### 6. Proximity Questions System
**Priority: MEDIUM**

**API Routes:**
- `/api/questions/proximity` - Check if within distance
  - Input: user position, target photo ID, distance threshold
  - Output: boolean yes/no
- `/api/questions/temperature` - Compare to last query
  - Track last query position
  - Return "hotter" or "colder"

**Database:**
```sql
CREATE TABLE query_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  game_id UUID,
  target_photo_id UUID,
  latitude FLOAT,
  longitude FLOAT,
  distance_meters FLOAT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 7. Target Discovery System
**Priority: MEDIUM**

Auto-detect when player is within range of a target:
- Check distance to all unfound targets every position update
- Trigger "Found!" animation when within 5-10 meters
- Record find event in database
- Update game progress

**Database:**
```sql
CREATE TABLE find_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID,
  game_id UUID,
  photo_id UUID,
  found_at TIMESTAMPTZ DEFAULT NOW(),
  time_to_find_seconds INT
);
```

### 8. Real-time Updates
**Priority: MEDIUM**

**Options:**
1. **Supabase Realtime** (recommended for hackathon)
   - Subscribe to game state changes
   - Listen for position updates
   - Get notified of discoveries

2. **Polling** (fallback)
   - Poll `/api/games/[id]/state` every 3-5 seconds
   - Simpler but less efficient

### 9. Game State Management
**Priority: HIGH**

**Client-side:**
- Use React Context or Zustand for global game state
- Track: current game, team, position, targets, progress

**State shape:**
```typescript
interface GameState {
  gameId: string;
  teamId: string;
  status: 'lobby' | 'setup' | 'active' | 'finished';
  myPosition: { lat: number; lng: number };
  targets: Photo[];
  foundTargets: string[]; // photo IDs
  otherTeams: Team[];
}
```

## Optional Features (Time Permitting)

### 10. Player Tagging
- Detect when two players are within 5m
- Tag system with time penalties
- Shield power-ups

### 11. Power-ups System
- Earn by completing physical challenges
- Types: Extra Hint, Range Boost, Radar, Speed Boost
- Store in `player_powerups` table

### 12. Hunter Mode
- Temporary GPS visibility
- Chase mechanics with cooldowns

### 13. Results & Stats
- Distance traveled per team
- Time to find each target
- MVP (fastest finder, most creative spot, etc.)
- Export/share results

## Technical Debt to Address

### Authentication
Currently using service role key (bypasses RLS). For production:
- Implement proper auth (Supabase Auth or simple session system)
- Set up Row Level Security policies
- Create client-side Supabase client

### Error Handling
- Add retry logic for failed uploads
- Handle offline scenarios
- Better error messages for users

### Performance
- Optimize image sizes (compress before upload)
- Add image thumbnails for faster loading
- Cache API responses where appropriate

### Testing
- Test on actual mobile devices outdoors
- Test GPS accuracy in different conditions
- Verify map boundaries work correctly

## Development Order Recommendation

For fastest path to playable demo:

1. ✅ Photo upload/display (DONE)
2. ✅ Lobby system (DONE — basic: create, join, player list)
3. ✅ Photo setup phase (DONE — main photo + hardcoded items + camera modal)
4. **Dynamic item selection** — Make "Visible from" items user-configurable
5. **Teams** — Assign players to teams
6. **GPS tracking** — Core mechanic
7. **Map view** — Visualize game state
8. **Active play phase** — Find targets
9. **Basic proximity questions** — Help players search
10. **Auto-discovery** — Detect when targets found
11. **Results screen** — Declare winner

Everything else is polish!
