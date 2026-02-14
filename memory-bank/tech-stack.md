# Tech Stack

**Frontend**
- Next.js 16 + React 19
- TypeScript
- Tailwind CSS

**Backend**
- Next.js API routes
- Supabase (Postgres)
- Supabase Storage (photos)

**Real-time** (TBD)
- Options: Supabase Realtime or polling

**Maps** (TBD)
- Options: Google Maps or Mapbox

**Note**: Technical decisions flexible - make choices as we build

---

## Database Schema Notes

### Photos Table (Current - Minimal MVP)
Current schema:
- `id` (uuid, primary key)
- `url` (text)
- `storage_path` (text)
- `created_at` (timestamptz)

**TODO - Future fields to add:**
- `game_id` (uuid) - Associate photo with specific game
- `team_id` (uuid) - Which team uploaded this photo
- `latitude` (float) - GPS coordinates where photo was taken
- `longitude` (float) - GPS coordinates where photo was taken
- `hints` (text or jsonb) - Additional hints for seekers
- `metadata` (jsonb) - Flexible storage for game-specific data
