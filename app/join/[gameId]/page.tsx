import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";
import { getPlayerForGame, PLAYER_COOKIE_NAME } from "@/lib/player-cookie";
import type { Player } from "@/lib/types";
import { JoinWithTutorial } from "./JoinWithTutorial";
import { RejoinPlayerList } from "./RejoinPlayerList";

type Props = { params: Promise<{ gameId: string }> };

export default async function JoinPage({ params }: Props) {
  const { gameId } = await params;

  const cookieStore = await cookies();
  const playersCookie = cookieStore.get(PLAYER_COOKIE_NAME)?.value;
  const decoded = playersCookie ? decodeURIComponent(playersCookie) : undefined;
  const existingPlayer = getPlayerForGame(decoded, gameId);
  if (existingPlayer) {
    redirect(`/games/${gameId}`);
  }

  const { data: game, error } = await supabase
    .from("games")
    .select("id, name, status")
    .eq("id", gameId)
    .single();

  if (error || !game) {
    notFound();
  }

  const isRejoin = game.status !== "lobby";

  let players: Player[] = [];
  if (isRejoin) {
    const { data: playersData } = await supabase
      .from("players")
      .select("id, name, game_id, created_at")
      .eq("game_id", gameId)
      .order("created_at", { ascending: true });
    players = (playersData ?? []) as Player[];
  }

  return (
    <div className="min-h-screen font-sans" style={{ background: "var(--background)" }}>
      <main className="mx-auto max-w-2xl px-6 py-16">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-bold" style={{ color: "var(--foreground)" }}>
            {isRejoin ? "Rejoin game" : "Join game"}
          </h1>
          <p className="mt-2" style={{ color: "var(--pastel-ink-muted)" }}>
            {game.name || "Unnamed game"}
          </p>
        </header>

        {isRejoin ? (
          players.length > 0 ? (
            <RejoinPlayerList gameId={gameId} players={players} />
          ) : (
            <section className="sketch-card p-6">
              <p style={{ color: "var(--pastel-ink-muted)" }}>
                No players in this game. Use a join link from the game host to add yourself first.
              </p>
            </section>
          )
        ) : (
          <JoinWithTutorial gameId={gameId} isRejoin={false} />
        )}
      </main>
    </div>
  );
}
