"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  Circle,
  Polygon,
} from "@react-google-maps/api";
import { circleToPolygonPoints, outerBounds } from "@/lib/map-utils";

const mapContainerStyle = {
  width: "100%",
  minHeight: "280px",
};

const BLUE_DOT_ICON_URL =
  "https://maps.google.com/mapfiles/ms/icons/blue-dot.png";

const RADIUS_MIN_M = 100;
const RADIUS_MAX_M = 2000;
const RADIUS_STEP_M = 50;

type LocationState =
  | { status: "idle" }
  | { status: "loading" }
  | {
      status: "success";
      coords: { latitude: number; longitude: number; accuracy: number };
    }
  | { status: "error"; message: string };

type Props = {
  gameId: string;
  initialZone?: {
    center_lat: number;
    center_lng: number;
    radius_meters: number;
  } | null;
  onSaved: () => void;
  onClose: () => void;
};

export function GameZoneModal({
  gameId,
  initialZone,
  onSaved,
  onClose,
}: Props) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const [location, setLocation] = useState<LocationState>(() =>
    initialZone
      ? {
          status: "success" as const,
          coords: {
            latitude: initialZone.center_lat,
            longitude: initialZone.center_lng,
            accuracy: 30,
          },
        }
      : { status: "idle" as const }
  );
  const [radiusMeters, setRadiusMeters] = useState(
    initialZone?.radius_meters ?? 500
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-zone",
    googleMapsApiKey: apiKey,
  });

  const center = useMemo(() => {
    if (location.status !== "success") return { lat: 0, lng: 0 };
    return {
      lat: location.coords.latitude,
      lng: location.coords.longitude,
    };
  }, [location]);

  const getLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocation({
        status: "error",
        message: "Geolocation is not supported.",
      });
      return;
    }
    setLocation({ status: "loading" });
    setSaveError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          status: "success",
          coords: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy ?? 30,
          },
        });
      },
      (err) => {
        setLocation({
          status: "error",
          message:
            err.code === 1
              ? "Location permission denied."
              : "Could not get location.",
        });
      },
      { enableHighAccuracy: true }
    );
  }, []);

  useEffect(() => {
    if (!initialZone && location.status === "idle") {
      getLocation();
    }
  }, [initialZone, location.status, getLocation]);

  const polygonPaths = useMemo(() => {
    if (location.status !== "success") return [];
    const outer = outerBounds(
      location.coords.latitude,
      location.coords.longitude,
      2
    );
    const inner = circleToPolygonPoints(
      location.coords.latitude,
      location.coords.longitude,
      radiusMeters,
      64
    );
    return [outer, inner];
  }, [location, radiusMeters]);

  const blueIcon = useMemo(() => {
    if (typeof window === "undefined" || !window.google) return undefined;
    return {
      url: BLUE_DOT_ICON_URL,
      scaledSize: new window.google.maps.Size(32, 32),
    };
  }, [isLoaded]);

  const handleSave = useCallback(async () => {
    if (location.status !== "success") return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/games/${gameId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zone_center_lat: location.coords.latitude,
          zone_center_lng: location.coords.longitude,
          zone_radius_meters: radiusMeters,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save zone");
      }
      onSaved();
      onClose();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Failed to save zone");
    } finally {
      setSaving(false);
    }
  }, [gameId, location, radiusMeters, onSaved, onClose]);

  const canSave = location.status === "success";
  const showMap = isLoaded && location.status === "success";

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-amber-50/95 dark:bg-zinc-900/95 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="zone-modal-title"
    >
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-amber-200/60 dark:border-zinc-700 px-4 py-3 safe-area-inset-top">
        <h2
          id="zone-modal-title"
          className="text-lg font-semibold text-amber-900 dark:text-amber-100"
        >
          Set game zone
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-2 text-amber-700 dark:text-amber-300 hover:bg-amber-200/50 dark:hover:bg-zinc-700"
          aria-label="Close"
        >
          <span className="sr-only">Close</span>
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 pb-safe">
        {location.status === "loading" && (
          <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
            Getting your location…
          </p>
        )}
        {location.status === "error" && (
          <p className="text-sm text-red-600 dark:text-red-400 mb-3">
            {location.message}
          </p>
        )}
        {location.status === "success" && (
          <p className="text-sm text-amber-800 dark:text-amber-200 mb-2">
            Center: {location.coords.latitude.toFixed(5)},{" "}
            {location.coords.longitude.toFixed(5)} · Accuracy ~
            {Math.round(location.coords.accuracy)} m
          </p>
        )}

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={getLocation}
            className="touch-manipulation rounded-xl bg-amber-500 hover:bg-amber-600 text-amber-950 font-medium px-4 py-2.5 text-sm transition-colors"
          >
            Refresh location
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-amber-900 dark:text-amber-100 mb-2">
            Zone radius: {radiusMeters} m
          </label>
          <input
            type="range"
            min={RADIUS_MIN_M}
            max={RADIUS_MAX_M}
            step={RADIUS_STEP_M}
            value={radiusMeters}
            onChange={(e) => setRadiusMeters(Number(e.target.value))}
            className="w-full h-3 rounded-full appearance-none bg-amber-200 dark:bg-zinc-600 accent-amber-600"
            aria-valuemin={RADIUS_MIN_M}
            aria-valuemax={RADIUS_MAX_M}
            aria-valuenow={radiusMeters}
          />
          <div className="flex justify-between text-xs text-amber-700 dark:text-amber-300 mt-1">
            <span>{RADIUS_MIN_M} m</span>
            <span>{RADIUS_MAX_M} m</span>
          </div>
        </div>

        {loadError && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-red-700 dark:text-red-300 text-sm mb-4">
            Failed to load map. Check your API key.
          </div>
        )}

        {!isLoaded && !loadError && (
          <div className="w-full min-h-[280px] rounded-xl bg-amber-100/80 dark:bg-zinc-700/80 flex items-center justify-center text-amber-800 dark:text-amber-200 text-sm mb-4">
            Loading map…
          </div>
        )}

        {showMap && (
          <div className="w-full overflow-hidden rounded-xl border border-amber-200/50 dark:border-zinc-600 mb-4 relative">
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={center}
              zoom={15}
              options={{
                zoomControl: true,
                mapTypeControl: true,
                fullscreenControl: true,
                streetViewControl: false,
                gestureHandling: "cooperative",
              }}
            >
              {/* Red shaded area outside the zone (polygon with hole) */}
              <Polygon
                paths={polygonPaths}
                options={{
                  fillColor: "#b91c1c",
                  fillOpacity: 0.35,
                  strokeColor: "#b91c1c",
                  strokeWeight: 2,
                  clickable: false,
                  zIndex: 1,
                }}
              />
              {/* Zone boundary: red circle */}
              <Circle
                center={center}
                radius={radiusMeters}
                options={{
                  strokeColor: "#b91c1c",
                  strokeWeight: 3,
                  fillColor: "#22c55e",
                  fillOpacity: 0.15,
                  clickable: false,
                  zIndex: 2,
                }}
              />
              {/* Accuracy circle around player (light blue/gray) */}
              {location.status === "success" && location.coords.accuracy > 0 && (
                <Circle
                  center={center}
                  radius={location.coords.accuracy}
                  options={{
                    strokeColor: "#3b82f6",
                    strokeWeight: 1.5,
                    fillColor: "#3b82f6",
                    fillOpacity: 0.2,
                    clickable: false,
                    zIndex: 3,
                  }}
                />
              )}
              <Marker
                position={center}
                icon={blueIcon}
                title="You are here"
                zIndex={4}
              />
            </GoogleMap>
          </div>
        )}

        {saveError && (
          <p className="text-sm text-red-600 dark:text-red-400 mb-3">
            {saveError}
          </p>
        )}

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave || saving}
            className="touch-manipulation w-full rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold px-6 py-3.5 text-base transition-colors"
          >
            {saving ? "Saving…" : "Save game zone"}
          </button>
          <p className="text-xs text-amber-700 dark:text-amber-300">
            The game zone is required before starting. Inside the green circle is
            the play area; outside is out of bounds (red).
          </p>
        </div>
      </div>
    </div>
  );
}
