# System Patterns

## Architecture
- **Home:** Server Component; fetches games via Supabase server client.
- **Location test:** Page is server component; all interactive UI is in client components (`LocationDisplay`, `MapDisplay`). Map script loads only on client via `useJsApiLoader` and dynamic import with `ssr: false`.

## Location flow
1. User clicks "Get my location" → `navigator.geolocation.getCurrentPosition` (one-shot).
2. On success: push point to `locationHistory`, set `secondsUntilNextPing` to 10, start 10s interval for `pollLocation`.
3. Every 10s: `getCurrentPosition` again → push to history, reset countdown to 10.
4. 1s interval updates `secondsUntilNextPing` for countdown display.
5. Cleanup: clear both intervals on unmount.

## Map
- **MapDisplay** receives `locations: LocationPoint[]` and `countdownSeconds: number | null`.
- Renders one `GoogleMap`, multiple `Marker`s (one per point). Icon: blue-dot (`mapfiles/ms/icons/blue-dot.png`), label = index+1, title = "#N — time".
- Countdown overlay: absolute bottom-center, "Next ping in Xs".
- No fitBounds: initial center/zoom from first point only; subsequent points just add markers.

## Data types
- `LocationPoint`: `{ lat, lng, timestamp }`.
- Exported from `LocationDisplay.tsx`, used by `MapDisplay.tsx`.
