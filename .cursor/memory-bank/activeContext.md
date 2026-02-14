# Active Context

## Current focus
- Camera-based photo upload with geolocation tagging on `/test-upload`.

## Recent changes
- Replaced file-input upload with in-app camera viewfinder (`getUserMedia`, rear camera via `facingMode: "environment"`).
- New `CameraCapture` component: live viewfinder → shutter → preview → retake/use-photo flow.
- Photos are geotagged at capture time using browser Geolocation API (same `getCurrentPosition` + `enableHighAccuracy` pattern as `LocationDisplay`).
- Geolocation requested on page mount; refreshed at moment of capture for accuracy.
- Upload API reverse-geocodes coordinates via Google Geocoding API → stores `latitude`, `longitude`, `location_name` in `photos` table.
- Photo grid displays location: `location_name` if available, raw coords as fallback, "Location unavailable" if no location.
- `photos` table schema extended: added `latitude` (double), `longitude` (double), `location_name` (text).

## Recent decisions
- Chose `getUserMedia` over `<input capture>` for in-app camera feel; tradeoff: no EXIF GPS, geolocation-only.
- Single `<video>` element stays mounted across loading→streaming states to prevent `srcObject` loss on re-render (fixed black-box bug).
- Reverse geocoding done server-side at upload time (not per-display) to avoid repeated API calls.
- Front-camera mirror flip not added — rear camera is the intended use case for the game; desktop front-cam "flip" is expected behavior.

## Important patterns
- Camera + geolocation permissions requested separately; each degrades gracefully if denied.
- Geolocation state uses same discriminated union pattern as `LocationDisplay` (`idle | loading | success | error`).
- `locationRef` keeps latest geolocation in a ref so the async capture callback always has fresh data.

## Next steps (not started)
- Game lobby system, teams, active play phase.
