import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";
import { getPlayerForGame, PLAYER_COOKIE_NAME } from "@/lib/player-cookie";

type Params = { params: Promise<{ gameId: string; playerId: string }> };

/**
 * POST /api/games/[gameId]/players/[playerId]/withdraw
 * Withdraw a player during play (zone/hiding/seeking). Only when game has started.
 * Any participant in the game can withdraw another player.
 */
export async function POST(_request: Request, { params }: Params) {
  const { gameId, playerId } = await params;
  const playerIdNum = Number(playerId);
  if (!Number.isInteger(playerIdNum)) {
    return NextResponse.json({ error: "Invalid player id" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const raw = cookieStore.get(PLAYER_COOKIE_NAME)?.value;
  const decoded = raw ? decodeURIComponent(raw) : undefined;
  const caller = getPlayerForGame(decoded, gameId);
  if (!caller) {
    return NextResponse.json({ error: "You must be in this game to withdraw a player" }, { status: 403 });
  }

  const { data: game, error: gameError } = await supabase
    .from("games")
    .select("id, status")
    .eq("id", gameId)
    .single();

  if (gameError || !game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }
  const status = (game as { status: string }).status;
  if (status === "lobby") {
    return NextResponse.json(
      { error: "Cannot withdraw in lobby; remove the player from the game instead." },
      { status: 400 }
    );
  }
  if (status === "completed") {
    return NextResponse.json({ error: "Game is already completed" }, { status: 400 });
  }

  // Ensure the target player is in this game
  const { data: target, error: targetError } = await supabase
    .from("players")
    .select("id, withdrawn_at")
    .eq("id", playerIdNum)
    .eq("game_id", gameId)
    .single();

  if (targetError || !target) {
    return NextResponse.json({ error: "Player not found in this game" }, { status: 404 });
  }
  if ((target as { withdrawn_at: string | null }).withdrawn_at != null) {
    return NextResponse.json({ error: "Player is already withdrawn" }, { status: 400 });
  }

  const { error: updateError } = await supabase
    .from("players")
    .update({ withdrawn_at: new Date().toISOString() })
    .eq("id", playerIdNum)
    .eq("game_id", gameId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
