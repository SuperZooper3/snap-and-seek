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
- `app/page.tsx` — home (games list + CreateGameForm).
- `app/games/[gameId]/page.tsx` — game lobby (players list, share link, start game, "Set Up Hiding Spot" button).
- `app/games/[gameId]/GameActions.tsx` — client: start game, copy join link.
- `app/games/[gameId]/setup/page.tsx` — server: cookie check + game fetch → `SetupClient`.
- `app/games/[gameId]/setup/SetupClient.tsx` — client: main photo slot, 2 hardcoded items, CameraModal, per-item upload callbacks.
- `app/join/[gameId]/page.tsx` — join game page; `JoinForm.tsx` — name input + cookie set.
- `app/location-test/page.tsx` — wraps `LocationDisplay`.
- `app/location-test/LocationDisplay.tsx` — client: geolocation, 10s polling, history state, countdown, points list; loads `MapDisplay` via `next/dynamic` with `ssr: false`.
- `app/location-test/MapDisplay.tsx` — client: `useJsApiLoader`, single map instance, markers from `locations` prop, blue-dot icon, countdown overlay; no fitBounds.
- `app/test-upload/page.tsx` — client: camera + geolocation upload page.
- `app/test-upload/CameraCapture.tsx` — re-exports from `components/CameraCapture.tsx`.
- `components/CameraCapture.tsx` — shared: `getUserMedia` viewfinder, shutter, preview/retake/use-photo. Props: `onCapture`, `disabled`, `autoStart`, `fullScreen`.
- `components/CameraModal.tsx` — shared: full-screen camera overlay. Props: `isOpen`, `onClose`, `onCapture`.
- `components/ItemBar.tsx` — shared: clickable item bar with label, photo, status. Props: `label`, `photoUrl`, `uploading`, `uploaded`, `onClick`.
- `app/api/upload/route.ts` — server: accepts file + optional lat/lng + optional game_id/player_id/label/is_main, reverse geocodes, uploads to Supabase Storage, inserts into `photos` table.
- `app/api/games/route.ts` — server: GET/POST games.
- `app/api/games/[gameId]/route.ts` — server: PATCH game status.
- `app/api/games/[gameId]/players/route.ts` — server: POST add player.
- `app/api/photos/route.ts` — server: returns all photos with `select("*")`.
- `lib/types.ts` — `Photo`, `Game`, `Player` interfaces.
- `lib/supabase.ts` — server-side Supabase client (service role).
- `lib/player-cookie.ts` — cookie-based player identity (read/write per game).
- `docs/supabase-schema-changes.sql` — DB migration SQL (games defaults + players index + photos game columns).
- `docs/google-maps-in-app.md` — setup and cost notes for embedding Google Map.

## Cost (Google Maps)
- Maps JS API: billed per map load. Polling/markers don't trigger new loads.
- Geocoding API: billed per request (one per photo upload). Free under $200/month credit (~40k requests).
- See docs and Cloud Console Billing/Reports for usage.
