import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";
import { getPlayerForGame, PLAYER_COOKIE_NAME } from "@/lib/player-cookie";
import { SeekingLayout } from "./SeekingLayout";

type Props = { params: Promise<{ gameId: string }> };

export default async function SeekingPage({ params }: Props) {
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
    .select("id, name, status, zone_center_lat, zone_center_lng, zone_radius_meters, seeking_started_at")
    .eq("id", gameId)
    .single();

  if (error || !game) {
    notFound();
  }

  const { data: players } = await supabase
    .from("players")
    .select("id, name, hiding_photo")
    .eq("game_id", gameId)
    .order("created_at", { ascending: true });

  const otherPlayers = (players ?? []).filter((p) => p.id !== currentPlayer.id);
  const photoIds = otherPlayers
    .map((p) => (p as { hiding_photo: number | null }).hiding_photo)
    .filter((id): id is number => id != null);
  const photoIdSet = [...new Set(photoIds)];

  let photoUrlById: Record<number, string> = {};
  if (photoIdSet.length > 0) {
    const { data: photos } = await supabase
      .from("photos")
      .select("id, url")
      .in("id", photoIdSet);
    if (photos) {
      for (const p of photos) {
        photoUrlById[p.id as number] = (p as { url: string }).url;
      }
    }
  }

  const targets = otherPlayers.map((p) => {
    const hidingPhoto = (p as { hiding_photo: number | null }).hiding_photo;
    return {
      playerId: p.id,
      name: (p as { name: string }).name,
      photoUrl: hidingPhoto != null ? photoUrlById[hidingPhoto] ?? null : null,
    };
  });

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
    <SeekingLayout
      gameId={gameId}
      gameName={(game as { name: string | null }).name || "Unnamed game"}
      zone={zone}
      playerId={currentPlayer.id}
      playerName={currentPlayer.name}
      seekingStartedAt={(game as { seeking_started_at: string | null }).seeking_started_at}
      targets={targets}
    />
  );
}
