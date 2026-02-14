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
- `app/games/page.tsx` — game management list.
- `app/games/new/page.tsx` — create game form → POST `/api/games` → redirect to game page.
- `app/games/[gameId]/page.tsx` — server: game + players, join URL, zone, currentPlayer (from cookie); renders `GameActions` + `PlayerList`. Auto-redirects to seeking/zone if game active (bypass with `?manage=1`).
- `app/games/[gameId]/GameActions.tsx` — client: copy join link, Set/Edit zone, hiding duration picker, Start game. Receives `currentPlayer` + `hidingDurationSeconds`. Shows status badge + navigation to seeking/zone when not lobby.
- `app/games/[gameId]/GameZoneModal.tsx` — client: full-screen modal, geolocation, slider 50m–1km, map with zone overlays, save via PATCH.
- `app/games/[gameId]/PlayerList.tsx` — client: player list with assume/release identity.
- `app/games/[gameId]/zone/page.tsx` — server: checks currentPlayer, fetches game + zone + hiding timestamps, renders header + `HidingTimeRemaining` + `ZoneWithLocation` + footer with "Go to photo capture" + `StartSeekingTestLink`.
- `app/games/[gameId]/zone/ZoneWithLocation.tsx` — client: 10s location refresh, countdown, outside-zone warning, wraps `ZoneMapView`. Supports `hideRefreshBar` and `onCountdownChange` props for seeking layout.
- `app/games/[gameId]/zone/ZoneMapView.tsx` — client: zone polygon + circle, user marker + imperative accuracy circle, fitBounds.
- `app/games/[gameId]/zone/HidingTimeRemaining.tsx` — client: countdown timer based on `hiding_started_at` + `hiding_duration_seconds`.
- `app/games/[gameId]/zone/StartSeekingTestLink.tsx` — client: button to PATCH status to "seeking" and navigate to seeking page.
- `app/games/[gameId]/setup/page.tsx` — server: cookie check + game fetch → `SetupClient`.
- `app/games/[gameId]/setup/SetupClient.tsx` — client: main photo slot, 2 hardcoded items, CameraModal, per-item upload callbacks, "Next" button.
- `app/games/[gameId]/seeking/page.tsx` — server: cookie check, game fetch (incl. `seeking_started_at`), renders `SeekingLayout`.
- `app/games/[gameId]/seeking/SeekingLayout.tsx` — client: map (reuses `ZoneWithLocation`) + floating `SeekingTimer` pill.
- `app/games/[gameId]/seeking/SeekingTimer.tsx` — client: elapsed time since `seeking_started_at`. Supports "bar" and "pill" variants.
- `app/games/[gameId]/god/page.tsx` — server: god mode map view showing all player positions.
- `app/games/[gameId]/god/GodMapView.tsx` — client: map with all player pings.
- `app/games/[gameId]/god/GodMapWithPings.tsx` — client: map + ping markers.
- `app/games/[gameId]/capture/page.tsx` — server: placeholder (superseded by setup page).
- `app/join/[gameId]/page.tsx` — join game (name form → POST players → redirect to game page).
- `app/test-upload/page.tsx` — client: camera + geolocation upload page.
- `app/test-upload/CameraCapture.tsx` — re-exports from `components/CameraCapture.tsx`.
- `components/CameraCapture.tsx` — shared: `getUserMedia` viewfinder, shutter, preview/retake/use-photo. Props: `onCapture`, `disabled`, `autoStart`, `fullScreen`.
- `components/CameraModal.tsx` — shared: full-screen camera overlay. Props: `isOpen`, `onClose`, `onCapture`.
- `components/ItemBar.tsx` — shared: clickable item bar with label, photo, status.
- `app/api/upload/route.ts` — server: accepts file + optional lat/lng + optional game_id/player_id/label/is_main, reverse geocodes, uploads to Supabase Storage, inserts into `photos` table.
- `app/api/games/route.ts` — POST: create game.
- `app/api/games/[gameId]/route.ts` — PATCH: update zone, status (`'hiding'` or `'seeking'`), or `hiding_duration_seconds`. Validates zone + 2+ players before hiding start.
- `app/api/games/[gameId]/players/route.ts` — POST: add player.
- `app/api/games/[gameId]/pings/route.ts` — POST: record player ping (lat/lng/accuracy). GET: list pings.
- `app/api/games/[gameId]/pings/latest/route.ts` — GET: latest ping per player.
- `app/api/photos/route.ts` — server: returns all photos.
- `lib/types.ts` — `Photo`, `Game` (incl. zone, hiding/seeking timestamps, hiding_duration_seconds), `GameZone`, `Player`.
- `lib/supabase.ts` — server-side Supabase client (service role).
- `lib/player-cookie.ts` — cookie-based player identity (read/write/clear per game).
- `lib/map-utils.ts` — `circleToPolygonPoints`, `outerBounds`, `getBoundsForCircle`, `distanceMeters`, `isEntirelyOutsideZone`.
- `docs/supabase-schema-changes.sql` — DB migration SQL (games defaults + players index + photos game columns).
- `docs/supabase-game-zone.sql` — ALTER games add zone columns.
- `docs/supabase-pings.sql` — CREATE player_pings table.
- `supabase-games-seeking-migration.sql` — ALTER games add hiding/seeking timestamp columns.
- `docs/google-maps-in-app.md` — setup and cost notes for embedding Google Map.

## Cost (Google Maps)
- Maps JS API: billed per map load. Polling/markers don't trigger new loads.
- Geocoding API: billed per request (one per photo upload). Free under $200/month credit (~40k requests).
- See docs and Cloud Console Billing/Reports for usage.
