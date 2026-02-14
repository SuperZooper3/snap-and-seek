# Active Context

## Current focus
- Game zone and zone view are implemented and documented in the memory bank.

## Recent changes (game zone + player identity)
- **Games table:** Zone columns (see `docs/supabase-game-zone.sql`). Zone required before start.
- **Set game zone modal:** Full-screen, 50m–1km slider, map (red outside, zone circle, blue pin + accuracy). fitBounds to zone; no stacking (no keys, imperative user circle on zone view).
- **Game page:** GameActions receives `currentPlayer`. "Start hiding" only when currentPlayer set; else "Join as a player below (tap a name) to start hiding." **PlayerList:** when !currentPlayer, player rows are clickable → assume identity (`setPlayerInCookie`); when currentPlayer, "You are: X" + "Release my identity" (`clearPlayerForGame`).
- **Zone / capture pages:** Redirect to `/games/[gameId]` if !currentPlayer (cookie check).
- **lib/player-cookie.ts:** `getPlayerForGame`, `setPlayerInCookie`, `clearPlayerForGame(gameId)` (release). Cookie name `sas_players`, per-game `{ id, name }`.
- **Map helpers:** `lib/map-utils.ts` — getBoundsForCircle, distanceMeters, isEntirelyOutsideZone, circleToPolygonPoints, outerBounds.

## Important patterns
- **Avoid map overlay stacking:** Use stable keys for Marker; for Circle that updates every N seconds, use imperative API (ref, create once, update in place) instead of library `<Circle>` which can stack on prop change.
- **Zone map layout:** Full-size map needs parent with explicit height (e.g. flex-1 min-h-[50vh]); map container minHeight 50vh; trigger `resize` + fitBounds after load for correct tiles.
- **Mobile:** viewport `viewportFit: cover`, touch-manipulation, safe-area classes, full-width CTAs.

## Next steps (not started)
- Real photo capture flow (camera + upload tied to game).
- Teams, active play phase, results.
