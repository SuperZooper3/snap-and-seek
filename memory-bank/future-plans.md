# Future Implementation Plan

## Immediate Next Steps

### 1. Enhance Photos Table Schema
When integrating photos into the actual game flow, add these fields to the `photos` table:

```sql
ALTER TABLE photos
ADD COLUMN game_id UUID REFERENCES games(id),
ADD COLUMN team_id UUID,
ADD COLUMN latitude FLOAT,
ADD COLUMN longitude FLOAT,
ADD COLUMN hints TEXT,
ADD COLUMN metadata JSONB;
```

**Fields:**
- `game_id` - Associate photo with specific game session
- `team_id` - Which team uploaded this photo
- `latitude`, `longitude` - GPS coordinates where photo was taken
- `hints` - Optional text hints for seekers
- `metadata` - Flexible JSON storage for game-specific data

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

**Libraries to consider:**
- Leaflet or Mapbox for map display
- Turf.js for distance calculations

### 5. Camera Integration
**Priority: MEDIUM**

Replace file upload with direct camera access:
- Use `<input type="file" accept="image/*" capture="environment">`
- Or use browser MediaDevices API for more control
- Automatically capture GPS coordinates when taking photo
- Integrate with existing `/api/upload` endpoint

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
2. **Lobby system** - Need this to coordinate players
3. **Teams** - Assign players to teams
4. **GPS tracking** - Core mechanic
5. **Map view** - Visualize game state
6. **Photo setup phase** - Let teams hide spots
7. **Active play phase** - Find targets
8. **Basic proximity questions** - Help players search
9. **Auto-discovery** - Detect when targets found
10. **Results screen** - Declare winner

Everything else is polish!
