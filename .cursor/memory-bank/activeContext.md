# Active Context

## Current focus
- Submissions system, win detection, and game summary page (AI-built).
- Radar proximity search and enhanced god mode (hand-built).
- Debug mode for location override (testing), zone enforcement (block photo capture when outside), and vibration feedback.
- Game flow: lobby → hiding (zone + photo setup) → waiting (ready-up) → seeking (radar + submissions) → completed (summary).

## Recent changes

### Debug mode (hand-built)
- **Debug location cookie:** `lib/debug-location-cookie.ts` — `sas_debug_location` cookie stores `{ lat, lng }`. `getDebugLocation()`, `setDebugLocation()`, `clearDebugLocation()`.
- **getLocation helper:** `lib/get-location.ts` — single `getLocation()` Promise. If debug cookie present → use it; else → `navigator.geolocation.getCurrentPosition`.
- **All location consumers** use `getLocation()`: ZoneWithLocation, SeekingLayout (camera + radar), SetupClient, GameZoneModal, test-upload, LocationDisplay.
- **Debug page** (`/debug`): Start debug mode (uses current GPS as initial location), map with click-to-set location, End debug mode (clears cookie). Link in home footer.
- **Persistence:** Cookie persists across tabs. Ending debug mode clears cookie; location reverts to real GPS.

### Zone enforcement (hand-built)
- **Outside-zone blocking:** "Go to photo capture" button and time's-up popup "Take photo" link disabled when user is outside zone. `ZoneWithLocation` reports via `onOutsideZoneChange`; `HidingLayout` blocks the links.
- **Vibration when outside:** When user is outside zone, phone vibrates continuously (double-pulse pattern every 2.5s) via `navigator.vibrate()`. Stops when back inside. Implemented in `ZoneWithLocation`.

### Submissions & win system (AI-built)
- **Submissions table:** New `submissions` table with `id`, `game_id`, `seeker_id`, `hider_id`, `photo_id`, `status`, `created_at`. Unique constraint on `(game_id, seeker_id, hider_id)` for successful submissions. Migration: `docs/supabase-submissions.sql`.
- **Games winner columns:** Added `winner_id` (FK to players) and `finished_at` (timestamptz) to `games` table. When a player finds all others, game status → `'completed'`.
- **Submissions API:** `POST /api/games/[gameId]/submissions` creates submission (default `'success'`), checks win condition. `GET` returns all submissions for a game.
- **Game status polling API:** `GET /api/games/[gameId]/game-status` returns game status, winner info, and all submissions. Used by 5s polling.
- **Seeking page overhaul:** Pull-up tray now has color-coded target pills (blue=unfound, green=found with checkmark). "I found [Name]!" button per target opens camera modal. After capture → upload → submit → pill turns green. Matched photo shown below hider's photo. 5s polling for game state updates.
- **Win modal:** Full-screen overlay when winner detected — "You won!" or "[Name] won!" with link to summary page.
- **Summary page:** `/games/[gameId]/summary` — 2D grid (seekers × hiders). Column headers show hider's hiding photo. Cells show seeker's submitted match photos. Diagonal = "self". Winner row highlighted with trophy.
- **Completed badge:** Games list and game detail pages show green "completed" badge. Game detail links to summary page when completed.
- **Types updated:** Added `Submission` interface; `Game` now has `winner_id` and `finished_at`.
- **Race condition protection:** Backend uses atomic `WHERE winner_id IS NULL` on winner update. Frontend disables submissions + stops polling once winner detected.

### Radar proximity search (hand-built)
- **Radar API:** `POST /api/games/[gameId]/radar` — accepts seeker's `lat`/`lng`, `targetPlayerId`, and configurable `distanceMeters`. Compares against target's hiding photo GPS. Returns `{ withinDistance, distanceMeters }`.
- **Radar UI:** In seeking tray — compact inline section with icon, "within" label, distance stepper (10m/25m/50m/100m/200m/500m), Search button, Yes/No result badge (green=yes, blue=no, amber=error).

### God mode overhaul (hand-built)
- **Photo locations API:** `GET /api/games/[gameId]/photo-locations` — returns lat/lng of each player's hiding photo.
- **Photo markers on map:** `GodMapView` now shows both live player pings (colored circle with initial) and hiding photo locations (default markers with name labels).
- **Photo tray:** New `GodPhotoTray` — draggable bottom tray showing all players' hiding photos in a horizontally scrollable card layout.
- **Color-coded legend:** Player colors assigned deterministically by ID. Legend bar at bottom shows player name + color dot.
- **God page server component:** Fetches players, hiding photo URLs, and passes `playerPhotos` to `GodMapWithPings`.

### Other hand-built changes
- **GamePageRefresh:** Client component that auto-refreshes game page every 3s for real-time player updates.
- **Setup page:** 3 "Visible from" items (Tree, Building, Path) instead of 2 (Tree, Rock).
- **Seeking timer fix:** Timer display fixes in seeking layout.

## Recent decisions
- Status always `'success'` for now — GPS check and Claude image recognition deferred.
- Win = first player to have successful submissions for ALL other players. Tiebreaker is natural (first to trigger the win-check write wins).
- Game status `'completed'` (not `'finished'`) for the final state.
- 5s polling for game status (consistent with existing patterns).
- No toast library — inline status text for submission feedback.
- Unique constraint on `(game_id, seeker_id, hider_id)` where `status = 'success'` prevents duplicate submissions.
- Radar distances: [10, 25, 50, 100, 200, 500] meters.
- God mode: spectators only (redirect if you're a player in the game).

## Important patterns
- **Location resolution:** Always use `getLocation()` from `lib/get-location.ts`. It checks debug cookie first, then falls back to `navigator.geolocation`.
- **Submission flow:** Tap "I found [Name]!" → camera modal → capture → upload to `/api/upload` → POST `/api/games/[gameId]/submissions` → local state update → pill turns green.
- **Radar flow:** Select target → adjust distance stepper → "Search" → `getLocation()` → POST `/api/games/[gameId]/radar` → Yes/No badge.
- **Polling flow:** Every 5s, fetch `/api/games/[gameId]/game-status` → update submissions state, check for winner → show win modal if winner detected.
- **Game status flow:** `"lobby"` → `"hiding"` → `"seeking"` → `"completed"`.
- **Draggable tray pattern:** Used in both SeekingLayout and GodPhotoTray — pointer events for drag, collapsed/expanded heights, snap-to-state on release.
- Cookie-based player identity (`sas_players`).

## Known issues
- Old orphaned photo rows accumulate in photos table (no cleanup).
- Submission photo URLs from other players' submissions aren't resolved dynamically in the 5s poll — only visible on page reload. The current player's own submissions are resolved immediately.

## Next steps
- GPS proximity check for submissions (compare seeker location vs. hider photo location).
- Claude image recognition API call for visual similarity check.
- Teams system.
- Dynamic "Visible from" items (currently hardcoded).
