"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { GameZoneModal } from "./GameZoneModal";
import { TutorialModal } from "@/components/TutorialModal";

type GameZone = {
  center_lat: number;
  center_lng: number;
  radius_meters: number;
} | null;

type PlayerIdentity = { id: number; name: string } | null;

const HIDING_DURATION_PRESETS = [
  { label: "30 seconds", value: 30 },
  { label: "1 minute", value: 60 },
  { label: "2 minutes", value: 120 },
  { label: "5 minutes", value: 300 },
  { label: "10 minutes", value: 600 },
  { label: "15 minutes", value: 900 },
  { label: "20 minutes", value: 1200 },
  { label: "30 minutes", value: 1800 },
] as const;

const POWERUP_CASTING_PRESETS = [
  { label: "10 seconds", value: 10 },
  { label: "30 seconds", value: 30 },
  { label: "1 minute", value: 60 },
  { label: "2 minutes", value: 120 },
  { label: "3 minutes", value: 180 },
  { label: "5 minutes", value: 300 },
] as const;

type Props = {
  gameId: string;
  status: string | null;
  joinUrl: string;
  playerCount: number;
  zone: GameZone;
  currentPlayer: PlayerIdentity;
  /** Hiding phase duration in seconds (see game-config). Only used in lobby. */
  hidingDurationSeconds: number;
  /** Power-up casting duration in seconds */
  powerupCastingSeconds: number;
};

export function GameActions({
  gameId,
  status,
  joinUrl,
  playerCount,
  zone,
  currentPlayer,
  hidingDurationSeconds,
  powerupCastingSeconds,
}: Props) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [starting, setStarting] = useState(false);
  const [zoneModalOpen, setZoneModalOpen] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [savingDuration, setSavingDuration] = useState(false);
  const [savingCasting, setSavingCasting] = useState(false);
  const isLobby = status === "lobby";
  const hasZone = zone != null;
  const canStart = playerCount >= 2 && hasZone;

  function copyLink() {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function startGame() {
    setStarting(true);
    try {
      const res = await fetch(`/api/games/${gameId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "hiding" }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to start game");
      }
      router.push(`/games/${gameId}/zone`);
    } finally {
      setStarting(false);
    }
  }

  async function setHidingDuration(seconds: number) {
    setSavingDuration(true);
    try {
      const res = await fetch(`/api/games/${gameId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hiding_duration_seconds: seconds }),
      });
      if (!res.ok) throw new Error("Failed to update duration");
      router.refresh();
    } finally {
      setSavingDuration(false);
    }
  }

  async function setPowerupCasting(seconds: number) {
    setSavingCasting(true);
    try {
      const res = await fetch(`/api/games/${gameId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ powerup_casting_duration_seconds: seconds }),
      });
      if (!res.ok) throw new Error("Failed to update cast time");
      router.refresh();
    } finally {
      setSavingCasting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-1">
          Share this link for players to join
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            readOnly
            value={joinUrl}
            className="flex-1 rounded-lg border border-amber-200 dark:border-zinc-600 bg-amber-50/50 dark:bg-zinc-700/50 px-3 py-2 text-sm text-amber-900 dark:text-amber-100 font-mono"
          />
          <button
            type="button"
            onClick={copyLink}
            className="rounded-lg bg-amber-500 hover:bg-amber-600 text-amber-950 font-medium px-4 py-2 text-sm whitespace-nowrap transition-colors"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      {isLobby && (
        <>
          <button
            type="button"
            onClick={() => setTutorialOpen(true)}
            className="touch-manipulation w-full rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-medium px-6 py-3 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            How to play <strong>Snap and Seek</strong>!
          </button>
          <div>
            <label className="block text-sm font-medium text-amber-900 dark:text-amber-100 mb-1.5">
              Hiding period
            </label>
            <select
              value={hidingDurationSeconds}
              onChange={(e) => setHidingDuration(Number(e.target.value))}
              disabled={savingDuration}
              className="w-full rounded-lg border border-amber-200 dark:border-zinc-600 bg-amber-50/50 dark:bg-zinc-700/50 px-3 py-2 text-sm text-amber-900 dark:text-amber-100"
            >
              {HIDING_DURATION_PRESETS.map(({ label, value }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-amber-900 dark:text-amber-100 mb-1.5">
              Time to Cast
            </label>
            <select
              value={powerupCastingSeconds}
              onChange={(e) => setPowerupCasting(Number(e.target.value))}
              disabled={savingCasting}
              className="w-full rounded-lg border border-amber-200 dark:border-zinc-600 bg-amber-50/50 dark:bg-zinc-700/50 px-3 py-2 text-sm text-amber-900 dark:text-amber-100"
            >
              {POWERUP_CASTING_PRESETS.map(({ label, value }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
              How long power-ups take to cast during seeking
            </p>
          </div>
          <button
            type="button"
            onClick={() => setZoneModalOpen(true)}
            className="touch-manipulation w-full rounded-xl bg-amber-500 hover:bg-amber-600 text-amber-950 font-semibold px-6 py-3 transition-colors"
          >
            {hasZone ? "Edit game zone" : "Set game zone"}
          </button>
          {!hasZone && (
            <p className="text-amber-800/80 dark:text-amber-200/80 text-sm">
              Set the play area on the map (required to start).
            </p>
          )}
          {!canStart && hasZone && (
            <p className="text-amber-800/80 dark:text-amber-200/80 text-sm">
              Need at least 2 players to start.
            </p>
          )}
          <button
            type="button"
            onClick={startGame}
            disabled={starting || !canStart}
            className="touch-manipulation w-full rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold px-6 py-3 transition-colors"
          >
            {starting ? "Starting…" : "Start game"}
          </button>
        </>
      )}

      {zoneModalOpen && (
        <GameZoneModal
          gameId={gameId}
          initialZone={zone}
          onSaved={() => {
            setZoneModalOpen(false);
            router.refresh();
          }}
          onClose={() => setZoneModalOpen(false)}
        />
      )}

      {tutorialOpen && (
        <TutorialModal onClose={() => setTutorialOpen(false)} />
      )}

      {!isLobby && status && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-amber-800/80 dark:text-amber-200/80 text-sm">
              Status
            </span>
            <span
              className={
                status === "completed"
                  ? "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-green-200/90 dark:bg-green-800/50 text-green-900 dark:text-green-100"
                  : status === "hiding"
                    ? "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-emerald-200/90 dark:bg-emerald-800/50 text-emerald-900 dark:text-emerald-100"
                    : status === "seeking"
                      ? "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-sky-200/90 dark:bg-sky-800/50 text-sky-900 dark:text-sky-100"
                      : "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-amber-200/90 dark:bg-amber-800/50 text-amber-900 dark:text-amber-100"
              }
            >
              {status}
            </span>
          </div>
          {status === "completed" ? (
            <a
              href={`/games/${gameId}/summary`}
              className="touch-manipulation block w-full rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 text-center transition-colors"
            >
              View game summary
            </a>
          ) : currentPlayer ? (
            <a
              href={status === "seeking" ? `/games/${gameId}/seeking` : `/games/${gameId}/zone`}
              className="touch-manipulation block w-full rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold px-6 py-3 text-center transition-colors"
            >
              {status === "seeking" ? "Go to seeking" : "Go to hiding"}
            </a>
          ) : (
            <p className="text-amber-800/80 dark:text-amber-200/80 text-sm">
              {status === "seeking"
                ? "Seeking in progress — join as a player to view the seeking map."
                : "Join as a player below (tap a name) to start hiding."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
