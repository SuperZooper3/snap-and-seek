# Tech Context

## Stack
- **Next.js** 16 (App Router).
- **React** 19.
- **Supabase** (server-side client, service role; `lib/supabase.ts`).
- **Tailwind CSS** v4.
- **Google Maps:** `@react-google-maps/api` for in-app map; Maps JavaScript API only (no Geocoding/Places for location test).

## Env
- `.env.local` (from `.env.example`): `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.
- Google key: client-side only; restrict by HTTP referrer in Cloud Console.

## Key paths
- `app/page.tsx` — home (games list).
- `app/location-test/page.tsx` — wraps `LocationDisplay`.
- `app/location-test/LocationDisplay.tsx` — client: geolocation, 10s polling, history state, countdown, points list; loads `MapDisplay` via `next/dynamic` with `ssr: false`.
- `app/location-test/MapDisplay.tsx` — client: `useJsApiLoader`, single map instance, markers from `locations` prop, blue-dot icon, countdown overlay; no fitBounds (map does not zoom on new points).
- `docs/google-maps-in-app.md` — setup and cost notes for embedding Google Map.

## Cost (Google Maps)
- Billed per map load (one per page open). Polling and adding pins do not trigger new loads.
- See docs and Cloud Console Billing/Reports for usage.
