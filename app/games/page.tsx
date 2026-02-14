import Link from "next/link";
import { BackArrowIcon } from "@/components/BackArrowIcon";
import { supabase } from "@/lib/supabase";
import type { Game } from "@/lib/types";

export default async function GamesPage() {
  const { data: games, error } = await supabase
    .from("games")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen font-sans" style={{ background: "var(--background)" }}>
      <main className="mx-auto max-w-2xl px-6 py-16">
        <header className="mb-10">
          <Link href="/" className="btn-ghost inline-flex items-center gap-1.5">
            <BackArrowIcon />
            Create game
          </Link>
          <h1 className="mt-4 text-3xl font-bold" style={{ color: "var(--foreground)" }}>
            All games
          </h1>
        </header>

        <section className="sketch-card p-6">
          <h2 className="text-xl font-bold mb-4" style={{ color: "var(--foreground)" }}>
            Running games
          </h2>
          {error && (
            <p className="text-sm mb-4" style={{ color: "var(--pastel-error)" }}>
              Could not load games: {error.message}
            </p>
          )}
          {!error && (!games || games.length === 0) && (
            <p style={{ color: "var(--pastel-ink-muted)" }}>
              No games yet. Create one above.
            </p>
          )}
          {!error && games && games.length > 0 && (
            <ul className="space-y-3">
              {(games as Game[]).map((game) => (
                <li key={game.id}>
                  <Link
                    href={`/games/${game.id}`}
                    className="block p-4 rounded-xl border-[3px] transition-all hover:translate-x-0.5 hover:translate-y-0.5"
                    style={{
                      background: "var(--pastel-butter)",
                      borderColor: "var(--pastel-border)",
                      color: "var(--pastel-ink)",
                      boxShadow: "3px 3px 0 var(--pastel-border-subtle)",
                    }}
                  >
                    <span className="font-bold">{game.name || "Unnamed game"}</span>
                    <span
                      className="ml-2 inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold border-2"
                      style={{
                        borderColor: "var(--pastel-border)",
                        background:
                          (game as Game).status === "completed"
                            ? "var(--pastel-mint)"
                            : (game as Game).status === "hiding"
                              ? "var(--pastel-mint)"
                              : (game as Game).status === "seeking"
                                ? "var(--pastel-sky)"
                                : "var(--pastel-peach)",
                        color: "var(--pastel-ink)",
                      }}
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
