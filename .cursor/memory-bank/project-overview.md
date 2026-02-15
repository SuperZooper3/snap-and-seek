# Project Overview

**Name**: Snap and Seek  
**Type**: Mobile-first multiplayer game  
**Timeline**: Hackathon project - target completion tomorrow afternoon  
**Goal**: Demo at Waddle League + film submission video

## Core Concept
Hide-and-seek meets scavenger hunt. Teams photograph hidden spots, then race to find each other's locations using GPS and proximity questions.

## Key Features
- GPS tracking with game boundaries
- Photo capture for hidden spots
- Question system (proximity checks, hotter/colder)
- Optional: tagging, hunter mode, power-ups

## Current State
- ✅ Next.js + Supabase starter
- ✅ In-app camera capture with geolocation tagging (`/test-upload`)
- ✅ Photo upload + reverse geocoding + location display
- ✅ Supabase Storage integration (`snap-and-seek-image` bucket)
- ✅ Location test page with GPS polling + in-app map
- ✅ Game management: create game, join via link, players list
- ✅ Game zone: Set zone modal (location + radius 50m–1km, map), required before start; zone stored on `games` table
- ✅ Zone view: full-screen map, live location (10s refresh, countdown), blue pin + accuracy circle, outside-zone warning
- ✅ Photo setup page (`/games/[gameId]/setup`) main photo + optional items + full-screen camera modal
- ✅ Shared components: `CameraCapture`, `CameraModal`, `ItemBar`
- 📋 Dynamic "visible from" items (currently hardcoded) - TBD
- 📋 GPS tracking in gameplay - TBD
- 📋 Proximity questions - TBD
- 📋 Main game UI - TBD

## Implementation Progress

### Phase 1: Photo Infrastructure (COMPLETED)
- ✅ Database schema: `photos` table with location + game context fields
- ✅ Storage bucket: `snap-and-seek-image` (public)
- ✅ API routes: `/api/upload` (accepts file + coords + game context, reverse geocodes) and `/api/photos`
- ✅ Test page: `/test-upload` in-app camera, geolocation, photo grid with location
- ✅ TypeScript types: Photo, Game, GameZone, Player interfaces in `lib/types.ts`
- ✅ Camera: `CameraCapture` shared component with `autoStart`/`fullScreen` props

### Phase 2: Game Zone & Flow (COMPLETED)
- ✅ DB: `games` zone columns (`zone_center_lat`, `zone_center_lng`, `zone_radius_meters`)
- ✅ Game management: `/games`, `/games/new`, `/join/[gameId]`, game page with join link and players
- ✅ Set zone modal: geolocation, slider 50m–1km, map (red outside, zone circle, blue pin + accuracy), save via PATCH; zone required before start
- ✅ Start game: PATCH status `hiding`, redirect to zone view; "Start hiding" button
- ✅ Zone view: full-screen map, 10s location refresh + countdown, single blue pin + single accuracy circle (imperative Circle), outside-zone warning, "Go to photo capture" → setup page
- ✅ Map utils: `lib/map-utils.ts`

### Phase 3: Photo Setup (COMPLETED)
- ✅ Photo setup page (`/games/[gameId]/setup`) with camera modal + per-item upload
- ✅ Cookie-based player identity (`lib/player-cookie.ts`)
- ✅ PlayerList component with assume/release identity
- 📋 DB migration for new `photos` columns (game_id, player_id, label, is_main)
- 📋 Dynamic item selection (currently hardcoded Tree + Rock)
- 📋 Ready-up / waiting screen after setup
