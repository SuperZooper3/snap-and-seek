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
- ✅ Photo upload backend (API routes for upload/fetch)
- ✅ Photo display test page (`/test-upload`)
- ✅ Supabase Storage integration (`snap-and-seek-image` bucket)
- 📋 Game lobby system - TBD
- 📋 GPS tracking - TBD
- 📋 Proximity questions - TBD
- 📋 Main game UI - TBD

## Implementation Progress

### Phase 1: Photo Infrastructure (COMPLETED)
- ✅ Database schema: `photos` table with minimal fields
- ✅ Storage bucket: `snap-and-seek-image` (public)
- ✅ API routes: `/api/upload` and `/api/photos`
- ✅ Test page: `/test-upload` for validating upload/display
- ✅ TypeScript types: Photo interface in `lib/types.ts`
