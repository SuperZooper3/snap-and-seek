# Active Context

## Current focus
- Location test page is feature-complete for hackathon: GPS, 10s polling, history pins (numbered, blue), countdown on map, points list, no auto-zoom, no external map link or cost copy.

## Recent decisions
- Map does not zoom/fitBounds when new points arrive — avoids annoying re-centering.
- Markers use blue-dot icon (current-location style); labels show 1, 2, 3… for order.
- Countdown shown on the map ("Next ping in Xs") rather than above.
- Removed "Open in Google Maps" and cost note from location page.

## Important patterns
- All map/geolocation code is client-only (dynamic import + useJsApiLoader).
- Location history and countdown state live in `LocationDisplay`; `MapDisplay` is presentational (locations + countdown props).
- Env: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` must be set for map to load; user adds it to `.env.local` from `.env.example`.

## Next steps (not started)
- Whatever the product needs next (e.g. persist locations, real game flow, etc.).
