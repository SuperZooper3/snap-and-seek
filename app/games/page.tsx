import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Game } from "@/lib/types";

export default async function GamesPage() {
  const { data: games, error } = await supabase
    .from("games")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100 dark:from-zinc-950 dark:to-zinc-900 font-sans">
      <main className="mx-auto max-w-2xl px-6 py-16">
        <header className="mb-10">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-amber-800 dark:text-amber-200 bg-amber-100/80 dark:bg-amber-900/30 hover:bg-amber-200/80 dark:hover:bg-amber-800/40 transition-colors"
          >
            <span aria-hidden>←</span>
            Create game
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-amber-900 dark:text-amber-100">
            All games
          </h1>
        </header>

        <section className="rounded-2xl bg-white/80 dark:bg-zinc-800/80 shadow-lg border border-amber-200/50 dark:border-zinc-700 p-6">
          <h2 className="text-xl font-semibold text-amber-900 dark:text-amber-100 mb-4">
            Running games
          </h2>
          {error && (
            <p className="text-red-600 dark:text-red-400 text-sm">
              Could not load games: {error.message}
            </p>
          )}
          {!error && (!games || games.length === 0) && (
            <p className="text-amber-800/70 dark:text-amber-200/70">
              No games yet. Create one above.
            </p>
          )}
          {!error && games && games.length > 0 && (
            <ul className="space-y-3">
              {(games as Game[]).map((game) => (
                <li key={game.id}>
                  <Link
                    href={`/games/${game.id}`}
                    className="block rounded-lg bg-amber-50/80 dark:bg-zinc-700/80 p-4 border border-amber-100 dark:border-zinc-600 hover:border-amber-300 dark:hover:border-zinc-500 transition-colors"
                  >
                    <span className="font-medium text-amber-900 dark:text-amber-100">
                      {game.name || "Unnamed game"}
                    </span>
                    <span
                      className={
                        (game as Game).status === "hiding"
                          ? "ml-2 inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-emerald-200/90 dark:bg-emerald-800/50 text-emerald-900 dark:text-emerald-100"
                          : "ml-2 inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-amber-200/80 dark:bg-amber-800/50 text-amber-800 dark:text-amber-200"
                      }
                    >
                      {(game as Game).status ?? "lobby"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
