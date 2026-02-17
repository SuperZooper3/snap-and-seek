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

  // Fetch game status; include winner columns (winner_ids may be missing until migration)
  type GameRow = {
    id: string;
    status: string;
    winner_id?: number | null;
    winner_ids?: number[] | null;
    finished_at?: string | null;
  };
  let game: GameRow | null = null;

  const withWinner = await supabase
    .from("games")
    .select("id, status, winner_id, winner_ids, finished_at")
    .eq("id", gameId)
    .single();

  if (withWinner.error) {
    const fallback = await supabase
      .from("games")
      .select("id, status, winner_id, finished_at")
      .eq("id", gameId)
      .single();
    if (fallback.error || !fallback.data) {
      return NextResponse.json(
        { error: fallback.error?.message ?? "Game not found" },
        { status: fallback.error ? 500 : 404 }
      );
    }
    game = { ...fallback.data, winner_ids: null } as GameRow;
  } else if (withWinner.data) {
    game = withWinner.data as GameRow;
  }

  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  const winnerIds = Array.isArray(game.winner_ids) && game.winner_ids.length > 0
    ? game.winner_ids
    : game.winner_id != null
      ? [game.winner_id]
      : [];
  const winnerId = winnerIds[0] ?? game.winner_id ?? null;

  if (winnerId != null && game.status !== "completed") {
    const finishedAt = game.finished_at ?? new Date().toISOString();
    await supabase
      .from("games")
      .update({ status: "completed", finished_at: finishedAt })
      .eq("id", gameId);
    game = { ...game, status: "completed", finished_at: finishedAt };
  }

  const { data: submissions, error: subError } = await supabase
    .from("submissions")
    .select("id, game_id, seeker_id, hider_id, photo_id, status, created_at")
    .eq("game_id", gameId)
    .order("created_at", { ascending: true });

  if (subError) {
    return NextResponse.json({ error: subError.message }, { status: 500 });
  }

  let winnerName: string | null = null;
  let winnerNames: string[] = [];
  if (winnerIds.length > 0) {
    const { data: winnerRows } = await supabase
      .from("players")
      .select("id, name")
      .in("id", winnerIds);
    if (winnerRows?.length) {
      const order = new Map(winnerIds.map((id, i) => [id, i]));
      winnerNames = winnerRows
        .sort((a, b) => (order.get((a as { id: number }).id) ?? 99) - (order.get((b as { id: number }).id) ?? 99))
        .map((r) => (r as { name: string }).name);
      winnerName = winnerNames[0] ?? null;
    }
  }

  return NextResponse.json({
    status: game.status,
    winner_id: winnerId,
    winner_name: winnerName,
    winner_ids: winnerIds,
    winner_names: winnerNames,
    finished_at: game.finished_at ?? null,
    submissions: submissions ?? [],
  });
}
