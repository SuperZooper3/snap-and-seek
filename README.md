# Snap and Seek

**Hide. Seek. Snap. Find them all.**

Hide-and-seek meets scavenger hunt. Set a game zone, hide and snap a photo of your spot, then race to find everyone else using GPS, a live map, and power-ups (Radar, Thermometer, Photo hints). First to find all the hiding spots wins. Mobile-first, amber-themed, and built for maximum whimsy.

- **Stack:** Next.js, Supabase (DB + Storage), Google Maps, in-app camera + geolocation
- **Flow:** Create game → share link → set zone → hiding (photo setup) → seeking (power-ups + “I found them!”) → winner + summary grid

## About Snap and Seek

Snap and Seek is a whimsical real-world mobile game that combines the thrill of hide and seek with the excitement of scavenger hunts and geocaching. Designed for outdoor play, it encourages players to explore their surroundings (like the amazing Stanford campus) while engaging in a fun, competitive experience with lots of running around and touching grass!

### Game concept

Players split into teams and are tasked with choosing a hidden location. The goal is to find all the other teams' hidden spots using landmark photos relative to the location and proximity clues.

### Core mechanics / abilities

- **Radar:** Narrow down locations with questions like "Are you within 100 meters of me?"
- **Hot or Cold:** By comparing two of your positions, you can see if you're colder or hotter to the location.
- **Landmark:** Unlock different photos taken at the hidden location to reveal more context—like the tallest visible tower or the nearest tree.

### Game flow

You create or join a game and get a shareable link so friends can join. Once everyone's in, you set the play area on a map—a zone (e.g. 50 m to 1 km) that keeps the game contained and fair. When the game starts, each team enters the hiding phase: you go to your secret spot, take a main photo of it, and optionally add landmark photos (e.g. the tallest visible tower, the nearest tree) or mark "I don't have this" for some types. You lock in your spot and wait for the seeking phase to begin. In seeking, everyone sees a live map with their position and a list of other teams to find. You use three kinds of clues: **Radar** asks "Am I within X meters?" and tells you yes or no; **Hot or Cold** compares two of your positions and says whether you're getting closer or farther; **Landmark** lets you unlock those extra photos from the hiding spot for more context. When you think you've found a team's location, you snap a photo and submit it; if it's correct, that target is marked found. The first team to find every other team's hiding spot wins, and a summary grid shows everyone's hiding and found photos so you can relive the round.

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Setup

1. **Supabase** – Create a project, add the `games` table (see repo docs), then copy **Project URL** and **service_role** key into `.env.local`.
2. **Google Maps** – Enable Maps JavaScript API + Geocoding API, create an API key, add to `.env.local`.

Copy from `.env.example` and fill in:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

Restart the dev server after editing env.

## Scripts

- `npm run dev` – dev server  
- `npm run build` – production build  
- `npm run start` – run production build  
