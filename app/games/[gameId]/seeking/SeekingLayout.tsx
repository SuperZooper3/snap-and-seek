"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useCallback, useRef, useEffect } from "react";
import { ZoneWithLocation } from "../zone/ZoneWithLocation";
import { SeekingTimer } from "./SeekingTimer";
import { CameraModal } from "@/components/CameraModal";
import type { Submission } from "@/lib/types";

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
  initialSubmissions: Submission[];
  initialSubmissionPhotoUrls: Record<number, string>;
  initialWinnerId: number | null;
  initialWinnerName: string | null;
};

export function SeekingLayout({
  gameId,
  gameName,
  zone,
  playerId,
  playerName,
  seekingStartedAt,
  targets,
  initialSubmissions,
  initialSubmissionPhotoUrls,
  initialWinnerId,
  initialWinnerName,
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

  // Submission state
  const [submissions, setSubmissions] = useState<Submission[]>(initialSubmissions);
  const [submissionPhotoUrls, setSubmissionPhotoUrls] = useState<Record<number, string>>(initialSubmissionPhotoUrls);
  const [winnerId, setWinnerId] = useState<number | null>(initialWinnerId);
  const [winnerName, setWinnerName] = useState<string | null>(initialWinnerName);

  // Camera + submit flow state
  const [cameraOpen, setCameraOpen] = useState(false);
  const [submitTargetId, setSubmitTargetId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<string | null>(null);

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

  // Poll game status regularly while seeking so everyone sees wins (and latest submissions).
  // First poll after 1s, then every 3s. Stop once a winner is detected.
  useEffect(() => {
    if (winnerId != null) return;

    const poll = async () => {
      try {
        const res = await fetch(`/api/games/${gameId}/game-status`);
        if (!res.ok) return;
        const data = await res.json();
        setSubmissions(data.submissions ?? []);
        if (data.winner_id != null) {
          setWinnerId(data.winner_id);
          setWinnerName(data.winner_name ?? null);
        }
      } catch {
        // Silently ignore polling errors
      }
    };

    const t = setTimeout(poll, 1000);
    const interval = setInterval(poll, 3000);
    return () => {
      clearTimeout(t);
      clearInterval(interval);
    };
  }, [gameId, winnerId]);

  const handleCountdownChange = useCallback((countdown: number) => {
    setRefreshCountdown(countdown);
  }, []);

  const selectedTarget = targets[selectedIndex];

  // Determine which targets have been found by the current player (success only)
  const foundHiderIds = new Set(
    submissions
      .filter((s) => s.seeker_id === playerId && s.status === "success")
      .map((s) => s.hider_id)
  );

  // Targets this seeker has tried but failed (no success for that hider yet)
  const failedAttemptHiderIds = new Set(
    submissions
      .filter((s) => s.seeker_id === playerId && s.status === "fail")
      .map((s) => s.hider_id)
  );
  // Only "failed attempt" if they don't have a success for that hider
  const triedButNotFoundHiderIds = new Set(
    [...failedAttemptHiderIds].filter((hiderId) => !foundHiderIds.has(hiderId))
  );

  // Get the submission photo URL for a specific hider (from current player's submissions)
  const getMySubmissionForHider = (hiderId: number): Submission | undefined => {
    return submissions.find(
      (s) => s.seeker_id === playerId && s.hider_id === hiderId && s.status === "success"
    );
  };

  const handleSelectTarget = useCallback((index: number) => {
    setSelectedIndex(index);
    setTrayExpanded(true);
    setRadarResult(null);
  }, []);

  // Game is frozen once a winner exists
  const gameOver = winnerId != null;

  // --- Camera + Submission flow ---
  const handleOpenCamera = useCallback((targetPlayerId: number) => {
    if (gameOver) return; // Block new submissions after game ends
    setSubmitTargetId(targetPlayerId);
    setSubmitStatus(null);
    setCameraOpen(true);
  }, [gameOver]);

  const handleCameraCapture = useCallback(
    async (blob: Blob) => {
      if (!submitTargetId) return;
      // Double-check: if a winner was set while camera was open, abort
      if (winnerId != null) {
        setCameraOpen(false);
        return;
      }
      setCameraOpen(false);
      setSubmitting(true);
      setSubmitStatus("Uploading photo...");

      try {
        // Step 1: Upload photo
        const formData = new FormData();
        formData.append("file", blob, "submission.jpg");
        formData.append("game_id", gameId);
        formData.append("player_id", String(playerId));

        // Get current location for the photo
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 5000,
            });
          });
          formData.append("latitude", String(pos.coords.latitude));
          formData.append("longitude", String(pos.coords.longitude));
        } catch {
          // Continue without location if geolocation fails
        }

        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        if (!uploadRes.ok) {
          setSubmitStatus("Upload failed!");
          setSubmitting(false);
          return;
        }
        const uploadData = await uploadRes.json();
        const photoId = uploadData.photo?.id;
        const photoUrl = uploadData.photo?.url;

        // Step 2: Create submission
        setSubmitStatus("Submitting...");
        const submitRes = await fetch(`/api/games/${gameId}/submissions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            seeker_id: playerId,
            hider_id: submitTargetId,
            photo_id: photoId,
          }),
        });

        if (!submitRes.ok) {
          const errData = await submitRes.json().catch(() => ({}));
          setSubmitStatus(errData.error ?? "Submission failed!");
          setSubmitting(false);
          return;
        }

        const submitData = await submitRes.json();
        const sub = submitData.submission as Submission;

        // Update local state immediately (backend returns resolved status: success | fail)
        setSubmissions((prev) => [...prev, sub]);
        if (photoId && photoUrl) {
          setSubmissionPhotoUrls((prev) => ({ ...prev, [photoId]: photoUrl }));
        }

        if (submitData.isWinner) {
          setWinnerId(playerId);
          setWinnerName(playerName);
          setSubmitStatus("You found everyone! You win!");
        } else if (sub.status === "success") {
          setSubmitStatus("Found!");
        } else {
          setSubmitStatus("Not close enough.");
        }
      } catch {
        setSubmitStatus("Something went wrong!");
      } finally {
        setSubmitting(false);
        // Clear status after 3 seconds
        setTimeout(() => setSubmitStatus(null), 3000);
      }
    },
    [submitTargetId, gameId, playerId, playerName, winnerId]
  );

  const handleCameraClose = useCallback(() => {
    setCameraOpen(false);
    setSubmitTargetId(null);
  }, []);

  // --- Tray drag handlers (unchanged) ---
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

  const handleTrayPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const start = dragStartRef.current;
      if (start == null) return;
      const dy = start.y - e.clientY;
      if (Math.abs(dy) > 5) didDragRef.current = true;
      const next = Math.max(TRAY_COLLAPSED_PX, Math.min(expandedHeightPx, start.height + dy));
      setDragHeightPx(next);
    },
    [expandedHeightPx]
  );

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

  // Radar proximity search
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

  // Submission-derived state for selected target
  const isTargetFound = selectedTarget ? foundHiderIds.has(selectedTarget.playerId) : false;
  const selectedSubmission = selectedTarget ? getMySubmissionForHider(selectedTarget.playerId) : undefined;
  const selectedSubmissionPhotoUrl = selectedSubmission?.photo_id
    ? submissionPhotoUrls[selectedSubmission.photo_id]
    : undefined;

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
          <span className="text-sm text-sky-700 dark:text-sky-300 shrink-0">
            You are: <strong className="font-semibold text-sky-900 dark:text-sky-100">{playerName}</strong>
          </span>
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

      {/* Bottom pull-up tray */}
      {targets.length > 0 && selectedTarget && (
        <div
          className="fixed bottom-0 left-0 right-0 z-20 flex flex-col bg-white dark:bg-zinc-800 border-t border-sky-200/50 dark:border-zinc-700 rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.08)] safe-area-inset-bottom"
          style={{
            height: `${trayHeightPx}px`,
            transition: isDragging ? "none" : "height 300ms ease-out",
          }}
        >
          {/* Drag handle */}
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

          {/* Tray content */}
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 pb-4">
            {/* Target pills */}
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <span className="text-sm font-medium text-sky-700 dark:text-sky-300 shrink-0">Targets:</span>
              {targets.map((t, i) => {
                const isFound = foundHiderIds.has(t.playerId);
                const triedButNotFound = triedButNotFoundHiderIds.has(t.playerId);
                const isSelected = selectedIndex === i;
                let pillClass: string;
                if (isFound && isSelected) {
                  pillClass = "bg-emerald-500 text-white dark:bg-emerald-600";
                } else if (isFound) {
                  pillClass =
                    "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-200 dark:hover:bg-emerald-800/50";
                } else if (triedButNotFound && isSelected) {
                  pillClass = "bg-amber-500 text-white dark:bg-amber-600";
                } else if (triedButNotFound) {
                  pillClass =
                    "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 hover:bg-amber-200 dark:hover:bg-amber-800/50";
                } else if (isSelected) {
                  pillClass = "bg-sky-600 text-white dark:bg-sky-500";
                } else {
                  pillClass =
                    "bg-sky-100/80 dark:bg-sky-900/30 text-sky-800 dark:text-sky-200 hover:bg-sky-200/80 dark:hover:bg-sky-800/40";
                }
                return (
                  <button
                    key={t.playerId}
                    type="button"
                    onClick={() => handleSelectTarget(i)}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors touch-manipulation flex items-center gap-1.5 ${pillClass}`}
                  >
                    {isFound && (
                      <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                    {t.name}
                  </button>
                );
              })}
            </div>

            {/* Selected target heading */}
            <h2 className="text-lg font-semibold text-sky-900 dark:text-sky-100 mt-1 mb-3">
              {selectedTarget.name}&apos;s target
              {isTargetFound && (
                <span className="ml-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  Found!
                </span>
              )}
            </h2>

            {/* Hider's hiding photo */}
            {selectedTarget.photoUrl ? (
              <div className="relative w-full aspect-[4/3] max-h-[40dvh] rounded-xl overflow-hidden bg-sky-100 dark:bg-zinc-700">
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

            {/* Radar: one compact line — icon, label, stepper, Search, Yes/No */}
            <section className="mt-4 pt-3 border-t border-sky-200/60 dark:border-zinc-600 flex flex-wrap items-center gap-2" aria-label="Radar">
              <span className="flex items-center gap-1.5 text-sm font-semibold text-sky-800 dark:text-sky-200 shrink-0">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-100 dark:bg-sky-900/50" aria-hidden>
                  <svg className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </span>
                Radar
              </span>
              <span className="text-xs text-sky-600 dark:text-sky-400 shrink-0">within</span>
              <div className="inline-flex items-center rounded-lg bg-sky-50 dark:bg-zinc-700/80 border border-sky-200/60 dark:border-zinc-600 shrink-0">
                <button
                  type="button"
                  disabled={radarDistanceIndex === 0 || radarLoading}
                  onClick={() => setRadarDistanceIndex((i) => Math.max(0, i - 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-l-lg text-sky-600 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-zinc-600 disabled:opacity-40 disabled:pointer-events-none touch-manipulation font-medium"
                  aria-label="Decrease distance"
                >
                  −
                </button>
                <span className="min-w-[2.25rem] text-center text-sm font-semibold tabular-nums text-sky-900 dark:text-sky-100">
                  {radarDistanceMeters}
                </span>
                <span className="pr-1.5 text-xs text-sky-600 dark:text-sky-400">m</span>
                <button
                  type="button"
                  disabled={radarDistanceIndex === RADAR_DISTANCES.length - 1 || radarLoading}
                  onClick={() => setRadarDistanceIndex((i) => Math.min(RADAR_DISTANCES.length - 1, i + 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-r-lg text-sky-600 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-zinc-600 disabled:opacity-40 disabled:pointer-events-none touch-manipulation font-medium"
                  aria-label="Increase distance"
                >
                  +
                </button>
              </div>
              <button
                type="button"
                onClick={handleRadarSearch}
                disabled={radarLoading}
                className="inline-flex items-center gap-1 rounded-lg bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400 text-white font-medium px-3 py-1.5 text-sm touch-manipulation transition-colors shrink-0"
              >
                {radarLoading ? "…" : <>Search <span aria-hidden>→</span></>}
              </button>
              {radarResult && (
                <span
                  className={`inline-flex items-center rounded-lg px-2.5 py-1 text-sm font-medium shrink-0 ${
                    radarResult.error && radarResult.distanceMeters == null
                      ? "bg-amber-100/80 dark:bg-zinc-600/80 text-amber-800 dark:text-amber-200"
                      : radarResult.withinDistance
                        ? "bg-emerald-100/80 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200"
                        : "bg-sky-100/80 dark:bg-zinc-600/80 text-sky-800 dark:text-sky-200"
                  }`}
                >
                  {radarResult.error && radarResult.distanceMeters == null ? radarResult.error : radarResult.withinDistance ? "Yes" : "No"}
                </span>
              )}
            </section>

            {/* Matched photo — shown when found */}
            {isTargetFound && selectedSubmissionPhotoUrl && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-2">
                  Your match
                </h3>
                <div className="relative w-full aspect-[4/3] max-h-[30dvh] rounded-xl overflow-hidden bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-300 dark:border-emerald-700">
                  <Image
                    src={selectedSubmissionPhotoUrl}
                    alt="Your matching photo"
                    fill
                    className="object-contain"
                    sizes="100vw"
                    unoptimized
                  />
                </div>
              </div>
            )}

            {/* Submit button or status */}
            <div className="mt-4">
              {submitting && (
                <div className="text-center py-3 text-sky-700 dark:text-sky-300 font-medium animate-pulse">
                  {submitStatus || "Processing..."}
                </div>
              )}
              {!submitting && submitStatus && (
                <div
                  className={`text-center py-3 font-medium ${
                    submitStatus === "Found!" || submitStatus.includes("win")
                      ? "text-emerald-600 dark:text-emerald-400"
                      : submitStatus === "Not close enough."
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {submitStatus}
                </div>
              )}
              {!isTargetFound && !submitting && !gameOver && (
                <button
                  type="button"
                  onClick={() => handleOpenCamera(selectedTarget.playerId)}
                  className={`touch-manipulation block w-full rounded-xl text-white font-semibold px-6 py-3.5 text-center transition-colors ${
                    triedButNotFoundHiderIds.has(selectedTarget.playerId)
                      ? "bg-amber-500 hover:bg-amber-600"
                      : "bg-sky-600 hover:bg-sky-700"
                  }`}
                >
                  I found {selectedTarget.name}!
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Camera modal */}
      <CameraModal isOpen={cameraOpen} onClose={handleCameraClose} onCapture={handleCameraCapture} />

      {/* Win modal overlay */}
      {winnerId != null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="win-modal-title"
        >
          <div className="rounded-2xl bg-white dark:bg-zinc-800 shadow-xl border border-emerald-200/50 dark:border-zinc-600 p-8 max-w-sm w-full text-center space-y-5">
            <div className="text-5xl" aria-hidden>
              {winnerId === playerId ? "🏆" : "🎉"}
            </div>
            <h2 id="win-modal-title" className="text-2xl font-bold text-emerald-800 dark:text-emerald-100">
              {winnerId === playerId ? "You won!" : `${winnerName ?? "Someone"} won!`}
            </h2>
            <p className="text-emerald-700 dark:text-emerald-200">
              {winnerId === playerId
                ? "You found everyone's hiding spots first!"
                : `${winnerName ?? "Another player"} found all the hiding spots before anyone else.`}
            </p>
            <Link
              href={`/games/${gameId}/summary`}
              className="touch-manipulation block w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3.5 text-center transition-colors"
            >
              View summary
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
