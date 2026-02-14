"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useCallback, useRef, useEffect } from "react";
import { ZoneWithLocation } from "../zone/ZoneWithLocation";
import { SeekingTimer } from "./SeekingTimer";

const TRAY_COLLAPSED_PX = 72;

const RADAR_DISTANCES = [10, 25, 50, 100, 200, 500];

function getExpandedHeightPx(): number {
  if (typeof window === "undefined") return 600;
  const h = window.visualViewport?.height ?? window.innerHeight;
  return Math.round(h * 0.8);
}

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
  const [refreshCountdown, setRefreshCountdown] = useState(5);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [trayExpanded, setTrayExpanded] = useState(false);
  const [expandedHeightPx, setExpandedHeightPx] = useState(600);
  const [dragHeightPx, setDragHeightPx] = useState<number | null>(null);
  const dragStartRef = useRef<{ y: number; height: number } | null>(null);
  const didDragRef = useRef(false);
  const [radarDistanceIndex, setRadarDistanceIndex] = useState(2);
  const [radarResult, setRadarResult] = useState<{
    withinDistance: boolean;
    distanceMeters: number | null;
    error?: string;
  } | null>(null);
  const [radarLoading, setRadarLoading] = useState(false);

  useEffect(() => {
    setExpandedHeightPx(getExpandedHeightPx());
    const onResize = () => setExpandedHeightPx(getExpandedHeightPx());
    window.visualViewport?.addEventListener("resize", onResize);
    window.addEventListener("resize", onResize);
    return () => {
      window.visualViewport?.removeEventListener("resize", onResize);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const handleCountdownChange = useCallback((countdown: number) => {
    setRefreshCountdown(countdown);
  }, []);

  const selectedTarget = targets[selectedIndex];

  const handleSelectTarget = useCallback((index: number) => {
    setSelectedIndex(index);
    setTrayExpanded(true);
    setRadarResult(null);
  }, []);

  const trayHeightPx = dragHeightPx ?? (trayExpanded ? expandedHeightPx : TRAY_COLLAPSED_PX);
  const isDragging = dragHeightPx !== null;

  const handleTrayPointerDown = useCallback(
    (e: React.PointerEvent) => {
      didDragRef.current = false;
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      dragStartRef.current = { y: e.clientY, height: trayHeightPx };
      setDragHeightPx(trayHeightPx);
    },
    [trayHeightPx]
  );

  const handleTrayPointerMove = useCallback((e: React.PointerEvent) => {
    const start = dragStartRef.current;
    if (start == null) return;
    const dy = start.y - e.clientY;
    if (Math.abs(dy) > 5) didDragRef.current = true;
    const next = Math.max(TRAY_COLLAPSED_PX, Math.min(expandedHeightPx, start.height + dy));
    setDragHeightPx(next);
  }, [expandedHeightPx]);

  const handleTrayPointerUp = useCallback(() => {
    const start = dragStartRef.current;
    dragStartRef.current = null;
    if (start == null) return;
    if (didDragRef.current) {
      const current = dragHeightPx ?? start.height;
      const mid = TRAY_COLLAPSED_PX + (expandedHeightPx - TRAY_COLLAPSED_PX) * 0.5;
      setTrayExpanded(current >= mid);
    }
    setDragHeightPx(null);
  }, [expandedHeightPx, dragHeightPx]);

  const handleTrayPointerCancel = useCallback(() => {
    dragStartRef.current = null;
    setDragHeightPx(null);
  }, []);

  const handleTrayClick = useCallback((e: React.MouseEvent) => {
    if (didDragRef.current) e.preventDefault();
    else setTrayExpanded((prev) => !prev);
  }, []);

  const radarDistanceMeters = RADAR_DISTANCES[radarDistanceIndex];
  const handleRadarSearch = useCallback(() => {
    if (!selectedTarget) return;
    setRadarLoading(true);
    setRadarResult(null);
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setRadarResult({ withinDistance: false, distanceMeters: null, error: "Location not available" });
      setRadarLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        fetch(`/api/games/${gameId}/radar`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lat,
            lng,
            targetPlayerId: selectedTarget.playerId,
            distanceMeters: radarDistanceMeters,
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.error && !("withinDistance" in data)) {
              setRadarResult({ withinDistance: false, distanceMeters: null, error: data.error });
              return;
            }
            setRadarResult({
              withinDistance: data.withinDistance ?? false,
              distanceMeters: data.distanceMeters ?? null,
              error: data.error,
            });
          })
          .catch(() => setRadarResult({ withinDistance: false, distanceMeters: null, error: "Request failed" }))
          .finally(() => setRadarLoading(false));
      },
      () => {
        setRadarResult({ withinDistance: false, distanceMeters: null, error: "Could not get your location" });
        setRadarLoading(false);
      },
      { enableHighAccuracy: true }
    );
  }, [gameId, selectedTarget, radarDistanceMeters]);

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

      {/* Bottom pull-up tray: target list (pills) + selected target photo + handle to expand/collapse (slideable) */}
      {targets.length > 0 && selectedTarget && (
        <div
          className="fixed bottom-0 left-0 right-0 z-20 flex flex-col bg-white dark:bg-zinc-800 border-t border-sky-200/50 dark:border-zinc-700 rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.08)] safe-area-inset-bottom"
          style={{
            height: `${trayHeightPx}px`,
            transition: isDragging ? "none" : "height 300ms ease-out",
          }}
        >
          <button
            type="button"
            onClick={handleTrayClick}
            onPointerDown={handleTrayPointerDown}
            onPointerMove={handleTrayPointerMove}
            onPointerUp={handleTrayPointerUp}
            onPointerCancel={handleTrayPointerCancel}
            className="shrink-0 flex flex-col items-center pt-2 pb-1 px-4 touch-manipulation cursor-grab active:cursor-grabbing touch-none"
            style={{ touchAction: "none" }}
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

            {/* Radar power-up: check if target's photo location is within distance */}
            <section className="mt-6 pt-4 border-t border-sky-200/60 dark:border-zinc-600" aria-label="Radar">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-sky-800 dark:text-sky-200 mb-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 dark:bg-sky-900/50" aria-hidden>
                  <svg className="h-4 w-4 text-sky-600 dark:text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </span>
                Radar
              </h3>
              <p className="text-xs text-sky-600 dark:text-sky-400 mb-3">Check if {selectedTarget.name}&apos;s spot is within:</p>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="inline-flex items-center rounded-xl bg-sky-50 dark:bg-zinc-700/80 border border-sky-200/60 dark:border-zinc-600">
                  <button
                    type="button"
                    disabled={radarDistanceIndex === 0 || radarLoading}
                    onClick={() => setRadarDistanceIndex((i) => Math.max(0, i - 1))}
                    className="flex h-10 w-10 items-center justify-center rounded-l-xl text-sky-600 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-zinc-600 disabled:opacity-40 disabled:pointer-events-none touch-manipulation font-medium text-lg"
                    aria-label="Decrease distance"
                  >
                    −
                  </button>
                  <span className="min-w-[3rem] text-center font-semibold tabular-nums text-sky-900 dark:text-sky-100">
                    {radarDistanceMeters}
                  </span>
                  <span className="pr-2 text-sm text-sky-600 dark:text-sky-400">m</span>
                  <button
                    type="button"
                    disabled={radarDistanceIndex === RADAR_DISTANCES.length - 1 || radarLoading}
                    onClick={() => setRadarDistanceIndex((i) => Math.min(RADAR_DISTANCES.length - 1, i + 1))}
                    className="flex h-10 w-10 items-center justify-center rounded-r-xl text-sky-600 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-zinc-600 disabled:opacity-40 disabled:pointer-events-none touch-manipulation font-medium text-lg"
                    aria-label="Increase distance"
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleRadarSearch}
                  disabled={radarLoading}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400 text-white font-medium px-4 py-2.5 text-sm touch-manipulation transition-colors"
                >
                  {radarLoading ? (
                    "Checking…"
                  ) : (
                    <>
                      Search
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
              {radarResult && (
                <div
                  className={`mt-3 rounded-xl px-3 py-2.5 text-sm font-medium ${
                    radarResult.error && radarResult.distanceMeters == null
                      ? "bg-amber-100/80 dark:bg-zinc-600/80 text-amber-800 dark:text-amber-200"
                      : radarResult.withinDistance
                        ? "bg-emerald-100/80 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200"
                        : "bg-sky-100/80 dark:bg-zinc-600/80 text-sky-800 dark:text-sky-200"
                  }`}
                >
                  {radarResult.error && radarResult.distanceMeters == null
                    ? radarResult.error
                    : radarResult.withinDistance
                      ? `Yes — within ${radarResult.distanceMeters ?? "?"} m`
                      : `No — ${radarResult.distanceMeters ?? "?"} m away`}
                </div>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
