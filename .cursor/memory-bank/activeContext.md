# Active Context

## Current focus
- Photo setup page (`/games/[gameId]/setup`) for the hiding phase — players photograph their hiding spot and tag visible landmarks.
- Game zone feature integrated: zone must be set before starting, zone view shows play area, then flows into photo setup.

## Recent changes
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

## Recent decisions
- `CameraCapture` is a shared component in `components/` — used by both `/test-upload` and the setup page's `CameraModal`.
- `ItemBar` is also in `components/` (reusable, not page-specific).
- Two hardcoded optional items ("Tree", "Rock") for now — will be made dynamic later.
- Photos uploaded immediately per-item (not batched on "Next"), so user gets real-time feedback.
- `is_main` boolean distinguishes the main hiding-spot photo from optional "visible from" photos.
- Desktop fullScreen camera: video capped at 65vh height with `object-contain` to keep controls visible.
- "Set Up Hiding Spot" button lives on the zone page (end of zone flow), not on the game lobby page.

## Important patterns
- **Avoid map overlay stacking:** Use stable keys for Marker; for Circle that updates every N seconds, use imperative API (ref, create once, update in place).
- **Zone map layout:** Full-size map needs parent with explicit height; map container minHeight 50vh; trigger `resize` + fitBounds after load.
- **Per-item upload callbacks:** `makeItemCapture(itemId, label)` factory returns a unique async callback per item.
- **Camera target state:** `cameraTarget: "main" | itemId | null` controls which slot the CameraModal is open for.
- Cookie-based player identity (same `sas_players` cookie pattern).
- **Mobile:** viewport `viewportFit: cover`, touch-manipulation, safe-area classes, full-width CTAs.

## Known issues to address later
- **Photo labeling for non-main photos:** Currently non-main photos are labeled with a simple text `label` field (e.g., "Tree", "Rock"). When items become dynamic, this needs a more robust approach — possibly a dedicated `item_id` foreign key or a unique constraint on `(game_id, player_id, label)` to prevent duplicates and allow reliable per-category queries. See future-plans.md.

## Next steps
- Run DB migration (`docs/supabase-schema-changes.sql`) in Supabase SQL Editor.
- Make "Visible from" items dynamic (currently hardcoded).
- Wire "Next" button on setup page to a waiting/lobby screen.
- Teams, active play phase, results.
