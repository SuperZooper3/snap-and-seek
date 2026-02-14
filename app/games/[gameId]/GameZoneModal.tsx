"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GoogleMap, Marker, Circle, Polygon } from "@react-google-maps/api";
import { useGoogleMapsLoader } from "@/lib/google-maps-loader";
import { getLocation as resolveLocation } from "@/lib/get-location";
import { circleToPolygonPoints, outerBounds, getBoundsForCircle } from "@/lib/map-utils";
const ZONE_FIT_PADDING_PX = 16;

const BLUE_DOT_ICON_URL =
  "https://maps.google.com/mapfiles/ms/icons/blue-dot.png";

const RADIUS_MIN_M = 50;
const RADIUS_MAX_M = 1000;
const RADIUS_STEP_M = 25;

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
  const [radiusMeters, setRadiusMeters] = useState(() => {
    const r = initialZone?.radius_meters ?? 500;
    return Math.min(RADIUS_MAX_M, Math.max(RADIUS_MIN_M, r));
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isRefreshingLocation, setIsRefreshingLocation] = useState(false);

  const { isLoaded, loadError } = useGoogleMapsLoader();

  const mapRef = useRef<google.maps.Map | null>(null);

  const center = useMemo(() => {
    if (location.status !== "success") return { lat: 0, lng: 0 };
    return {
      lat: location.coords.latitude,
      lng: location.coords.longitude,
    };
  }, [location]);

  const fitMapToZone = useCallback((map: google.maps.Map) => {
    if (center.lat === 0 && center.lng === 0) return;
    const b = getBoundsForCircle(center.lat, center.lng, radiusMeters);
    const bounds = new google.maps.LatLngBounds(
      { lat: b.south, lng: b.west },
      { lat: b.north, lng: b.east }
    );
    map.fitBounds(bounds, ZONE_FIT_PADDING_PX);
  }, [center.lat, center.lng, radiusMeters]);

  const getLocation = useCallback(() => {
    const alreadyHaveLocation = location.status === "success";
    if (!alreadyHaveLocation) {
      setLocation({ status: "loading" });
    } else {
      setIsRefreshingLocation(true);
    }
    setSaveError(null);
    resolveLocation()
      .then((pos) => {
        setLocation({
          status: "success",
          coords: {
            latitude: pos.latitude,
            longitude: pos.longitude,
            accuracy: pos.accuracy,
          },
        });
        setIsRefreshingLocation(false);
      })
      .catch((err) => {
        setLocation({
          status: "error",
          message: err instanceof Error ? err.message : "Could not get location.",
        });
        setIsRefreshingLocation(false);
      });
  }, [location.status]);

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

  useEffect(() => {
    if (!mapRef.current || center.lat === 0) return;
    fitMapToZone(mapRef.current);
  }, [center.lat, center.lng, radiusMeters, fitMapToZone]);

  return (
    <div
      className="fixed inset-0 z-50 flex min-h-screen min-h-[100dvh] flex-col backdrop-blur-sm font-sans"
      style={{ background: "var(--background)" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="zone-modal-title"
    >
      <div className="flex shrink-0 items-center justify-between gap-3 border-b-[3px] px-4 py-3 safe-area-inset-top" style={{ borderColor: "var(--pastel-border)", background: "var(--pastel-paper)" }}>
        <h2
          id="zone-modal-title"
          className="text-lg font-bold"
          style={{ color: "var(--foreground)" }}
        >
          Set game zone
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-2 transition-colors hover:opacity-80"
          style={{ color: "var(--pastel-ink-muted)" }}
          aria-label="Close"
        >
          <span className="sr-only">Close</span>
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex flex-1 flex-col min-h-0">
        <div className="shrink-0 px-4 py-3 space-y-2">
          {location.status === "loading" && (
            <p className="text-sm" style={{ color: "var(--pastel-ink-muted)" }}>
              Getting your location…
            </p>
          )}
          {location.status === "error" && (
            <p className="text-sm" style={{ color: "var(--pastel-error)" }}>
              {location.message}
            </p>
          )}
          {location.status === "success" && (
            <>
              <p className="text-sm" style={{ color: "var(--pastel-ink-muted)" }}>
                Center: {location.coords.latitude.toFixed(5)},{" "}
                {location.coords.longitude.toFixed(5)} · Accuracy ~
                {Math.round(location.coords.accuracy)} m
                {isRefreshingLocation && (
                  <span className="ml-2">· Updating…</span>
                )}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={getLocation}
                  disabled={isRefreshingLocation}
                  className="btn-sm shrink-0"
                >
                  {isRefreshingLocation ? "Updating…" : "Refresh location"}
                </button>
                <div className="flex-1 min-w-[120px]">
                  <label className="block text-xs font-bold mb-1" style={{ color: "var(--foreground)" }}>
                    Zone radius: {radiusMeters} m
                  </label>
                  <input
                    type="range"
                    min={RADIUS_MIN_M}
                    max={RADIUS_MAX_M}
                    step={RADIUS_STEP_M}
                    value={radiusMeters}
                    onChange={(e) => setRadiusMeters(Number(e.target.value))}
                    className="w-full h-3 rounded-full appearance-none border-2"
                    style={{
                      background: "var(--pastel-butter)",
                      borderColor: "var(--pastel-border)",
                      accentColor: "var(--pastel-border)",
                    }}
                    aria-valuemin={RADIUS_MIN_M}
                    aria-valuemax={RADIUS_MAX_M}
                    aria-valuenow={radiusMeters}
                  />
                  <div className="flex justify-between text-xs mt-0.5" style={{ color: "var(--pastel-ink-muted)" }}>
                    <span>{RADIUS_MIN_M} m</span>
                    <span>{RADIUS_MAX_M} m</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {loadError && (
          <div className="shrink-0 mx-4 mb-2 rounded-xl border-2 p-3 text-sm" style={{ background: "var(--pastel-error)", borderColor: "var(--pastel-border)", color: "var(--pastel-ink)" }}>
            Failed to load map. Check your API key.
          </div>
        )}

        {!isLoaded && !loadError && !showMap && (
          <div className="flex-1 min-h-0 flex items-center justify-center text-sm px-4" style={{ color: "var(--pastel-ink-muted)" }}>
            Loading map…
          </div>
        )}

        {showMap && (
          <div className="flex-1 min-h-0 w-full relative">
            <GoogleMap
              mapContainerStyle={{ width: "100%", height: "100%" }}
              mapContainerClassName="absolute inset-0"
              center={center}
              zoom={15}
              onLoad={(map) => {
                mapRef.current = map;
                fitMapToZone(map);
              }}
              onUnmount={() => {
                mapRef.current = null;
              }}
              options={{
                zoomControl: true,
                mapTypeControl: true,
                fullscreenControl: true,
                streetViewControl: false,
                gestureHandling: "cooperative",
                minZoom: 12,
              }}
            >
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
              <Circle
                center={center}
                radius={radiusMeters}
                options={{
                  strokeColor: "#b91c1c",
                  strokeWeight: 3,
                  fillColor: "transparent",
                  fillOpacity: 0,
                  clickable: false,
                  zIndex: 2,
                }}
              />
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

        <div className="shrink-0 px-4 py-3 pb-safe border-t-[3px] space-y-2" style={{ borderColor: "var(--pastel-border)", background: "var(--pastel-paper)" }}>
          {saveError && (
            <p className="text-sm" style={{ color: "var(--pastel-error)" }}>{saveError}</p>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave || saving}
            className="btn-primary touch-manipulation w-full disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save game zone"}
          </button>
          <p className="text-xs" style={{ color: "var(--pastel-ink-muted)" }}>
            Inside the circle = play area. Outside = out of bounds (red).
          </p>
        </div>
      </div>
    </div>
  );
}
