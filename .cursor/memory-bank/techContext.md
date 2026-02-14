# Tech Context

## Stack
- **Next.js** 16 (App Router).
- **React** 19.
- **Supabase** (server-side client, service role; `lib/supabase.ts`).
- **Tailwind CSS** v4.
- **Google Maps:** `@react-google-maps/api` for in-app map; Maps JavaScript API for location-test.
- **Google Geocoding API:** server-side reverse geocoding in `/api/upload` (requires separate enable in Cloud Console).

## Env
- `.env.local` (from `.env.example`): `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.
- Google key: used client-side for maps, server-side for Geocoding API.

## Key paths
- `app/page.tsx` — home (games list).
- `app/location-test/page.tsx` — wraps `LocationDisplay`.
- `app/location-test/LocationDisplay.tsx` — client: geolocation, 10s polling, history state, countdown, points list; loads `MapDisplay` via `next/dynamic` with `ssr: false`.
- `app/location-test/MapDisplay.tsx` — client: `useJsApiLoader`, single map instance, markers from `locations` prop, blue-dot icon, countdown overlay; no fitBounds.
- `app/test-upload/page.tsx` — client: camera + geolocation upload page. Requests geolocation on mount, uses `CameraCapture` for in-app camera, sends photo + coords to `/api/upload`, displays photo grid with location.
- `app/test-upload/CameraCapture.tsx` — client: `getUserMedia` viewfinder (rear camera), shutter via canvas snapshot, preview/retake/use-photo flow.
- `app/api/upload/route.ts` — server: accepts file + optional lat/lng, reverse geocodes, uploads to Supabase Storage, inserts into `photos` table.
- `app/api/photos/route.ts` — server: returns all photos with `select("*")` (includes location fields).
- `lib/types.ts` — `Photo` interface (id, url, storage_path, created_at, latitude, longitude, location_name).
- `docs/google-maps-in-app.md` — setup and cost notes for embedding Google Map.

## Cost (Google Maps)
- Maps JS API: billed per map load. Polling/markers don't trigger new loads.
- Geocoding API: billed per request (one per photo upload). Free under $200/month credit (~40k requests).
- See docs and Cloud Console Billing/Reports for usage.
