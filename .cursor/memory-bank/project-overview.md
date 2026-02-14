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
- 📋 Game lobby system - TBD
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
