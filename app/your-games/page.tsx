import Link from "next/link";
import { cookies } from "next/headers";
import { BackArrowIcon } from "@/components/BackArrowIcon";
import { supabase } from "@/lib/supabase";
import { parseYourGamesCookie, YOUR_GAMES_COOKIE_NAME } from "@/lib/your-games-cookie";
import type { Game } from "@/lib/types";

export default async function YourGamesPage() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(YOUR_GAMES_COOKIE_NAME)?.value;
  const gameIds = parseYourGamesCookie(raw);

  let games: Game[] = [];
  if (gameIds.length > 0) {
    const { data, error } = await supabase
      .from("games")
      .select("*")
      .in("id", gameIds);

    if (!error && data && data.length > 0) {
      const byId = new Map((data as Game[]).map((g) => [g.id, g]));
      games = gameIds.map((id) => byId.get(id)).filter((g): g is Game => g != null);
    }
  }

  return (
    <div className="min-h-screen font-sans" style={{ background: "var(--background)" }}>
      <main className="mx-auto max-w-2xl px-6 py-16">
        <header className="mb-10">
          <Link href="/" className="btn-ghost inline-flex items-center gap-1.5">
            <BackArrowIcon />
            Create game
          </Link>
          <h1 className="mt-4 text-3xl font-bold" style={{ color: "var(--foreground)" }}>
            Your games
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--pastel-ink-muted)" }}>
            Games you’ve created or joined. Reopen from here to rejoin.
          </p>
        </header>

        <section className="sketch-card p-6">
          <h2 className="text-xl font-bold mb-4" style={{ color: "var(--foreground)" }}>
            Your games
          </h2>
          {games.length === 0 && (
            <p style={{ color: "var(--pastel-ink-muted)" }}>
              You haven’t joined or created any games yet. Create a game above or use a join link to get started.
            </p>
          )}
          {games.length > 0 && (
            <ul className="space-y-3">
              {games.map((game) => (
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
                          game.status === "completed"
                            ? "var(--pastel-mint)"
                            : game.status === "hiding"
                              ? "var(--pastel-mint)"
                              : game.status === "seeking"
                                ? "var(--pastel-sky)"
                                : "var(--pastel-peach)",
                        color: "var(--pastel-ink)",
                      }}
                    >
                      {game.status ?? "lobby"}
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
