"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { GoogleMap, Marker } from "@react-google-maps/api";
import { useGoogleMapsLoader } from "@/lib/google-maps-loader";
import {
  getDebugLocation,
  setDebugLocation,
  clearDebugLocation,
} from "@/lib/debug-location-cookie";
import { getLocation } from "@/lib/get-location";

const BLUE_DOT_ICON_URL =
  "https://maps.google.com/mapfiles/ms/icons/blue-dot.png";

/** Fallback center when no debug location (e.g. before first load) */
const FALLBACK_LAT = 37.7749;
const FALLBACK_LNG = -122.4194;

export function DebugModeClient() {
  const [debugLocation, setDebugLocationState] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [startLoading, setStartLoading] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const { isLoaded, loadError } = useGoogleMapsLoader();

  // Sync from cookie on mount (client-side only)
  useEffect(() => {
    const loc = getDebugLocation();
    setDebugLocationState(loc);
  }, []);

  const handleStartDebug = useCallback(() => {
    setStartError(null);
    setStartLoading(true);
    getLocation()
      .then((pos) => {
        setDebugLocation(pos.latitude, pos.longitude);
        setDebugLocationState({ lat: pos.latitude, lng: pos.longitude });
      })
      .catch((err) => {
        setStartError(err instanceof Error ? err.message : "Could not get location.");
      })
      .finally(() => {
        setStartLoading(false);
      });
  }, []);

  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    const latLng = e.latLng;
    if (!latLng) return;
    const lat = latLng.lat();
    const lng = latLng.lng();
    setDebugLocation(lat, lng);
    setDebugLocationState({ lat, lng });
  }, []);

  const handleEndDebug = useCallback(() => {
    clearDebugLocation();
    setDebugLocationState(null);
  }, []);

  const center = useMemo(() => {
    if (debugLocation) return { lat: debugLocation.lat, lng: debugLocation.lng };
    return { lat: FALLBACK_LAT, lng: FALLBACK_LNG };
  }, [debugLocation]);

  const blueIcon = useMemo(() => {
    if (typeof window === "undefined" || !window.google) return undefined;
    return {
      url: BLUE_DOT_ICON_URL,
      scaledSize: new window.google.maps.Size(32, 32),
    };
  }, [isLoaded]);

  return (
    <main className="mx-auto max-w-lg min-h-screen flex flex-col px-4 py-6">
      <header className="shrink-0 mb-4">
        <Link
          href="/"
          className="text-sm text-zinc-600 dark:text-zinc-400 hover:underline"
        >
          ← Back to home
        </Link>
        <h1 className="mt-2 text-xl font-bold text-zinc-900 dark:text-zinc-100">
          Debug Mode
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Override your GPS location for testing. Click the map to set location.
          Persists across tabs until you end debug mode.
        </p>
      </header>

      {!debugLocation ? (
        <div className="flex flex-col gap-4 flex-1">
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            Debug mode is off. Your location comes from real GPS. Starting will
            use your current position as the debug location.
          </p>
          {startError && (
            <p className="text-sm text-red-600 dark:text-red-400">{startError}</p>
          )}
          <button
            type="button"
            onClick={handleStartDebug}
            disabled={startLoading}
            className="touch-manipulation w-full rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-70 text-white font-semibold px-6 py-3.5 transition-colors"
          >
            {startLoading ? "Getting your location…" : "Start debug mode"}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4 flex-1 min-h-0">
          <div className="shrink-0 rounded-lg bg-amber-50 dark:bg-zinc-800 border border-amber-200/60 dark:border-zinc-600 p-3 font-mono text-xs text-zinc-800 dark:text-zinc-200">
            <p className="font-semibold text-amber-800 dark:text-amber-200 mb-1">
              Debug location (active)
            </p>
            <p>
              {debugLocation.lat.toFixed(6)}, {debugLocation.lng.toFixed(6)}
            </p>
            <p className="mt-1 text-zinc-600 dark:text-zinc-400">
              Click the map below to change.
            </p>
          </div>

          <div className="flex-1 min-h-[300px] rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700">
            {loadError && (
              <div className="h-full flex items-center justify-center bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm p-4">
                Failed to load map.
              </div>
            )}
            {!loadError && isLoaded && (
              <GoogleMap
                mapContainerStyle={{ width: "100%", height: "100%", minHeight: 300 }}
                center={center}
                zoom={15}
                onClick={handleMapClick}
                options={{
                  zoomControl: true,
                  mapTypeControl: true,
                  fullscreenControl: true,
                  streetViewControl: false,
                  gestureHandling: "cooperative",
                  minZoom: 4,
                }}
              >
                <Marker
                  position={center}
                  icon={blueIcon}
                  title="Debug location (click map to move)"
                />
              </GoogleMap>
            )}
            {!isLoaded && !loadError && (
              <div className="h-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-sm">
                Loading map…
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleEndDebug}
            className="touch-manipulation w-full rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3.5 transition-colors"
          >
            End debug mode
          </button>
          <p className="text-xs text-zinc-500 dark:text-zinc-500 text-center">
            Ending clears the debug cookie. Location will use real GPS again.
          </p>
        </div>
      )}
    </main>
  );
}
