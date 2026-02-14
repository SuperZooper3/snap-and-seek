import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * GET /api/games/[gameId]/submissions
 * Returns all submissions for the game.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params;

  const { data, error } = await supabase
    .from("submissions")
    .select("*")
    .eq("game_id", gameId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ submissions: data ?? [] });
}

/**
 * POST /api/games/[gameId]/submissions
 * Create a new submission. For now, always sets status to 'success'.
 * After inserting, checks if the seeker has found all other players (win condition).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params;
  const body = await request.json().catch(() => ({}));

  const seekerId: number | undefined = body?.seeker_id;
  const hiderId: number | undefined = body?.hider_id;
  const photoId: number | undefined = body?.photo_id;

  if (!seekerId || !hiderId) {
    return NextResponse.json(
      { error: "seeker_id and hider_id are required" },
      { status: 400 }
    );
  }

  // Reject submissions if game is already completed (someone already won)
  const { data: currentGame } = await supabase
    .from("games")
    .select("status, winner_id")
    .eq("id", gameId)
    .single();

  if (currentGame?.status === "completed" || currentGame?.winner_id != null) {
    return NextResponse.json(
      { error: "Game is already completed", winner_id: currentGame.winner_id },
      { status: 409 }
    );
  }

  // Check for existing successful submission for this (seeker, hider) pair
  const { data: existing } = await supabase
    .from("submissions")
    .select("id")
    .eq("game_id", gameId)
    .eq("seeker_id", seekerId)
    .eq("hider_id", hiderId)
    .eq("status", "success")
    .limit(1);

  if (existing && existing.length > 0) {
    return NextResponse.json(
      { error: "Already submitted successfully for this target" },
      { status: 409 }
    );
  }

  // Insert submission — default status 'success'
  const { data: submission, error: insertError } = await supabase
    .from("submissions")
    .insert({
      game_id: gameId,
      seeker_id: seekerId,
      hider_id: hiderId,
      ...(photoId ? { photo_id: photoId } : {}),
      status: "success",
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json(
      { error: insertError.message },
      { status: 500 }
    );
  }

  // --- Win check ---
  // Count distinct hiders this seeker has successfully found
  const { data: successfulSubmissions, error: countError } = await supabase
    .from("submissions")
    .select("hider_id")
    .eq("game_id", gameId)
    .eq("seeker_id", seekerId)
    .eq("status", "success");

  if (countError) {
    // Submission succeeded but win check failed — return submission anyway
    return NextResponse.json({ submission, isWinner: false });
  }

  const distinctHiders = new Set(
    (successfulSubmissions ?? []).map((s: { hider_id: number }) => s.hider_id)
  );

  // Count total players in this game
  const { count: totalPlayers } = await supabase
    .from("players")
    .select("*", { count: "exact", head: true })
    .eq("game_id", gameId);

  const neededFinds = (totalPlayers ?? 0) - 1; // everyone except yourself
  const isWinner = neededFinds > 0 && distinctHiders.size >= neededFinds;

  if (isWinner) {
    // Atomic: only set winner if no winner already exists (WHERE winner_id IS NULL).
    // This prevents two concurrent winners — only the first UPDATE to match wins.
    const { data: updated } = await supabase
      .from("games")
      .update({
        winner_id: seekerId,
        status: "completed",
        finished_at: new Date().toISOString(),
      })
      .eq("id", gameId)
      .is("winner_id", null)
      .select("winner_id")
      .single();

    // If someone else already won (our update matched 0 rows), we're not the winner
    if (!updated || updated.winner_id !== seekerId) {
      return NextResponse.json({ submission, isWinner: false });
    }
  }

  return NextResponse.json({ submission, isWinner });
}
