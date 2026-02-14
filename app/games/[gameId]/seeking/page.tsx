import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";
import { getPlayerForGame, PLAYER_COOKIE_NAME } from "@/lib/player-cookie";
import { getPowerupCastingSeconds } from "@/lib/game-config";
import type { Submission } from "@/lib/types";
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

  // Try with winner_id and powerup_casting_duration_seconds first; fall back to without if columns don't exist yet
  let game: Record<string, unknown> | null = null;
  {
    const { data, error } = await supabase
      .from("games")
      .select("id, name, status, zone_center_lat, zone_center_lng, zone_radius_meters, seeking_started_at, winner_id, powerup_casting_duration_seconds")
      .eq("id", gameId)
      .single();
    if (!error && data) {
      game = data;
    } else {
      // Fallback: new columns may not exist yet
      const { data: fallback, error: fallbackErr } = await supabase
        .from("games")
        .select("id, name, status, zone_center_lat, zone_center_lng, zone_radius_meters, seeking_started_at")
        .eq("id", gameId)
        .single();
      if (fallbackErr || !fallback) notFound();
      game = { ...fallback, winner_id: null, powerup_casting_duration_seconds: null };
    }
  }

  if (!game) {
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

  const photoUrlById: Record<number, string> = {};
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

  // Load initial submissions for this game (gracefully handles missing table)
  let initialSubmissions: Submission[] = [];
  {
    const { data: submissionsData, error: subErr } = await supabase
      .from("submissions")
      .select("*")
      .eq("game_id", gameId)
      .order("created_at", { ascending: true });
    if (!subErr && submissionsData) {
      initialSubmissions = submissionsData as Submission[];
    }
  }

  // Resolve photo URLs for successful submissions (the seeker's matched photos)
  const submissionPhotoIds = initialSubmissions
    .filter((s) => s.photo_id != null && s.status === "success")
    .map((s) => s.photo_id as number);
  const submissionPhotoIdSet = [...new Set(submissionPhotoIds)];

  const submissionPhotoUrlById: Record<number, string> = {};
  if (submissionPhotoIdSet.length > 0) {
    const { data: subPhotos } = await supabase
      .from("photos")
      .select("id, url")
      .in("id", submissionPhotoIdSet);
    if (subPhotos) {
      for (const p of subPhotos) {
        submissionPhotoUrlById[p.id as number] = (p as { url: string }).url;
      }
    }
  }

  // If there's a winner, resolve their name
  let winnerName: string | null = null;
  if (game.winner_id != null) {
    const winner = (players ?? []).find((p) => p.id === game.winner_id);
    winnerName = winner ? (winner as { name: string }).name : null;
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

  const powerupCastingSeconds = getPowerupCastingSeconds(
    (game as { powerup_casting_duration_seconds: number | null }).powerup_casting_duration_seconds
  );

  return (
    <SeekingLayout
      gameId={gameId}
      gameName={(game as { name: string | null }).name || "Unnamed game"}
      zone={zone}
      playerId={currentPlayer.id}
      playerName={currentPlayer.name}
      seekingStartedAt={(game as { seeking_started_at: string | null }).seeking_started_at}
      targets={targets}
      initialSubmissions={initialSubmissions}
      initialSubmissionPhotoUrls={submissionPhotoUrlById}
      initialWinnerId={game.winner_id as number | null}
      initialWinnerName={winnerName}
      powerupCastingSeconds={powerupCastingSeconds}
    />
  );
}
