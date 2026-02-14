# System Patterns

## Architecture
- **Home:** Server Component; fetches games via Supabase server client.
- **Location test:** Page is server component; all interactive UI is in client components (`LocationDisplay`, `MapDisplay`). Map script loads only on client via `useJsApiLoader` and dynamic import with `ssr: false`.
- **Photo upload (`/test-upload`):** Client component with `CameraCapture` child. Camera + geolocation both client-side; upload + reverse geocoding server-side via API route.
- **Game lobby (`/games/[gameId]`):** Server component fetches game + players. Client component `GameActions` handles start game, share link, zone modal. `PlayerList` handles assume/release identity. Cookie-based player identity.
- **Photo setup (`/games/[gameId]/setup`):** Server component checks cookie identity (redirects to join if missing), fetches game. Client component `SetupClient` manages photo slots, camera modal, per-item uploads.

## Shared components (`components/`)
- **CameraCapture:** `getUserMedia` viewfinder (rear camera), shutter, preview, retake/use-photo. Props: `onCapture(blob)`, `disabled`, `autoStart` (skip Open Camera button), `fullScreen` (remove max-width, cap at 65vh). Used by `/test-upload` (via re-export) and `CameraModal`.
- **CameraModal:** Fixed full-screen overlay (z-50, bg-black). Header with close button, CameraCapture with `autoStart fullScreen`, flex layout pins controls at bottom. Props: `isOpen`, `onClose`, `onCapture(blob)`. Calls `onCapture` then `onClose` on use-photo.
- **ItemBar:** Clickable bar with label, photo thumbnail, upload status badge. Props: `label`, `photoUrl`, `uploading`, `uploaded`, `onClick`.

## Location flow
- **Central helper:** `getLocation()` from `lib/get-location.ts`. Checks `sas_debug_location` cookie first; if present, returns that. Else uses `navigator.geolocation.getCurrentPosition`. All location consumers (ZoneWithLocation, SeekingLayout, SetupClient, GameZoneModal, test-upload, LocationDisplay) use this.
- **Debug mode:** `/debug` page. Start → sets cookie with current GPS. Click map → updates cookie. End → clears cookie.

## Location flow (location-test)
1. User clicks "Get my location" → `getLocation()` (one-shot).
2. On success: push point to `locationHistory`, set `secondsUntilNextPing` to 10, start 10s interval for `pollLocation`.
3. Every 10s: `getCurrentPosition` again → push to history, reset countdown to 10.
4. 1s interval updates `secondsUntilNextPing` for countdown display.
5. Cleanup: clear both intervals on unmount.

## Camera + Photo Upload flow (test-upload)
1. Page mounts → requests geolocation (`getCurrentPosition`, `enableHighAccuracy: true`).
2. User taps "Open Camera" → `getUserMedia({ video: { facingMode: "environment" } })` → live `<video>` viewfinder.
3. Single `<video>` element stays mounted across loading/streaming states (prevents `srcObject` loss).
4. User taps shutter → canvas snapshot → JPEG blob → preview shown with Retake/Use Photo.
5. "Use Photo" → refreshes geolocation for accuracy → sends `FormData` (file + lat/lng) to `/api/upload`.
6. Server: uploads to Supabase Storage → reverse geocodes via Google Geocoding API → inserts into `photos` table.
7. Graceful degradation: if geolocation denied → uploads without location; if geocoding fails → stores coords only, `location_name` null.

## Photo setup flow (`/games/[gameId]/setup`)
1. Server component checks cookie identity → redirects to `/join/[gameId]` if not joined.
2. `SetupClient` renders main photo slot + 3 "Visible from" items (Tree, Building, Path). Per item: ItemBar + checkbox "I don't have this option" (checkbox disabled when that item has a photo).
3. Satisfied = for each item, either photo uploaded or checkbox checked. Next enabled only when main photo + all three items satisfied.
4. User taps a slot → `cameraTarget` state set → `CameraModal` opens. "Use Photo" → upload via `/api/upload`; lock-in sends `hiding_photo`, `tree_photo`/`building_photo`/`path_photo`, and `unavailable_photo_types` (ids where checkbox checked).
5. ItemBar shows "Photo Uploaded" when complete. Tapping again allows retake.

## Map
- **MapDisplay** (location-test): receives `locations: LocationPoint[]` and `countdownSeconds: number | null`. Renders one `GoogleMap`, multiple `Marker`s. No fitBounds.
- **Game zone modal:** Zone only (center + radius). Single zone Circle + Polygon (red outside with hole); blue pin + accuracy circle; fitBounds to zone. Save via PATCH with zone fields only. Time to Cast is **not** in this modal — it is on the lobby page (GameActions).
- **Zone view:** `ZoneMapView` gets zone + optional `userPosition`. Zone = Polygon + Circle (library). User = one Marker (library) + one accuracy circle via **imperative** `google.maps.Circle` (ref: create once, `setCenter`/`setRadius` on update) to avoid stacking. Map fitBounds to zone (+ user when present). `fullSize` prop: map fills container (min-height 50vh, resize trigger after load).
- **ZoneWithLocation:** Uses `getLocation()` for 5s refresh. Computes `outsideZone` via `isEntirelyOutsideZone`. Reports via `onOutsideZoneChange`. When outside: red banner, vibrates (double-pulse every 2.5s via `navigator.vibrate`), `HidingLayout` blocks photo capture button.

## Player identity (no auth)
- **Cookie** `sas_players`: JSON object `Record<gameId, { id, name }>`. Read via `getPlayerForGame(cookieValue, gameId)` (server or client). Write from client only: `setPlayerInCookie(gameId, { id, name })` (join or assume), `clearPlayerForGame(gameId)` (release).
- **Join flow:** POST `/api/games/[gameId]/players` with name → response has player `id`, `name` → `setPlayerInCookie` → redirect to game page.
- **Assume identity:** On game page, when !currentPlayer, PlayerList renders each player as clickable; onClick → `setPlayerInCookie(gameId, { id: p.id, name: p.name })`, router.refresh().
- **Release identity:** When currentPlayer, "Release my identity" → `clearPlayerForGame(gameId)`, router.refresh(). User no longer that player; "Start hiding" hidden until they assume or join again.
- **Route protection:** Zone page and capture page (server): read cookie, if !getPlayerForGame(decoded, gameId) redirect to `/games/[gameId]`. "Start hiding" link only rendered when currentPlayer.

## Submission flow (`/games/[gameId]/seeking`)
1. Seeking page loads: server fetches game, players, hiding photos, existing submissions.
2. `SeekingLayout` renders pull-up tray with target pills (blue=unfound, green=found).
3. User taps "I found [Name]!" → `submitTargetId` set → `CameraModal` opens.
4. Camera capture → blob returned → upload to `/api/upload` with `game_id`, `player_id`, lat/lng.
5. Upload returns `{ id, url }` → POST to `/api/games/[gameId]/submissions` with `seeker_id`, `hider_id`, `photo_id`.
6. Backend: insert submission (default `'success'`), check win condition (distinct hider count = total players - 1), set winner if first to complete.
7. Response: `{ submission, isWinner }`. Client updates local state → pill turns green, matched photo shown.
8. Every 5s: poll `GET /api/games/[gameId]/game-status` → update submissions + check for winner → show win modal if detected.
9. Win modal: full-screen overlay, "You won!" / "[Name] won!", link to summary page.

## Power-ups (hints) flow (`/games/[gameId]/seeking`)
1. `PowerupTabs` receives `selectedTarget`, `powerupCastingSeconds`. Polls GET hints?seekerId&status=casting and status=completed every 2s; filters by `hider_id === selectedTarget.playerId`.
2. User picks tab (Radar/Thermometer/Photo). If no active hint: can start one via POST `/api/games/[gameId]/hints` with type + initialData. Only one casting hint per (seeker, hider); partial unique index enforces this.
3. `CastingTimer` runs; on expiry calls `onComplete(hintId)`. For Thermometer, `handleCastingComplete` is a no-op (hint stays casting); for Radar/Photo, parent PATCHes with resultData and updates state.
4. Radar: initialData has distanceMeters; on complete, call radar API and PATCH with resultData. Thermometer: initialData has startLat/startLng, thresholdMeters (from game config). Uses `getLocation()` for distance (1s poll) so debug mode works. Stop button appears only after cast time complete; disabled until distance ≥ threshold. User clicks "Stop Thermometer — Get Result" → thermometer API → PATCH with result → `onHintCompleted` optimistically updates state (reuse without poll delay). Result (hotter/colder/neutral) shown at bottom, bold. Neutral = distance to target changed ≤10m. Thermometer reusable (no one-use limit). Photo: initialData has photoType/photoId; on complete, note has photoType; photo-unlock returns URL. Types with `unavailable: true` show absence message upfront.
5. `PhotoPowerup`: availablePhotos can have `unavailable: true`; those show message only. Others: Unlock → cast → show "✓ Unlocked" and image. Duplicate keys/guard in `handleRevealPhoto` for actual photos.

## Summary page (`/games/[gameId]/summary`)
- Server fetches all players, successful submissions, photo URLs.
- `SummaryGrid`: 2D table (seekers × hiders). Column headers = hider's hiding photo. Cells = seeker's submitted match photo. Diagonal = "self". Winner row highlighted with trophy.

## Data types
- `LocationPoint`: `{ lat, lng, timestamp }`. Exported from `LocationDisplay.tsx`, used by `MapDisplay.tsx`.
- `Photo`: `{ id, url, storage_path, created_at, latitude, longitude, location_name, game_id, player_id }`. Defined in `lib/types.ts`.
- `Game`: `{ id, name, status, zone fields, hiding/seeking timestamps, winner_id, finished_at, powerup_casting_duration_seconds, thermometer_threshold_meters }`. Defined in `lib/types.ts`.
- `GameZone`: `{ center_lat, center_lng, radius_meters }`. Defined in `lib/types.ts`.
- `Player`: `{ id, created_at, name, game_id, hiding_photo, tree_photo, building_photo, path_photo, unavailable_hint_photo_types? }`. Defined in `lib/types.ts`.
- `Submission`: `{ id, game_id, seeker_id, hider_id, photo_id, status, created_at }`. Defined in `lib/types.ts`.
- `Hint`: `{ id, game_id, seeker_id, hider_id, type, note, casting_duration_seconds, status, created_at, completed_at }`. type: 'radar'|'thermometer'|'photo'; status: 'casting'|'completed'|'cancelled'. Note is JSON (radar: distanceMeters + result; thermometer: startLat/startLng/thresholdMeters + result; photo: photoType, photoId, unlocked). Defined in `lib/types.ts`.
- `lib/map-utils.ts`: `circleToPolygonPoints`, `outerBounds`, `getBoundsForCircle`, `distanceMeters`, `isEntirelyOutsideZone`.
