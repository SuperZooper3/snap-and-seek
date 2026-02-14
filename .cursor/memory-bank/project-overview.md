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
- ✅ Game creation + join flow with cookie-based identity
- ✅ Game lobby with player list + share link + start game
- ✅ Photo setup page (`/games/[gameId]/setup`) — main photo + optional items + full-screen camera modal
- ✅ Shared components: `CameraCapture`, `CameraModal`, `ItemBar`
- 📋 Dynamic "visible from" items (currently hardcoded) - TBD
- 📋 GPS tracking in gameplay - TBD
- 📋 Proximity questions - TBD
- 📋 Main game UI - TBD

## Implementation Progress

### Phase 1: Photo Infrastructure (COMPLETED)
- ✅ Database schema: `photos` table with location fields (latitude, longitude, location_name)
- ✅ Storage bucket: `snap-and-seek-image` (public)
- ✅ API routes: `/api/upload` (accepts file + coords + game context, reverse geocodes) and `/api/photos`
- ✅ Test page: `/test-upload` — in-app camera, geolocation, photo grid with location
- ✅ TypeScript types: Photo, Game, Player interfaces in `lib/types.ts`
- ✅ Camera: `CameraCapture` shared component with `autoStart`/`fullScreen` props

### Phase 2: Game Flow (IN PROGRESS)
- ✅ Game creation + lobby (`/games/[gameId]`)
- ✅ Join flow with name entry (`/join/[gameId]`)
- ✅ Cookie-based player identity (`lib/player-cookie.ts`)
- ✅ Photo setup page (`/games/[gameId]/setup`) with camera modal + per-item upload
- 📋 DB migration for new `photos` columns (game_id, player_id, label, is_main)
- 📋 Dynamic item selection (currently hardcoded Tree + Rock)
- 📋 Ready-up / waiting screen after setup
