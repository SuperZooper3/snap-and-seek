/**
 * Debug location override stored in a cookie.
 * When present, getLocation() uses this instead of navigator.geolocation.
 */

export const DEBUG_LOCATION_COOKIE_NAME = "sas_debug_location";

const MAX_AGE_DAYS = 7;
const MAX_AGE_SECONDS = MAX_AGE_DAYS * 24 * 60 * 60;

export type DebugLocation = { lat: number; lng: number };

export function getDebugLocation(): DebugLocation | null {
  if (typeof document === "undefined") return null;
  const raw = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${DEBUG_LOCATION_COOKIE_NAME}=`))
    ?.split("=")[1];
  const decoded = raw ? decodeURIComponent(raw) : undefined;
  if (!decoded) return null;
  try {
    const parsed = JSON.parse(decoded) as unknown;
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      typeof (parsed as DebugLocation).lat === "number" &&
      typeof (parsed as DebugLocation).lng === "number"
    ) {
      return parsed as DebugLocation;
    }
  } catch {
    // invalid JSON
  }
  return null;
}

/** Call from client only: saves debug location (enables debug mode). */
export function setDebugLocation(lat: number, lng: number): void {
  if (typeof document === "undefined") return;
  const value = JSON.stringify({ lat, lng });
  document.cookie = `${DEBUG_LOCATION_COOKIE_NAME}=${encodeURIComponent(value)}; path=/; max-age=${MAX_AGE_SECONDS}; SameSite=Lax`;
}

/** Call from client only: removes debug location (disables debug mode). */
export function clearDebugLocation(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${DEBUG_LOCATION_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
}
