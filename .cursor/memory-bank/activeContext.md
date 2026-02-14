# Active Context

## Current focus
- **Power-ups (hints) system:** Time-based casting for Radar, Thermometer, and Photo hints. Casting duration (**Time to Cast**) configurable on the **lobby page** (same level as Hiding period and Edit game zone), not inside the Set game zone modal. Only one casting hint per seeker–hider pair; multiple completed hints allowed. Unlock state persists (optimistic update on completion).
- **Optional hint photos:** Setup enforces Tree/Building/Path — each either a photo or "I don't have this option" checkbox. Unavailable types stored and shown to seekers as free hint (message upfront, no casting).
- Submissions system, win detection, and game summary page (AI-built).
- Radar proximity search (now one of three power-up types) and enhanced god mode (hand-built).
- Debug mode for location override (testing), zone enforcement (block photo capture when outside), and vibration feedback.
- Game flow: lobby → hiding (zone + photo setup) → waiting (ready-up) → seeking (power-ups + submissions) → completed (summary).

## Recent changes

### Power-ups (hints) system
- **Hints table:** `docs/supabase-hints-table.sql` and fix script `docs/supabase-hints-table-fix.sql`. Columns: `id`, `game_id`, `seeker_id`, `hider_id`, `type` ('radar'|'thermometer'|'photo'), `note` (JSON), `casting_duration_seconds`, `status` ('casting'|'completed'|'cancelled'), `created_at`, `completed_at`. **Constraint:** Use partial unique index `one_casting_hint_per_pair` on `(game_id, seeker_id, hider_id) WHERE (status = 'casting')` — NOT a full UNIQUE on (..., status), which would allow only one completed hint per pair.
- **Games:** `powerup_casting_duration_seconds` (default 60). Set on **lobby page** (GameActions) via dropdown "Time to Cast", alongside Hiding period and Edit game zone — **not** inside Set game zone modal. `lib/game-config.ts`: `DEFAULT/MIN/MAX_POWERUP_CASTING_SECONDS`, `getPowerupCastingSeconds()`.
- **APIs:** POST/GET `/api/games/[gameId]/hints` (start hint, list by seeker/status). PATCH/GET `/api/games/[gameId]/hints/[hintId]` (complete/cancel, get one). POST `/api/games/[gameId]/thermometer` (hotter/colder). POST `/api/games/[gameId]/photo-unlock` (list available photos — incl. types with `unavailable: true` — or get photo URL by type). PATCH lock-in accepts `unavailable_photo_types` (array of 'tree'|'building'|'path').
- **Seeking UI:** `PowerupTabs` with folder-style tabs (Radar, Thermometer, Photo). When one hint is casting, other tabs disabled. Per-target completed state: show "✓ Unlocked" / result and prevent re-cast. Components: `CastingTimer`, `RadarPowerup`, `ThermometerPowerup`, `PhotoPowerup`, `HintHistory`.
- **Photo unlock / unavailable hints:** For types where hider chose "I don't have this option", photo-unlock returns `unavailable: true`. PhotoPowerup shows the absence message **upfront** (e.g. "This player has no tree or similar landmark near their spot") with **no Unlock button** — seekers don't spend cast time on non-existent hints.
- **Photo unlock persistence:** On hint completion, add returned hint to `completedHints` immediately so "✓ Unlocked" doesn’t revert before next poll.
- **Next.js images:** `next.config.ts` — `images.remotePatterns` with `hostname: '*.supabase.co'`, `pathname: '/storage/v1/object/public/**'` for Supabase Storage URLs.
- **Optional hint photos (setup):** SetupClient: per-item checkbox "I don't have this option" (disabled when photo uploaded). Next enabled only when main photo + all three items satisfied (photo or checkbox). Lock-in sends `unavailable_photo_types`. DB: `players.unavailable_hint_photo_types` (text[]). Migration: `docs/supabase-unavailable-hint-photos.sql`.

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

### Radar (as power-up)
- **Radar** is one of three power-up types. Same backend idea: `POST /api/games/[gameId]/radar` for instant check; hints flow uses POST hints → casting timer → PATCH complete with result. Radar UI in seeking: distance stepper, "Cast Radar", then result when completed. Legacy radar API still used for the actual distance check when completing the radar hint.

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
- **Power-ups flow:** Select target → choose tab (Radar/Thermometer/Photo) → start hint (POST `/api/games/[gameId]/hints`) → CastingTimer runs → on complete, PATCH hint with resultData → optimistically add to `completedHints` so UI doesn’t revert. Poll hints every 2s for active + completed.
- **Radar (power-up):** Distance stepper → Cast Radar → timer → result stored in hint note. Thermometer: set start point, move away, stop when far enough → hotter/colder. Photo: Types with a photo show Unlock → casting → image. Types marked "I don't have this option" by hider show the absence message upfront (no Unlock, no casting).
- **Polling flow:** Every 5s, fetch `/api/games/[gameId]/game-status` → update submissions state, check for winner → show win modal if winner detected.
- **Game status flow:** `"lobby"` → `"hiding"` → `"seeking"` → `"completed"`.
- **Draggable tray pattern:** Used in both SeekingLayout and GodPhotoTray — pointer events for drag, collapsed/expanded heights, snap-to-state on release.
- Cookie-based player identity (`sas_players`).

## Known issues
- Old orphaned photo rows accumulate in photos table (no cleanup).
- Submission photo URLs from other players' submissions aren't resolved dynamically in the 5s poll — only visible on page reload. The current player's own submissions are resolved immediately.
- If hints table was created with the wrong UNIQUE constraint (including `status`), run `docs/supabase-hints-table-fix.sql` in Supabase SQL Editor to drop and recreate with partial unique index.

## Next steps
- GPS proximity check for submissions (compare seeker location vs. hider photo location).
- Claude image recognition API call for visual similarity check.
- Teams system.
- Dynamic "Visible from" items (currently hardcoded).
- Optional: pass `resultData: { unlocked: true }` when completing photo hint from CastingTimer so note stores it explicitly.
