# Progress

## What works
- Home page: hero, games from Supabase, footer link to Location test.
- Photo upload (`/test-upload`): in-app camera viewfinder (`getUserMedia`, rear camera), shutter/preview/retake flow, geolocation tagging at capture, reverse geocoding to human-readable address, photo grid with location display (pin icon + address or coords).
- Game creation + join flow: create game on home page → game lobby (`/games/[gameId]`) → share join link → join with name (`/join/[gameId]`) → cookie-based identity.
- **Photo setup page** (`/games/[gameId]/setup`): main hiding-spot photo + 3 optional "Visible from" items (Tree, Building, Path). Full-screen camera modal. Photos upload immediately; locked in to player row on "Next" via `/api/games/[gameId]/lock-in`.
- **Waiting page** (`/games/[gameId]/waiting`): polls readiness every 5s with countdown. Ready = `players.hiding_photo IS NOT NULL`. Blue "Start seeking!" button when all ready.
- **Shared components:** `CameraCapture`, `CameraModal`, `ItemBar`.
- `photos` table: `id` (bigint), `url`, `storage_path`, `created_at`, `latitude`, `longitude`, `location_name`, `game_id`, `player_id`.
- `players` table: now has `hiding_photo`, `tree_photo`, `building_photo`, `path_photo` (bigint FK to photos.id).
- Upload API: file + optional lat/lng + game_id/player_id → Supabase Storage + reverse geocode → DB insert. Returns `{ id, url }`.
- Photos API: returns all photos with location fields via `select("*")`.
- Supabase: `games` table (with zone columns + hiding/seeking timestamps), `players` table, `photos` table, `player_pings` table, server client with service role, no RLS.

### Game management & zone (implemented)
- **Games list** (`/games`), **create game** (`/games/new`), **game page** (`/games/[gameId]`): join link, players list (with assume/release identity), Set/Edit game zone button, Start game (requires zone + 2+ players).
- **GamePageRefresh:** Auto-refreshes game page every 3s so new players stream in without manual refresh.
- **Set game zone modal:** Current location, slider 50m–1km, map with red shaded outside (polygon with hole), single red zone circle (empty inside), blue pin + light blue accuracy circle. Refresh location; save zone via PATCH. Map fills modal; fitBounds to zone (~90% fill). Zone required before start.
- **Start game:** PATCH status to `hiding` (sets `hiding_started_at`); redirects to `/games/[gameId]/zone`. Lobby shows "Start hiding" button linking to zone.
- **Player identity:** Cookie `sas_players` stores per-game `{ id, name }`. "Start hiding" only shown when `currentPlayer` is set. PlayerList: tap player to assume identity; "Release my identity" to clear. Zone/capture pages redirect if !currentPlayer.
- **Zone view** (`/games/[gameId]/zone`): Protected (redirect if !currentPlayer). Full-screen map (mobile), zone polygon + circle. Live location every 5s with countdown. Single blue pin + imperative accuracy circle (no stacking). Outside-zone warning (red banner). **Photo capture blocked** when outside zone (button disabled + vibration on mobile). Hiding time remaining countdown. "Go to photo capture" → `/games/[gameId]/setup` (only when inside zone). "Start seeking (test)" link.
- **API:** PATCH `/api/games/[gameId]` accepts zone fields, `status: 'hiding'` (validates zone + 2+ players), `status: 'seeking'` (sets `seeking_started_at`), `hiding_duration_seconds`.
- **DB:** Run `docs/supabase-game-zone.sql` in Supabase to add zone columns.

### Seeking phase (implemented)
- **Seeking page** (`/games/[gameId]/seeking`): `SeekingLayout` with map (reuses `ZoneWithLocation`) + floating `SeekingTimer` pill showing elapsed time since `seeking_started_at`. Pull-up bottom tray with color-coded target pills (blue=unfound, green=found with checkmark). "I found [Name]!" button per target opens camera modal. Photo upload + submission flow. 5s polling for game status updates.
- **Radar proximity search:** In seeking tray — compact UI with distance stepper (10/25/50/100/200/500m) and Search button. Backend: `POST /api/games/[gameId]/radar` compares seeker GPS vs. hider's hiding photo GPS using `distanceMeters()` from `map-utils`. Returns Yes/No with color-coded badge.
- **Submissions system:** `submissions` table with `game_id`, `seeker_id`, `hider_id`, `photo_id`, `status`. POST API creates submission and checks win condition. GET API returns all submissions. Game-status polling API returns game state + submissions.
- **Win detection:** When a player has successful submissions for all other players, game status → `'completed'`, `winner_id` set, `finished_at` recorded. Win modal overlay on seeking page. First to complete wins (natural tiebreaker). Race condition protection: atomic `WHERE winner_id IS NULL` on DB update; frontend disables UI + stops polling once winner detected.
- **Summary page** (`/games/[gameId]/summary`): 2D grid (seekers × hiders) with photo thumbnails. Winner banner with trophy. Column headers show hider's hiding photo. Diagonal cells marked "self". Scrollable on mobile.
- **Completed badge:** Games list and game detail pages show green "completed" status badge. Game detail links to summary page when completed.
- **Game page auto-redirect:** If currentPlayer and status is "seeking" → redirect to seeking page. If "hiding" → redirect to zone. Bypass with `?manage=1`.
- **God mode** (`/games/[gameId]/god`): Spectator-only view (redirects players). Map shows live player pings (color-coded circle markers with initials) + hiding photo locations (default markers with name labels). Draggable bottom photo tray shows all players' hiding photos. Color-coded legend. 5s auto-refresh for positions.
- **Player pings:** POST/GET `/api/games/[gameId]/pings` + GET `/api/games/[gameId]/pings/latest`. `player_pings` table.

### Debug mode (implemented)
- **`/debug` page:** Start debug mode (uses current GPS), click map to set fake location, End debug mode (clears cookie). Link in home footer.
- **`lib/debug-location-cookie.ts`:** Cookie `sas_debug_location` with lat/lng. `getDebugLocation`, `setDebugLocation`, `clearDebugLocation`.
- **`lib/get-location.ts`:** `getLocation()` — cookie first, else navigator.geolocation. All location consumers use this.
- **Vibration API:** When outside zone, `navigator.vibrate([200, 100, 200])` every 2.5s until back inside.

## What's left
- **DB migration required:** Run `docs/supabase-submissions.sql` in Supabase SQL Editor to create submissions table and add winner columns to games.
- GPS proximity check for submissions (compare seeker GPS vs. hider photo GPS) — currently all submissions default to `'success'`.
- Claude image recognition for visual similarity — deferred.
- Google Geocoding API must be enabled in Cloud Console for reverse geocoding to work.
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` must be in `.env.local`.
- Make "Visible from" items dynamic (currently hardcoded to Tree, Building, Path).
- Teams — not started.

## Known issues
- Desktop front-facing webcam appears "flipped" — expected; rear camera on mobile is correct.
- No EXIF GPS extraction (getUserMedia canvas blobs lack EXIF); relies entirely on browser geolocation.
- Orphaned photo rows accumulate (no cleanup when retaking).

## Evolution
- Started with redirect to Google Maps; switched to in-app map.
- Location test: polling, history, pins, countdown, points list, blue-dot markers.
- Photo upload: started as file-input picker → replaced with in-app camera viewfinder + geolocation tagging + reverse geocoding + location display in photo grid.
- Camera component: started in `app/test-upload/` → moved to shared `components/CameraCapture.tsx` with `autoStart`/`fullScreen` props. Wrapped in `CameraModal` for setup page.
- Game management: added games/players, join link, Set game zone modal (geolocation + slider + map with red outside/zone circle). Zone stored on games; required before start. Start game → redirect to zone view.
- Zone view: full-screen map, live location 10s refresh, countdown, single blue pin + single accuracy circle (imperative Circle to avoid stacking), outside-zone warning. Hiding time remaining. "Go to photo capture" → setup page. "Start seeking (test)" link.
- Player identity: only active players (cookie) can use "Start hiding"; game page PlayerList allows assume and release identity; zone and capture routes redirect if not a player.
- Setup page: wireframe-driven design (from hand-drawn mockups). Main photo + optional "visible from" items with per-item camera modal + upload callbacks. Grew from 2 items (Tree, Rock) to 3 (Tree, Building, Path).
- Seeking phase: seeking page with map + elapsed timer, god mode for spectators, player pings for location tracking. Added radar proximity search (hand-built), submissions + win detection + summary page (AI-built).
- God mode: started as simple map with pings → enhanced with photo location markers, color-coded player icons, draggable photo tray.
