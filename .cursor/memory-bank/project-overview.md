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
- ✅ Zone view: full-screen map, live location (10s refresh, countdown), blue pin + accuracy circle, outside-zone warning, "Go to photo capture"
- ✅ Photo capture placeholder page (`/games/[gameId]/capture`)
- 📋 Real photo capture in game (camera + upload tied to game)
- 📋 Game lobby system (join code, etc.) - optional
- 📋 GPS tracking in gameplay - TBD
- 📋 Proximity questions - TBD
- 📋 Main game UI - TBD

## Implementation Progress

### Phase 1: Photo Infrastructure (COMPLETED)
- ✅ Database schema: `photos` table with location fields (latitude, longitude, location_name)
- ✅ Storage bucket: `snap-and-seek-image` (public)
- ✅ API routes: `/api/upload` (accepts file + coords, reverse geocodes) and `/api/photos`
- ✅ Test page: `/test-upload` — in-app camera, geolocation, photo grid with location
- ✅ TypeScript types: Photo interface in `lib/types.ts`
- ✅ Camera: `CameraCapture` component using `getUserMedia` (rear camera)

### Phase 2: Game zone & flow (COMPLETED)
- ✅ DB: `games` zone columns (`zone_center_lat`, `zone_center_lng`, `zone_radius_meters`) — see `docs/supabase-game-zone.sql`
- ✅ Game management: `/games`, `/games/new`, `/join/[gameId]`, game page with join link and players
- ✅ Set zone modal: geolocation, slider 50m–1km, map (red outside, zone circle, blue pin + accuracy), save via PATCH; zone required before start
- ✅ Start game: PATCH status `hiding`, redirect to zone view; "Start hiding" button
- ✅ Zone view: full-screen map, 10s location refresh + countdown, single blue pin + single accuracy circle (imperative Circle to avoid stacking), outside-zone warning, "Go to photo capture"
- ✅ Capture page: placeholder
- ✅ Map utils: `lib/map-utils.ts` (getBoundsForCircle, distanceMeters, isEntirelyOutsideZone, circleToPolygonPoints, outerBounds)
