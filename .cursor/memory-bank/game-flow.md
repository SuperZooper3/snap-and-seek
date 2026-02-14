# Game Flow

## Development Status

### Implemented
1. **Photo Upload Test Page** (`/test-upload`)
   - Upload images to Supabase Storage
   - Display all uploaded photos
   - Bare-bones UI for backend testing

### To Be Implemented
1. **Lobby**: Create/join game with code
2. **Setup**: Teams photograph their hidden spots (integrate with photo upload)
3. **Active Play**: Find other teams' locations via GPS + questions
4. **Results**: Winner, stats, replay

## Full Game Flow (Target)

### 1. Landing & Lobby
- Create new game (set boundaries, duration)
- Generate shareable join code
- Join existing game with code
- Wait for all players to ready up

### 2. Photo Setup Phase
- Each team navigates to their hiding spot
- Take photo using device camera (integrate `/api/upload`)
- Capture GPS coordinates automatically
- Optional: add hints
- Lock in selection

### 3. Active Play Phase
- Map view showing:
  - Game boundary
  - Your current position
  - Other teams' photos (targets)
  - Progress indicators
- Question system:
  - "Am I within 50m/100m?"
  - "Hotter or colder?"
  - Request hints
- Auto-detect when you reach a target location
- Race to find all spots

### 4. Results Screen
- Winner announcement
- Stats (distance traveled, time to find each spot)
- MVP/achievements
- Option to play again

## Design Principles
- Mobile-first (phone optimized)
- Maximum whimsy over competition
- Fast iteration over perfection
