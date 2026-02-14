# Tech Stack

**Frontend**
- Next.js 16 + React 19
- TypeScript
- Tailwind CSS

**Backend**
- Next.js API routes
- Supabase (Postgres)
- Supabase Storage (photos)

**Real-time** (TBD)
- Options: Supabase Realtime or polling

**Maps**
- **Google Maps JavaScript API** (Maps JavaScript API)
- Wrapper: `@react-google-maps/api` for React integration
- Cost: Free tier sufficient for hackathon (pay-as-you-go with free monthly thresholds)
- Setup: Requires Google Cloud project, API key, and billing enabled (with budget alerts)

**Note**: Technical decisions flexible - make choices as we build

---

## Database Schema Notes

### Photos Table
Current schema:
- `id` (uuid, primary key)
- `url` (text)
- `storage_path` (text)
- `created_at` (timestamptz)
- `latitude` (double precision) - GPS lat from browser geolocation
- `longitude` (double precision) - GPS lng from browser geolocation
- `location_name` (text) - reverse-geocoded address from Google Geocoding API

**TODO - Future fields to add:**
- `game_id` (uuid) - Associate photo with specific game
- `team_id` (uuid) - Which team uploaded this photo
- `hints` (text or jsonb) - Additional hints for seekers
- `metadata` (jsonb) - Flexible storage for game-specific data

### Games table (game zone)
- `id`, `name`, `status` (default `'lobby'`), `created_at`
- **Zone (required before start):** `zone_center_lat`, `zone_center_lng`, `zone_radius_meters` (double precision, nullable). See `docs/supabase-game-zone.sql`.
- Types in `lib/types.ts`: `Game`, `GameZone` (center_lat, center_lng, radius_meters).

---

## Google Maps Setup

### Environment Variables
Add to `.env.local` (already in `.env.example`):
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

### Cost Management
- **Billing Model**: Pay-as-you-go with free monthly usage thresholds per product
- **Maps JavaScript API**: Only charges for Dynamic Maps SKU (map loads)
- **Map Load**: Charged once per page load showing the map; refreshing counts as new load
- **Location Polling**: Browser's Geolocation API is free (no Google servers)
- **In-Map Updates**: Adding/updating markers doesn't trigger new charges
- **Budget Protection**: Set $1 budget alert in Google Cloud Console
- **Free Tier**: Typical hackathon usage (dozens/hundreds of loads) stays free

### Google Cloud Project Setup
1. Create project in [Google Cloud Console](https://console.cloud.google.com/)
2. Enable **Maps JavaScript API** (only API needed for location display)
3. Create API key in **APIs & Services → Credentials**
4. **Restrict key** (recommended):
   - Application restrictions: HTTP referrers (`http://localhost:3000/*`, `https://yourdomain.com/*`)
   - API restrictions: Maps JavaScript API only
5. Enable billing and set budget alerts

### Implementation Approach
- Use `@react-google-maps/api` React wrapper for clean integration
- Load map only in client components (`"use client"`)
- Use `next/dynamic` with `ssr: false` for map components
- Supports touch (pan/zoom) by default on mobile
- Container: `width: 100%` with `min-height: 300px` or `50vh` for mobile

### Game zone maps
- **Set zone modal:** Current location + slider (50m–1km), red shaded outside (Polygon with hole), single red zone circle (empty inside), blue pin + accuracy circle. Map fits zone with padding; no keys on zone Circle/Polygon so they update in place (avoids stacking). Zone overlays drawn after one rAF to avoid stuck initial circle.
- **Zone view page:** Full-screen map; live location every 10s with "Next refresh in Xs" and "Blue is where you are". User pin = single Marker (library); user accuracy = single imperative `google.maps.Circle` (ref, create once, `setCenter`/`setRadius` on update) to avoid stacking. Outside-zone warning when `distance(user, zoneCenter) > zoneRadius + userAccuracy`. Helpers in `lib/map-utils.ts`: `getBoundsForCircle`, `distanceMeters`, `isEntirelyOutsideZone`, `circleToPolygonPoints`, `outerBounds`.

### References
- [Maps JavaScript API Usage & Billing](https://developers.google.com/maps/documentation/javascript/usage-and-billing)
- [Pricing (March 2025)](https://developers.google.com/maps/billing-and-pricing/march-2025)
- [Pricing Overview](https://developers.google.com/maps/billing-and-pricing/overview)
