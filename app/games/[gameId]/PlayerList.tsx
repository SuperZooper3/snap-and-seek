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
      <h2 className="text-lg font-semibold text-amber-900 dark:text-amber-100 mb-3">
        Players ({players.length})
      </h2>
      {currentPlayer && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="text-sm text-amber-700 dark:text-amber-300">
            You are: <strong>{currentPlayer.name}</strong>
          </span>
          <button
            type="button"
            onClick={releaseIdentity}
            className="text-xs rounded-lg px-3 py-1.5 bg-amber-200/80 dark:bg-zinc-600/80 text-amber-900 dark:text-amber-100 hover:bg-amber-300/80 dark:hover:bg-zinc-500/80 transition-colors"
          >
            Release my identity
          </button>
        </div>
      )}
      {players.length === 0 && (
        <p className="text-amber-800/70 dark:text-amber-200/70 text-sm">
          No players yet. Share the link above so others can join.
        </p>
      )}
      {!currentPlayer && (
        <div className="mb-3 p-2">
          <Link
            href={`/join/${gameId}`}
            className="touch-manipulation block w-full rounded-xl bg-amber-500 hover:bg-amber-600 text-amber-950 font-semibold px-6 py-3 text-center transition-colors"
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
                className={`rounded-lg px-4 py-2 ${
                  isYou
                    ? "bg-amber-200/60 dark:bg-amber-600/30 text-amber-900 dark:text-amber-100 font-medium"
                    : "bg-amber-50/80 dark:bg-zinc-700/80 text-amber-900 dark:text-amber-100"
                } ${!isYou && !currentPlayer ? "cursor-pointer hover:bg-amber-100 dark:hover:bg-zinc-600/80 transition-colors" : ""}`}
                onClick={
                  !isYou && !currentPlayer
                    ? () => assumePlayer(p)
                    : undefined
                }
                role={!isYou && !currentPlayer ? "button" : undefined}
              >
                {p.name}
                {isYou && (
                  <span className="ml-2 text-xs text-amber-700 dark:text-amber-300">
                    (you)
                  </span>
                )}
                {!isYou && !currentPlayer && (
                  <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">
                    — tap to join as this player
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
