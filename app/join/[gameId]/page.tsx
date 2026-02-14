import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";
import { getPlayerForGame, PLAYER_COOKIE_NAME } from "@/lib/player-cookie";
import { JoinWithTutorial } from "./JoinWithTutorial";

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

  if (game.status !== "lobby") {
    return (
      <div className="min-h-screen font-sans" style={{ background: "var(--background)" }}>
        <main className="mx-auto max-w-2xl px-6 py-16">
          <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
            This game has already started
          </h1>
          <p className="mt-2" style={{ color: "var(--pastel-ink-muted)" }}>
            You can’t join once the game is in progress.
          </p>
          <Link href="/" className="mt-6 btn-ghost inline-flex">
            Back to Snap and Seek
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans" style={{ background: "var(--background)" }}>
      <main className="mx-auto max-w-2xl px-6 py-16">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-bold" style={{ color: "var(--foreground)" }}>
            Join game
          </h1>
          <p className="mt-2" style={{ color: "var(--pastel-ink-muted)" }}>
            {game.name || "Unnamed game"}
          </p>
        </header>

        <JoinWithTutorial gameId={gameId} />
      </main>
    </div>
  );
}
