import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * GET /api/games/[gameId]/game-status
 * Returns game status, winner info, and all submissions.
 * Used by the 5s poll on the seeking page.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params;

  // Fetch game status + winner info
  const { data: game, error: gameError } = await supabase
    .from("games")
    .select("id, status, winner_id, finished_at")
    .eq("id", gameId)
    .single();

  if (gameError || !game) {
    return NextResponse.json(
      { error: gameError?.message ?? "Game not found" },
      { status: gameError ? 500 : 404 }
    );
  }

  // Fetch all submissions for this game
  const { data: submissions, error: subError } = await supabase
    .from("submissions")
    .select("id, game_id, seeker_id, hider_id, photo_id, status, created_at")
    .eq("game_id", gameId)
    .order("created_at", { ascending: true });

  if (subError) {
    return NextResponse.json({ error: subError.message }, { status: 500 });
  }

  // If there's a winner, fetch their name
  let winnerName: string | null = null;
  if (game.winner_id != null) {
    const { data: winner } = await supabase
      .from("players")
      .select("name")
      .eq("id", game.winner_id)
      .single();
    winnerName = winner?.name ?? null;
  }

  return NextResponse.json({
    status: game.status,
    winner_id: game.winner_id,
    winner_name: winnerName,
    finished_at: game.finished_at,
    submissions: submissions ?? [],
  });
}
