# Game Flow

## Development Status

### Implemented
1. **Photo Upload Test Page** (`/test-upload`)
   - In-app camera viewfinder (`getUserMedia`, rear camera)
   - Shutter, preview, retake/use-photo flow
   - Geolocation tagging at capture (browser Geolocation API, `enableHighAccuracy`)
   - Server-side reverse geocoding (Google Geocoding API) → human-readable `location_name`
   - Upload to Supabase Storage + insert into `photos` table with location
   - Photo grid displays location (address, coords fallback, or "unavailable")

2. **Game management & zone**
   - **Create/join:** `/games`, `/games/new`, `/join/[gameId]` (shareable link), players list on game page.
   - **Set game zone (required before start):** Modal with current location, slider 50m–1km, map (red outside polygon, red zone circle, blue pin + accuracy). Saves to `games.zone_center_lat/lng/radius_meters`. Start game disabled until zone set + ≥2 players.
   - **Start game:** PATCH status to `hiding`, redirect to zone view. Button label "Start hiding".
   - **Zone view** (`/games/[gameId]/zone`): Full-screen map, zone boundary, live location every 10s (countdown, "Blue is where you are"), single blue pin + single accuracy circle, warning if entirely outside zone. "Go to photo capture" → capture page.
   - **Photo capture** (`/games/[gameId]/capture`): Placeholder "coming soon" page.

### To Be Implemented
1. **Lobby**: Join with code (optional; currently join via link).
2. **Setup**: Real photo capture in game (camera + upload tied to game/team).
3. **Active Play**: Find other teams' locations via GPS + questions.
4. **Results**: Winner, stats, replay.

## Full Game Flow (Target)

### 1. Landing & Lobby
- Create new game (set boundaries, duration)
- Generate shareable join code
- Join existing game with code
- Wait for all players to ready up

### 2. Photo Setup Phase
- Each team navigates to their hiding spot
- Take photo using device camera (integrate `/api/upload`)
- Capture GPS coordinates automatically
- Optional: add hints
- Lock in selection

### 3. Active Play Phase
- Map view showing:
  - Game boundary
  - Your current position
  - Other teams' photos (targets)
  - Progress indicators
- Question system:
  - "Am I within 50m/100m?"
  - "Hotter or colder?"
  - Request hints
- Auto-detect when you reach a target location
- Race to find all spots

### 4. Results Screen
- Winner announcement
- Stats (distance traveled, time to find each spot)
- MVP/achievements
- Option to play again

## Design Principles
- Mobile-first (phone optimized)
- Maximum whimsy over competition
- Fast iteration over perfection
