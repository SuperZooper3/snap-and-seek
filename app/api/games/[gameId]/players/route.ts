import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params;

  const { data: game, error: gameError } = await supabase
    .from("games")
    .select("id, status")
    .eq("id", gameId)
    .single();

  if (gameError || !game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  const body = await _request.json();
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json(
      { error: "Name is required" },
      { status: 400 }
    );
  }

  if (game.status === "lobby") {
    const { data: player, error } = await supabase
      .from("players")
      .insert({ game_id: gameId, name })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(player);
  }

  // Game has started: allow rejoin by assuming an existing player with that name
  const { data: existingPlayers, error: findError } = await supabase
    .from("players")
    .select("id, name, game_id")
    .eq("game_id", gameId)
    .eq("name", name)
    .limit(1);

  if (findError) {
    return NextResponse.json({ error: findError.message }, { status: 500 });
  }
  if (existingPlayers && existingPlayers.length > 0) {
    return NextResponse.json(existingPlayers[0]);
  }

  return NextResponse.json(
    {
      error:
        "No player with that name in this game. The game has already started, so you can only rejoin using the exact name you used when you joined.",
    },
    { status: 400 }
  );
}
