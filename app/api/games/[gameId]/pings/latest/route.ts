import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * GET latest ping per player for this game.
 * Returns array of { player_id, name, lat, lng, created_at }.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params;

  const { data: pings, error } = await supabase
    .from("pings")
    .select("id, player_id, lat, lng, created_at")
    .eq("game_id", gameId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  if (!pings || pings.length === 0) {
    return NextResponse.json([]);
  }

  const latestByPlayer = new Map<
    number,
    { player_id: number; lat: number; lng: number; created_at: string }
  >();
  for (const p of pings) {
    if (!latestByPlayer.has(p.player_id)) {
      latestByPlayer.set(p.player_id, {
        player_id: p.player_id,
        lat: p.lat,
        lng: p.lng,
        created_at: p.created_at,
      });
    }
  }

  const playerIds = [...latestByPlayer.keys()];
  const { data: players } = await supabase
    .from("players")
    .select("id, name")
    .in("id", playerIds);

  const nameById = new Map(
    (players ?? []).map((r) => [r.id as number, (r.name as string) ?? ""])
  );

  const result = [...latestByPlayer.values()]
    .map((p) => ({
      player_id: p.player_id,
      name: nameById.get(p.player_id) ?? "Unknown",
      lat: p.lat,
      lng: p.lng,
      created_at: p.created_at,
    }))
    .sort((a, b) => a.player_id - b.player_id);

  return NextResponse.json(result);
}
