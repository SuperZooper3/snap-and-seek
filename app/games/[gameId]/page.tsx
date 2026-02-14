import Link from "next/link";
import { notFound } from "next/navigation";
import { headers, cookies } from "next/headers";
import { supabase } from "@/lib/supabase";
import { getPlayerForGame, PLAYER_COOKIE_NAME } from "@/lib/player-cookie";
import type { Game, Player } from "@/lib/types";
import { GameActions } from "./GameActions";
import { PlayerList } from "./PlayerList";

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

  const zone =
    game.zone_center_lat != null &&
    game.zone_center_lng != null &&
    game.zone_radius_meters != null
      ? {
          center_lat: game.zone_center_lat as number,
          center_lng: game.zone_center_lng as number,
          radius_meters: game.zone_radius_meters as number,
        }
      : null;

  const cookieStore = await cookies();
  const playersCookie = cookieStore.get(PLAYER_COOKIE_NAME)?.value;
  const decoded = playersCookie ? decodeURIComponent(playersCookie) : undefined;
  const currentPlayer = getPlayerForGame(decoded, gameId);

  return (
    <div className="min-h-screen min-h-[100dvh] bg-gradient-to-b from-amber-50 to-orange-100 dark:from-zinc-950 dark:to-zinc-900 font-sans">
      <main className="mx-auto max-w-2xl px-4 sm:px-6 py-8 sm:py-16 pb-safe">
        <header className="mb-10">
          <Link
            href="/"
            className="text-sm text-amber-800/70 dark:text-amber-200/70 hover:underline"
          >
            ← Create game
          </Link>
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
            zone={zone}
            currentPlayer={currentPlayer}
          />

          {zone && !currentPlayer && (
          <Link
            href={`/games/${gameId}/god`}
            className="touch-manipulation block w-full rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold px-6 py-3 text-center transition-colors"
          >
            God mode — view all positions on map
          </Link>
        )}

          <PlayerList
            gameId={gameId}
            players={(players as Player[]) ?? []}
            currentPlayer={currentPlayer}
          />
        </section>
      </main>
    </div>
  );
}
