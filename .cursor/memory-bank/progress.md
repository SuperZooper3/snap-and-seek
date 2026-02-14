# Progress

## What works
- Home page: hero, games from Supabase, footer link to Location test.
- Location test: GPS, 10s polling, numbered blue-dot pins, countdown on map, points list, no auto-zoom. Amber theme, mobile-friendly.
- Photo upload (`/test-upload`): in-app camera viewfinder (`getUserMedia`, rear camera), shutter/preview/retake flow, geolocation tagging at capture, reverse geocoding to human-readable address, photo grid with location display (pin icon + address or coords).
- Game creation + join flow: create game on home page → game lobby (`/games/[gameId]`) → share join link → join with name (`/join/[gameId]`) → cookie-based identity.
- **Photo setup page** (`/games/[gameId]/setup`): main hiding-spot photo + 2 hardcoded optional "Visible from" items (Tree, Rock). Full-screen camera modal opens on tap. Per-item upload with immediate feedback. "Photo Uploaded" badge on completion.
- **Shared components:** `CameraCapture` (with `autoStart`/`fullScreen` props), `CameraModal` (full-screen overlay), `ItemBar` (clickable item bar with photo/status).
- `photos` table: `id`, `url`, `storage_path`, `created_at`, `latitude`, `longitude`, `location_name`, `game_id`, `player_id`, `label`, `is_main`.
- Upload API: file + optional lat/lng + optional game_id/player_id/label/is_main → Supabase Storage + reverse geocode → DB insert.
- Photos API: returns all photos with location fields via `select("*")`.
- Supabase: `games` table + `players` table + `photos` table, server client with service role, no RLS.

## What's left
- **DB migration required:** `ALTER TABLE photos ADD COLUMN game_id/player_id/label/is_main` must be run manually in Supabase SQL Editor (see `docs/supabase-schema-changes.sql` lines 12-16).
- Google Geocoding API must be enabled in Cloud Console for reverse geocoding to work.
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` must be in `.env.local`.
- Make "Visible from" items dynamic (currently hardcoded to "Tree" and "Rock").
- Photo labeling robustness for non-main photos (see Known issues below).
- Wire "Next" button on setup page to waiting/lobby screen.
- Game lobby ready-up, teams, active play, results — not started.

## Known issues
- Desktop front-facing webcam appears "flipped" — expected; rear camera on mobile is correct.
- No EXIF GPS extraction (getUserMedia canvas blobs lack EXIF); relies entirely on browser geolocation.
- **Non-main photo labeling:** Currently uses a simple text `label` field. When items become dynamic, need a more robust system (e.g., dedicated `item_id` FK, unique constraint on `game_id + player_id + label`) to prevent duplicates and allow reliable per-category queries.

## Evolution
- Started with redirect to Google Maps; switched to in-app map.
- Location test: polling, history, pins, countdown, points list, blue-dot markers.
- Photo upload: started as file-input picker → replaced with in-app camera viewfinder + geolocation tagging + reverse geocoding + location display in photo grid.
- Camera component: started in `app/test-upload/` → moved to shared `components/CameraCapture.tsx` with `autoStart`/`fullScreen` props. Wrapped in `CameraModal` for setup page.
- Setup page: wireframe-driven design (from hand-drawn mockups). Main photo + optional "visible from" items with per-item camera modal + upload callbacks.
