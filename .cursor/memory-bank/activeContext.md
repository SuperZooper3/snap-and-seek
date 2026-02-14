# Active Context

## Current focus
- Player waiting/ready-up page (`/games/[gameId]/waiting`) — between photo setup and seeking phase.
- Seeking phase integrated: game transitions lobby → hiding → (waiting) → seeking.
- Photo setup page (`/games/[gameId]/setup`) for the hiding phase — players photograph their hiding spot and tag visible landmarks.
- Game zone feature integrated: zone must be set before starting, zone view shows play area, then flows into photo setup.

## Recent changes
- **Seeking phase:** New status `"seeking"` with `seeking_started_at` timestamp. `/games/[gameId]/seeking` page with `SeekingLayout` (map + floating timer pill) and `SeekingTimer` (elapsed time). `StartSeekingTestLink` on zone page transitions game to seeking. Game page auto-redirects to seeking/zone based on status.
- **Hiding timer:** `HidingTimeRemaining` component on zone page shows countdown based on `hiding_started_at` + `hiding_duration_seconds`.
- **Hiding duration:** Configurable in lobby via dropdown (30s to 30min). Stored as `hiding_duration_seconds` on games table. `hiding_started_at` set when game starts.
- **God mode:** `/games/[gameId]/god` — view all player positions on map (accessible when not a player).
- **Player pings:** `/api/games/[gameId]/pings` — POST to record player location, GET latest pings. `player_pings` table with `game_id`, `player_id`, `lat`, `lng`, `accuracy`.
- **Game zone:** Zone columns on `games` table (`zone_center_lat`, `zone_center_lng`, `zone_radius_meters`). Set zone modal (geolocation + slider 50m–1km + map with red outside/zone circle). Zone required before start. Start game → redirect to zone view.
- **Zone view:** Full-screen map, live location 10s refresh with countdown, single blue pin + accuracy circle (imperative Circle to avoid stacking), outside-zone warning. "Go to photo capture" → `/games/[gameId]/setup`.
- **Shared components:** Moved `CameraCapture` from `app/test-upload/` to `components/CameraCapture.tsx`. Old location re-exports for backward compatibility.
- **CameraCapture enhancements:** Added `autoStart` (skip "Open Camera" button, start on mount) and `fullScreen` (remove max-width, cap video at `max-h-[65vh]` with `object-contain` so controls stay visible on desktop).
- **CameraModal:** Full-screen overlay component (`components/CameraModal.tsx`). Header with close button, camera body with flex layout that pins shutter/retake/use-photo controls at the bottom.
- **ItemBar:** Reusable bar component (`components/ItemBar.tsx`). Shows label, photo thumbnail (if taken), upload status badge, chevron. Entire bar is clickable.
- **Setup page:** `/games/[gameId]/setup` — server component checks cookie identity, passes game/player context to `SetupClient`. Client component has main hiding-spot photo slot at top, 2 hardcoded "Visible from" items ("Tree", "Rock"), per-item upload callbacks via factory function, and a placeholder "Next" button.
- **Upload API extended:** `/api/upload` now accepts optional `game_id`, `player_id`, `label`, `is_main` fields.
- **Photos table extended:** New columns `game_id`, `player_id`, `label`, `is_main`. Migration SQL in `docs/supabase-schema-changes.sql`.
- **PlayerList component:** Refactored inline player list into `PlayerList.tsx` with "assume player" (tap to join as) and "release identity" features.
- **Player identity:** Cookie `sas_players` stores per-game `{ id, name }`. Join form sets cookie after POST. "Start hiding" only shown when currentPlayer set. PlayerList: if !currentPlayer, player rows clickable → assume identity; if currentPlayer, "You are: X" + "Release my identity". Zone and capture pages redirect to game page if !currentPlayer.

## Recent decisions
- `CameraCapture` is a shared component in `components/` — used by both `/test-upload` and the setup page's `CameraModal`.
- `ItemBar` is also in `components/` (reusable, not page-specific).
- Two hardcoded optional items ("Tree", "Rock") for now — will be made dynamic later.
- Photos uploaded immediately per-item (not batched on "Next"), so user gets real-time feedback.
- `is_main` boolean distinguishes the main hiding-spot photo from optional "visible from" photos.
- Desktop fullScreen camera: video capped at 65vh height with `object-contain` to keep controls visible.
- "Set Up Hiding Spot" button lives on the zone page (end of zone flow), not on the game lobby page.
- Waiting page polls every 5 seconds (not realtime) for player readiness.
- Player is "ready" when they have a photo with `is_main = true` for that game.
- "Start!" on waiting page transitions game to "seeking" and navigates to `/games/[gameId]/seeking`.

## Important patterns
- **Avoid map overlay stacking:** Use stable keys for Marker; for Circle that updates every N seconds, use imperative API (ref, create once, update in place).
- **Zone map layout:** Full-size map needs parent with explicit height; map container minHeight 50vh; trigger `resize` + fitBounds after load.
- **Per-item upload callbacks:** `makeItemCapture(itemId, label)` factory returns a unique async callback per item.
- **Camera target state:** `cameraTarget: "main" | itemId | null` controls which slot the CameraModal is open for.
- Cookie-based player identity (same `sas_players` cookie pattern).
- **Mobile:** viewport `viewportFit: cover`, touch-manipulation, safe-area classes, full-width CTAs.
- **Game status flow:** `"lobby"` → `"hiding"` (hiding_started_at set) → `"seeking"` (seeking_started_at set).
- **Auto-redirect on game page:** If currentPlayer and status is "seeking" → redirect to seeking page. If "hiding" → redirect to zone. Bypass with `?manage=1`.

## Known issues to address later
- **Photo labeling for non-main photos:** Currently non-main photos are labeled with a simple text `label` field (e.g., "Tree", "Rock"). When items become dynamic, this needs a more robust approach — possibly a dedicated `item_id` foreign key or a unique constraint on `(game_id, player_id, label)` to prevent duplicates and allow reliable per-category queries. See future-plans.md.

## Next steps
- Implement waiting/ready-up page (`/games/[gameId]/waiting`) with player readiness polling.
- Make "Visible from" items dynamic (currently hardcoded).
- Teams, results.
