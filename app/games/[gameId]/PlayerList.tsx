"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { setPlayerInCookie, clearPlayerForGame } from "@/lib/player-cookie";
import type { Player } from "@/lib/types";

type PlayerIdentity = { id: number; name: string } | null;

type Props = {
  gameId: string;
  players: Player[];
  currentPlayer: PlayerIdentity;
};

export function PlayerList({ gameId, players, currentPlayer }: Props) {
  const router = useRouter();

  function assumePlayer(player: Player) {
    setPlayerInCookie(gameId, { id: player.id, name: player.name });
    router.refresh();
  }

  function releaseIdentity() {
    clearPlayerForGame(gameId);
    router.refresh();
  }

  return (
    <div>
      <h2 className="text-lg font-bold mb-3" style={{ color: "var(--foreground)" }}>
        Players ({players.length})
      </h2>
      {currentPlayer && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="text-sm" style={{ color: "var(--pastel-ink-muted)" }}>
            You are: <strong style={{ color: "var(--foreground)" }}>{currentPlayer.name}</strong>
          </span>
          <button
            type="button"
            onClick={releaseIdentity}
            className="btn-sm !min-h-0 !py-1.5 !text-xs"
          >
            Release my identity
          </button>
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
            return (
              <li
                key={p.id}
                className="rounded-xl border-[3px] px-4 py-2.5 transition-all"
                style={{
                  background: isYou ? "var(--pastel-butter)" : "var(--pastel-paper)",
                  borderColor: "var(--pastel-border)",
                  color: "var(--pastel-ink)",
                  cursor: !isYou && !currentPlayer ? "pointer" : undefined,
                  boxShadow: "3px 3px 0 var(--pastel-border-subtle)",
                }}
                onClick={
                  !isYou && !currentPlayer
                    ? () => assumePlayer(p)
                    : undefined
                }
                role={!isYou && !currentPlayer ? "button" : undefined}
              >
                {p.name}
                {isYou && (
                  <span className="ml-2 text-xs" style={{ color: "var(--pastel-ink-muted)" }}>
                    (you)
                  </span>
                )}
                {!isYou && !currentPlayer && (
                  <span className="ml-2 text-xs" style={{ color: "var(--pastel-ink-muted)" }}>
                    tap to join as this player
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
