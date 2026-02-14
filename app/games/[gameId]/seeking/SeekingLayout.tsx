"use client";

import Link from "next/link";
import { useState, useCallback } from "react";
import { ZoneWithLocation } from "../zone/ZoneWithLocation";
import { SeekingTimer } from "./SeekingTimer";

type Zone = {
  center_lat: number;
  center_lng: number;
  radius_meters: number;
};

type Props = {
  gameId: string;
  gameName: string;
  zone: Zone;
  playerId: number;
  seekingStartedAt: string | null;
};

export function SeekingLayout({
  gameId,
  gameName,
  zone,
  playerId,
  seekingStartedAt,
}: Props) {
  const [refreshCountdown, setRefreshCountdown] = useState(10);

  const handleCountdownChange = useCallback((countdown: number) => {
    setRefreshCountdown(countdown);
  }, []);

  return (
    <div className="flex min-h-screen min-h-[100dvh] flex-col overflow-x-hidden w-full max-w-[100vw] bg-gradient-to-b from-sky-50 to-sky-100 dark:from-zinc-950 dark:to-zinc-900 font-sans">
      {/* Single top bar: Back left, Refresh right */}
      <header className="shrink-0 flex items-center justify-between gap-3 border-b border-sky-200/50 dark:border-zinc-700 px-4 py-2.5 safe-area-inset-top bg-sky-50/95 dark:bg-zinc-900/95">
        <Link
          href={`/games/${gameId}`}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-sky-800 dark:text-sky-200 bg-sky-100/80 dark:bg-sky-900/30 hover:bg-sky-200/80 dark:hover:bg-sky-800/40 transition-colors"
        >
          <span aria-hidden>←</span>
          Back to game
        </Link>
        <div className="flex items-center gap-2 text-sm text-sky-700 dark:text-sky-300">
          <span className="font-medium tabular-nums">Refresh in {refreshCountdown}s</span>
        </div>
      </header>

      {/* Map area with floating timer pill */}
      <main className="relative flex min-h-0 min-w-0 flex-1 flex-col w-full overflow-hidden">
        <ZoneWithLocation
          zone={zone}
          gameId={gameId}
          playerId={playerId}
          hideRefreshBar
          onCountdownChange={handleCountdownChange}
        />
        {/* Dynamic island style pill on top of map */}
        <div
          className="absolute top-4 left-1/2 z-10 -translate-x-1/2 pointer-events-none"
          aria-label="Seeking time"
        >
          <SeekingTimer seekingStartedAt={seekingStartedAt} variant="pill" />
        </div>
      </main>
    </div>
  );
}
