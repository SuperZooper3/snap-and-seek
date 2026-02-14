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
 * Game record from the database
 */
export interface Game {
  id: string;
  name: string | null;
  status: string | null;
  created_at: string | null;
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
