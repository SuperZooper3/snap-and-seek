"use client";

import { useCallback, useEffect, useMemo, useRef, Fragment } from "react";
import { GoogleMap, Circle, Polygon, Polyline, Marker } from "@react-google-maps/api";
import { useGoogleMapsLoader } from "@/lib/google-maps-loader";
import { circleToPolygonPoints, outerBounds, getBoundsForCircle, perpendicularBisector, zoneHalfPlanePolygon } from "@/lib/map-utils";

const ZONE_FIT_PADDING_PX = 8;
const BLUE_DOT_ICON_URL = "https://maps.google.com/mapfiles/ms/icons/blue-dot.png";
const RED_DOT_ICON_URL = "https://maps.google.com/mapfiles/ms/icons/red-dot.png";
const GREY_DOT_ICON_URL = "https://maps.google.com/mapfiles/ms/icons/grey-dot.png";

type Zone = {
  center_lat: number;
  center_lng: number;
  radius_meters: number;
};

type UserPosition = {
  lat: number;
  lng: number;
  accuracy: number;
} | null;

/** Thermometer history pin: 1 = start, 2 = end; color by result (red=hotter, blue=colder) */
export type ThermometerPin = {
  lat: number;
  lng: number;
  number: 1 | 2;
  color: "red" | "blue" | "gray";
};

type Props = {
  zone: Zone;
  /** When true, map fills container (height 100%) for full-screen zone view */
  fullSize?: boolean;
  /** Current user location for blue pin + accuracy circle */
  userPosition?: UserPosition;
  /** Pins for completed thermometer readings (1 = start, 2 = end) */
  thermometerPins?: ThermometerPin[];
  /** Completed thermometer hints: bisector line + shaded half-plane (per selected target) */
  thermometerBisectors?: { startLat: number; startLng: number; endLat: number; endLng: number; result: "hotter" | "colder" | "same" }[];
  /** While thermometer is casting: start position so we can draw a live dotted bisector (start → current user position) */
  thermometerPreviewStart?: { startLat: number; startLng: number } | null;
  /** Radar cast circles (center + radius per completed radar hint; withinDistance = hit → highlight outside, miss → highlight inside) */
  radarCircles?: { lat: number; lng: number; radiusMeters: number; withinDistance?: boolean }[];
  /** Preview circle for radar (dotted) when user has selected a distance but not yet cast center + radius */
  radarPreviewCircle?: { lat: number; lng: number; radiusMeters: number } | null;
};

export function ZoneMapView({ zone, fullSize = false, userPosition = null, thermometerPins = [], thermometerBisectors = [], thermometerPreviewStart = null, radarCircles = [], radarPreviewCircle = null }: Props) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const userCircleRef = useRef<google.maps.Circle | null>(null);
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

  /** Zone boundary as polygon (for radar "hit" = highlight outside circle) */
  const zoneCirclePath = useMemo(
    () =>
      circleToPolygonPoints(zone.center_lat, zone.center_lng, zone.radius_meters, 64).map((p) => ({
        lat: p.lat,
        lng: p.lng,
      })),
    [zone.center_lat, zone.center_lng, zone.radius_meters]
  );

  const updateUserCircle = useCallback((map: google.maps.Map) => {
    if (!userPosition) {
      if (userCircleRef.current) {
        userCircleRef.current.setMap(null);
        userCircleRef.current = null;
      }
      return;
    }
    if (!userCircleRef.current) {
      userCircleRef.current = new google.maps.Circle({
        map,
        center: { lat: userPosition.lat, lng: userPosition.lng },
        radius: userPosition.accuracy,
        strokeColor: "#3b82f6",
        strokeWeight: 1.5,
        fillColor: "#3b82f6",
        fillOpacity: 0.25,
        clickable: false,
      });
    } else {
      userCircleRef.current.setCenter({ lat: userPosition.lat, lng: userPosition.lng });
      userCircleRef.current.setRadius(userPosition.accuracy);
    }
  }, [userPosition]);

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
    if (fullSize) {
      window.setTimeout(() => {
        google.maps.event.trigger(map, "resize");
        map.fitBounds(bounds, ZONE_FIT_PADDING_PX);
      }, 100);
    }
  }, [zone.center_lat, zone.center_lng, zone.radius_meters, fullSize]);

  useEffect(() => {
    if (mapRef.current && typeof google !== "undefined") {
      updateUserCircle(mapRef.current);
    }
  }, [userPosition, updateUserCircle]);

  const blueIcon = useMemo(() => {
    if (typeof window === "undefined" || !window.google) return undefined;
    return {
      url: BLUE_DOT_ICON_URL,
      scaledSize: new window.google.maps.Size(32, 32),
    };
  }, [isLoaded]);

  const thermometerPinIcon = useCallback(
    (color: "red" | "blue" | "gray") => {
      if (typeof window === "undefined" || !window.google) return undefined;
      const url =
        color === "red"
          ? RED_DOT_ICON_URL
          : color === "blue"
            ? BLUE_DOT_ICON_URL
            : GREY_DOT_ICON_URL;
      return {
        url,
        scaledSize: new window.google.maps.Size(28, 28),
      };
    },
    [isLoaded]
  );

  if (loadError) {
    return (
      <div className="rounded-xl bg-red-50 dark:bg-red-900/20 p-4 text-red-700 dark:text-red-300 text-sm">
        Failed to load map.
      </div>
    );
  }

  const mapContainerStyle = fullSize
    ? { width: "100%", height: "100%", minHeight: "50vh" }
    : { width: "100%", minHeight: "min(70vh, 400px)" };

  if (!isLoaded) {
    return (
      <div
        className={
          fullSize
            ? "w-full h-full flex items-center justify-center bg-amber-100/80 dark:bg-zinc-700/80 text-amber-800 dark:text-amber-200 text-sm"
            : "w-full min-h-[280px] rounded-xl bg-amber-100/80 dark:bg-zinc-700/80 flex items-center justify-center text-amber-800 dark:text-amber-200 text-sm"
        }
      >
        Loading map…
      </div>
    );
  }

  return (
    <div
      className={
        fullSize
          ? "absolute inset-0 h-full w-full min-w-0 overflow-hidden"
          : "w-full min-w-0 overflow-hidden rounded-xl border border-amber-200/50 dark:border-zinc-600"
      }
    >
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        mapContainerClassName={fullSize ? "absolute inset-0 h-full w-full" : undefined}
        center={center}
        zoom={15}
        onLoad={(map) => {
          mapRef.current = map;
          fitMapToZone(map);
          updateUserCircle(map);
        }}
        onUnmount={() => {
          if (userCircleRef.current) {
            userCircleRef.current.setMap(null);
            userCircleRef.current = null;
          }
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
        {thermometerBisectors.map((tb, i) => {
          const [lineP1, lineP2] = perpendicularBisector(tb.startLat, tb.startLng, tb.endLat, tb.endLng, 0.03);
          const shadePolygon =
            tb.result !== "same"
              ? zoneHalfPlanePolygon(
                  zone.center_lat,
                  zone.center_lng,
                  zone.radius_meters,
                  lineP1,
                  lineP2,
                  tb.startLat,
                  tb.startLng,
                  tb.result === "hotter"
                )
              : null;
          return (
            <Fragment key={`thermo-bisector-${i}-${tb.startLat}-${tb.startLng}-${tb.endLat}-${tb.endLng}`}>
              <Polyline
                path={[lineP1, lineP2]}
                options={{
                  strokeColor: "#0ea5e9",
                  strokeWeight: 2,
                  strokeOpacity: 0.9,
                  clickable: false,
                }}
              />
              {shadePolygon && shadePolygon.length >= 3 && (
                <Polygon
                  paths={shadePolygon}
                  options={{
                    strokeColor: "#0ea5e9",
                    strokeWeight: 2,
                    fillColor: "#0ea5e9",
                    fillOpacity: 0.2,
                    clickable: false,
                  }}
                />
              )}
            </Fragment>
          );
        })}
        {thermometerPreviewStart && userPosition && isLoaded && typeof google !== "undefined" && (() => {
          const [lineP1, lineP2] = perpendicularBisector(
            thermometerPreviewStart.startLat,
            thermometerPreviewStart.startLng,
            userPosition.lat,
            userPosition.lng,
            0.03
          );
          return (
            <Polyline
              key="thermo-preview-bisector"
              path={[lineP1, lineP2]}
              options={{
                strokeColor: "#ea580c",
                strokeWeight: 2,
                strokeOpacity: 0.9,
                icons: [
                  {
                    icon: {
                      path: google.maps.SymbolPath.CIRCLE,
                      scale: 2,
                      fillColor: "#ea580c",
                      fillOpacity: 0.9,
                      strokeColor: "#ea580c",
                      strokeWeight: 1,
                    },
                    repeat: "12px",
                  },
                ],
                clickable: false,
              }}
            />
          );
        })()}
        {radarCircles.map((circle, i) => {
          const isHit = circle.withinDistance === true;
          const isMiss = circle.withinDistance === false;
          // Hit: highlight outside the circle (zone minus circle). Miss: highlight inside the circle.
          if (isHit) {
            // Hole must be wound opposite to outer for Google Maps to cut it out correctly
            const radarHolePath = circleToPolygonPoints(
              circle.lat,
              circle.lng,
              circle.radiusMeters,
              64
            )
              .map((p) => ({ lat: p.lat, lng: p.lng }))
              .reverse();
            return (
              <Polygon
                key={`radar-hit-${i}-${circle.lat}-${circle.lng}-${circle.radiusMeters}`}
                paths={[zoneCirclePath, radarHolePath]}
                options={{
                  strokeColor: "#0ea5e9",
                  strokeWeight: 2,
                  fillColor: "#0ea5e9",
                  fillOpacity: 0.2,
                  clickable: false,
                }}
              />
            );
          }
          return (
            <Circle
              key={`radar-${i}-${circle.lat}-${circle.lng}-${circle.radiusMeters}`}
              center={{ lat: circle.lat, lng: circle.lng }}
              radius={circle.radiusMeters}
              options={{
                strokeColor: "#0ea5e9",
                strokeWeight: 2,
                fillColor: "#0ea5e9",
                fillOpacity: isMiss ? 0.25 : 0.15,
                clickable: false,
              }}
            />
          );
        })}
        {radarPreviewCircle && isLoaded && typeof google !== "undefined" && (() => {
          const points = circleToPolygonPoints(
            radarPreviewCircle.lat,
            radarPreviewCircle.lng,
            radarPreviewCircle.radiusMeters,
            64
          );
          const closedPath = points.length > 0 ? [...points, points[0]] : points;
          return (
          <Polyline
            path={closedPath.map((p) => ({ lat: p.lat, lng: p.lng }))}
            options={{
              strokeColor: "#0ea5e9",
              strokeWeight: 2,
              strokeOpacity: 0.9,
              icons: [
                {
                  icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 2,
                    fillColor: "#0ea5e9",
                    fillOpacity: 0.9,
                    strokeColor: "#0ea5e9",
                    strokeWeight: 1,
                  },
                  repeat: "12px",
                },
              ],
              clickable: false,
            }}
          />
          );
        })()}
        {userPosition && (
          <Marker
            key="user-marker"
            position={{ lat: userPosition.lat, lng: userPosition.lng }}
            icon={blueIcon}
            title="You are here"
          />
        )}
        {thermometerPins.map((pin, i) => (
          <Marker
            key={`thermo-${i}-${pin.lat}-${pin.lng}-${pin.number}`}
            position={{ lat: pin.lat, lng: pin.lng }}
            icon={thermometerPinIcon(pin.color)}
            label={{
              text: String(pin.number),
              color: "white",
              fontWeight: "bold",
              fontSize: "12px",
            }}
            title={pin.number === 1 ? "Thermometer start" : pin.number === 2 ? "Thermometer end" : undefined}
          />
        ))}
      </GoogleMap>
    </div>
  );
}
