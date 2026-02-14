"use client";

import { useCallback, useMemo, useRef } from "react";
import { GoogleMap, Circle, Polygon, Marker } from "@react-google-maps/api";
import { useGoogleMapsLoader } from "@/lib/google-maps-loader";
import { circleToPolygonPoints, outerBounds, getBoundsForCircle } from "@/lib/map-utils";

const ZONE_FIT_PADDING_PX = 80;

export type PlayerMarker = {
  player_id: number;
  name: string;
  lat: number;
  lng: number;
  color: string;
};

type Zone = {
  center_lat: number;
  center_lng: number;
  radius_meters: number;
};

type Props = {
  zone: Zone;
  playerMarkers: PlayerMarker[];
};

function makeCircleIconUrl(hexColor: string): string {
  const size = 36;
  const r = size / 2;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${r}" cy="${r}" r="${r - 2}" fill="${hexColor}" stroke="white" stroke-width="2"/></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export function GodMapView({ zone, playerMarkers }: Props) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const { isLoaded, loadError } = useGoogleMapsLoader();

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

  const fitMapToZone = useCallback((map: google.maps.Map) => {
    const b = getBoundsForCircle(
      zone.center_lat,
      zone.center_lng,
      zone.radius_meters
    );
    const bounds = new google.maps.LatLngBounds(
      { lat: b.south, lng: b.west },
      { lat: b.north, lng: b.east }
    );
    map.fitBounds(bounds, ZONE_FIT_PADDING_PX);
  }, [zone.center_lat, zone.center_lng, zone.radius_meters]);

  if (loadError) {
    return (
      <div className="rounded-xl bg-red-50 dark:bg-red-900/20 p-4 text-red-700 dark:text-red-300 text-sm">
        Failed to load map.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-full min-h-[400px] flex items-center justify-center bg-amber-100/80 dark:bg-zinc-700/80 text-amber-800 dark:text-amber-200 text-sm">
        Loading map…
      </div>
    );
  }

  return (
    <div className="absolute inset-0 w-full h-full">
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%" }}
        mapContainerClassName="absolute inset-0 w-full h-full"
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
          }}
        />
        <Circle
          center={center}
          radius={zone.radius_meters}
          options={{
            strokeColor: "#b91c1c",
            strokeWeight: 3,
            fillColor: "transparent",
            fillOpacity: 0,
            clickable: false,
          }}
        />
        {playerMarkers.map((p) => (
          <Marker
            key={p.player_id}
            position={{ lat: p.lat, lng: p.lng }}
            icon={{
              url: makeCircleIconUrl(p.color),
              scaledSize: new google.maps.Size(36, 36),
              anchor: new google.maps.Point(18, 18),
            }}
            label={{
              text: p.name.length > 0 ? p.name.charAt(0).toUpperCase() : "?",
              color: "white",
              fontSize: "14px",
              fontWeight: "bold",
            }}
            title={p.name}
          />
        ))}
      </GoogleMap>
    </div>
  );
}
