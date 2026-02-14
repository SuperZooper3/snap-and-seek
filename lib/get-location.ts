/**
 * Get current location. Uses debug cookie if present, else navigator.geolocation.
 */

import { getDebugLocation } from "./debug-location-cookie";

export type LocationResult = {
  latitude: number;
  longitude: number;
  accuracy: number;
};

/**
 * Returns a Promise that resolves with the current location.
 * If debug mode is active (sas_debug_location cookie present), returns that immediately.
 * Otherwise uses navigator.geolocation.getCurrentPosition.
 */
export function getLocation(): Promise<LocationResult> {
  const debug = getDebugLocation();
  if (debug) {
    return Promise.resolve({
      latitude: debug.lat,
      longitude: debug.lng,
      accuracy: 1,
    });
  }
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.reject(new Error("Geolocation is not supported."));
  }
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy ?? 30,
        });
      },
      (err) => {
        reject(
          err.code === 1
            ? new Error("Location permission denied.")
            : new Error("Could not get location.")
        );
      },
      { enableHighAccuracy: true }
    );
  });
}
