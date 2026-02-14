import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default async function Home() {
  const { data: games, error } = await supabase.from("games").select("*");

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100 dark:from-zinc-950 dark:to-zinc-900 font-sans">
      <main className="mx-auto max-w-2xl px-6 py-16">
        <header className="text-center mb-14">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-amber-900 dark:text-amber-100">
            Snap and Seek
          </h1>
          <p className="mt-3 text-lg text-amber-800/80 dark:text-amber-200/80">
            Hide. Seek. Snap. Find them all.
          </p>
        </header>

        <section className="rounded-2xl bg-white/80 dark:bg-zinc-800/80 shadow-lg border border-amber-200/50 dark:border-zinc-700 p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-amber-900 dark:text-amber-100 mb-4">
            Games
          </h2>
          {error && (
            <p className="text-red-600 dark:text-red-400 text-sm">
              Could not load games: {error.message}. Check .env and Supabase setup.
            </p>
          )}
          {!error && (!games || games.length === 0) && (
            <p className="text-amber-800/70 dark:text-amber-200/70">
              No games yet. Create a <code className="bg-amber-100 dark:bg-zinc-700 px-1 rounded">games</code> table in Supabase and add some rows.
            </p>
          )}
          {!error && games && games.length > 0 && (
            <ul className="space-y-3">
              {games.map((game) => (
                <li
                  key={(game as { id?: string }).id ?? JSON.stringify(game)}
                  className="rounded-lg bg-amber-50/80 dark:bg-zinc-700/80 p-4 border border-amber-100 dark:border-zinc-600"
                >
                  <pre className="text-sm text-amber-900 dark:text-amber-100 overflow-x-auto whitespace-pre-wrap break-words font-mono">
                    {JSON.stringify(game, null, 2)}
                  </pre>
                </li>
              ))}
            </ul>
          )}
        </section>

        <footer className="mt-12 text-center text-sm text-amber-800/60 dark:text-amber-200/60">
          Snap and Seek — hackathon edition ·{" "}
          <Link href="/location-test" className="hover:underline">
            Location test
          </Link>
        </footer>
      </main>
    </div>
  );
}
