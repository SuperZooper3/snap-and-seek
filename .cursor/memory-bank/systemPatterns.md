# System Patterns

## Architecture
- **Home:** Server Component; fetches games via Supabase server client.
- **Location test:** Page is server component; all interactive UI is in client components (`LocationDisplay`, `MapDisplay`). Map script loads only on client via `useJsApiLoader` and dynamic import with `ssr: false`.
- **Photo upload (`/test-upload`):** Client component with `CameraCapture` child. Camera + geolocation both client-side; upload + reverse geocoding server-side via API route.
- **Game lobby (`/games/[gameId]`):** Server component fetches game + players. Client component `GameActions` handles start game + share link. Cookie-based player identity.
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
6. Server: uploads to Supabase Storage → reverse geocodes via Google Geocoding API → inserts into `photos` table with `url`, `storage_path`, `latitude`, `longitude`, `location_name`.
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
- **MapDisplay** receives `locations: LocationPoint[]` and `countdownSeconds: number | null`.
- Renders one `GoogleMap`, multiple `Marker`s (one per point). Icon: blue-dot, label = index+1, title = "#N — time".
- Countdown overlay: absolute bottom-center, "Next ping in Xs".
- No fitBounds: initial center/zoom from first point only; subsequent points just add markers.

## Data types
- `LocationPoint`: `{ lat, lng, timestamp }`. Exported from `LocationDisplay.tsx`, used by `MapDisplay.tsx`.
- `Photo`: `{ id, url, storage_path, created_at, latitude, longitude, location_name, game_id, player_id, label, is_main }`. Defined in `lib/types.ts`.
- `Game`: `{ id, name, status, created_at }`. Defined in `lib/types.ts`.
- `Player`: `{ id, created_at, name, game_id }`. Defined in `lib/types.ts`.
