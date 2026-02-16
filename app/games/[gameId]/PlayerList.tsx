"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { setPlayerInCookie, clearPlayerForGame } from "@/lib/player-cookie";
import type { Player } from "@/lib/types";

type PlayerIdentity = { id: number; name: string } | null;

type Props = {
  gameId: string;
  players: Player[];
  currentPlayer: PlayerIdentity;
  gameStatus?: string | null;
};

export function PlayerList({ gameId, players, currentPlayer, gameStatus }: Props) {
  const router = useRouter();
  const [editingName, setEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState(currentPlayer?.name ?? "");
  const [savingName, setSavingName] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [withdrawingId, setWithdrawingId] = useState<number | null>(null);
  const isLobby = gameStatus === "lobby";
  const gameStarted = gameStatus != null && gameStatus !== "lobby" && gameStatus !== "completed";

  function assumePlayer(player: Player) {
    setPlayerInCookie(gameId, { id: player.id, name: player.name });
    router.refresh();
  }

  function releaseIdentity() {
    clearPlayerForGame(gameId);
    router.refresh();
  }

  async function saveName() {
    if (!currentPlayer || !editNameValue.trim()) return;
    setSavingName(true);
    try {
      const res = await fetch(`/api/games/${gameId}/players/${currentPlayer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editNameValue.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update name");
      }
      setPlayerInCookie(gameId, { id: currentPlayer.id, name: editNameValue.trim() });
      setEditingName(false);
      router.refresh();
    } finally {
      setSavingName(false);
    }
  }

  async function leaveGame() {
    if (!currentPlayer || !isLobby) return;
    if (!confirm("Leave this game? You will be removed from the player list.")) return;
    setLeaving(true);
    try {
      const res = await fetch(`/api/games/${gameId}/players/${currentPlayer.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to leave game");
      }
      clearPlayerForGame(gameId);
      router.refresh();
    } finally {
      setLeaving(false);
    }
  }

  async function withdrawPlayer(player: Player) {
    if (!gameStarted || player.withdrawn_at) return;
    if (!confirm(`Withdraw ${player.name}? They will no longer be a target; others won't need to find them.`)) return;
    setWithdrawingId(player.id);
    try {
      const res = await fetch(`/api/games/${gameId}/players/${player.id}/withdraw`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to withdraw player");
      }
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to withdraw");
    } finally {
      setWithdrawingId(null);
    }
  }

  return (
    <div>
      <h2 className="text-lg font-bold mb-3" style={{ color: "var(--foreground)" }}>
        Players ({players.length})
      </h2>
      {currentPlayer && (
        <div className="mb-3 space-y-2">
          {!editingName ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm" style={{ color: "var(--pastel-ink-muted)" }}>
                You are: <strong style={{ color: "var(--foreground)" }}>{currentPlayer.name}</strong>
              </span>
              <button
                type="button"
                onClick={() => {
                  setEditNameValue(currentPlayer.name);
                  setEditingName(true);
                }}
                className="btn-sm !min-h-0 !py-1.5 !text-xs"
              >
                Edit name
              </button>
              <button
                type="button"
                onClick={releaseIdentity}
                className="btn-sm !min-h-0 !py-1.5 !text-xs"
              >
                Release my identity
              </button>
              {isLobby && (
                <button
                  type="button"
                  onClick={leaveGame}
                  disabled={leaving}
                  className="btn-sm !min-h-0 !py-1.5 !text-xs"
                  style={{ color: "#b91c1c" }}
                >
                  {leaving ? "Leaving…" : "Leave game"}
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={editNameValue}
                onChange={(e) => setEditNameValue(e.target.value)}
                className="sketch-input flex-1 min-w-0 px-3 py-2 text-sm"
                placeholder="Your name"
                autoFocus
              />
              <button
                type="button"
                onClick={saveName}
                disabled={savingName || !editNameValue.trim()}
                className="btn-sm !min-h-0 !py-1.5 !text-xs"
              >
                {savingName ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => setEditingName(false)}
                className="btn-sm !min-h-0 !py-1.5 !text-xs"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
      {players.length === 0 && (
        <p className="text-sm" style={{ color: "var(--pastel-ink-muted)" }}>
          No players yet. Share the link above so others can join.
        </p>
      )}
      {!currentPlayer && (
        <div className="mb-3">
          <Link
            href={`/join/${gameId}`}
            className="btn-pastel-peach touch-manipulation block w-full text-center"
          >
            Join as a player
          </Link>
        </div>
      )}
      {players.length > 0 && (
        <ul className="space-y-2">
          {players.map((p) => {
            const isYou = currentPlayer?.id === p.id;
            const withdrawn = !!p.withdrawn_at;
            const canAssume = !isYou && !currentPlayer && !withdrawn;
            return (
              <li
                key={p.id}
                className="rounded-xl border-[3px] px-4 py-2.5 transition-all flex flex-wrap items-center justify-between gap-2"
                style={{
                  background: isYou ? "var(--pastel-butter)" : withdrawn ? "var(--pastel-paper)" : "var(--pastel-paper)",
                  borderColor: "var(--pastel-border)",
                  color: "var(--pastel-ink)",
                  cursor: canAssume ? "pointer" : undefined,
                  boxShadow: "3px 3px 0 var(--pastel-border-subtle)",
                }}
                onClick={canAssume ? () => assumePlayer(p) : undefined}
                role={canAssume ? "button" : undefined}
              >
                <span>
                  {p.name}
                  {isYou && (
                    <span className="ml-2 text-xs" style={{ color: "var(--pastel-ink-muted)" }}>
                      (you)
                    </span>
                  )}
                  {withdrawn && (
                    <span className="ml-2 text-xs font-medium" style={{ color: "var(--pastel-ink-muted)" }}>
                      (withdrawn)
                    </span>
                  )}
                  {canAssume && (
                    <span className="ml-2 text-xs" style={{ color: "var(--pastel-ink-muted)" }}>
                      tap to join as this player
                    </span>
                  )}
                </span>
                {gameStarted && currentPlayer && !isYou && !withdrawn && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      withdrawPlayer(p);
                    }}
                    disabled={withdrawingId === p.id}
                    className="btn-withdraw shrink-0"
                  >
                    {withdrawingId === p.id ? "Withdrawing…" : "Withdraw"}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
