/**
 * Cookie storing game IDs the user has created or joined ("your games").
 * Used so we can show a "Your games" page without listing all public games.
 */

export const YOUR_GAMES_COOKIE_NAME = "sas_your_games";

const MAX_GAME_IDS = 30;
const MAX_AGE_DAYS = 365;

export function parseYourGamesCookie(value: string | undefined): string[] {
  if (!value) return [];
  try {
    const decoded = decodeURIComponent(value);
    const parsed = JSON.parse(decoded) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string" && id.length > 0).slice(0, MAX_GAME_IDS);
  } catch {
    return [];
  }
}

/** Call from client only: add a game ID to "your games" (most recent first, deduped, capped). */
export function addGameToYourGames(gameId: string): void {
  if (typeof document === "undefined") return;
  const raw = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${YOUR_GAMES_COOKIE_NAME}=`))
    ?.split("=")[1];
  const existing = parseYourGamesCookie(raw);
  const rest = existing.filter((id) => id !== gameId);
  const next = [gameId, ...rest].slice(0, MAX_GAME_IDS);
  const maxAge = MAX_AGE_DAYS * 24 * 60 * 60;
  document.cookie = `${YOUR_GAMES_COOKIE_NAME}=${encodeURIComponent(JSON.stringify(next))}; path=/; max-age=${maxAge}; SameSite=Lax`;
}
