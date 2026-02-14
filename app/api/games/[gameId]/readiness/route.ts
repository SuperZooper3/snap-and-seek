import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params;

  // Fetch all players for this game, including their hiding_photo column
  const { data: players, error: playersError } = await supabase
    .from("players")
    .select("id, name, created_at, hiding_photo")
    .eq("game_id", gameId)
    .order("created_at", { ascending: true });

  if (playersError) {
    return NextResponse.json(
      { error: playersError.message },
      { status: 500 }
    );
  }

  // A player is ready when their hiding_photo is set (locked in)
  const result = (players ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    created_at: p.created_at,
    isReady: p.hiding_photo != null,
  }));

  const readyCount = result.filter((p) => p.isReady).length;

  return NextResponse.json({
    players: result,
    readyCount,
    totalCount: result.length,
    allReady: readyCount === result.length && result.length > 0,
  });
}
