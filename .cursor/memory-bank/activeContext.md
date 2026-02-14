# Active Context

## Current focus
- Photo setup page (`/games/[gameId]/setup`) for the hiding phase — players photograph their hiding spot and tag visible landmarks.

## Recent changes
- **Shared components:** Moved `CameraCapture` from `app/test-upload/` to `components/CameraCapture.tsx`. Old location re-exports for backward compatibility.
- **CameraCapture enhancements:** Added `autoStart` (skip "Open Camera" button, start on mount) and `fullScreen` (remove max-width, cap video at `max-h-[65vh]` with `object-contain` so controls stay visible on desktop).
- **CameraModal:** New full-screen overlay component (`components/CameraModal.tsx`). Fixed inset-0 z-50 bg-black. Header with close button, camera body with flex layout that pins shutter/retake/use-photo controls at the bottom.
- **ItemBar:** New reusable bar component (`components/ItemBar.tsx`). Shows label, photo thumbnail (if taken), upload status badge ("Photo Uploaded" / "Uploading..." / "Tap to take photo"), chevron. Entire bar is clickable.
- **Setup page:** `/games/[gameId]/setup` — server component checks cookie identity (redirects to `/join/[gameId]` if not found), passes game/player context to `SetupClient`. Client component has main hiding-spot photo slot at top, 2 hardcoded "Visible from" items ("Tree", "Rock") below, per-item upload callbacks via factory function, and a placeholder "Next" button.
- **Upload API extended:** `/api/upload` now accepts optional `game_id`, `player_id`, `label`, `is_main` fields; passes them through to `photos` table insert.
- **Photos table extended:** New columns `game_id` (uuid FK → games), `player_id` (integer FK → players), `label` (text), `is_main` (boolean default false). Migration SQL in `docs/supabase-schema-changes.sql`.
- **Game lobby:** Added "Set Up Hiding Spot" button on `/games/[gameId]` page, visible only when current player has joined.

## Recent decisions
- `CameraCapture` is a shared component in `components/` — used by both `/test-upload` and the setup page's `CameraModal`.
- `ItemBar` is also in `components/` (reusable, not page-specific).
- Two hardcoded optional items ("Tree", "Rock") for now — will be made dynamic later.
- Photos uploaded immediately per-item (not batched on "Next"), so user gets real-time feedback.
- `is_main` boolean distinguishes the main hiding-spot photo from optional "visible from" photos.
- Desktop fullScreen camera: video capped at 65vh height with `object-contain` to keep controls visible. On mobile the viewfinder still fills most of the screen.

## Important patterns
- **Per-item upload callbacks:** `makeItemCapture(itemId, label)` factory returns a unique async callback per item. Each callback: creates preview URL → sets uploading state → uploads via `/api/upload` with game/player/label/is_main → updates uploaded URL.
- **Camera target state:** `cameraTarget: "main" | itemId | null` controls which slot the CameraModal is open for. The active capture callback is derived from this.
- Cookie-based player identity (same `sas_players` cookie pattern as game lobby).

## Known issues to address later
- **Photo labeling for non-main photos:** Currently non-main photos are labeled with a simple text `label` field (e.g., "Tree", "Rock"). When items become dynamic, this needs a more robust approach — possibly a dedicated `item_id` foreign key or a unique constraint on `(game_id, player_id, label)` to prevent duplicates and allow reliable per-category queries. See future-plans.md.

## Next steps
- Run DB migration (`docs/supabase-schema-changes.sql` lines 12-16) in Supabase SQL Editor.
- Make "Visible from" items dynamic (currently hardcoded).
- Wire "Next" button to a waiting/lobby screen.
- Game lobby, teams, active play phase.
