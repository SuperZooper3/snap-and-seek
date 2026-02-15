"use client";

import { useRouter } from "next/navigation";
import { setPlayerInCookie } from "@/lib/player-cookie";
import { addGameToYourGames } from "@/lib/your-games-cookie";
import type { Player } from "@/lib/types";

type Props = { gameId: string; players: Player[] };

export function RejoinPlayerList({ gameId, players }: Props) {
  const router = useRouter();

  function assumePlayer(player: Player) {
    addGameToYourGames(gameId);
    setPlayerInCookie(gameId, { id: player.id, name: player.name });
    router.push(`/games/${gameId}`);
    router.refresh();
  }

  return (
    <section className="sketch-card p-6">
      <h2 className="text-lg font-bold mb-3" style={{ color: "var(--foreground)" }}>
        Rejoin as
      </h2>
      <p className="text-sm mb-4" style={{ color: "var(--pastel-ink-muted)" }}>
        Tap your name to rejoin the game.
      </p>
      <ul className="space-y-2">
        {players.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => assumePlayer(p)}
              className="w-full text-left rounded-xl border-[3px] px-4 py-2.5 transition-all hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5"
              style={{
                background: "var(--pastel-butter)",
                borderColor: "var(--pastel-border)",
                color: "var(--pastel-ink)",
                boxShadow: "3px 3px 0 var(--pastel-border-subtle)",
              }}
            >
              {p.name}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
