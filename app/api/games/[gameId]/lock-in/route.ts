import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params;

  const body = await request.json().catch(() => ({}));
  const playerId = body?.player_id;
  const hidingPhoto = body?.hiding_photo;
  const treePhoto = body?.tree_photo ?? null;
  const buildingPhoto = body?.building_photo ?? null;
  const pathPhoto = body?.path_photo ?? null;

  if (!playerId || typeof playerId !== "number") {
    return NextResponse.json(
      { error: "player_id (number) is required" },
      { status: 400 }
    );
  }

  if (hidingPhoto == null || typeof hidingPhoto !== "number") {
    return NextResponse.json(
      { error: "hiding_photo (number) is required" },
      { status: 400 }
    );
  }

  // Verify the player belongs to this game
  const { data: player, error: playerError } = await supabase
    .from("players")
    .select("id, game_id")
    .eq("id", playerId)
    .eq("game_id", gameId)
    .single();

  if (playerError || !player) {
    return NextResponse.json(
      { error: "Player not found in this game" },
      { status: 404 }
    );
  }

  // Update the player's photo columns
  const updates: Record<string, number | null> = {
    hiding_photo: hidingPhoto,
    tree_photo: treePhoto,
    building_photo: buildingPhoto,
    path_photo: pathPhoto,
  };

  const { data, error } = await supabase
    .from("players")
    .update(updates)
    .eq("id", playerId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, player: data });
}
