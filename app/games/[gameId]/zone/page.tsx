import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";
import { getPlayerForGame, PLAYER_COOKIE_NAME } from "@/lib/player-cookie";
import { getHidingDurationSeconds } from "@/lib/game-config";
import { HidingLayout } from "./HidingLayout";

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
    .select("id, name, status, zone_center_lat, zone_center_lng, zone_radius_meters, hiding_started_at, hiding_duration_seconds")
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
    <HidingLayout
      gameId={gameId}
      zone={zone}
      playerId={currentPlayer.id}
      hidingStartedAt={(game as { hiding_started_at: string | null }).hiding_started_at}
      hidingDurationSeconds={getHidingDurationSeconds(
        (game as { hiding_duration_seconds: number | null }).hiding_duration_seconds
      )}
    />
  );
}
