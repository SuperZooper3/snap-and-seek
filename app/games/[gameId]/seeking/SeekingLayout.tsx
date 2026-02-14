"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useCallback } from "react";
import { ZoneWithLocation } from "../zone/ZoneWithLocation";
import { SeekingTimer } from "./SeekingTimer";

type Zone = {
  center_lat: number;
  center_lng: number;
  radius_meters: number;
};

export type SeekingTarget = {
  playerId: number;
  name: string;
  photoUrl: string | null;
};

type Props = {
  gameId: string;
  gameName: string;
  zone: Zone;
  playerId: number;
  playerName: string;
  seekingStartedAt: string | null;
  targets: SeekingTarget[];
};

export function SeekingLayout({
  gameId,
  gameName,
  zone,
  playerId,
  playerName,
  seekingStartedAt,
  targets,
}: Props) {
  const [refreshCountdown, setRefreshCountdown] = useState(10);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [trayExpanded, setTrayExpanded] = useState(false);

  const handleCountdownChange = useCallback((countdown: number) => {
    setRefreshCountdown(countdown);
  }, []);

  const selectedTarget = targets[selectedIndex];

  const handleSelectTarget = useCallback((index: number) => {
    setSelectedIndex(index);
    setTrayExpanded(true);
  }, []);

  return (
    <div className="flex min-h-screen min-h-[100dvh] flex-col overflow-x-hidden w-full max-w-[100vw] bg-gradient-to-b from-sky-50 to-sky-100 dark:from-zinc-950 dark:to-zinc-900 font-sans">
      {/* Top bar: You are NAME, Back to game, Refresh — all inline */}
      <header className="shrink-0 flex items-center justify-between gap-3 border-b border-sky-200/50 dark:border-zinc-700 px-4 py-2.5 safe-area-inset-top bg-sky-50/95 dark:bg-zinc-900/95">
        <div className="flex items-center gap-2 min-w-0">
          <Link
            href={`/games/${gameId}`}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-sky-800 dark:text-sky-200 bg-sky-100/80 dark:bg-sky-900/30 hover:bg-sky-200/80 dark:hover:bg-sky-800/40 transition-colors shrink-0"
          >
            <span aria-hidden>←</span>
            Back to game
          </Link>
          <span className="text-sm text-sky-700 dark:text-sky-300 shrink-0">You are: <strong className="font-semibold text-sky-900 dark:text-sky-100">{playerName}</strong></span>
        </div>
        <div className="flex items-center gap-2 text-sm text-sky-700 dark:text-sky-300 shrink-0">
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

      {/* Bottom pull-up tray: target list (pills) + selected target photo + handle to expand/collapse */}
      {targets.length > 0 && selectedTarget && (
        <div
          className="fixed bottom-0 left-0 right-0 z-20 flex flex-col bg-white dark:bg-zinc-800 border-t border-sky-200/50 dark:border-zinc-700 rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.08)] safe-area-inset-bottom transition-[height] duration-300 ease-out"
          style={{ height: trayExpanded ? "80dvh" : "72px" }}
        >
          <button
            type="button"
            onClick={() => setTrayExpanded((e) => !e)}
            className="shrink-0 flex flex-col items-center pt-2 pb-1 px-4 touch-manipulation cursor-grab active:cursor-grabbing"
            aria-expanded={trayExpanded}
            aria-label={trayExpanded ? "Collapse target tray" : "Expand target tray"}
          >
            <span className="w-10 h-1 rounded-full bg-sky-300 dark:bg-zinc-500" aria-hidden />
          </button>
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 pb-4">
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <span className="text-sm font-medium text-sky-700 dark:text-sky-300 shrink-0">Targets:</span>
              {targets.map((t, i) => (
                <button
                  key={t.playerId}
                  type="button"
                  onClick={() => handleSelectTarget(i)}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors touch-manipulation ${
                    selectedIndex === i
                      ? "bg-sky-600 text-white dark:bg-sky-500"
                      : "bg-sky-100/80 dark:bg-sky-900/30 text-sky-800 dark:text-sky-200 hover:bg-sky-200/80 dark:hover:bg-sky-800/40"
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
            <h2 className="text-lg font-semibold text-sky-900 dark:text-sky-100 mt-1 mb-3">
              {selectedTarget.name}&apos;s target
            </h2>
            {selectedTarget.photoUrl ? (
              <div className="relative w-full aspect-[4/3] max-h-[60dvh] rounded-xl overflow-hidden bg-sky-100 dark:bg-zinc-700">
                <Image
                  src={selectedTarget.photoUrl}
                  alt={`${selectedTarget.name}'s hiding spot`}
                  fill
                  className="object-contain"
                  sizes="100vw"
                  unoptimized
                />
              </div>
            ) : (
              <p className="text-sm text-sky-600 dark:text-sky-400 py-4">No target photo</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
