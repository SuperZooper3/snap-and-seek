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
- `app/page.tsx` — home (games list).
- `app/games/page.tsx` — game management list.
- `app/games/new/page.tsx` — create game form → POST `/api/games` → redirect to game page.
- `app/games/[gameId]/page.tsx` — server: game + players, join URL, zone, currentPlayer (from cookie); renders `GameActions` (zone + currentPlayer) and `PlayerList` (players + currentPlayer).
- `app/games/[gameId]/GameActions.tsx` — client: copy join link, Set/Edit zone, Start game. Receives `currentPlayer`; "Start hiding" only shown when currentPlayer set, else "Join as a player below (tap a name) to start hiding."
- `app/games/[gameId]/PlayerList.tsx` — client: list of players. If !currentPlayer: each player row clickable → `setPlayerInCookie(gameId, { id, name })` (assume identity). If currentPlayer: shows "You are: X" + "Release my identity" → `clearPlayerForGame(gameId)`.
- `app/games/[gameId]/GameZoneModal.tsx` — client: full-screen modal, geolocation, slider 50m–1km, map with zone (red outside polygon, red circle, no green fill), blue pin + accuracy circle. Saves zone via PATCH `/api/games/[gameId]`. Zone overlays rendered after one rAF (`showZoneOverlays`); map fills remaining space; fitBounds to zone with small padding.
- `app/games/[gameId]/zone/page.tsx` — server: checks currentPlayer from cookie; if !currentPlayer redirects to `/games/[gameId]`. Fetches game + zone, renders header + `ZoneWithLocation` + footer with "Go to photo capture".
- `app/games/[gameId]/zone/ZoneWithLocation.tsx` — client: 10s location refresh, countdown "Next refresh in Xs", "Blue is where you are", outside-zone warning, wraps `ZoneMapView` with `userPosition`.
- `app/games/[gameId]/zone/ZoneMapView.tsx` — client: `useJsApiLoader`, zone polygon + circle, optional `userPosition` → single Marker (library) + single imperative `google.maps.Circle` (ref, no stacking). `fullSize` prop for full-screen map; `fitMapToZone` on load and when userPosition changes.
- `app/games/[gameId]/capture/page.tsx` — server: if !currentPlayer redirects to `/games/[gameId]`. Placeholder "Photo capture — coming soon" with back link to zone.
- `app/join/[gameId]/page.tsx` — join game (name form → POST players → redirect to game page).
- `app/location-test/page.tsx` — wraps `LocationDisplay`.
- `app/location-test/LocationDisplay.tsx` — client: geolocation, 10s polling, history state, countdown, points list; loads `MapDisplay` via `next/dynamic` with `ssr: false`.
- `app/location-test/MapDisplay.tsx` — client: `useJsApiLoader`, single map instance, markers from `locations` prop, blue-dot icon, countdown overlay; no fitBounds.
- `app/test-upload/page.tsx` — client: camera + geolocation upload page. Requests geolocation on mount, uses `CameraCapture` for in-app camera, sends photo + coords to `/api/upload`, displays photo grid with location.
- `app/test-upload/CameraCapture.tsx` — client: `getUserMedia` viewfinder (rear camera), shutter via canvas snapshot, preview/retake/use-photo flow.
- `app/api/games/route.ts` — POST: create game (name, status lobby).
- `app/api/games/[gameId]/route.ts` — PATCH: update zone (`zone_center_lat`, `zone_center_lng`, `zone_radius_meters`) and/or `status: 'hiding'` (requires zone set + ≥2 players).
- `app/api/games/[gameId]/players/route.ts` — POST: add player (name, game_id).
- `app/api/upload/route.ts` — server: accepts file + optional lat/lng, reverse geocodes, uploads to Supabase Storage, inserts into `photos` table.
- `app/api/photos/route.ts` — server: returns all photos with `select("*")` (includes location fields).
- `lib/types.ts` — `Photo`, `Game` (incl. zone_center_lat/lng/radius_meters), `GameZone`, `Player`.
- `lib/player-cookie.ts` — cookie `sas_players` (per-game `{ id, name }`). `getPlayerForGame`, `setPlayerInCookie`, `clearPlayerForGame(gameId)` (release identity). Used by join form, game page, zone/capture redirect.
- `lib/map-utils.ts` — `circleToPolygonPoints`, `outerBounds`, `getBoundsForCircle`, `distanceMeters`, `isEntirelyOutsideZone`.
- `docs/google-maps-in-app.md` — setup and cost notes for embedding Google Map.
- `docs/supabase-game-zone.sql` — ALTER games add zone columns; run in Supabase SQL Editor.

## Cost (Google Maps)
- Maps JS API: billed per map load. Polling/markers don't trigger new loads.
- Geocoding API: billed per request (one per photo upload). Free under $200/month credit (~40k requests).
- See docs and Cloud Console Billing/Reports for usage.
