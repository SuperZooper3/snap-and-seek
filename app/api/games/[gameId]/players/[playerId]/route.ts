import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";
import { getPlayerForGame, PLAYER_COOKIE_NAME } from "@/lib/player-cookie";

type Params = { params: Promise<{ gameId: string; playerId: string }> };

function getCurrentPlayerId(gameId: string, cookieValue: string | undefined): number | null {
  const decoded = cookieValue ? decodeURIComponent(cookieValue) : undefined;
  const identity = getPlayerForGame(decoded, gameId);
  return identity?.id ?? null;
}

/** DELETE: remove yourself from the game (only in lobby). */
export async function DELETE(_request: Request, { params }: Params) {
  const { gameId, playerId } = await params;
  const playerIdNum = Number(playerId);
  if (!Number.isInteger(playerIdNum)) {
    return NextResponse.json({ error: "Invalid player id" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const raw = cookieStore.get(PLAYER_COOKIE_NAME)?.value;
  const currentId = getCurrentPlayerId(gameId, raw);
  if (currentId === null || currentId !== playerIdNum) {
    return NextResponse.json({ error: "You can only remove yourself" }, { status: 403 });
  }

  const { data: game, error: gameError } = await supabase
    .from("games")
    .select("id, status")
    .eq("id", gameId)
    .single();

  if (gameError || !game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }
  if (game.status !== "lobby") {
    return NextResponse.json(
      { error: "Cannot leave after the game has started" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("players")
    .delete()
    .eq("id", playerIdNum)
    .eq("game_id", gameId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

/** PATCH: update your own name (only in lobby). */
export async function PATCH(request: Request, { params }: Params) {
  const { gameId, playerId } = await params;
  const playerIdNum = Number(playerId);
  if (!Number.isInteger(playerIdNum)) {
    return NextResponse.json({ error: "Invalid player id" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const raw = cookieStore.get(PLAYER_COOKIE_NAME)?.value;
  const currentId = getCurrentPlayerId(gameId, raw);
  if (currentId === null || currentId !== playerIdNum) {
    return NextResponse.json({ error: "You can only edit your own name" }, { status: 403 });
  }

  const body = await request.json();
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const { data: game, error: gameError } = await supabase
    .from("games")
    .select("id, status")
    .eq("id", gameId)
    .single();

  if (gameError || !game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }
  if (game.status !== "lobby") {
    return NextResponse.json(
      { error: "Cannot edit name after the game has started" },
      { status: 400 }
    );
  }

  const { data: player, error } = await supabase
    .from("players")
    .update({ name })
    .eq("id", playerIdNum)
    .eq("game_id", gameId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(player);
}
