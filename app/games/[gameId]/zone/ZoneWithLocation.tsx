"use client";

import { useCallback, useEffect, useState } from "react";
import { ZoneMapView } from "./ZoneMapView";
import { isEntirelyOutsideZone } from "@/lib/map-utils";

const REFRESH_INTERVAL_MS = 10_000;

type Zone = {
  center_lat: number;
  center_lng: number;
  radius_meters: number;
};

type Props = {
  zone: Zone;
};

type UserPosition = {
  lat: number;
  lng: number;
  accuracy: number;
} | null;

export function ZoneWithLocation({ zone }: Props) {
  const [userPosition, setUserPosition] = useState<UserPosition>(null);
  const [countdown, setCountdown] = useState(10);
  const [locationError, setLocationError] = useState<string | null>(null);

  const refreshLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationError("Geolocation not supported");
      return;
    }
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserPosition({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy ?? 30,
        });
        setCountdown(10);
      },
      () => {
        setLocationError("Could not get location");
        setCountdown(10);
      },
      { enableHighAccuracy: true }
    );
  }, []);

  useEffect(() => {
    refreshLocation();
  }, [refreshLocation]);

  useEffect(() => {
    const id = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          refreshLocation();
          return 10;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [refreshLocation]);

  const outsideZone =
    userPosition &&
    isEntirelyOutsideZone(
      userPosition.lat,
      userPosition.lng,
      userPosition.accuracy,
      zone.center_lat,
      zone.center_lng,
      zone.radius_meters
    );

  return (
    <>
      <div className="shrink-0 flex flex-col items-center justify-center gap-0.5 bg-amber-200/60 dark:bg-zinc-700/60 px-4 py-2 text-sm">
        <span className="text-amber-900 dark:text-amber-100 font-medium">
          Next refresh in {countdown}s
        </span>
        <span className="text-xs text-amber-800/80 dark:text-amber-200/80">
          Blue is where you are
        </span>
      </div>

      {outsideZone && (
        <div className="shrink-0 bg-red-600 text-white px-4 py-3 text-center text-sm font-medium">
          You’re outside the zone — get back inside the play area.
        </div>
      )}

      {locationError && (
        <div className="shrink-0 bg-amber-200/80 dark:bg-zinc-700/80 text-amber-900 dark:text-amber-100 px-4 py-2 text-sm text-center">
          {locationError}
        </div>
      )}

      <div className="relative min-h-[50vh] flex-1 w-full">
        <ZoneMapView zone={zone} fullSize userPosition={userPosition} />
      </div>
    </>
  );
}
