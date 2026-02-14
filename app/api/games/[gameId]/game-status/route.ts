import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * GET /api/games/[gameId]/game-status
 * Returns game status, winner info, and all submissions.
 * Used by the 3s poll on the seeking page.
 * Tolerates missing winner_id/finished_at columns (returns null until migration is run).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params;

  // Fetch game status; include winner columns if they exist (migration may not be run yet)
  type GameRow = { id: string; status: string; winner_id?: number | null; finished_at?: string | null };
  let game: GameRow | null = null;

  const withWinner = await supabase
    .from("games")
    .select("id, status, winner_id, finished_at")
    .eq("id", gameId)
    .single();

  if (withWinner.error) {
    const msg = withWinner.error.message ?? "";
    if (msg.includes("winner_id") || msg.includes("does not exist")) {
      const fallback = await supabase
        .from("games")
        .select("id, status")
        .eq("id", gameId)
        .single();
      if (fallback.error || !fallback.data) {
        return NextResponse.json(
          { error: fallback.error?.message ?? "Game not found" },
          { status: fallback.error ? 500 : 404 }
        );
      }
      game = { ...fallback.data, winner_id: null, finished_at: null };
    } else {
      return NextResponse.json(
        { error: withWinner.error.message ?? "Game not found" },
        { status: 500 }
      );
    }
  } else if (withWinner.data) {
    game = withWinner.data as GameRow;
  }

  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  // If there's a winner but status wasn't set to completed (e.g. older bug or race), repair it now
  const winnerId = game.winner_id ?? null;
  if (winnerId != null && game.status !== "completed") {
    const finishedAt = game.finished_at ?? new Date().toISOString();
    await supabase
      .from("games")
      .update({ status: "completed", finished_at: finishedAt })
      .eq("id", gameId);
    game = { ...game, status: "completed", finished_at: finishedAt };
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

  let winnerName: string | null = null;
  if (winnerId != null) {
    const { data: winner } = await supabase
      .from("players")
      .select("name")
      .eq("id", winnerId)
      .single();
    winnerName = winner?.name ?? null;
  }

  return NextResponse.json({
    status: game.status,
    winner_id: winnerId,
    winner_name: winnerName,
    finished_at: game.finished_at ?? null,
    submissions: submissions ?? [],
  });
}
