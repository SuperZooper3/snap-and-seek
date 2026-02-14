# System Patterns

## Architecture
- **Home:** Server Component; fetches games via Supabase server client.
- **Location test:** Page is server component; all interactive UI is in client components (`LocationDisplay`, `MapDisplay`). Map script loads only on client via `useJsApiLoader` and dynamic import with `ssr: false`.
- **Photo upload (`/test-upload`):** Client component with `CameraCapture` child. Camera + geolocation both client-side; upload + reverse geocoding server-side via API route.

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
6. Server: uploads to Supabase Storage → reverse geocodes via Google Geocoding API → inserts into `photos` table with `url`, `storage_path`, `latitude`, `longitude`, `location_name`.
7. Graceful degradation: if geolocation denied → uploads without location; if geocoding fails → stores coords only, `location_name` null.

## Map
- **MapDisplay** (location-test): receives `locations: LocationPoint[]` and `countdownSeconds: number | null`. Renders one `GoogleMap`, multiple `Marker`s (one per point). Icon: blue-dot, label = index+1, title = "#N — time". Countdown overlay: absolute bottom-center, "Next ping in Xs". No fitBounds.
- **Game zone modal:** Single zone Circle + Polygon (red outside with hole); no keys so they update in place (avoids stacking). Zone overlays drawn after one rAF (`showZoneOverlays`) to avoid stuck initial circle. Blue pin + accuracy circle from current location; map fitBounds to zone with padding.
- **Zone view:** `ZoneMapView` gets zone + optional `userPosition`. Zone = Polygon + Circle (library). User = one Marker (library) + one accuracy circle via **imperative** `google.maps.Circle` (ref: create once, `setCenter`/`setRadius` on update) to avoid stacking. Map fitBounds to zone (+ user when present). `fullSize` prop: map fills container (min-height 50vh, resize trigger after load).

## Player identity (no auth)
- **Cookie** `sas_players`: JSON object `Record<gameId, { id, name }>`. Read via `getPlayerForGame(cookieValue, gameId)` (server or client). Write from client only: `setPlayerInCookie(gameId, { id, name })` (join or assume), `clearPlayerForGame(gameId)` (release).
- **Join flow:** POST `/api/games/[gameId]/players` with name → response has player `id`, `name` → `setPlayerInCookie` → redirect to game page.
- **Assume identity:** On game page, when !currentPlayer, PlayerList renders each player as clickable; onClick → `setPlayerInCookie(gameId, { id: p.id, name: p.name })`, router.refresh().
- **Release identity:** When currentPlayer, "Release my identity" → `clearPlayerForGame(gameId)`, router.refresh(). User no longer that player; "Start hiding" hidden until they assume or join again.
- **Route protection:** Zone page and capture page (server): read cookie, if !getPlayerForGame(decoded, gameId) redirect to `/games/[gameId]`. "Start hiding" link only rendered when currentPlayer.

## Data types
- `LocationPoint`: `{ lat, lng, timestamp }`. Exported from `LocationDisplay.tsx`, used by `MapDisplay.tsx`.
- `Photo`: `{ id, url, storage_path, created_at, latitude, longitude, location_name }`. Defined in `lib/types.ts`.
- `Game`: `id`, `name`, `status`, `created_at`, `zone_center_lat`, `zone_center_lng`, `zone_radius_meters`. `GameZone`: `{ center_lat, center_lng, radius_meters }`.
- `lib/map-utils.ts`: `circleToPolygonPoints`, `outerBounds`, `getBoundsForCircle`, `distanceMeters`, `isEntirelyOutsideZone` (user circle entirely outside zone when `distance > zoneRadius + userAccuracy`).
