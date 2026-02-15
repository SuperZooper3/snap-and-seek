"use client";

import Link from "next/link";
import { useState, useCallback } from "react";
import { BackArrowIcon } from "@/components/BackArrowIcon";
import { ZoneWithLocation } from "./ZoneWithLocation";
import { HidingTimeRemaining } from "./HidingTimeRemaining";
type Zone = {
  center_lat: number;
  center_lng: number;
  radius_meters: number;
};

type Props = {
  gameId: string;
  zone: Zone;
  playerId: number;
  hidingStartedAt: string | null;
  hidingDurationSeconds: number;
};

export function HidingLayout({
  gameId,
  zone,
  playerId,
  hidingStartedAt,
  hidingDurationSeconds,
}: Props) {
  const [refreshCountdown, setRefreshCountdown] = useState(5);
  const [showPhotoPopup, setShowPhotoPopup] = useState(false);
  const [outsideZone, setOutsideZone] = useState<boolean>(false);

  const handleCountdownChange = useCallback((countdown: number) => {
    setRefreshCountdown(countdown);
  }, []);

  const handleOutsideZoneChange = useCallback((outside: boolean) => {
    setOutsideZone(outside);
  }, []);

  const handleTimeUp = useCallback(() => {
    setShowPhotoPopup(true);
  }, []);

  return (
    <div className="flex h-[100dvh] flex-col overflow-x-hidden w-full max-w-[100vw] font-sans" style={{ background: "var(--background)" }}>
      <header
        className="shrink-0 flex items-center justify-between gap-3 border-b-[3px] px-4 py-2.5 safe-area-inset-top"
        style={{ borderColor: "var(--pastel-border)", background: "var(--pastel-paper)" }}
      >
        <Link
          href={`/games/${gameId}`}
          className="btn-ghost inline-flex items-center gap-1.5 shrink-0"
        >
          <BackArrowIcon />
          Back to game
        </Link>
        <div className="text-sm font-bold tabular-nums" style={{ color: "var(--pastel-ink-muted)" }}>
          Refresh in {refreshCountdown}s
        </div>
      </header>

      <main className="relative flex min-h-0 min-w-0 flex-1 flex-col w-full overflow-hidden">
        <ZoneWithLocation
          zone={zone}
          gameId={gameId}
          playerId={playerId}
          hideRefreshBar
          onCountdownChange={handleCountdownChange}
          onOutsideZoneChange={handleOutsideZoneChange}
        />
        <div className="absolute top-4 left-1/2 z-10 -translate-x-1/2 pointer-events-none" aria-label="Time remaining">
          <HidingTimeRemaining
            hidingStartedAt={hidingStartedAt}
            hidingDurationSeconds={hidingDurationSeconds}
            variant="pill"
            onTimeUp={handleTimeUp}
          />
        </div>
      </main>

      <footer
        className="shrink-0 border-t-[3px] px-4 py-3 pb-safe space-y-2 font-sans"
        style={{ borderColor: "var(--pastel-border)", background: "var(--pastel-paper)" }}
      >
        <p className="text-xs" style={{ color: "var(--pastel-ink-muted)" }}>
          Play area: inside the circle ({Math.round(zone.radius_meters)} m). Red = out of bounds.
        </p>
        {outsideZone ? (
          <span
            className="touch-manipulation block w-full rounded-xl border-[3px] font-bold px-6 py-3.5 text-center cursor-not-allowed"
            style={{
              background: "var(--pastel-warn)",
              borderColor: "var(--pastel-border)",
              color: "var(--pastel-ink)",
            }}
            aria-disabled="true"
          >
            Go to photo capture get inside the zone first
          </span>
        ) : (
          <Link
            href={`/games/${gameId}/setup`}
            className="btn-primary touch-manipulation block w-full text-center"
          >
            Go to photo capture
          </Link>
        )}
      </footer>

      {showPhotoPopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          style={{ background: "rgba(0,0,0,0.4)" }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="photo-popup-title"
        >
          <div className="sketch-card p-6 max-w-sm w-full text-center space-y-4">
            <h2 id="photo-popup-title" className="text-xl font-bold" style={{ color: "var(--foreground)" }}>
              Time’s up!
            </h2>
            <p style={{ color: "var(--pastel-ink-muted)" }}>
              Take a picture right now and submit it of something!
            </p>
            {outsideZone ? (
              <span
                className="touch-manipulation block w-full rounded-xl border-[3px] font-bold px-6 py-3.5 text-center cursor-not-allowed"
                style={{
                  background: "var(--pastel-warn)",
                  borderColor: "var(--pastel-border)",
                  color: "var(--pastel-ink)",
                }}
              >
                Get inside the zone first
              </span>
            ) : (
              <Link
                href={`/games/${gameId}/setup`}
                className="btn-primary touch-manipulation block w-full text-center"
              >
                Take photo
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
