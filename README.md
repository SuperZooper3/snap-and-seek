# Snap and Seek

<img width="1620" height="1080" alt="MockupViews_1x_PNG_20260215_515" src="https://github.com/user-attachments/assets/11a08cad-4db7-429e-987d-0f272e103f6b" />

## About Snap and Seek

**Hide. Seek. Snap. Find them all.**

*play free at [snap-and-seek-game.vercel.app](https://snap-and-seek-game.vercel.app/)*

Snap and Seek is a whimsical real-world mobile game that combines the thrill of hide and seek with the excitement of scavenger hunts and geocaching. Designed for outdoor play, it encourages players to explore their surroundings (like the amazing Stanford campus) while engaging in a fun, competitive experience with lots of running around and touching grass!

### Game concept

Players split into teams and are tasked with choosing a hidden location. The goal is to find all the other teams' hidden spots using landmark photos relative to the location and proximity clues.

### Core mechanics / abilities

- **Radar:** Narrow down locations with questions like "Are you within 100 meters of me?"
- **Hot or Cold:** By comparing two of your positions, you can see if you're colder or hotter to the location.
- **Landmark:** Unlock different photos taken at the hidden location to reveal more context—like the tallest visible tower or the nearest tree.

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
