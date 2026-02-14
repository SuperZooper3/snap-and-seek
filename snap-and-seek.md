# Snap and Seek

**Hide. Seek. Snap. Find them all.**

A mobile-first multiplayer game that combines hide-and-seek with scavenger hunting and geocaching.

---

## Game Concept

Traditional hide-and-seek has problems:
- Sequential gameplay (wait for your turn)
- Hider gets bored sitting still
- Finding someone ends the game for them

**Snap and Seek fixes this:**
- ✅ Simultaneous gameplay - everyone plays at once
- ✅ Teams hide *locations*, not themselves
- ✅ Computer handles the "questioning" instead of the hider
- ✅ Race to find ALL spots, not just one

---

## How It Works

### Phase 1: Hide (Photo Setup)
Each team finds a spot within the game boundary and takes a photo. This photo becomes their "hidden object."

### Phase 2: Seek (Active Gameplay)
All teams can now see each other's photos and must race to physically find those locations using:
- **GPS tracking** - Walk around the game area
- **Question system** - Ask proximity questions:
  - "Am I within 100 meters?"
  - "Hotter or colder from my last position?"
  - "Show me a hint"
- **Map view** - See game boundary, your position, and found targets

### Phase 3: Victory
First team to physically reach all other teams' hidden spots wins!

---

## Core Mechanics

### 🗺️ Location & GPS
- Set game center coordinate (lat/lng)
- Define radius (e.g., 100m around a building)
- Real-time GPS tracking of all players
- Automatic detection when you reach a target location

### 📸 Photo Capture
- Take photo at your hidden spot
- GPS coordinates attached automatically
- Add optional hints for other teams
- Preview and retake before locking in

### ❓ Question System
Instead of asking the hider "am I close?", the app answers:
- **Proximity checks**: "Within 50m?", "Within 100m?"
- **Temperature feedback**: "Hotter" or "Colder" since last query
- **Hints**: Request additional photos or text clues

### 🎮 Optional Game Modes

**Player Tagging:**
- Tag opponents when within 5 meters
- Tagged players get time penalty or temporary freeze

**Hunter Mode:**
- Temporary GPS visibility between hunter/hunted teams
- Chase mechanics with cooldowns

**Power-Ups:**
- Unlocked by completing physical tasks:
  - Walk 200 meters → unlock Radar
  - Run at 2.5 m/s → unlock Speed Boost
- Examples: Extra Hint, Range Boost, Tagging Shield

---

## Technical Architecture

### Client (Mobile App)
- **Platforms**: iOS/Android via mobile web browser
- **Key screens**:
  - Auth/onboarding
  - Lobby (create/join with game code)
  - Game setup (hide your spot)
  - Active play (map + questions)
  - Results (winner + stats)

### Backend
- **Game server**: Next.js API routes
- **Real-time service**: WebSocket or polling
- **Storage**: Photos, game state, player positions

### Data Model
Core entities:
- **Users** - Player profiles (username, stats)
- **Games** - Game sessions (center, radius, status, join code)
- **Teams** - Team assignments within games
- **Targets** - Hidden spots with photos and GPS coordinates
- **PlayerStates** - Real-time positions and status
- **FindEvents** - Records of teams discovering targets
- **TagEvents** - Player tagging records
- **PowerUps** - Unlockable abilities

---

## Game Flow

```
┌─────────────┐
│   Landing   │
│    Page     │
└──────┬──────┘
       │
       ├──> Create Game
       │    ├─ Set center location
       │    ├─ Set radius
       │    ├─ Set duration
       │    └─ Generate join code
       │
       └──> Join Game
            └─ Enter code
                    │
                    ▼
            ┌───────────────┐
            │     Lobby     │
            │ (Wait for all │
            │    players)   │
            └───────┬───────┘
                    │
                    ▼
            ┌───────────────┐
            │  Photo Setup  │
            │  (Each team   │
            │  hides spot)  │
            └───────┬───────┘
                    │
                    ▼
            ┌───────────────┐
            │ Active Play   │
            │ ├─ Map view   │
            │ ├─ Questions  │
            │ ├─ Tagging    │
            │ └─ Power-ups  │
            └───────┬───────┘
                    │
                    ▼
            ┌───────────────┐
            │    Results    │
            │ (Winner,      │
            │  stats, MVP)  │
            └───────────────┘
```

---

## Design Principles

### 🎨 Whimsy Over Competition
- Playful, colorful UI
- Fun animations and celebrations
- Lighthearted tone
- Emphasis on adventure, not aggression

### 📱 Mobile-First
- Optimized for phones (primary device)
- Large touch targets
- Thumb-friendly layouts
- Works in bright sunlight

### ⚡ Fast & Simple
- Quick onboarding (no complex account creation)
- Clear visual feedback
- Minimal text, maximum icons
- Games finish in 10-20 minutes

---

## Development Timeline

**Target**: Tomorrow afternoon
**Goal**: Demo-ready for Waddle League testing + filming submission video

### Priority Order
1. **Core loop** - Hide spot → find spots
2. **Question system** - Basic proximity checks
3. **Polish** - Whimsical UI/UX
4. **Optional features** - Tagging, power-ups (if time permits)

---

## Success Criteria

**For hackathon submission:**
- ✅ 2+ teams can play simultaneously
- ✅ Photo capture works reliably
- ✅ GPS tracking shows positions on map
- ✅ Proximity questions return accurate answers
- ✅ Winner determination works correctly
- ✅ Game is fun and whimsical
- ✅ Demo video shows full gameplay loop

**Nice-to-haves:**
- Tagging mechanics
- Power-up system
- Hunter mode
- Sound effects
- Advanced animations

---

## Resources

- **Meeting transcript**: https://notes.granola.ai/t/0ab2b884-9249-4332-ac33-7a4c77a37f12
- **Testing location**: Waddle League
- **Tech stack**: Next.js, Supabase, Google Maps/Mapbox

---

*Built for maximum whimsy. 🎮📸🗺️*
