# Progress

## What works
- Home page: hero, games from Supabase, footer link to Location test.
- Location test: GPS, 10s polling, numbered blue-dot pins, countdown on map, points list, no auto-zoom. Amber theme, mobile-friendly.
- Photo upload (`/test-upload`): in-app camera viewfinder (`getUserMedia`, rear camera), shutter/preview/retake flow, geolocation tagging at capture, reverse geocoding to human-readable address, photo grid with location display (pin icon + address or coords).
- `photos` table: `id`, `url`, `storage_path`, `created_at`, `latitude`, `longitude`, `location_name`.
- Upload API: file + lat/lng → Supabase Storage + reverse geocode → DB insert.
- Photos API: returns all photos with location fields via `select("*")`.
- Supabase: `games` table (with zone_center_lat, zone_center_lng, zone_radius_meters), `players` table, server client with service role, no RLS.

### Game management & zone (implemented)
- **Games list** (`/games`), **create game** (`/games/new`), **game page** (`/games/[gameId]`): join link, players list, Set/Edit game zone button, Start game (requires zone + ≥2 players).
- **Set game zone modal:** Current location, slider 50m–1km, map with red shaded outside (polygon with hole), single red zone circle (empty inside), blue pin + light blue accuracy circle. Refresh location; save zone via PATCH. Map fills modal; fitBounds to zone (~90% fill). Zone required before start.
- **Start game:** PATCH status to `hiding`; redirects to `/games/[gameId]/zone`. Lobby shows "Start hiding" button linking to zone.
- **Player identity:** Cookie `sas_players` stores per-game `{ id, name }`. Join form sets cookie after POST. **Start hiding** only shown when `currentPlayer` is set; else message "Join as a player below (tap a name) to start hiding." **PlayerList** (game page): if !currentPlayer, tap a player row to assume identity (`setPlayerInCookie`); if currentPlayer, "You are: X" + "Release my identity" (`clearPlayerForGame`). Zone and capture pages redirect to game page if !currentPlayer.
- **Zone view** (`/games/[gameId]/zone`): Protected (redirect if !currentPlayer). Full-screen map (mobile), zone polygon + circle. Live location every 10s with countdown "Next refresh in Xs", "Blue is where you are". Single blue pin (Marker) + single blue accuracy circle (imperative `google.maps.Circle` ref, no stacking). Warning when entirely outside zone. "Go to photo capture" → `/games/[gameId]/capture`.
- **Photo capture** (`/games/[gameId]/capture`): Protected (redirect if !currentPlayer). Placeholder "Photo capture — coming soon", back to zone.
- **API:** PATCH `/api/games/[gameId]` accepts zone fields and/or `status: 'hiding'`; validates zone set + ≥2 players before start.
- **DB:** Run `docs/supabase-game-zone.sql` in Supabase to add zone columns.

## What's left
- DB migration: `ALTER TABLE photos ADD COLUMN latitude/longitude/location_name` must be run manually in Supabase SQL Editor (if not done).
- Google Geocoding API must be enabled in Cloud Console for reverse geocoding to work.
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` must be in `.env.local`.
- Real photo capture flow (camera + upload tied to game); teams, active play, results — not started.

## Known issues
- Desktop front-facing webcam appears "flipped" — expected; rear camera on mobile is correct.
- No EXIF GPS extraction (getUserMedia canvas blobs lack EXIF); relies entirely on browser geolocation.

## Evolution
- Started with redirect to Google Maps; switched to in-app map.
- Location test: polling, history, pins, countdown, points list, blue-dot markers.
- Photo upload: started as file-input picker → replaced with in-app camera viewfinder + geolocation tagging + reverse geocoding + location display in photo grid.
- Game management: added games/players, join link, Set game zone modal (geolocation + slider + map with red outside/zone circle, no green fill). Zone stored on games; required before start. Start game → redirect to zone view.
- Zone view: full-screen map, live location 10s refresh, countdown, single blue pin + single accuracy circle (imperative Circle to avoid library stacking), outside-zone warning, "Go to photo capture" → placeholder capture page.
- Player identity: only active players (cookie) can use "Start hiding"; game page PlayerList allows assume (tap player when not in) and release ("Release my identity"); zone and capture routes redirect to game page if not a player. `lib/player-cookie.ts`: `clearPlayerForGame(gameId)` added.
