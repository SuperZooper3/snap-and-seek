"use client";

import { useMemo } from "react";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";

const mapContainerStyle = {
  width: "100%",
  minHeight: "300px",
};

type MapDisplayProps = {
  lat: number;
  lng: number;
};

export function MapDisplay({ lat, lng }: MapDisplayProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey,
  });

  const center = useMemo(() => ({ lat, lng }), [lat, lng]);

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

  return (
    <div className="w-full overflow-hidden rounded-lg border border-amber-200/50 dark:border-zinc-600">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={15}
        options={{
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: true,
          fullscreenControl: true,
          streetViewControl: false,
        }}
      >
        <Marker position={center} title="You are here" />
      </GoogleMap>
    </div>
  );
}
