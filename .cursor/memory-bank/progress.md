# Progress

## What works
- Home page: hero, games from Supabase, footer link to Location test.
- Location test: "Get my location" → permission → first position; map loads in-app (Google Maps JS API); 10s polling; location history; numbered blue-dot pins; countdown on map ("Next ping in Xs"); points list at bottom (index, lat/lng, time). Map stays fixed (no auto-zoom). Styling: amber theme, mobile-friendly.
- Supabase: `games` table, server client with service role, no RLS.
- Docs: `docs/google-maps-in-app.md` (setup, billing, what counts as cost).

## What's left
- No outstanding location-test tasks from recent requests.
- Broader product/game features as needed.

## Known issues
- None recorded.

## Evolution
- Started with redirect to Google Maps for location; switched to in-app map per docs.
- Added polling, history, pins, then countdown on map, numbered pins, points list; removed external link and notes; disabled fitBounds; blue-dot markers.
