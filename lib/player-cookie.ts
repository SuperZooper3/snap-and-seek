/**
 * Cookie-based player identity (no auth). One cookie stores which player
 * you are per game: { [gameId]: { id: number, name: string } }.
 */

export const PLAYER_COOKIE_NAME = "sas_players";

const MAX_AGE_DAYS = 30;

export type PlayerIdentity = { id: number; name: string };

export type PlayersCookie = Record<string, PlayerIdentity>;

export function parsePlayersCookie(value: string | undefined): PlayersCookie {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value) as unknown;
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
      ? (parsed as PlayersCookie)
      : {};
  } catch {
    return {};
  }
}

export function getPlayerForGame(
  value: string | undefined,
  gameId: string
): PlayerIdentity | null {
  const all = parsePlayersCookie(value);
  const entry = all[gameId];
  return entry && typeof entry.id === "number" && typeof entry.name === "string"
    ? { id: entry.id, name: entry.name }
    : null;
}

/** Call from client only: saves this player for the game in the cookie. */
export function setPlayerInCookie(
  gameId: string,
  player: PlayerIdentity
): void {
  if (typeof document === "undefined") return;
  const raw = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${PLAYER_COOKIE_NAME}=`))
    ?.split("=")[1];
  const decoded = raw ? decodeURIComponent(raw) : undefined;
  const existing = parsePlayersCookie(decoded);
  const merged: PlayersCookie = { ...existing, [gameId]: player };
  const maxAge = MAX_AGE_DAYS * 24 * 60 * 60;
  document.cookie = `${PLAYER_COOKIE_NAME}=${encodeURIComponent(JSON.stringify(merged))}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

/** Call from client only: removes your identity for this game (release). */
export function clearPlayerForGame(gameId: string): void {
  if (typeof document === "undefined") return;
  const raw = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${PLAYER_COOKIE_NAME}=`))
    ?.split("=")[1];
  const decoded = raw ? decodeURIComponent(raw) : undefined;
  const existing = parsePlayersCookie(decoded);
  const { [gameId]: _removed, ...rest } = existing;
  const maxAge = MAX_AGE_DAYS * 24 * 60 * 60;
  document.cookie = `${PLAYER_COOKIE_NAME}=${encodeURIComponent(JSON.stringify(rest))}; path=/; max-age=${maxAge}; SameSite=Lax`;
}
