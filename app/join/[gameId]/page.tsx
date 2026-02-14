import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { JoinForm } from "./JoinForm";

type Props = { params: Promise<{ gameId: string }> };

export default async function JoinPage({ params }: Props) {
  const { gameId } = await params;

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
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100 dark:from-zinc-950 dark:to-zinc-900 font-sans">
        <main className="mx-auto max-w-2xl px-6 py-16">
          <h1 className="text-2xl font-bold text-amber-900 dark:text-amber-100">
            This game has already started
          </h1>
          <p className="mt-2 text-amber-800/80 dark:text-amber-200/80">
            You can’t join once the game is in progress.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block text-amber-600 dark:text-amber-400 hover:underline"
          >
            Back to Snap and Seek
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100 dark:from-zinc-950 dark:to-zinc-900 font-sans">
      <main className="mx-auto max-w-2xl px-6 py-16">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-amber-900 dark:text-amber-100">
            Join game
          </h1>
          <p className="mt-2 text-amber-800/80 dark:text-amber-200/80">
            {game.name || "Unnamed game"}
          </p>
        </header>

        <section className="rounded-2xl bg-white/80 dark:bg-zinc-800/80 shadow-lg border border-amber-200/50 dark:border-zinc-700 p-6">
          <JoinForm gameId={gameId} />
        </section>
      </main>
    </div>
  );
}
