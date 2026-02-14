import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ZoneMapView } from "./ZoneMapView";

type Props = { params: Promise<{ gameId: string }> };

export default async function GameZonePage({ params }: Props) {
  const { gameId } = await params;

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
    <div className="min-h-screen min-h-[100dvh] bg-gradient-to-b from-amber-50 to-orange-100 dark:from-zinc-950 dark:to-zinc-900 font-sans flex flex-col">
      <header className="shrink-0 border-b border-amber-200/50 dark:border-zinc-700 px-4 py-3 safe-area-inset-top">
        <Link
          href={`/games/${gameId}`}
          className="text-sm text-amber-800/70 dark:text-amber-200/70 hover:underline"
        >
          ← Back to game
        </Link>
        <h1 className="mt-2 text-xl font-bold text-amber-900 dark:text-amber-100">
          Game zone
        </h1>
        <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
          {(game as { name: string | null }).name || "Unnamed game"} · Stay inside the green circle
        </p>
      </header>

      <main className="flex-1 overflow-auto px-4 py-4 pb-safe">
        <ZoneMapView zone={zone} />
        <div className="mt-4 rounded-xl bg-white/80 dark:bg-zinc-800/80 border border-amber-200/50 dark:border-zinc-700 p-4">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong className="text-amber-900 dark:text-amber-100">Play area:</strong>{" "}
            Inside the green circle (radius {Math.round(zone.radius_meters)} m). Outside is out of bounds (red).
          </p>
        </div>
      </main>
    </div>
  );
}
