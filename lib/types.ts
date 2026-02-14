/**
 * Photo record from the database
 */
export interface Photo {
  id: string;
  url: string;
  storage_path: string;
  created_at: string;
  latitude: number | null;
  longitude: number | null;
  location_name: string | null;
}

/**
 * Game zone (center + radius). Required before starting a game.
 */
export interface GameZone {
  center_lat: number;
  center_lng: number;
  radius_meters: number;
}

/**
 * Game record from the database
 */
export interface Game {
  id: string;
  name: string | null;
  status: string | null;
  created_at: string | null;
  zone_center_lat: number | null;
  zone_center_lng: number | null;
  zone_radius_meters: number | null;
}

/**
 * Player record from the database
 */
export interface Player {
  id: number;
  created_at: string;
  name: string;
  game_id: string;
}
