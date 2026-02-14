# Tech Context

## Stack
- **Next.js** 16 (App Router).
- **React** 19.
- **Supabase** (server-side client, service role; `lib/supabase.ts`).
- **Tailwind CSS** v4.
- **Google Maps:** `@react-google-maps/api` for in-app map; Maps JavaScript API for location-test.
- **Google Geocoding API:** server-side reverse geocoding in `/api/upload` (requires separate enable in Cloud Console).

## Env
- `.env.local` (from `.env.example`): `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.
- Google key: used client-side for maps, server-side for Geocoding API.

## Key paths
- `app/page.tsx` — home (games list + CreateGameForm, footer links: View all games, Debug mode).
- `app/games/page.tsx` — game management list. Status badges: lobby (gray), hiding (amber), seeking (sky), completed (green).
- `app/games/new/page.tsx` — create game form → POST `/api/games` → redirect to game page.
- `app/games/[gameId]/page.tsx` — server: game + players, join URL, zone, currentPlayer (from cookie); renders `GameActions` + `PlayerList` + `GamePageRefresh`. Auto-redirects to seeking/zone if game active (bypass with `?manage=1`).
- `app/games/[gameId]/GameActions.tsx` — client: copy join link, Hiding period dropdown, **Time to Cast** dropdown, **Thermometer distance** dropdown (25/50/100/150/200m), Set/Edit zone button, Start game. Status badge + navigation. Completed → link to summary.
- `app/games/[gameId]/GamePageRefresh.tsx` — client: auto-refreshes game page every 3s for real-time player updates.
- `app/games/[gameId]/GameZoneModal.tsx` — client: full-screen modal, geolocation, slider 50m–1km, map with zone overlays. Saves zone only (center + radius) via PATCH; Time to Cast is on lobby page.
- `app/games/[gameId]/PlayerList.tsx` — client: player list with assume/release identity.
- `app/debug/page.tsx` — debug mode page. Renders `DebugModeClient` (client).
- `app/debug/DebugModeClient.tsx` — client: Start debug (uses getLocation), map click-to-set, End debug. Cookie-based location override.
- `app/games/[gameId]/zone/page.tsx` — server: checks currentPlayer, fetches game + zone + hiding timestamps, renders header + `HidingTimeRemaining` + `ZoneWithLocation` + footer with "Go to photo capture" (blocked when outside) + `StartSeekingTestLink`.
- `app/games/[gameId]/zone/ZoneWithLocation.tsx` — client: 5s location refresh via `getLocation`, countdown, outside-zone warning, vibration when outside, `onOutsideZoneChange` callback. Wraps `ZoneMapView`.
- `app/games/[gameId]/zone/ZoneMapView.tsx` — client: zone polygon + circle, user marker + imperative accuracy circle, fitBounds.
- `app/games/[gameId]/zone/HidingLayout.tsx` — client: hiding layout wrapper. Uses `onOutsideZoneChange` to block photo capture button when outside zone.
- `app/games/[gameId]/zone/HidingTimeRemaining.tsx` — client: countdown timer based on `hiding_started_at` + `hiding_duration_seconds`.
- `app/games/[gameId]/zone/StartSeekingTestLink.tsx` — client: button to PATCH status to "seeking" and navigate to seeking page.
- `app/games/[gameId]/setup/page.tsx` — server: cookie check + game fetch → `SetupClient`.
- `app/games/[gameId]/setup/SetupClient.tsx` — client: main photo slot, 3 "Visible from" items (Tree, Building, Path) with per-item "I don't have this option" checkbox (disabled when photo uploaded). Next enabled when main + all three satisfied (photo or checkbox). Lock-in sends `unavailable_photo_types`. CameraModal, per-item upload callbacks.
- `app/games/[gameId]/seeking/page.tsx` — server: cookie check, game fetch (incl. `seeking_started_at`, `winner_id` with graceful fallback), loads players + hiding photos + submissions, renders `SeekingLayout`.
- `app/games/[gameId]/seeking/SeekingLayout.tsx` — client: map + pull-up tray with target pills, **PowerupTabs** (Radar/Thermometer/Photo), "I found [Name]!" + camera + submission flow, 5s game-status polling, win modal, **HintHistory**.
- `app/games/[gameId]/seeking/PowerupTabs.tsx` — client: folder-style tabs; CastingTimer when active; RadarPowerup, ThermometerPowerup, PhotoPowerup. Polls hints every 2s; on completion adds hint to completedHints so unlock state persists.
- `app/games/[gameId]/seeking/CastingTimer.tsx` — client: countdown for active hint; onComplete(hintId), onCancel(hintId). Fixed deps to avoid infinite setState loop.
- `app/games/[gameId]/seeking/RadarPowerup.tsx`, `ThermometerPowerup.tsx`, `PhotoPowerup.tsx` — client: per-type UI. ThermometerPowerup uses `getLocation()` (debug-aware), requires cast time + distance before Stop, calls `onHintCompleted` for immediate reuse; result at bottom.
- `app/games/[gameId]/seeking/HintHistory.tsx` — client: expandable list of completed hints for current seeker.
- `app/games/[gameId]/seeking/SeekingTimer.tsx` — client: elapsed time since `seeking_started_at`. Supports "bar" and "pill" variants.
- `app/games/[gameId]/summary/page.tsx` — server: fetches game, all players, all submissions, photo URLs; renders winner banner + `SummaryGrid`. Graceful fallback if submissions table doesn't exist yet.
- `app/games/[gameId]/summary/SummaryGrid.tsx` — client: 2D grid table (seekers × hiders) with photo thumbnails, diagonal "self" cells, winner row highlighted.
- `app/games/[gameId]/god/page.tsx` — server: spectator-only (redirects players). Fetches game, zone, players, hiding photo URLs. Renders `GodMapWithPings` with `playerPhotos`.
- `app/games/[gameId]/god/GodMapView.tsx` — client: map with zone overlays, player ping markers (colored circles with initials via SVG data URLs), photo location markers (default pins with name labels). Exports `PlayerMarker` type.
- `app/games/[gameId]/god/GodMapWithPings.tsx` — client: 5s polling for player pings + photo locations. Color-coded player legend. Passes markers to `GodMapView` + renders `GodPhotoTray`.
- `app/games/[gameId]/god/GodPhotoTray.tsx` — client: draggable bottom tray with horizontal scroll of player hiding photos. Same drag pattern as SeekingLayout tray.
- `app/games/[gameId]/capture/page.tsx` — server: placeholder (superseded by setup page).
- `app/join/[gameId]/page.tsx` — join game (name form → POST players → redirect to game page).
- `app/test-upload/page.tsx` — client: camera + geolocation upload page.
- `app/test-upload/CameraCapture.tsx` — re-exports from `components/CameraCapture.tsx`.
- `components/CameraCapture.tsx` — shared: `getUserMedia` viewfinder, shutter, preview/retake/use-photo. Props: `onCapture`, `disabled`, `autoStart`, `fullScreen`.
- `components/CameraModal.tsx` — shared: full-screen camera overlay. Props: `isOpen`, `onClose`, `onCapture`.
- `components/ItemBar.tsx` — shared: clickable item bar with label, photo, status.
- `app/api/upload/route.ts` — server: accepts file + optional lat/lng + optional game_id/player_id/label/is_main, reverse geocodes, uploads to Supabase Storage, inserts into `photos` table.
- `app/api/games/route.ts` — POST: create game.
- `app/api/games/[gameId]/route.ts` — PATCH: update zone, status, `hiding_duration_seconds`, `powerup_casting_duration_seconds`, or `thermometer_threshold_meters`. Validates zone + 2+ players before hiding start.
- `app/api/games/[gameId]/players/route.ts` — POST: add player.
- `app/api/games/[gameId]/pings/route.ts` — POST: record player ping (lat/lng/accuracy). GET: list pings.
- `app/api/games/[gameId]/pings/latest/route.ts` — GET: latest ping per player.
- `app/api/games/[gameId]/radar/route.ts` — POST: radar proximity check. Accepts `{ lat, lng, targetPlayerId, distanceMeters }`. Compares seeker GPS vs. target's hiding photo GPS. Returns `{ withinDistance, distanceMeters }`.
- `app/api/games/[gameId]/hints/route.ts` — POST: create hint (seekerId, hiderId, type, initialData). GET: list hints for game (optional seekerId, status).
- `app/api/games/[gameId]/hints/[hintId]/route.ts` — PATCH: complete or cancel hint (status, resultData). GET: single hint.
- `app/api/games/[gameId]/thermometer/route.ts` — POST: hotter/colder/neutral (hintId, currentLat, currentLng). Uses startLat/startLng as fallback when lastLat/lastLng absent. Neutral = distance to target changed ≤10m. Returns distanceFromStart, canComplete, result.
- `app/api/games/[gameId]/photo-unlock/route.ts` — POST: list available photos (hiderId; includes types with `unavailable: true`) or get photo URL (hiderId, photoType; returns `unavailable: true` for opted-out types).
- `app/api/games/[gameId]/photo-locations/route.ts` — GET: returns `{ player_id, name, lat, lng }[]` for all players whose hiding photo has GPS coordinates. Used by god mode.
- `app/api/games/[gameId]/submissions/route.ts` — POST: create submission (default `'success'`), win check. GET: all submissions for game. Atomic winner update with `WHERE winner_id IS NULL`. Rejects submissions for completed games (409).
- `app/api/games/[gameId]/game-status/route.ts` — GET: game status + winner info + all submissions (used by 5s poll).
- `app/api/photos/route.ts` — server: returns all photos.
- `lib/types.ts` — `Photo`, `Game` (incl. zone, timestamps, winner, `powerup_casting_duration_seconds`, `thermometer_threshold_meters`), `GameZone`, `Player`, `Submission`, `Hint` (and Radar/Thermometer/Photo note types).
- `lib/game-config.ts` — hiding duration + `getHidingDurationSeconds`; power-up casting + `getPowerupCastingSeconds`; thermometer threshold + `getThermometerThresholdMeters` (MIN 25, MAX 300, default 100).
- `next.config.ts` — `images.remotePatterns`: `*.supabase.co` with path `/storage/v1/object/public/**` for Supabase Storage photo URLs.
- `lib/supabase.ts` — server-side Supabase client (service role).
- `lib/player-cookie.ts` — cookie-based player identity (read/write/clear per game).
- `lib/debug-location-cookie.ts` — debug location override. Cookie `sas_debug_location`, `getDebugLocation`, `setDebugLocation`, `clearDebugLocation`.
- `lib/get-location.ts` — `getLocation()`: returns Promise with lat/lng. Cookie first (debug mode), else navigator.geolocation. Used by all location consumers.
- `lib/map-utils.ts` — `circleToPolygonPoints`, `outerBounds`, `getBoundsForCircle`, `distanceMeters`, `isEntirelyOutsideZone`.
- `lib/google-maps-loader.ts` — shared Google Maps JS API loader hook (`useGoogleMapsLoader`).
- `docs/supabase-schema-changes.sql` — DB migration SQL (games defaults + players index + photos game columns).
- `docs/supabase-game-zone.sql` — ALTER games add zone columns.
- `docs/supabase-pings.sql` — CREATE player_pings table.
- `docs/supabase-submissions.sql` — CREATE submissions table + ALTER games add winner_id/finished_at.
- `docs/supabase-hints-table.sql` — CREATE hints table (partial unique index) + ALTER games add powerup_casting_duration_seconds. `docs/supabase-thermometer-threshold.sql` — ALTER games add thermometer_threshold_meters (default 100). Use hints-table-fix if wrong UNIQUE.
- `docs/supabase-unavailable-hint-photos.sql` — ALTER players add unavailable_hint_photo_types (text[]).
- `supabase-games-seeking-migration.sql` — ALTER games add hiding/seeking timestamp columns.
- `docs/google-maps-in-app.md` — setup and cost notes for embedding Google Map.

## Cost (Google Maps)
- Maps JS API: billed per map load. Polling/markers don't trigger new loads.
- Geocoding API: billed per request (one per photo upload). Free under $200/month credit (~40k requests).
- See docs and Cloud Console Billing/Reports for usage.
