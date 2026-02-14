"use client";

import { useCallback, useMemo, useRef } from "react";
import { GoogleMap, Marker } from "@react-google-maps/api";
import { useGoogleMapsLoader } from "@/lib/google-maps-loader";
import type { LocationPoint } from "./LocationDisplay";

const mapContainerStyle = {
  width: "100%",
  minHeight: "300px",
};

const BLUE_DOT_ICON_URL = "https://maps.google.com/mapfiles/ms/icons/blue-dot.png";

type MapDisplayProps = {
  locations: LocationPoint[];
  countdownSeconds: number | null;
};

export function MapDisplay({ locations, countdownSeconds }: MapDisplayProps) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const { isLoaded, loadError } = useGoogleMapsLoader();

  const center = useMemo(() => {
    if (locations.length === 0) return { lat: 0, lng: 0 };
    const last = locations[locations.length - 1];
    return { lat: last.lat, lng: last.lng };
  }, [locations]);

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  const blueIcon = useMemo(() => {
    if (typeof window === "undefined" || !window.google) return undefined;
    return {
      url: BLUE_DOT_ICON_URL,
      scaledSize: new window.google.maps.Size(32, 32),
    };
  }, [isLoaded]);

  if (loadError) {
    return (
      <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 text-red-700 dark:text-red-300 text-sm">
        Failed to load Google Maps. Check your API key and console for details.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full min-h-[300px] rounded-lg bg-amber-100/80 dark:bg-zinc-700/80 flex items-center justify-center text-amber-800 dark:text-amber-200 text-sm">
        Loading map…
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <div className="w-full min-h-[300px] rounded-lg bg-amber-100/80 dark:bg-zinc-700/80 flex items-center justify-center text-amber-800 dark:text-amber-200 text-sm">
        No points yet
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-lg border border-amber-200/50 dark:border-zinc-600 relative">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={15}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: true,
          fullscreenControl: true,
          streetViewControl: false,
        }}
      >
        {locations.map((point, i) => (
          <Marker
            key={`${i}-${point.timestamp}`}
            position={{ lat: point.lat, lng: point.lng }}
            icon={blueIcon}
            label={{
              text: String(i + 1),
              color: "white",
              fontWeight: "bold",
            }}
            title={`#${i + 1} — ${new Date(point.timestamp).toLocaleTimeString()}`}
          />
        ))}
      </GoogleMap>
      {countdownSeconds !== null && (
        <div
          className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-amber-900/90 dark:bg-zinc-800/90 text-amber-100 text-sm font-medium px-3 py-1.5 rounded-full"
          aria-live="polite"
        >
          Next ping in {countdownSeconds}s
        </div>
      )}
    </div>
  );
}
