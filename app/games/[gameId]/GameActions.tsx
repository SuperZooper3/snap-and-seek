"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  gameId: string;
  status: string | null;
  joinUrl: string;
  playerCount: number;
};

export function GameActions({ gameId, status, joinUrl, playerCount }: Props) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [starting, setStarting] = useState(false);
  const isLobby = status === "lobby";
  const canStart = playerCount >= 2;

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
      router.refresh();
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
          {!canStart && (
            <p className="text-amber-800/80 dark:text-amber-200/80 text-sm">
              Need at least 2 players to start.
            </p>
          )}
          <button
            type="button"
            onClick={startGame}
            disabled={starting || !canStart}
            className="rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold px-6 py-3 transition-colors"
          >
            {starting ? "Starting…" : "Start game"}
          </button>
        </>
      )}

      {!isLobby && status && (
        <p className="text-amber-800/80 dark:text-amber-200/80 text-sm">
          Status: <strong>{status}</strong>
        </p>
      )}
    </div>
  );
}
