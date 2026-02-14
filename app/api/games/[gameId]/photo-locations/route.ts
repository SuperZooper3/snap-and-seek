import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * GET latest photo location per player for this game.
 * Returns array of { player_id, name, lat, lng } for players whose hiding_photo has coordinates.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params;

  const { data: players, error: playersError } = await supabase
    .from("players")
    .select("id, name, hiding_photo")
    .eq("game_id", gameId)
    .order("created_at", { ascending: true });

  if (playersError) {
    return NextResponse.json(
      { error: playersError.message },
      { status: 500 }
    );
  }

  const withPhoto = (players ?? []).filter(
    (p) => (p as { hiding_photo: number | null }).hiding_photo != null
  );
  const photoIds = withPhoto.map(
    (p) => (p as { hiding_photo: number | null }).hiding_photo as number
  );

  if (photoIds.length === 0) {
    return NextResponse.json([]);
  }

  const { data: photos, error: photosError } = await supabase
    .from("photos")
    .select("id, latitude, longitude")
    .in("id", photoIds);

  if (photosError) {
    return NextResponse.json(
      { error: photosError.message },
      { status: 500 }
    );
  }

  const photoById = new Map(
    (photos ?? []).map((p) => [
      p.id as number,
      {
        lat: (p as { latitude: number | null }).latitude,
        lng: (p as { longitude: number | null }).longitude,
      },
    ])
  );

  const result: { player_id: number; name: string; lat: number; lng: number }[] = [];
  for (const p of withPhoto) {
    const photoId = (p as { hiding_photo: number | null }).hiding_photo as number;
    const loc = photoById.get(photoId);
    if (loc && loc.lat != null && loc.lng != null) {
      result.push({
        player_id: p.id as number,
        name: (p as { name: string }).name ?? "Unknown",
        lat: loc.lat,
        lng: loc.lng,
      });
    }
  }

  return NextResponse.json(result);
}
