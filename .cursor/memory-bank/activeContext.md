# Active Context

## Current focus
- Player waiting/ready-up page and photo lock-in flow.
- Game flow: lobby → hiding (zone + photo setup) → waiting (ready-up) → seeking.

## Recent changes
- **Photo lock-in refactor:** Removed `label`/`is_main` from photos table. Added `hiding_photo`, `tree_photo`, `building_photo`, `path_photo` (bigint FK to `photos.id`) on `players` table. Photos upload immediately but are only "locked in" to the player row on "Next" click via `PATCH /api/games/[gameId]/lock-in`. Migration: `docs/supabase-player-photos.sql`.
- **Setup page items:** Changed from Tree/Rock to Tree/Building/Path. IDs match player column names. `PhotoSlot` now tracks `photoId` (number). Upload API no longer sends label/is_main.
- **Waiting page:** `/games/[gameId]/waiting` — polls `/api/games/[gameId]/readiness` every 5s with visible countdown. Player is ready when `players.hiding_photo IS NOT NULL`. Blue "Start seeking!" button enabled when all ready → PATCH status to "seeking" → navigate to seeking page.
- **Seeking phase:** Status `"seeking"`, `seeking_started_at`, `/games/[gameId]/seeking` with map + timer pill.
- **Other merged features:** Hiding timer, hiding duration config, god mode, player pings.

## Recent decisions
- Photo IDs are bigint (not UUID) — `photos.id` is Supabase default bigint.
- Photos upload immediately for preview feedback; lock-in writes IDs to player row on "Next".
- Retaking photos overwrites the player columns with new photo IDs. Old photos orphaned but harmless.
- Readiness checks `players.hiding_photo` directly — no cross-table query needed.
- Optional photos (tree/building/path) don't affect readiness.
- Waiting page uses 5s polling (not realtime).

## Important patterns
- **Lock-in flow:** Upload returns `{ id, url }` → stored in client state → "Next" calls lock-in API → navigate to waiting.
- **Game status flow:** `"lobby"` → `"hiding"` → `"seeking"`.
- **Auto-redirect on game page:** seeking → seeking page, hiding → zone. Bypass with `?manage=1`.
- Cookie-based player identity (`sas_players`).
- Imperative google.maps.Circle to avoid stacking on zone map.

## Known issues
- Old orphaned photo rows accumulate in photos table (no cleanup).

## Next steps
- Teams, active play mechanics, results.
