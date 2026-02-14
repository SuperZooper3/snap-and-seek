import Link from "next/link";
import { notFound } from "next/navigation";
import { headers, cookies } from "next/headers";
import { supabase } from "@/lib/supabase";
import { getPlayerForGame, PLAYER_COOKIE_NAME } from "@/lib/player-cookie";
import type { Game, Player } from "@/lib/types";
import { GameActions } from "./GameActions";

type Props = { params: Promise<{ gameId: string }> };

async function getBaseUrl() {
  const url = process.env.NEXT_PUBLIC_APP_URL;
  if (url) return url.replace(/\/$/, "");
  const headersList = await headers();
  const host = headersList.get("x-forwarded-host") ?? headersList.get("host");
  const proto = headersList.get("x-forwarded-proto") ?? "http";
  return host ? `${proto}://${host}` : "http://localhost:3000";
}

export default async function GamePage({ params }: Props) {
  const { gameId } = await params;

  const { data: game, error: gameError } = await supabase
    .from("games")
    .select("*")
    .eq("id", gameId)
    .single();

  if (gameError || !game) {
    notFound();
  }

  const { data: players } = await supabase
    .from("players")
    .select("*")
    .eq("game_id", gameId)
    .order("created_at", { ascending: true });

  const joinUrl = `${await getBaseUrl()}/join/${gameId}`;

  const cookieStore = await cookies();
  const playersCookie = cookieStore.get(PLAYER_COOKIE_NAME)?.value;
  const decoded = playersCookie ? decodeURIComponent(playersCookie) : undefined;
  const currentPlayer = getPlayerForGame(decoded, gameId);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100 dark:from-zinc-950 dark:to-zinc-900 font-sans">
      <main className="mx-auto max-w-2xl px-6 py-16">
        <header className="mb-10">
          <Link
            href="/"
            className="text-sm text-amber-800/70 dark:text-amber-200/70 hover:underline"
          >
            ← Create game
          </Link>
          {currentPlayer && (
            <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
              You are: <strong>{currentPlayer.name}</strong>
            </p>
          )}
          <h1 className="mt-4 text-3xl font-bold text-amber-900 dark:text-amber-100">
            {(game as Game).name || "Unnamed game"}
          </h1>
        </header>

        <section className="rounded-2xl bg-white/80 dark:bg-zinc-800/80 shadow-lg border border-amber-200/50 dark:border-zinc-700 p-6 space-y-6">
          <GameActions
            gameId={gameId}
            status={(game as Game).status}
            joinUrl={joinUrl}
            playerCount={(players as Player[])?.length ?? 0}
          />

          {currentPlayer && (
            <div>
              <Link
                href={`/games/${gameId}/setup`}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white font-semibold px-6 py-3 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
                  />
                </svg>
                Set Up Hiding Spot
              </Link>
            </div>
          )}

          <div>
            <h2 className="text-lg font-semibold text-amber-900 dark:text-amber-100 mb-3">
              Players ({((players as Player[]) ?? []).length})
            </h2>
            {(!players || players.length === 0) && (
              <p className="text-amber-800/70 dark:text-amber-200/70 text-sm">
                No players yet. Share the link above so others can join.
              </p>
            )}
            {players && players.length > 0 && (
              <ul className="space-y-2">
                {(players as Player[]).map((p) => {
                  const isYou = currentPlayer?.id === p.id;
                  return (
                    <li
                      key={p.id}
                      className={`rounded-lg px-4 py-2 ${
                        isYou
                          ? "bg-amber-200/60 dark:bg-amber-600/30 text-amber-900 dark:text-amber-100 font-medium"
                          : "bg-amber-50/80 dark:bg-zinc-700/80 text-amber-900 dark:text-amber-100"
                      }`}
                    >
                      {p.name}
                      {isYou && (
                        <span className="ml-2 text-xs text-amber-700 dark:text-amber-300">
                          (you)
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
