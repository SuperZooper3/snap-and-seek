"use client";

import { useMemo } from "react";
import { GoogleMap, useJsApiLoader, Circle, Polygon } from "@react-google-maps/api";
import { circleToPolygonPoints, outerBounds } from "@/lib/map-utils";

const mapContainerStyle = {
  width: "100%",
  minHeight: "min(70vh, 400px)",
};

type Zone = {
  center_lat: number;
  center_lng: number;
  radius_meters: number;
};

type Props = {
  zone: Zone;
};

export function ZoneMapView({ zone }: Props) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-zone-view",
    googleMapsApiKey: apiKey,
  });

  const center = useMemo(
    () => ({ lat: zone.center_lat, lng: zone.center_lng }),
    [zone]
  );

  const polygonPaths = useMemo(() => {
    const outer = outerBounds(zone.center_lat, zone.center_lng, 2);
    const inner = circleToPolygonPoints(
      zone.center_lat,
      zone.center_lng,
      zone.radius_meters,
      64
    );
    return [outer, inner];
  }, [zone]);

  if (loadError) {
    return (
      <div className="rounded-xl bg-red-50 dark:bg-red-900/20 p-4 text-red-700 dark:text-red-300 text-sm">
        Failed to load map.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full min-h-[280px] rounded-xl bg-amber-100/80 dark:bg-zinc-700/80 flex items-center justify-center text-amber-800 dark:text-amber-200 text-sm">
        Loading map…
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-xl border border-amber-200/50 dark:border-zinc-600">
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
        <Polygon
          paths={polygonPaths}
          options={{
            fillColor: "#b91c1c",
            fillOpacity: 0.35,
            strokeColor: "#b91c1c",
            strokeWeight: 2,
            clickable: false,
          }}
        />
        <Circle
          center={center}
          radius={zone.radius_meters}
          options={{
            strokeColor: "#b91c1c",
            strokeWeight: 3,
            fillColor: "#22c55e",
            fillOpacity: 0.15,
            clickable: false,
          }}
        />
      </GoogleMap>
    </div>
  );
}
