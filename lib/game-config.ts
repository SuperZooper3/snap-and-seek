/**
 * Single source of truth for game settings.
 * Used in lobby, zone (hiding) timer, API, and game creation.
 */

/** Default hiding phase duration in seconds (1 minute). */
export const DEFAULT_HIDING_DURATION_SECONDS = 60;

/** Minimum allowed hiding duration (seconds). */
export const MIN_HIDING_DURATION_SECONDS = 30;

/** Maximum allowed hiding duration (seconds). */
export const MAX_HIDING_DURATION_SECONDS = 86400;

/** Default power-up casting duration in seconds (1 minute). */
export const DEFAULT_POWERUP_CASTING_SECONDS = 60;

/** Minimum allowed power-up casting duration (seconds). */
export const MIN_POWERUP_CASTING_SECONDS = 10;

/** Maximum allowed power-up casting duration (seconds). */
export const MAX_POWERUP_CASTING_SECONDS = 300;

/**
 * Resolve hiding duration from game: use DB value if valid, otherwise default.
 */
export function getHidingDurationSeconds(
  fromDb: number | null | undefined
): number {
  if (fromDb == null) return DEFAULT_HIDING_DURATION_SECONDS;
  if (
    typeof fromDb !== "number" ||
    fromDb < MIN_HIDING_DURATION_SECONDS ||
    fromDb > MAX_HIDING_DURATION_SECONDS
  ) {
    return DEFAULT_HIDING_DURATION_SECONDS;
  }
  return fromDb;
}

/**
 * Resolve power-up casting duration from game: use DB value if valid, otherwise default.
 */
export function getPowerupCastingSeconds(
  fromDb: number | null | undefined
): number {
  if (fromDb == null) return DEFAULT_POWERUP_CASTING_SECONDS;
  if (
    typeof fromDb !== "number" ||
    fromDb < MIN_POWERUP_CASTING_SECONDS ||
    fromDb > MAX_POWERUP_CASTING_SECONDS
  ) {
    return DEFAULT_POWERUP_CASTING_SECONDS;
  }
  return fromDb;
}
