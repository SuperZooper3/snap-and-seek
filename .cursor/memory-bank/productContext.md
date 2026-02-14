# Product Context

## Why it exists
- Hackathon app: prove out Supabase integration and in-app location + map UX.
- Location test page validates: get current position, show on map, poll every 10s, show history (pins + list).

## How it should work
- **Home:** Snap and Seek hero, games list from Supabase, footer link to "Location test".
- **Location test:** User taps "Get my location" → permission → first position shown; map loads (client-only), 10s polling starts; countdown on map ("Next ping in Xs"); numbered blue-dot pins; scrollable points list at bottom. Map does not auto-zoom on new pings (stays where user left it).
- **Game flow:** Create game → share join link → players join → Set game zone (modal: your location + radius slider + **Time to Cast** for power-ups; required) → Start game (≥2 players) → redirect to zone view. Zone view: full-screen map, your position, countdown, outside-zone warning; "Go to photo capture" → setup. Seeking: map + target pills + **power-ups** (Radar, Thermometer, Photo) with configurable casting time; only one casting hint per target at a time; unlock state persists.

## UX preferences
- Mobile-friendly (touch, viewport, full-width map).
- Amber/orange theme (Tailwind) across the app.
- No "Open in Google Maps" link or cost notes on the location page (removed per request).
