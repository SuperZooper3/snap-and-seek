import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";
import { getPlayerForGame, PLAYER_COOKIE_NAME } from "@/lib/player-cookie";
import { ZoneWithLocation } from "./ZoneWithLocation";

type Props = { params: Promise<{ gameId: string }> };

export default async function GameZonePage({ params }: Props) {
  const { gameId } = await params;

  const cookieStore = await cookies();
  const playersCookie = cookieStore.get(PLAYER_COOKIE_NAME)?.value;
  const decoded = playersCookie ? decodeURIComponent(playersCookie) : undefined;
  const currentPlayer = getPlayerForGame(decoded, gameId);
  if (!currentPlayer) {
    redirect(`/games/${gameId}`);
  }

  const { data: game, error } = await supabase
    .from("games")
    .select("id, name, status, zone_center_lat, zone_center_lng, zone_radius_meters")
    .eq("id", gameId)
    .single();

  if (error || !game) {
    notFound();
  }

  const zoneSet =
    game.zone_center_lat != null &&
    game.zone_center_lng != null &&
    game.zone_radius_meters != null;

  if (!zoneSet) {
    notFound();
  }

  const zone = {
    center_lat: game.zone_center_lat as number,
    center_lng: game.zone_center_lng as number,
    radius_meters: game.zone_radius_meters as number,
  };

  return (
    <div className="flex min-h-screen min-h-[100dvh] flex-col bg-gradient-to-b from-amber-50 to-orange-100 dark:from-zinc-950 dark:to-zinc-900 font-sans">
      <header className="shrink-0 border-b border-amber-200/50 dark:border-zinc-700 px-4 py-2.5 safe-area-inset-top">
        <Link
          href={`/games/${gameId}`}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-amber-800 dark:text-amber-200 bg-amber-100/80 dark:bg-amber-900/30 hover:bg-amber-200/80 dark:hover:bg-amber-800/40 transition-colors"
        >
          <span aria-hidden>←</span>
          Back to game
        </Link>
        <h1 className="mt-1.5 text-lg font-bold text-amber-900 dark:text-amber-100">
          Game zone
        </h1>
        <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-300">
          {(game as { name: string | null }).name || "Unnamed game"} · Stay inside the circle
        </p>
      </header>

      <main className="relative flex min-h-0 flex-1 flex-col w-full">
        <ZoneWithLocation zone={zone} gameId={gameId} playerId={currentPlayer.id} />
      </main>

      <footer className="shrink-0 border-t border-amber-200/50 dark:border-zinc-700 px-4 py-3 pb-safe space-y-2 bg-amber-50/80 dark:bg-zinc-900/80">
        <p className="text-xs text-amber-700 dark:text-amber-300">
          Play area: inside the circle ({Math.round(zone.radius_meters)} m). Red = out of bounds.
        </p>
        <Link
          href={`/games/${gameId}/capture`}
          className="touch-manipulation block w-full rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold px-6 py-3.5 text-center transition-colors"
        >
          Go to photo capture
        </Link>
      </footer>
    </div>
  );
}
