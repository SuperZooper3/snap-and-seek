# Active Context

## Current focus
- Game zone and zone view are implemented and documented in the memory bank.

## Recent changes (game zone feature)
- **Games table:** Zone columns `zone_center_lat`, `zone_center_lng`, `zone_radius_meters` (see `docs/supabase-game-zone.sql`). Zone required before starting game.
- **Set game zone modal:** Full-screen, mobile-first. Geolocation on open; slider 50m–1km; map with red shaded outside (Polygon, strokeWeight 0), single red zone circle (transparent fill). Blue pin + light blue accuracy circle. Refresh location; save zone via PATCH. Map fills remaining space; fitBounds to zone (~90% with 16px padding). Overlays drawn after one rAF to avoid stuck initial circle; no keys on Circle/Polygon so they update in place.
- **Game page:** "Set game zone" / "Edit game zone", "Start game" (disabled until zone + ≥2 players). When status is hiding: "Start hiding" button → zone view.
- **Zone view:** Full-screen layout. `ZoneWithLocation` wraps map: 10s location refresh, countdown "Next refresh in Xs", "Blue is where you are". Outside-zone warning when `isEntirelyOutsideZone(...)`. Single blue pin (Marker, stable key) + single blue accuracy circle (imperative `google.maps.Circle` in ref: create once, update with `setCenter`/`setRadius` to avoid stacking). Footer: "Go to photo capture" → `/games/[gameId]/capture`.
- **Capture page:** Placeholder "Photo capture — coming soon".
- **Map helpers:** `lib/map-utils.ts` — `getBoundsForCircle`, `distanceMeters`, `isEntirelyOutsideZone`, `circleToPolygonPoints`, `outerBounds`.

## Important patterns
- **Avoid map overlay stacking:** Use stable keys for Marker; for Circle that updates every N seconds, use imperative API (ref, create once, update in place) instead of library `<Circle>` which can stack on prop change.
- **Zone map layout:** Full-size map needs parent with explicit height (e.g. flex-1 min-h-[50vh]); map container minHeight 50vh; trigger `resize` + fitBounds after load for correct tiles.
- **Mobile:** viewport `viewportFit: cover`, touch-manipulation, safe-area classes, full-width CTAs.

## Next steps (not started)
- Real photo capture flow (camera + upload tied to game).
- Teams, active play phase, results.
