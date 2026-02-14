# Product Context

## Why it exists
- Hackathon app: prove out Supabase integration and in-app location + map UX.
- Location test page validates: get current position, show on map, poll every 10s, show history (pins + list).

## How it should work
- **Home:** Snap and Seek hero, games list from Supabase, footer link to "Location test".
- **Location test:** User taps "Get my location" → permission → first position shown; map loads (client-only), 10s polling starts; countdown on map ("Next ping in Xs"); numbered blue-dot pins; scrollable points list at bottom. Map does not auto-zoom on new pings (stays where user left it).
- **Game flow:** Create game → share join link → players join → Set game zone (modal: your location + radius slider, map shows zone; required) → Start game (≥2 players) → redirect to zone view. Zone view: full-screen map, your position (blue pin + accuracy circle), 10s refresh with countdown, warning if outside zone; "Go to photo capture" → placeholder capture page.

## UX preferences
- Mobile-friendly (touch, viewport, full-width map).
- Amber/orange theme (Tailwind) across the app.
- No "Open in Google Maps" link or cost notes on the location page (removed per request).
