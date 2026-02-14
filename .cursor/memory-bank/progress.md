# Progress

## What works
- Home page: hero, games from Supabase, footer link to Location test.
- Location test: GPS, 10s polling, numbered blue-dot pins, countdown on map, points list, no auto-zoom. Amber theme, mobile-friendly.
- Photo upload (`/test-upload`): in-app camera viewfinder (`getUserMedia`, rear camera), shutter/preview/retake flow, geolocation tagging at capture, reverse geocoding to human-readable address, photo grid with location display (pin icon + address or coords).
- `photos` table: `id`, `url`, `storage_path`, `created_at`, `latitude`, `longitude`, `location_name`.
- Upload API: file + lat/lng → Supabase Storage + reverse geocode → DB insert.
- Photos API: returns all photos with location fields via `select("*")`.
- Supabase: `games` table + `photos` table, server client with service role, no RLS.

## What's left
- DB migration: `ALTER TABLE photos ADD COLUMN latitude/longitude/location_name` must be run manually in Supabase SQL Editor.
- Google Geocoding API must be enabled in Cloud Console for reverse geocoding to work.
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` must be in `.env.local`.
- Game lobby, teams, active play, results — not started.

## Known issues
- Desktop front-facing webcam appears "flipped" — expected; rear camera on mobile is correct.
- No EXIF GPS extraction (getUserMedia canvas blobs lack EXIF); relies entirely on browser geolocation.

## Evolution
- Started with redirect to Google Maps; switched to in-app map.
- Location test: polling, history, pins, countdown, points list, blue-dot markers.
- Photo upload: started as file-input picker → replaced with in-app camera viewfinder + geolocation tagging + reverse geocoding + location display in photo grid.
