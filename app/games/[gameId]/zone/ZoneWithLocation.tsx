"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ZoneMapView } from "./ZoneMapView";
import { isEntirelyOutsideZone } from "@/lib/map-utils";
import { getLocation } from "@/lib/get-location";

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
  /** Called when the user is detected as outside or inside the zone */
  onOutsideZoneChange?: (outside: boolean) => void;
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
  onOutsideZoneChange,
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
    setLocationError(null);
    getLocation()
      .then((res) => {
        setUserPosition({
          lat: res.latitude,
          lng: res.longitude,
          accuracy: res.accuracy,
        });
        setCountdown(REFRESH_INTERVAL_SECONDS);
        uploadPing(res.latitude, res.longitude);
      })
      .catch((err) => {
        setLocationError(err instanceof Error ? err.message : "Could not get location");
        setCountdown(REFRESH_INTERVAL_SECONDS);
      });
  }, [uploadPing]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial location fetch on mount
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

  useEffect(() => {
    onOutsideZoneChange?.(!!outsideZone);
  }, [outsideZone, onOutsideZoneChange]);

  // Vibrate repeatedly when outside zone (attention-grabbing feedback on mobile)
  useEffect(() => {
    if (!outsideZone) return;
    const canVibrate =
      typeof navigator !== "undefined" && "vibrate" in navigator;
    if (!canVibrate) return;

    const vibrateInterval = setInterval(() => {
      navigator.vibrate([400, 50, 400, 50, 400]);
    }, 1200);

    return () => {
      clearInterval(vibrateInterval);
      navigator.vibrate(0);
    };
  }, [outsideZone]);

  return (
    <>
      {!hideRefreshBar && (
        <div
          className="shrink-0 flex flex-col items-center justify-center gap-0.5 px-4 py-2 text-sm border-b-[3px]"
          style={{
            background: "var(--pastel-butter)",
            borderColor: "var(--pastel-border)",
          }}
        >
          <span className="font-bold" style={{ color: "var(--pastel-ink)" }}>
            Next refresh in {countdown}s
          </span>
          <span className="text-xs" style={{ color: "var(--pastel-ink-muted)" }}>
            Blue is where you are
          </span>
        </div>
      )}

      {outsideZone && (
        <div
          className="shrink-0 px-4 py-3 text-center text-sm font-bold border-b-[3px]"
          style={{
            background: "var(--pastel-error)",
            borderColor: "var(--pastel-border)",
            color: "var(--pastel-ink)",
          }}
        >
          You’re outside the zone — get back inside the play area.
        </div>
      )}

      {locationError && (
        <div
          className="shrink-0 px-4 py-2 text-sm text-center font-bold border-b-[3px]"
          style={{
            background: "var(--pastel-warn)",
            borderColor: "var(--pastel-border)",
            color: "var(--pastel-ink)",
          }}
        >
          {locationError}
        </div>
      )}

      <div className="relative min-h-0 min-w-0 flex-1 w-full overflow-hidden">
        <ZoneMapView zone={zone} fullSize userPosition={userPosition} />
      </div>
    </>
  );
}
