"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { GameZoneModal } from "./GameZoneModal";

type GameZone = {
  center_lat: number;
  center_lng: number;
  radius_meters: number;
} | null;

type PlayerIdentity = { id: number; name: string } | null;

type Props = {
  gameId: string;
  status: string | null;
  joinUrl: string;
  playerCount: number;
  zone: GameZone;
  currentPlayer: PlayerIdentity;
};

export function GameActions({ gameId, status, joinUrl, playerCount, zone, currentPlayer }: Props) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [starting, setStarting] = useState(false);
  const [zoneModalOpen, setZoneModalOpen] = useState(false);
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

      {!isLobby && status && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-amber-800/80 dark:text-amber-200/80 text-sm">
              Status
            </span>
            <span
              className={
                status === "hiding"
                  ? "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-emerald-200/90 dark:bg-emerald-800/50 text-emerald-900 dark:text-emerald-100"
                  : "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-amber-200/90 dark:bg-amber-800/50 text-amber-900 dark:text-amber-100"
              }
            >
              {status}
            </span>
          </div>
          {currentPlayer ? (
            <a
              href={`/games/${gameId}/zone`}
              className="touch-manipulation block w-full rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold px-6 py-3 text-center transition-colors"
            >
              Start hiding
            </a>
          ) : (
            <p className="text-amber-800/80 dark:text-amber-200/80 text-sm">
              Join as a player below (tap a name) to start hiding.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
