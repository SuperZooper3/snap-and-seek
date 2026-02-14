"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ZoneMapView } from "./ZoneMapView";
import { isEntirelyOutsideZone } from "@/lib/map-utils";

const REFRESH_INTERVAL_SECONDS = 3;
const MIN_PING_INTERVAL_MS = (REFRESH_INTERVAL_SECONDS - 1) * 1000;

type Zone = {
  center_lat: number;
  center_lng: number;
  radius_meters: number;
};

type Props = {
  zone: Zone;
  gameId: string;
  playerId: number;
  /** When true, hide the refresh bar and report countdown via onCountdownChange (e.g. for seeking header) */
  hideRefreshBar?: boolean;
  onCountdownChange?: (countdown: number) => void;
};

type UserPosition = {
  lat: number;
  lng: number;
  accuracy: number;
} | null;

export function ZoneWithLocation({
  zone,
  gameId,
  playerId,
  hideRefreshBar = false,
  onCountdownChange,
}: Props) {
  const [userPosition, setUserPosition] = useState<UserPosition>(null);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL_SECONDS);
  const [locationError, setLocationError] = useState<string | null>(null);
  const lastPingAtRef = useRef<number>(0);

  const uploadPing = useCallback(
    (lat: number, lng: number) => {
      const now = Date.now();
      if (now - lastPingAtRef.current < MIN_PING_INTERVAL_MS) return;
      lastPingAtRef.current = now;
      fetch(`/api/games/${gameId}/pings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ player_id: playerId, lat, lng }),
      }).catch(() => {});
    },
    [gameId, playerId]
  );

  const refreshLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationError("Geolocation not supported");
      return;
    }
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setUserPosition({
          lat,
          lng,
          accuracy: position.coords.accuracy ?? 30,
        });
        setCountdown(REFRESH_INTERVAL_SECONDS);
        uploadPing(lat, lng);
      },
      () => {
        setLocationError("Could not get location");
        setCountdown(REFRESH_INTERVAL_SECONDS);
      },
      { enableHighAccuracy: true }
    );
  }, [uploadPing]);

  useEffect(() => {
    refreshLocation();
  }, [refreshLocation]);

  useEffect(() => {
    onCountdownChange?.(countdown);
  }, [countdown, onCountdownChange]);

  useEffect(() => {
    const id = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          refreshLocation();
          return REFRESH_INTERVAL_SECONDS;
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
      {!hideRefreshBar && (
        <div className="shrink-0 flex flex-col items-center justify-center gap-0.5 bg-amber-200/60 dark:bg-zinc-700/60 px-4 py-2 text-sm">
          <span className="text-amber-900 dark:text-amber-100 font-medium">
            Next refresh in {countdown}s
          </span>
          <span className="text-xs text-amber-800/80 dark:text-amber-200/80">
            Blue is where you are
          </span>
        </div>
      )}

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

      <div className="relative min-h-0 min-w-0 flex-1 w-full overflow-hidden">
        <ZoneMapView zone={zone} fullSize userPosition={userPosition} />
      </div>
    </>
  );
}
