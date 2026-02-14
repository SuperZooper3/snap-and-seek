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

  const handleCountdownChange = useCallback((countdown: number) => {
    setRefreshCountdown(countdown);
  }, []);

  const handleTimeUp = useCallback(() => {
    setShowPhotoPopup(true);
  }, []);

  return (
    <div className="flex h-[100dvh] flex-col overflow-x-hidden w-full max-w-[100vw] bg-gradient-to-b from-amber-50 to-orange-100 dark:from-zinc-950 dark:to-zinc-900 font-sans">
      {/* Single top bar: Back left, Refresh right (same as seeking) */}
      <header className="shrink-0 flex items-center justify-between gap-3 border-b border-amber-200/50 dark:border-zinc-700 px-4 py-2.5 safe-area-inset-top bg-amber-50/95 dark:bg-zinc-900/95">
        <Link
          href={`/games/${gameId}`}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-amber-800 dark:text-amber-200 bg-amber-100/80 dark:bg-amber-900/30 hover:bg-amber-200/80 dark:hover:bg-amber-800/40 transition-colors"
        >
          <BackArrowIcon />
          Back to game
        </Link>
        <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
          <span className="font-medium tabular-nums">Refresh in {refreshCountdown}s</span>
        </div>
      </header>

      {/* Map area with floating time-remaining pill; main fills space so footer stays at bottom of viewport */}
      <main className="relative flex min-h-0 min-w-0 flex-1 flex-col w-full overflow-hidden">
        <ZoneWithLocation
          zone={zone}
          gameId={gameId}
          playerId={playerId}
          hideRefreshBar
          onCountdownChange={handleCountdownChange}
        />
        <div
          className="absolute top-4 left-1/2 z-10 -translate-x-1/2 pointer-events-none"
          aria-label="Time remaining"
        >
          <HidingTimeRemaining
            hidingStartedAt={hidingStartedAt}
            hidingDurationSeconds={hidingDurationSeconds}
            variant="pill"
            onTimeUp={handleTimeUp}
          />
        </div>
      </main>

      {/* Footer: pinned to bottom of viewport (100dvh) so "Go to photo capture" is always reachable without scroll */}
      <footer className="shrink-0 border-t border-amber-200/50 dark:border-zinc-700 px-4 py-3 pb-safe space-y-2 bg-amber-50/80 dark:bg-zinc-900/80">
        <p className="text-xs text-amber-700 dark:text-amber-300">
          Play area: inside the circle ({Math.round(zone.radius_meters)} m). Red = out of bounds.
        </p>
        <Link
          href={`/games/${gameId}/setup`}
          className="touch-manipulation block w-full rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold px-6 py-3.5 text-center transition-colors"
        >
          Go to photo capture
        </Link>
      </footer>

      {/* Popup when time hits 0 */}
      {showPhotoPopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="photo-popup-title"
        >
          <div className="rounded-2xl bg-white dark:bg-zinc-800 shadow-xl border border-amber-200/50 dark:border-zinc-600 p-6 max-w-sm w-full text-center space-y-4">
            <h2 id="photo-popup-title" className="text-xl font-bold text-amber-900 dark:text-amber-100">
              Time’s up!
            </h2>
            <p className="text-amber-800 dark:text-amber-200">
              Take a picture right now and submit it of something!
            </p>
            <Link
              href={`/games/${gameId}/setup`}
              className="touch-manipulation block w-full rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold px-6 py-3.5 text-center transition-colors"
            >
              Take photo
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
