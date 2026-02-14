/**
 * Photo record from the database
 */
export interface Photo {
  id: number;
  url: string;
  storage_path: string;
  created_at: string;
  latitude: number | null;
  longitude: number | null;
  location_name: string | null;
  game_id: string | null;
  player_id: number | null;
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
  /** Hiding phase duration in seconds. See lib/game-config for default and bounds. */
  hiding_duration_seconds: number | null;
  /** Power-up casting duration in seconds. See lib/game-config for default and bounds. */
  powerup_casting_duration_seconds: number | null;
  /** Set when status becomes 'hiding' */
  hiding_started_at: string | null;
  /** Set when status becomes 'seeking' */
  seeking_started_at: string | null;
  /** FK to players.id — the winner of the game */
  winner_id: number | null;
  /** Set when game status becomes 'completed' */
  finished_at: string | null;
}

/**
 * Submission record from the database
 */
export interface Submission {
  id: string;
  game_id: string;
  seeker_id: number;
  hider_id: number;
  photo_id: number | null;
  status: "pending" | "success" | "fail";
  created_at: string;
}

/**
 * Player record from the database
 */
export interface Player {
  id: number;
  created_at: string;
  name: string;
  game_id: string;
  /** bigint FK to photos.id — the main hiding spot photo */
  hiding_photo: number | null;
  /** bigint FK to photos.id — optional tree photo */
  tree_photo: number | null;
  /** bigint FK to photos.id — optional building photo */
  building_photo: number | null;
  /** bigint FK to photos.id — optional path photo */
  path_photo: number | null;
}

/**
 * Hint/Power-up record from the database
 */
export interface Hint {
  id: string;
  game_id: string;
  seeker_id: number;
  hider_id: number;
  type: 'radar' | 'thermometer' | 'photo';
  note: string | null;
  casting_duration_seconds: number;
  status: 'casting' | 'completed' | 'cancelled';
  created_at: string;
  completed_at: string | null;
}

/**
 * Power-up casting state for UI management
 */
export interface PowerupCastingState {
  activeHints: Hint[];
  completedHints: Hint[];
  selectedPowerupType: 'radar' | 'thermometer' | 'photo';
}

/**
 * Radar hint result data stored in note field
 */
export interface RadarHintNote {
  distanceMeters: number;
  result?: {
    withinDistance: boolean;
    actualDistance: number;
  };
}

/**
 * Thermometer hint data stored in note field
 */
export interface ThermometerHintNote {
  startLat: number;
  startLng: number;
  thresholdMeters: number;
  result?: 'hotter' | 'colder' | 'same';
}

/**
 * Photo hint data stored in note field
 */
export interface PhotoHintNote {
  photoType: 'tree' | 'building' | 'path';
  photoId: number;
  unlocked: boolean;
}
