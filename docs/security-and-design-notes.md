# Security and design notes (publish audit)

Notes from the pre-publish security audit. Keep these in mind when changing APIs or Supabase config.

---

## Changes made (implementation summary)

- **Removed test-upload:** Deleted `app/test-upload/page.tsx` and `app/test-upload/CameraCapture.tsx`. Deleted `app/api/photos/route.ts` (GET was the only handler; test-upload was the only consumer).
- **Removed location-test:** Deleted `app/location-test/page.tsx`, `app/location-test/MapDisplay.tsx`, and `app/location-test/LocationDisplay.tsx`.
- **Removed “All games”:** Removed the GET handler from `app/api/games/route.ts` (kept POST for creating games). Deleted `app/games/page.tsx`. Updated `app/not-found.tsx` and `app/games/[gameId]/not-found.tsx` so the primary link is “Your games” with `href="/your-games"` instead of “All games” and `/games`.
- **robots.ts:** Removed `"/test-upload/"` and `"/location-test/"` from the `disallow` array.
- **Storage bucket doc:** Added `docs/supabase-storage-bucket-check.sql` with SQL to inspect policies on `storage.objects` and instructions for dropping an anon SELECT policy if one exists. Linked to it from the Storage bucket section below.
- **Your games:** Left unchanged; `app/your-games/page.tsx` and the your-games flow are still the way users see games they created or joined.

---

## Discovery model

- **No index of games.** Users only see games they created or were invited to (join link or “Your games” cookie).
- **No global photo list.** No API returns all photos; photo access is only in the context of a game and a player (e.g. photo-unlock by `gameId` + `hiderId`).
- Game IDs are the secret: without a list endpoint, they’re only known to creators and people with the share link.

---

## Supabase

### Database (games, players, photos, etc.)

- We use a magic-link / share-link model with **no user auth**. All database access is via the backend **service role** (superkey) only; we do not use RLS (intentional). Access control is “what the Next.js API exposes.”
- For the “no index” model, no DB schema change was required; removing list endpoints was enough.
- We are not planning to add RLS or direct client access; the backend uses the superkey only. Games are only visible to people who have the link.

### Storage bucket (`snap-and-seek-image`)

- **Public read by path:** Keep the bucket public so direct object URLs (from `photos.url` / `getPublicUrl`) keep working.
- **No listing:** Ensure there is **no policy** that allows anon (or authenticated) users to **list** objects in the bucket. In Supabase Dashboard → Storage → `snap-and-seek-image`, confirm only the service role can list; anon should not have list permission.
- **Paths:** Uploads use unguessable paths (`timestamp` + random string); the only way to get paths was the removed global photos API, so the bucket is not dumpable.
- **Check policies:** See [docs/supabase-storage-bucket-check.sql](supabase-storage-bucket-check.sql) for SQL to inspect storage policies and ensure anon cannot list.

---

## “Your games” cookie

- `sas_your_games` is set and read on the client; it’s not a security boundary (users could add someone else’s game ID).
- It’s a UX hint so returning users see their games. The real protection is that game IDs aren’t discoverable (no index).

---

## APIs removed for security

| Removed | Reason |
|--------|--------|
| GET `/api/games` | Exposed a full list of all games (IDs, names, status, etc.). |
| Page `/games` (“All games”) | Rendered that list; inherently relied on the bad API. |
| GET `/api/photos` | Exposed all photos (URLs, storage paths, game_id, player_id, lat/lng). Made the bucket effectively listable. Removed; the only consumer was the test-upload page, which was also removed. |

---

## Other APIs (intentionally unchanged)

- **Scoped under `/api/games/[gameId]/`:** No participant/auth check; “if you know the game ID you can call.” Acceptable because game IDs are only known via create or invite.
- **POST `/api/games`:** Unauthenticated create is intentional.
- **POST `/api/upload`:** Unauthenticated; consider rate limiting or abuse checks if you see abuse.

---

## Attack surface checklist (final pass)

Things that could be abused or that you might want to lock down. Say which are real concerns and we can address them.

### Index / enumeration (removed)

- **GET `/api/games`**, **Page `/games` (“All games”)**, and **GET `/api/photos`** have been removed. Not-found links point to “Your games” (`/your-games`).

### Game-scoped APIs (no participant check)

- Anyone with a game ID (e.g. from a join link) can call all `/api/games/[gameId]/...` endpoints: game-status, submissions, hints, photo-locations (god mode), players, pings, photo-unlock, etc. No check that “you are in this game.” Acceptable if game ID is the secret.
- **POST `/api/games/[gameId]/submissions`** — Accepts `seeker_id`, `hider_id`, `photo_id` in the body and does **not** verify that the caller is that seeker (e.g. via cookie). So a participant who knows another player’s IDs could submit a find on their behalf or cheat (e.g. claim a find as seeker X). Only the client currently sends the “current” player from cookie; the API trusts the body.

### Create / join / upload (unauthenticated)

- **POST `/api/games`** — Anyone can create games; no rate limit. Could be used to spam the DB.
- **POST `/api/games/[gameId]/players`** — Anyone can add a player (join) if they know the game ID; no rate limit per game. Could fill a lobby with fake names.
- **POST `/api/upload`** — Anyone can upload (type/size validated, path is server-generated). No check that `game_id` / `player_id` in the form belong to a real game/player, so uploads could be associated with arbitrary IDs. No rate limit; could be used to fill storage.

### Cookies

- **Player and “your games” cookies** — Set from client with `path=/; max-age=...; SameSite=Lax`. No `Secure` flag (in production over HTTPS, browsers still send them; adding `Secure` is best practice so they’re never sent over HTTP).
- Cookies are not `HttpOnly` because the app needs to read/write them from JS; that’s intentional.

### Debug / test routes (reachable if URL is known)

- **`/debug`** — Location override for testing (cookie). Does not call sensitive APIs. Disallowed in robots.txt but still reachable.
- **`/test-upload`** and **`/location-test`** — Removed; no longer in the app.

### Errors and secrets

- Some API routes return `error.message` from Supabase on 500s, which can leak constraint/DB details. Usually low impact.
- **Google Maps API key** — `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is used in the upload route (server) and in the Maps loader (client), so it’s exposed in the client bundle. Restrict the key by HTTP referrer and by API (Maps, Geocoding) in Google Cloud Console so it can’t be reused from other origins.
- **Service role key** — Not exposed (server env only). Good.

### XSS / injection

- **dangerouslySetInnerHTML** — Used once on the home page for JSON-LD (`JSON.stringify(jsonLd)`); data is server-built from env, not user input. Low risk.
- Supabase client uses parameterized queries; no raw SQL from request input, so SQL injection risk is low.
