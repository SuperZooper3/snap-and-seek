import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";
import { getPlayerForGame, PLAYER_COOKIE_NAME } from "@/lib/player-cookie";
import { GodMapWithPings } from "./GodMapWithPings";

type Props = { params: Promise<{ gameId: string }> };

export default async function GodModePage({ params }: Props) {
  const { gameId } = await params;

  const cookieStore = await cookies();
  const playersCookie = cookieStore.get(PLAYER_COOKIE_NAME)?.value;
  const decoded = playersCookie ? decodeURIComponent(playersCookie) : undefined;
  if (getPlayerForGame(decoded, gameId)) {
    redirect(`/games/${gameId}`);
  }

  const { data: game, error } = await supabase
    .from("games")
    .select("id, name, zone_center_lat, zone_center_lng, zone_radius_meters")
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
    <div className="flex min-h-screen min-h-[100dvh] w-full flex-col bg-zinc-900 font-sans">
      <header className="shrink-0 border-b border-white/10 bg-zinc-900 px-3 py-2 safe-area-inset-top">
        <Link
          href={`/games/${gameId}`}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-amber-200 bg-white/10 hover:bg-white/15 transition-colors"
        >
          <span aria-hidden>←</span>
          Back to game
        </Link>
        <p className="mt-0.5 text-xs text-white/80">
          God mode · {(game as { name: string | null }).name || "Unnamed game"}
        </p>
      </header>
      <main className="flex min-h-0 flex-1 flex-col w-full">
        <GodMapWithPings gameId={gameId} zone={zone} />
      </main>
    </div>
  );
}
