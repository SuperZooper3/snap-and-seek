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

## Location flow (location-test)
1. User clicks "Get my location" → `navigator.geolocation.getCurrentPosition` (one-shot).
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
2. `SetupClient` renders main photo slot + 2 hardcoded "Visible from" items (Tree, Rock).
3. User taps a slot → `cameraTarget` state set to `"main"` or item id → `CameraModal` opens.
4. `CameraModal` auto-starts camera. User takes photo → retake/use-photo flow.
5. "Use Photo" → `onCapture(blob)` called → modal closes → parent callback fires.
6. Per-item callback (from `makeItemCapture` factory): creates preview URL, sets uploading state, uploads to `/api/upload` with `game_id`, `player_id`, `label`, `is_main`, updates state with uploaded URL.
7. ItemBar shows "Photo Uploaded" badge when complete. Tapping again allows retake.

## Map
- **MapDisplay** (location-test): receives `locations: LocationPoint[]` and `countdownSeconds: number | null`. Renders one `GoogleMap`, multiple `Marker`s. No fitBounds.
- **Game zone modal:** Single zone Circle + Polygon (red outside with hole); no keys so they update in place. Zone overlays drawn after one rAF (`showZoneOverlays`). Blue pin + accuracy circle; fitBounds to zone with padding.
- **Zone view:** `ZoneMapView` gets zone + optional `userPosition`. Zone = Polygon + Circle (library). User = one Marker (library) + one accuracy circle via **imperative** `google.maps.Circle` (ref: create once, `setCenter`/`setRadius` on update) to avoid stacking. Map fitBounds to zone (+ user when present). `fullSize` prop: map fills container (min-height 50vh, resize trigger after load).

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

## Summary page (`/games/[gameId]/summary`)
- Server fetches all players, successful submissions, photo URLs.
- `SummaryGrid`: 2D table (seekers × hiders). Column headers = hider's hiding photo. Cells = seeker's submitted match photo. Diagonal = "self". Winner row highlighted with trophy.

## Data types
- `LocationPoint`: `{ lat, lng, timestamp }`. Exported from `LocationDisplay.tsx`, used by `MapDisplay.tsx`.
- `Photo`: `{ id, url, storage_path, created_at, latitude, longitude, location_name, game_id, player_id }`. Defined in `lib/types.ts`.
- `Game`: `{ id, name, status, created_at, zone fields, hiding/seeking timestamps, winner_id, finished_at }`. Defined in `lib/types.ts`.
- `GameZone`: `{ center_lat, center_lng, radius_meters }`. Defined in `lib/types.ts`.
- `Player`: `{ id, created_at, name, game_id, hiding_photo, tree_photo, building_photo, path_photo }`. Defined in `lib/types.ts`.
- `Submission`: `{ id, game_id, seeker_id, hider_id, photo_id, status, created_at }`. Defined in `lib/types.ts`.
- `lib/map-utils.ts`: `circleToPolygonPoints`, `outerBounds`, `getBoundsForCircle`, `distanceMeters`, `isEntirelyOutsideZone`.
